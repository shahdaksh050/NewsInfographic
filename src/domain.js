import { stableId, stripHtml } from "./utils.js";

function first(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function parseDate(value) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

export function normalizeArticle(input, defaults = {}) {
  if (!input || typeof input !== "object") throw new TypeError("Article must be an object");

  const title = stripHtml(first(input.title, input.headline, input.name));
  if (!title) throw new TypeError("Article title is required");

  const url = String(first(input.url, input.link, input.source_url, defaults.url, ""));
  const description = stripHtml(
    first(input.description, input.summary, input.content, input.excerpt, input.body, ""),
  );
  const sourceName = stripHtml(
    first(
      input.source_name,
      typeof input.source === "string" ? input.source : input.source?.name,
      defaults.sourceName,
      "Unknown source",
    ),
  );
  const rawUpstreamId = first(input.id, input.guid);
  const upstreamId = rawUpstreamId == null ? "" : String(rawUpstreamId);
  const id = upstreamId && /^[a-zA-Z0-9_.-]+$/.test(upstreamId)
    ? upstreamId
    : stableId(upstreamId, url, title);

  return {
    id,
    upstreamId,
    title,
    description,
    url,
    sourceName,
    publishedAt: parseDate(first(input.published_at, input.publishedAt, input.published, input.pubDate)),
    imageUrl: String(first(input.image_url, input.imageUrl, input.urlToImage, input.image, "")),
    category: stripHtml(first(input.category, defaults.category, "Current Affairs")),
    raw: input,
  };
}

export function articleListFromPayload(payload) {
  if (Array.isArray(payload)) return payload;
  for (const key of ["articles", "items", "results", "data", "news"]) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  throw new TypeError("Expected an array or an object containing articles/items/results/data/news");
}

const STOP_WORDS = new Set([
  "the", "a", "an", "in", "on", "at", "to", "for", "of", "and", "is", "was",
  "with", "by", "from", "as", "that", "this", "it", "are", "were", "be", "has",
  "have", "had", "will", "would", "can", "could", "should", "about", "after",
  "into", "over", "under", "than", "or", "but", "so", "up", "out", "all", "its",
  "के", "की", "का", "को", "में", "से", "ने", "पर", "और", "है", "हैं", "था", "थी", "थे", "लिए", "भी", "किया", "गया", "गई", "गए", "हुए", "हुई", "हुआ", "द्वारा"
]);

export function normalizeTopicKey(text = "") {
  if (!text) return "";
  return String(text)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractTopicTokens(text = "") {
  const normalized = normalizeTopicKey(text);
  if (!normalized) return new Set();
  const words = normalized.split(/\s+/).filter((w) => w.length >= 2 && !STOP_WORDS.has(w));
  return new Set(words);
}

export function topicSimilarity(tokensA, tokensB) {
  if (!tokensA || !tokensB || tokensA.size === 0 || tokensB.size === 0) return 0;
  let intersection = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) intersection += 1;
  }
  const union = tokensA.size + tokensB.size - intersection;
  const jaccard = union > 0 ? intersection / union : 0;
  const minSize = Math.min(tokensA.size, tokensB.size);
  const containment = minSize > 0 ? intersection / minSize : 0;
  return Math.max(jaccard, containment * 0.85);
}

export function deduplicateArticles(articles, { threshold = 0.55 } = {}) {
  const seenIds = new Set();
  const seenUrls = new Set();
  const seenTitles = new Set();
  const seenTokenSets = [];
  const unique = [];

  for (const article of articles) {
    if (!article || !article.title) continue;
    const id = article.id || "";
    if (id && seenIds.has(id)) continue;

    const url = (article.url || "").trim().toLowerCase();
    if (url && seenUrls.has(url)) continue;

    const normTitle = normalizeTopicKey(article.title);
    if (!normTitle || seenTitles.has(normTitle)) continue;

    const tokens = extractTopicTokens(article.title);
    let isDuplicate = false;
    for (const existing of seenTokenSets) {
      if (topicSimilarity(tokens, existing) >= threshold) {
        isDuplicate = true;
        break;
      }
    }
    if (isDuplicate) continue;

    if (id) seenIds.add(id);
    if (url) seenUrls.add(url);
    seenTitles.add(normTitle);
    seenTokenSets.push(tokens);
    unique.push(article);
  }

  return unique;
}
