import path from "node:path";
import fs from "node:fs/promises";
import {
  deduplicateArticles,
  extractTopicTokens,
  normalizeArticle,
  normalizeTopicKey,
  topicSimilarity,
} from "./domain.js";
import { fetchNews } from "./sources/index.js";
import { enrichArticle } from "./enrichment/index.js";
import { fallbackArtSvg } from "./art/fallback.js";
import { generateGeminiArt, hasGeminiArt } from "./art/gemini.js";
import { generateCloudflareArt, hasCloudflareArt } from "./art/cloudflare.js";
import { renderPost } from "./renderer.js";
import { ensureDir, fetchWithTimeout, slugify, stableId, writeJson } from "./utils.js";

function runId() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function fetchSourceImage(url, timeoutMs = 25000) {
  if (!url || typeof url !== "string" || !/^https?:\/\//i.test(url) || url === "undefined") {
    return null;
  }
  try {
    const res = await fetchWithTimeout(url, { headers: { "user-agent": "UPSCBrief/0.1" } }, timeoutMs);
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length > 5000) return buffer;
  } catch {
    return null;
  }
  return null;
}

async function generateOne(article, config, options, directory, runContext = {}) {
  const enriched = await enrichArticle(article, config, options);
  if (!options.includeLowRelevance && enriched.relevanceScore < config.relevanceThreshold) {
    return {
      id: article.id,
      title: article.title,
      status: "skipped",
      reason: `UPSC relevance ${enriched.relevanceScore} < ${config.relevanceThreshold}`,
    };
  }

  // Prevent generating multiple posts for the same topic/headline in the same run
  if (runContext.seenHeadlines && enriched.headline) {
    const normHeadline = normalizeTopicKey(enriched.headline);
    const tokens = extractTopicTokens(enriched.headline);
    const isDuplicate =
      runContext.seenHeadlines.has(normHeadline) ||
      (runContext.seenHeadlineTokens &&
        runContext.seenHeadlineTokens.some((existing) => topicSimilarity(tokens, existing) >= 0.7));

    if (isDuplicate) {
      return {
        id: article.id,
        title: article.title,
        status: "skipped",
        reason: `Duplicate topic / headline "${enriched.headline}" already generated in this batch`,
      };
    }
  }

  let artBuffer = null;
  let artMethod = null;
  let artWarning = null;
  let artUsage = null;
  let estimatedImageCostUsd = 0;

  // 1. Try using the actual image from the article if available
  if (article.imageUrl) {
    const sourceBuf = await fetchSourceImage(article.imageUrl, config.requestTimeoutMs);
    if (sourceBuf) {
      artBuffer = sourceBuf;
      artMethod = "source-image";
    }
  }

  // 2. Try AI generation if enabled and no source image
  if (!artBuffer && options.useAi !== false) {
    if (config.imageProvider === "cloudflare" && hasCloudflareArt(config)) {
      try {
        const image = await generateCloudflareArt(enriched.visualPrompt, config);
        artBuffer = image.buffer;
        artUsage = image.usage;
        artMethod = config.cloudflareImageModel;
      } catch (error) {
        artWarning = `Cloudflare image generation failed: ${error.message}`;
      }
    } else if (hasGeminiArt(config)) {
      try {
        const image = await generateGeminiArt(enriched.visualPrompt, config);
        artBuffer = image.buffer;
        artUsage = image.usage;
        estimatedImageCostUsd = image.estimatedCostUsd;
        artMethod = config.geminiImageModel;
      } catch (error) {
        artWarning = `Gemini image generation failed: ${error.message}`;
      }
    }
  }

  // 3. Strict verification: Never give output without an actual image when AI / actual images are expected
  if (!artBuffer) {
    if ((options.useAi !== false || options.requireActualImage) && !options.allowFallbackArt) {
      throw new Error(
        `No actual image available (${artWarning || "image provider unavailable and no source image found"}). Output suppressed.`,
      );
    }
    artBuffer = fallbackArtSvg(article);
    artMethod = "editorial-vector";
  }

  const filename = `${slugify(enriched.headline)}-${article.id.slice(0, 8)}.png`;
  const outputFile = path.join(directory, filename);
  await renderPost({ article, enriched, artBuffer, outputFile, config, artMethod });

  return {
    id: article.id,
    title: article.title,
    status: "draft",
    approval: { status: "pending", reviewedAt: null },
    image: filename,
    source: { name: article.sourceName, url: article.url, publishedAt: article.publishedAt },
    editorial: enriched,
    generation: {
      artMethod,
      copyMethod: enriched.method,
      usage: artUsage,
      estimatedImageCostUsd,
      productionReady: true,
      warnings: [enriched.warning, artWarning].filter(Boolean),
    },
  };
}

