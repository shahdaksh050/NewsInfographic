import fs from "node:fs/promises";
import sharp from "sharp";
import { normalizeArticle } from "../src/domain.js";
import { heuristicEnrichment } from "../src/enrichment/heuristic.js";
import { buildFactsPanelSvg } from "../src/renderer.js";

const fixture = JSON.parse(await fs.readFile("fixtures/topics_110_latest.json", "utf8"));
const source = fixture.articles.find((item) => item.title.startsWith("CAQM Approves Revised GRAP")) || fixture.articles[0];
const enriched = heuristicEnrichment(normalizeArticle(source));
await sharp(buildFactsPanelSvg(enriched)).png().toFile("output/panel-preview.png");
console.log(JSON.stringify(enriched.summaryPoints, null, 2));
