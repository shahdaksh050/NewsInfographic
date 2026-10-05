import test from "node:test";
import assert from "node:assert/strict";
import { articleListFromPayload, normalizeArticle } from "../src/domain.js";

test("normalizes common news API fields", () => {
  const article = normalizeArticle({
    headline: "A <b>policy</b> update",
    summary: "Useful &amp; concise.",
    link: "https://example.com/a",
    source: { name: "Example" },
    publishedAt: "2026-10-05T00:00:00Z",
  });
  assert.equal(article.title, "A policy update");
  assert.equal(article.description, "Useful & concise.");
  assert.equal(article.sourceName, "Example");
  assert.equal(article.id.length, 16);
});

test("hashes URL-shaped upstream IDs into filesystem-safe IDs", () => {
  const article = normalizeArticle({
    id: "https://example.com/news/one",
    title: "Story",
    url: "https://example.com/news/one",
  });
  assert.match(article.id, /^[a-f0-9]{16}$/);
  assert.equal(article.upstreamId, "https://example.com/news/one");
});

test("extracts arrays from common response envelopes", () => {
  assert.deepEqual(articleListFromPayload({ results: [{ title: "x" }] }), [{ title: "x" }]);
  assert.throws(() => articleListFromPayload({ nope: [] }), /Expected an array/);
});
