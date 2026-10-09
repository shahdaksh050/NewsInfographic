import path from "node:path";
import { fetchPibNews } from "../src/sources/pib.js";
import { writeJson } from "../src/utils.js";

function argument(name, fallback) {
  const prefix = `--${name}=`;
  const inline = process.argv.find((value) => value.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const limit = Math.min(150, Math.max(1, Number(argument("limit", 110)) || 110));
const outputFile = path.resolve(argument("out", "fixtures/topics_110_latest.json"));
const articles = await fetchPibNews({ limit, timeoutMs: 45000 });

if (articles.length < limit) {
  throw new Error(`Only ${articles.length} verified, unique PIB topics were available; ${limit} required.`);
}

await writeJson(outputFile, {
  metadata: {
    title: "Latest verified UPSC current-affairs topics",
    generated_at: new Date().toISOString(),
    requested: limit,
    included: articles.length,
    verification: "Every item links to and uses extractive facts from an official PIB release.",
  },
  articles: articles.map((article) => ({
    id: article.id,
    title: article.title,
    description: article.description,
    url: article.url,
    source_name: article.sourceName,
    published_at: article.publishedAt,
    category: article.category,
    verified: true,
    verification: article.raw.verification,
    summary_points: article.raw.summary_points,
    upsc_papers: article.raw.upsc_papers,
    relevance_score: article.raw.relevance_score,
  })),
});

console.log(`Saved ${articles.length} verified UPSC topics to ${outputFile}`);
