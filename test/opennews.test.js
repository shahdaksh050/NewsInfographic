import test from "node:test";
import assert from "node:assert/strict";
import { fetchOpenNews } from "../src/sources/opennews.js";

test("requests India news and normalizes the open-source placeholder response", async () => {
  const originalFetch = globalThis.fetch;
  let requestUrl;
  globalThis.fetch = async (url) => {
    requestUrl = new URL(url);
    return new Response(JSON.stringify({ articles: [{
      id: "one",
      title: "A policy story",
      description: "Policy details.",
      link: "https://example.test/one",
      source: "Example",
      published: "2026-10-05T00:00:00Z"
    }] }), { status: 200 });
  };
  try {
    const articles = await fetchOpenNews({ url: "https://api.example.test/news", limit: 7 });
    assert.equal(requestUrl.searchParams.get("category"), "india");
    assert.equal(requestUrl.searchParams.get("limit"), "7");
    assert.equal(articles[0].sourceName, "Example");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
