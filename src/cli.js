import path from "node:path";
import { getConfig } from "./config.js";
import { runPipeline } from "./pipeline.js";

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--no-ai") result.useAi = false;
    else if (arg === "--allow-fallback-art") result.allowFallbackArt = true;
    else if (arg === "--summary-only") result.summaryOnly = true;
    else if (arg === "--include-low-relevance") result.includeLowRelevance = true;
    else if (arg.startsWith("--")) {
      const [rawKey, inline] = arg.slice(2).split("=", 2);
      const key = rawKey.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      result[key] = inline ?? argv[++index];
    }
  }
  if (result.limit) result.limit = Math.min(500, Math.max(1, Number(result.limit) || 110));
  return result;
}

const args = parseArgs(process.argv.slice(2));
const config = getConfig({
  ...(args.out ? { outputDir: path.resolve(args.out) } : {}),
  ...(args.brand ? { brandName: args.brand } : {}),
});

try {
  const manifest = await runPipeline(config, args);
  console.log(JSON.stringify(args.summaryOnly ? {
    runId: manifest.runId,
    status: manifest.status,
    output: path.join(config.outputDir, manifest.runId),
    summary: manifest.summary,
  } : manifest, null, 2));
  if (manifest.summary.failed) process.exitCode = 1;
} catch (error) {
  console.error(error.stack || error.message);
  process.exitCode = 1;
}