export async function runPipeline(config, options = {}) {
  const targetLimit = options.limit || config.limit;
  const candidateLimit = options.includeLowRelevance ? targetLimit : Math.min(500, targetLimit * 4);
  const sourceName = options.articles ? "request" : options.source || config.source;
  const articles = options.articles
    ? options.articles.map((article) => normalizeArticle(article))
    : await fetchNews(config, { ...options, limit: candidateLimit });
  const unique = deduplicateArticles(articles);

  if (unique.length === 0) {
    throw new Error(`No articles retrieved from source "${sourceName}". Cannot generate output without articles and actual images.`);
  }

  const id = options.runId || runId();
  const directory = path.join(config.outputDir, id);
  await ensureDir(directory);

  const manifest = {
    runId: id,
    createdAt: new Date().toISOString(),
    status: "running",
    source: sourceName,
    postSize: { width: 1080, height: 1350 },
    posts: [],
  };

  const runContext = {
    seenHeadlines: new Set(),
    seenHeadlineTokens: [],
  };

  for (const article of unique) {
    if (manifest.posts.filter((post) => post.status === "draft").length >= targetLimit) break;
    let result;
    try {
      result = await generateOne(article, config, options, directory, runContext);
    } catch (error) {
      result = { id: article.id, title: article.title, status: "failed", error: error.message };
    }
    if (result.status === "draft" && result.editorial?.headline) {
      const norm = normalizeTopicKey(result.editorial.headline);
      runContext.seenHeadlines.add(norm);
      runContext.seenHeadlineTokens.push(extractTopicTokens(result.editorial.headline));
    }
    manifest.posts.push(result);
    await writeJson(path.join(directory, "manifest.json"), manifest);
    options.onProgress?.({
      processed: manifest.posts.length,
      available: unique.length,
      generated: manifest.posts.filter((post) => post.status === "draft").length,
      target: targetLimit,
      result,
    });
  }

  const generatedCount = manifest.posts.filter((post) => post.status === "draft").length;
  if (generatedCount === 0) {
    // If no post could be generated with an actual image, clean up the empty directory so no output is left behind
    await fs.rm(directory, { recursive: true, force: true }).catch(() => {});
    throw new Error(
      `No posts could be generated with actual images (all ${manifest.posts.length} candidate articles failed or were skipped). Output run folder cleaned up.`,
    );
  }

  manifest.status = manifest.posts.some((post) => post.status === "failed") ? "completed_with_errors" : "completed";
  manifest.completedAt = new Date().toISOString();
  manifest.summary = {
    received: unique.length,
    generated: generatedCount,
    skipped: manifest.posts.filter((post) => post.status === "skipped").length,
    failed: manifest.posts.filter((post) => post.status === "failed").length,
    estimatedImageCostUsd: Number(
      manifest.posts.reduce((sum, post) => sum + (post.generation?.estimatedImageCostUsd || 0), 0).toFixed(4),
    ),
  };
  await writeJson(path.join(directory, "manifest.json"), manifest);
  return manifest;
}
