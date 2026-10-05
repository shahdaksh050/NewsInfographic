import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";

test("HTTP API generates, serves, and approves a draft", async (context) => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "upsc-brief-test-"));
  process.env.OUTPUT_DIR = tempRoot;
  const { createServer } = await import(`../src/server.js?test=${Date.now()}`);
  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  context.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await fs.rm(tempRoot, { recursive: true, force: true });
  });
  const base = `http://127.0.0.1:${server.address().port}`;

  const health = await (await fetch(`${base}/health`)).json();
  assert.equal(health.ok, true);
  assert.ok(health.ai.imageModel);
  assert.ok(["cloudflare", "gemini"].includes(health.ai.imageProvider));

  const generatedResponse = await fetch(`${base}/api/generate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      useAi: false,
      includeLowRelevance: true,
      articles: [{
        id: "api-story",
        title: "Parliament considers a new governance policy",
        description: "The proposed policy creates a new oversight process. It will be debated in Parliament. The change concerns public accountability.",
        url: "https://example.test/story",
        source_name: "Test Source",
        published_at: "2026-10-05T10:00:00+05:30"
      }],
    }),
  });
  assert.equal(generatedResponse.status, 201);
  const manifest = await generatedResponse.json();
  assert.equal(manifest.summary.generated, 1);
  assert.equal(manifest.posts[0].approval.status, "pending");

  const imageResponse = await fetch(`${base}/outputs/${manifest.runId}/${manifest.posts[0].image}`);
  assert.equal(imageResponse.status, 200);
  assert.equal(imageResponse.headers.get("content-type"), "image/png");
  assert.ok((await imageResponse.arrayBuffer()).byteLength > 10_000);

  const reviewResponse = await fetch(`${base}/api/runs/${manifest.runId}/posts/api-story/review`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ status: "approved", note: "Verified" }),
  });
  assert.equal(reviewResponse.status, 200);
  assert.equal((await reviewResponse.json()).approval.status, "approved");
});
