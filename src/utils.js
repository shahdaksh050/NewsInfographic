import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export function decodeEntities(value = "") {
  return String(value)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/gi, " ")
    .replace(/&ndash;/gi, "–")
    .replace(/&mdash;/gi, "—")
    .replace(/&lsquo;/gi, "‘")
    .replace(/&rsquo;/gi, "’")
    .replace(/&ldquo;/gi, "“")
    .replace(/&rdquo;/gi, "”")
    .replace(/&hellip;/gi, "…")
    .replace(/&bull;/gi, "•")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .trim();
}

export function stripHtml(value = "") {
  return decodeEntities(
    String(value)
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " "),
  );
}

export function stableId(...parts) {
  return crypto.createHash("sha256").update(parts.filter(Boolean).join("|")).digest("hex").slice(0, 16);
}

export function slugify(value, max = 70) {
  const slug = String(value)
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
  return (slug || "story").slice(0, max).replace(/-+$/g, "");
}

export function escapeXml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function dateLabel(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "DATE UNAVAILABLE";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  })
    .format(date)
    .toUpperCase();
}

export async function ensureDir(directory) {
  await fs.mkdir(directory, { recursive: true });
  return directory;
}

export async function readJson(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

export async function writeJson(file, value) {
  await ensureDir(path.dirname(file));
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function fetchWithTimeout(url, options = {}, timeoutMs = 30000) {
  const signal = AbortSignal.timeout(timeoutMs);
  const response = await fetch(url, { ...options, signal });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const error = new Error(`HTTP ${response.status} from ${url}: ${body.slice(0, 300)}`);
    error.status = response.status;
    error.retryAfter = response.headers.get("retry-after");
    throw error;
  }
  return response;
}
