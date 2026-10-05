import readline from "node:readline/promises";
import path from "node:path";
import process from "node:process";
import { getConfig } from "./config.js";
import { runPipeline } from "./pipeline.js";
import { createServer } from "./server.js";
import { getManifest, listRuns, reviewPost } from "./reviews.js";

const color = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function paint(value, tone) {
  return process.stdout.isTTY ? `${color[tone]}${value}${color.reset}` : String(value);
}

function banner() {
  console.log(paint("\n╔══════════════════════════════════════════╗", "yellow"));
  console.log(paint("║          UPSC BRIEF — NEWS STUDIO        ║", "yellow"));
  console.log(paint("╚══════════════════════════════════════════╝", "yellow"));
  console.log(paint("One source-backed social post per news item\n", "dim"));
}

function help() {
  console.log(`UPSC Brief interactive CLI

Usage:
  node src/tui.js
  npm.cmd run cli
  start.cmd

The menu can generate live or fixture posts, review drafts, list previous
runs, display provider status, and start the HTTP API.`);
}

async function askInteger(rl, prompt, fallback, min = 1, max = 50) {
  const answer = (await rl.question(`${prompt} [${fallback}]: `)).trim();
  if (!answer) return fallback;
  const value = Number.parseInt(answer, 10);
  if (!Number.isFinite(value) || value < min || value > max) {
    console.log(paint(`Enter a number from ${min} to ${max}.`, "red"));
    return askInteger(rl, prompt, fallback, min, max);
  }
  return value;
}

async function askYesNo(rl, prompt, fallback = true) {
  const suffix = fallback ? "Y/n" : "y/N";
  const answer = (await rl.question(`${prompt} [${suffix}]: `)).trim().toLowerCase();
  if (!answer) return fallback;
  if (["y", "yes"].includes(answer)) return true;
  if (["n", "no"].includes(answer)) return false;
  console.log(paint("Please answer y or n.", "red"));
  return askYesNo(rl, prompt, fallback);
}

function postLine(post, index) {
  const approval = post.approval?.status || "—";
  const statusTone = post.status === "draft" ? "green" : post.status === "failed" ? "red" : "yellow";
  return `${String(index + 1).padStart(2)}. ${paint(post.status.padEnd(8), statusTone)} ${approval.padEnd(8)} ${post.title}`;
}

function printManifest(manifest, config) {
  console.log(`\n${paint("Run complete", "green")}: ${manifest.runId}`);
  console.log(`Generated ${manifest.summary.generated}, skipped ${manifest.summary.skipped}, failed ${manifest.summary.failed}`);
  if (manifest.summary.estimatedImageCostUsd) {
    console.log(`Estimated Gemini image cost: $${manifest.summary.estimatedImageCostUsd.toFixed(4)}`);
  }
  console.log(`Folder: ${path.join(config.outputDir, manifest.runId)}`);
  manifest.posts.forEach((post, index) => console.log(postLine(post, index)));
}

async function generate(rl, config, source) {
  const limit = await askInteger(rl, "How many posts?", config.limit);
  const useAi = await askYesNo(rl, "Use Gemini copy and image generation?", true);
  const includeLowRelevance = source === "fixture"
    ? true
    : await askYesNo(rl, "Include low-UPSC-relevance stories?", false);
  console.log(paint(`\nFetching ${source} stories…`, "cyan"));
  const imageConfigured = config.imageProvider === "cloudflare"
    ? Boolean(config.cloudflareAccountId && config.cloudflareApiToken)
    : Boolean(config.geminiImageApiKey);
  if (useAi && !imageConfigured) {
    console.log(paint(`No ${config.imageProvider} image credentials detected; artwork will use the local fallback.`, "yellow"));
  }
  const manifest = await runPipeline(config, {
    source,
    limit,
    useAi,
    includeLowRelevance,
    onProgress(event) {
      const symbol = event.result.status === "draft" ? "✓" : event.result.status === "failed" ? "✗" : "–";
      console.log(` ${symbol} ${event.result.status.padEnd(8)} ${event.generated}/${event.target} — ${event.result.title}`);
    },
  });
  printManifest(manifest, config);
}

