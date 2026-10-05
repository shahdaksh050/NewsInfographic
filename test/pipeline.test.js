import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";
import { runPipeline } from "../src/pipeline.js";

test("refuses to generate output when no articles exist", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "pipeline-test-"));
  try {
    await assert.rejects(
      () => runPipeline({ outputDir: tempDir, limit: 2, relevanceThreshold: 35 }, { articles: [] }),
      /No articles retrieved/,
    );
    const files = await fs.readdir(tempDir);
    assert.equal(files.length, 0, "No empty directory should be left");
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

test("refuses to generate output without an actual image when useAi is true", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "pipeline-test-"));
  try {
    const config = {
      outputDir: tempDir,
      limit: 1,
      relevanceThreshold: 10,
      imageProvider: "cloudflare",
      cloudflareAccountId: "", // unconfigured so AI generation fails
      cloudflareApiToken: "",
      geminiApiKey: "",
      geminiImageApiKey: "",
    };

    // When useAi is true (default) and no image is available, it should refuse to produce an output card
    await assert.rejects(
      () =>
        runPipeline(config, {
          useAi: true,
          includeLowRelevance: true,
          articles: [
            {
              id: "no-image-article",
              title: "Test article without image",
              description: "This is a test description.",
              url: "https://example.test/no-image",
            },
          ],
        }),
      /No posts could be generated with actual images/,
    );

    const files = await fs.readdir(tempDir);
    assert.equal(files.length, 0, "Directory should be cleaned up when no actual image was generated");
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});
