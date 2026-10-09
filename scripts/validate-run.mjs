import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const runDirectory = path.resolve(process.argv[2] || "output/upsc-verified-110-final-2026-10-06");
const manifest = JSON.parse(await fs.readFile(path.join(runDirectory, "manifest.json"), "utf8"));
const drafts = manifest.posts.filter((post) => post.status === "draft");
const errors = [];
const headlines = new Set();
const imageNames = new Set();
const methods = {};
const categories = {};

if (manifest.status !== "completed") errors.push(`Manifest status is ${manifest.status}`);
if (drafts.length !== 110) errors.push(`Expected 110 drafts, found ${drafts.length}`);

for (const post of drafts) {
  if (!/^https:\/\/www\.pib\.gov\.in\/PressReleasePage\.aspx\?PRID=\d+/.test(post.source?.url || "")) {
    errors.push(`${post.id}: source is not an official PIB release URL`);
  }
  if (post.editorial?.method !== "verified-extractive" || !post.editorial?.verified) {
    errors.push(`${post.id}: copy is not marked verified-extractive`);
  }
  if ((post.editorial?.summaryPoints || []).length < 2) errors.push(`${post.id}: fewer than two facts`);
  const copy = JSON.stringify(post.editorial || {});
  if (/&(?:[a-z]+|#\d+);|�|â€|Â·/.test(copy)) errors.push(`${post.id}: malformed entity or encoding`);
  if (headlines.has(post.editorial.headline)) errors.push(`${post.id}: duplicate headline`);
  headlines.add(post.editorial.headline);
  if (imageNames.has(post.image)) errors.push(`${post.id}: duplicate image filename`);
  imageNames.add(post.image);

  const imagePath = path.join(runDirectory, post.image);
  try {
    const metadata = await sharp(imagePath).metadata();
    if (metadata.width !== 1080 || metadata.height !== 1350 || metadata.format !== "png") {
      errors.push(`${post.id}: expected 1080x1350 PNG, found ${metadata.width}x${metadata.height} ${metadata.format}`);
    }
  } catch (error) {
    errors.push(`${post.id}: unreadable image (${error.message})`);
  }

  const method = post.generation?.artMethod || "unknown";
  methods[method] = (methods[method] || 0) + 1;
  const category = post.editorial?.category || "Unknown";
  categories[category] = (categories[category] || 0) + 1;
}

const result = {
  valid: errors.length === 0,
  runId: manifest.runId,
  status: manifest.status,
  posts: drafts.length,
  methods,
  categories,
  errors,
};
console.log(JSON.stringify(result, null, 2));
if (errors.length) process.exitCode = 1;
