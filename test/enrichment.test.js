import test from "node:test";
import assert from "node:assert/strict";
import { heuristicEnrichment } from "../src/enrichment/heuristic.js";

test("classifies economy and creates three bounded facts", () => {
  const result = heuristicEnrichment({
    title: "Food imports and agricultural policy",
    description: "India imported grain. The economy faced inflation and food shortages. A new agriculture programme followed.",
    sourceName: "Press Information Bureau",
    category: "General",
  });
  assert.equal(result.category, "Economy");
  assert.deepEqual(result.upscPapers, ["GS3"]);
  assert.equal(result.summaryPoints.length, 3);
  assert.ok(result.relevanceScore >= 35);
  assert.match(result.visualPrompt, /No words/);
});
