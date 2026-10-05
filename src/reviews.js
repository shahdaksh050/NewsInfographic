import fs from "node:fs/promises";
import path from "node:path";
import { readJson, writeJson } from "./utils.js";

function safeSegment(value, label) {
  if (!/^[a-zA-Z0-9_.-]+$/.test(value)) throw new Error(`Invalid ${label}`);
  return value;
}

export async function getManifest(outputDir, id) {
  safeSegment(id, "run id");
  return readJson(path.join(outputDir, id, "manifest.json"));
}

export async function listRuns(outputDir) {
  try {
    const entries = await fs.readdir(outputDir, { withFileTypes: true });
    const results = [];
    for (const entry of entries.filter((item) => item.isDirectory()).sort((a, b) => b.name.localeCompare(a.name))) {
      try {
        const manifest = await getManifest(outputDir, entry.name);
        results.push({ runId: manifest.runId, createdAt: manifest.createdAt, status: manifest.status, summary: manifest.summary });
      } catch {
        // Ignore directories that are not pipeline runs.
      }
    }
    return results;
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

export async function reviewPost(outputDir, runId, postId, status, note = "") {
  if (!new Set(["approved", "rejected", "pending"]).has(status)) throw new Error("Invalid review status");
  const manifest = await getManifest(outputDir, runId);
  const post = manifest.posts.find((item) => item.id === postId);
  if (!post) throw new Error("Post not found");
  if (post.status !== "draft") throw new Error(`Cannot review a post with status ${post.status}`);
  post.approval = { status, note: String(note).slice(0, 500), reviewedAt: new Date().toISOString() };
  await writeJson(path.join(outputDir, runId, "manifest.json"), manifest);
  return post;
}
