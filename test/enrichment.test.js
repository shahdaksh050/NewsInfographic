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

test("preserves extractive copy for a verified official release", () => {
  const result = heuristicEnrichment({
    title: "Cabinet approves Green Grid Mission",
    description: "Ignored in favor of reviewed points.",
    sourceName: "Cabinet · Press Information Bureau",
    category: "Environment & Geography",
    raw: {
      verified: true,
      summary_points: ["The mission expands interstate transmission.", "Battery storage supports peak demand.", "The programme has an official implementation timeline."],
      upsc_papers: ["GS3"],
      relevance_score: 96,
    },
  });
  assert.equal(result.method, "verified-extractive");
  assert.equal(result.verified, true);
  assert.equal(result.relevanceScore, 96);
  assert.deepEqual(result.upscPapers, ["GS3"]);
  assert.equal(result.summaryPoints[0], "The mission expands interstate transmission.");
});
