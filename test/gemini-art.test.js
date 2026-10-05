import test from "node:test";
import assert from "node:assert/strict";
import { estimatedGeminiImageCost, generateGeminiArt, shouldRetryGeminiImageError } from "../src/art/gemini.js";

test("estimates current 1K standard image prices", () => {
  assert.equal(estimatedGeminiImageCost("gemini-3.1-flash-lite-image", "1K"), 0.0336);
  assert.equal(estimatedGeminiImageCost("gemini-3.1-flash-image", "1K"), 0.067);
  assert.equal(estimatedGeminiImageCost("gemini-3-pro-image", "1K"), 0.134);
  assert.equal(estimatedGeminiImageCost("gemini-3.1-flash-lite-image", "2K"), null);
});

test("uses the stateless Interactions API with 4:5 image output", async () => {
  const originalFetch = globalThis.fetch;
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options, body: JSON.parse(options.body) };
    return new Response(JSON.stringify({
      id: "interaction-1",
      status: "completed",
      steps: [{ type: "model_output", content: [{ type: "image", mime_type: "image/jpeg", data: Buffer.from("fake-image").toString("base64") }] }],
      usage: { total_tokens: 1120 },
    }), { status: 200, headers: { "content-type": "application/json" } });
  };
  try {
    const result = await generateGeminiArt("text-free art", {
      geminiImageApiKey: "test-key",
      geminiImageModel: "gemini-3.1-flash-lite-image",
      geminiImageAspectRatio: "4:5",
      geminiImageSize: "1K",
      imageRetryCount: 0,
      requestTimeoutMs: 1000,
    });
    assert.equal(request.url, "https://generativelanguage.googleapis.com/v1beta/interactions");
    assert.equal(request.options.headers["x-goog-api-key"], "test-key");
    assert.equal(request.body.response_format.aspect_ratio, "4:5");
    assert.equal(request.body.response_format.image_size, "1K");
    assert.equal(request.body.store, false);
    assert.equal(result.buffer.toString(), "fake-image");
    assert.equal(result.estimatedCostUsd, 0.0336);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("does not retry a free-tier limit of zero", () => {
  const error = Object.assign(new Error("limit: 0 requests per day on Free Tier; upgrade your tier"), { status: 429 });
  assert.equal(shouldRetryGeminiImageError(error), false);
  assert.equal(shouldRetryGeminiImageError(Object.assign(new Error("temporary"), { status: 429 })), true);
});
