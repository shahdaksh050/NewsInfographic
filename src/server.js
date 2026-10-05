import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getConfig } from "./config.js";
import { fetchNews } from "./sources/index.js";
import { runPipeline } from "./pipeline.js";
import { getManifest, listRuns, reviewPost } from "./reviews.js";

const config = getConfig();

function json(res, status, body) {
  const data = Buffer.from(JSON.stringify(body, null, 2));
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": data.length,
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "GET,POST,OPTIONS",
  });
  res.end(data);
}

async function bodyJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 2_000_000) throw new Error("Request body exceeds 2 MB");
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function serveOutput(res, pathname) {
  const relative = decodeURIComponent(pathname.slice("/outputs/".length));
  const resolved = path.resolve(config.outputDir, relative);
  const root = `${path.resolve(config.outputDir)}${path.sep}`;
  if (!resolved.startsWith(root)) return json(res, 403, { error: "Forbidden" });
  const data = await fs.readFile(resolved);
  const type = resolved.endsWith(".png") ? "image/png" : "application/json; charset=utf-8";
  res.writeHead(200, { "content-type": type, "content-length": data.length, "cache-control": "no-store" });
  res.end(data);
}

export function createServer() {
  return http.createServer(async (req, res) => {
    if (req.method === "OPTIONS") return json(res, 204, {});
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    try {
      if (req.method === "GET" && url.pathname === "/health") {
        return json(res, 200, {
          ok: true,
          ai: {
            geminiCopy: Boolean(config.geminiApiKey),
            geminiImage: Boolean(config.geminiImageApiKey),
            cloudflareImage: Boolean(config.cloudflareAccountId && config.cloudflareApiToken),
            imageProvider: config.imageProvider,
            imageModel: config.imageProvider === "cloudflare"
              ? config.cloudflareImageModel
              : config.geminiImageModel,
          },
        });
      }
      if (req.method === "GET" && url.pathname === "/api/news") {
        const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit")) || config.limit));
        const source = url.searchParams.get("source") || config.source;
        return json(res, 200, { articles: await fetchNews(config, { limit, source }) });
      }
      if (req.method === "POST" && url.pathname === "/api/generate") {
        const body = await bodyJson(req);
        const manifest = await runPipeline(config, {
          articles: body.articles,
          source: body.source,
          url: body.sourceUrl,
          limit: Math.min(50, Math.max(1, Number(body.limit) || config.limit)),
          useAi: body.useAi !== false,
          includeLowRelevance: Boolean(body.includeLowRelevance),
        });
        return json(res, 201, manifest);
      }
      if (req.method === "GET" && url.pathname === "/api/runs") {
        return json(res, 200, { runs: await listRuns(config.outputDir) });
      }
      const runMatch = url.pathname.match(/^\/api\/runs\/([^/]+)$/);
      if (req.method === "GET" && runMatch) return json(res, 200, await getManifest(config.outputDir, runMatch[1]));

      const reviewMatch = url.pathname.match(/^\/api\/runs\/([^/]+)\/posts\/([^/]+)\/review$/);
      if (req.method === "POST" && reviewMatch) {
        const body = await bodyJson(req);
        return json(res, 200, await reviewPost(config.outputDir, reviewMatch[1], reviewMatch[2], body.status, body.note));
      }
      if (req.method === "GET" && url.pathname.startsWith("/outputs/")) return await serveOutput(res, url.pathname);
      return json(res, 404, { error: "Not found" });
    } catch (error) {
      const code = error.code === "ENOENT" ? 404 : error instanceof SyntaxError || /required|invalid|expected/i.test(error.message) ? 400 : 500;
      return json(res, code, { error: error.message });
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  createServer().listen(config.port, () => {
    console.log(`UPSC Brief API listening on http://localhost:${config.port}`);
  });
}