async function chooseRun(rl, config) {
  const runs = await listRuns(config.outputDir);
  if (!runs.length) {
    console.log(paint("No generated runs found.", "yellow"));
    return null;
  }
  console.log("");
  runs.slice(0, 20).forEach((run, index) => {
    const summary = run.summary || {};
    console.log(`${String(index + 1).padStart(2)}. ${run.runId}  ${run.status}  (${summary.generated || 0} generated)`);
  });
  const number = await askInteger(rl, "Select run", 1, 1, Math.min(20, runs.length));
  return runs[number - 1];
}

async function showRuns(rl, config) {
  const run = await chooseRun(rl, config);
  if (!run) return;
  const manifest = await getManifest(config.outputDir, run.runId);
  printManifest(manifest, config);
}

async function review(rl, config) {
  const run = await chooseRun(rl, config);
  if (!run) return;
  const manifest = await getManifest(config.outputDir, run.runId);
  const drafts = manifest.posts.filter((post) => post.status === "draft");
  if (!drafts.length) {
    console.log(paint("This run contains no reviewable drafts.", "yellow"));
    return;
  }
  console.log("");
  drafts.forEach((post, index) => console.log(postLine(post, index)));
  const number = await askInteger(rl, "Select post", 1, 1, drafts.length);
  const post = drafts[number - 1];
  const choice = (await rl.question("Decision — [a]pprove, [r]eject, [p]ending: ")).trim().toLowerCase();
  const status = choice.startsWith("a") ? "approved" : choice.startsWith("r") ? "rejected" : "pending";
  const note = (await rl.question("Review note (optional): ")).trim();
  const updated = await reviewPost(config.outputDir, run.runId, post.id, status, note);
  console.log(paint(`${updated.title}: ${updated.approval.status}`, status === "approved" ? "green" : "yellow"));
}

function providerStatus(config) {
  console.log(`\nNews source:       ${config.source}`);
  console.log(`Gemini copy:       ${config.geminiApiKey ? paint("configured", "green") : paint("not configured", "yellow")}`);
  console.log(`Gemini image:      ${config.geminiImageApiKey ? paint("configured", "green") : paint("not configured", "yellow")}`);
  console.log(`Cloudflare image:  ${config.cloudflareAccountId && config.cloudflareApiToken ? paint("configured", "green") : paint("not configured", "yellow")}`);
  console.log(`Image provider:    ${config.imageProvider}`);
  console.log(`Image model:       ${config.imageProvider === "cloudflare" ? config.cloudflareImageModel : config.geminiImageModel}`);
  console.log(`Image output:      4:5 final post`);
  console.log(`Output directory:  ${config.outputDir}`);
  if (config.imageProvider === "gemini") console.log(paint("Gemini image generation requires a paid API tier.", "dim"));
}

async function startApi(rl, config) {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(config.port, resolve);
  });
  console.log(paint(`\nAPI running at http://localhost:${config.port}`, "green"));
  console.log("Press Enter to stop it and return to the menu.");
  await rl.question("");
  await new Promise((resolve) => server.close(resolve));
  console.log("API stopped.");
}

async function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) return help();
  const config = getConfig();
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.on("SIGINT", () => rl.close());
  banner();

  try {
    while (true) {
      console.log(`
${paint("1", "cyan")}  Generate from live open-source news
${paint("2", "cyan")}  Generate from official PIB RSS
${paint("3", "cyan")}  Generate demo posts
${paint("4", "cyan")}  List and inspect previous runs
${paint("5", "cyan")}  Review a generated post
${paint("6", "cyan")}  Start HTTP API
${paint("7", "cyan")}  Show configuration status
${paint("0", "cyan")}  Exit
`);
      const choice = (await rl.question("Choose an action: ")).trim();
      try {
        if (choice === "0" || choice.toLowerCase() === "q") break;
        if (choice === "1") await generate(rl, config, "opennews");
        else if (choice === "2") await generate(rl, config, "pib");
        else if (choice === "3") await generate(rl, config, "fixture");
        else if (choice === "4") await showRuns(rl, config);
        else if (choice === "5") await review(rl, config);
        else if (choice === "6") await startApi(rl, config);
        else if (choice === "7") providerStatus(config);
        else console.log(paint("Unknown choice.", "red"));
      } catch (error) {
        console.error(paint(`Error: ${error.message}`, "red"));
      }
    }
  } finally {
    rl.close();
  }
  console.log("Goodbye.");
}

await main();
