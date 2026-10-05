import test from "node:test";
import assert from "node:assert/strict";
import { generateCloudflareArt } from "../src/art/cloudflare.js";

test("calls Workers AI FLUX and decodes its image", async () => {
  const originalFetch = globalThis.fetch;
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options, body: JSON.parse(options.body) };
    return new Response(JSON.stringify({
      success: true,
      result: { image: Buffer.from("fake-cloudflare-image").toString("base64") },
    }), { status: 200, headers: { "content-type": "application/json" } });
  };
  try {
    const result = await generateCloudflareArt("sepia collage", {
      cloudflareAccountId: "account-id",
      cloudflareApiToken: "test-token",
      cloudflareImageModel: "@cf/black-forest-labs/flux-1-schnell",
      cloudflareImageSteps: 6,
      requestTimeoutMs: 1000,
    });
    assert.match(request.url, /accounts\/account-id\/ai\/run\/@cf\/black-forest-labs\/flux-1-schnell$/);
    assert.equal(request.options.headers.authorization, "Bearer test-token");
    assert.equal(request.body.steps, 6);
    assert.equal(result.buffer.toString(), "fake-cloudflare-image");
    assert.equal(result.estimatedCostUsd, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
