import test from "node:test";
import assert from "node:assert/strict";
import { buildOverlaySvg } from "../src/renderer.js";

test("renders factual copy and disclosure into SVG overlay", () => {
  const svg = buildOverlaySvg(
    { sourceName: "PIB & Test", publishedAt: "2026-10-05T00:00:00Z" },
    { headline: "A short headline", summaryPoints: ["One", "Two", "Three"], category: "Economy", upscPapers: ["GS3"] },
    { brandName: "UPSC BRIEF" },
  ).toString();
  assert.match(svg, /AI-GENERATED ILLUSTRATION/);
  assert.match(svg, /PIB &amp; TEST/);
  assert.match(svg, /A SHORT HEADLINE/i);
});
