import test from "node:test";
import assert from "node:assert/strict";
import { articleListFromPayload, deduplicateArticles, normalizeArticle } from "../src/domain.js";

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

test("deduplicates articles by exact and near-identical topics", () => {
  const articles = [
    {
      id: "art-1",
      title: "Cabinet approves National Green Hydrogen Mission with ₹19,744 crore outlay",
      url: "https://example.com/one",
    },
    {
      id: "art-2",
      title: "Cabinet Approves National Green Hydrogen Mission", // near identical topic
      url: "https://example.com/two",
    },
    {
      id: "art-3",
      title: "Supreme Court upholds constitutional validity of 10% EWS quota",
      url: "https://example.com/three",
    },
    {
      id: "art-4",
      title: "Cabinet approves National Green Hydrogen Mission with ₹19,744 crore outlay", // exact duplicate
      url: "https://example.com/four",
    },
    {
      id: "art-5",
      title: "विज्ञान एवं प्रौद्योगिकी मंत्री डॉ. जितेंद्र सिंह ने स्विट्जरलैंड के राष्‍ट्रपति से मुलाकात की",
      url: "https://pib.gov.in/photo1",
    },
    {
      id: "art-6",
      title: "विज्ञान एवं प्रौद्योगिकी मंत्री डॉ. जितेंद्र सिंह ने स्विट्जरलैंड के राष्‍ट्रपति से मुलाकात की", // duplicate PIB gallery item
      url: "https://pib.gov.in/photo2",
    },
  ];

  const unique = deduplicateArticles(articles);
  assert.equal(unique.length, 3);
  assert.equal(unique[0].id, "art-1");
  assert.equal(unique[1].id, "art-3");
  assert.equal(unique[2].id, "art-5");
});
