import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { normalizeArticle } from "../src/domain.js";
import { heuristicEnrichment } from "../src/enrichment/heuristic.js";
import { buildFactsPanelSvg } from "../src/renderer.js";

const runDirectory = path.resolve(process.argv[2] || "output/upsc-verified-110-final-2026-10-06");
const fixtureFile = path.resolve(process.argv[3] || "fixtures/topics_110_latest.json");
const manifestFile = path.join(runDirectory, "manifest.json");
const manifest = JSON.parse(await fs.readFile(manifestFile, "utf8"));
const fixture = JSON.parse(await fs.readFile(fixtureFile, "utf8"));
const byId = new Map(fixture.articles.map((item) => [item.id, item]));
let refreshed = 0;

for (const post of manifest.posts) {
  if (post.status !== "draft") continue;
  const source = byId.get(post.id);
  if (!source) throw new Error(`No fixture article found for ${post.id}`);
  const article = normalizeArticle(source);
  const enriched = heuristicEnrichment(article);
  const imageFile = path.join(runDirectory, post.image);
  const temporary = `${imageFile}.refresh.png`;
  await sharp(imageFile)
    .composite([{ input: buildFactsPanelSvg(enriched), top: 0, left: 0 }])
    .png({ compressionLevel: 8 })
    .toFile(temporary);
  await fs.rename(temporary, imageFile);
  post.editorial = enriched;
  post.generation.copyRefreshedAt = new Date().toISOString();
  refreshed += 1;
}

manifest.copyRefreshedAt = new Date().toISOString();
await fs.writeFile(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`Refreshed verified copy on ${refreshed} cards in ${runDirectory}`);
