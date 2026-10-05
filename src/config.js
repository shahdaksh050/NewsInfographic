import path from "node:path";

try {
  process.loadEnvFile?.();
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

function intEnv(name, fallback, min = 0, max = Number.MAX_SAFE_INTEGER) {
  const value = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

export function getConfig(overrides = {}) {
  return {
    source: process.env.NEWS_SOURCE || "opennews",
    sourceUrl: process.env.NEWS_SOURCE_URL || "",
    openNewsUrl:
      process.env.OPEN_NEWS_URL ||
      "https://nlko2jkif0.execute-api.ap-south-1.amazonaws.com/prod/news/latest",
    limit: intEnv("NEWS_LIMIT", 11, 1, 50),
    geminiApiKey: process.env.GEMINI_API_KEY || "",
    geminiModel: process.env.GEMINI_MODEL || "gemini-3.1-flash-lite",
    geminiImageApiKey: process.env.GEMINI_IMAGE_API_KEY || process.env.GEMINI_API_KEY || "",
    geminiImageModel: process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-lite-image",
    geminiImageAspectRatio: process.env.GEMINI_IMAGE_ASPECT_RATIO || "4:5",
    geminiImageSize: process.env.GEMINI_IMAGE_SIZE || "1K",
    cloudflareAccountId: process.env.CLOUDFLARE_ACCOUNT_ID || "",
    cloudflareApiToken: process.env.CLOUDFLARE_API_TOKEN || "",
    cloudflareImageModel:
      process.env.CLOUDFLARE_IMAGE_MODEL || "@cf/black-forest-labs/flux-1-schnell",
    cloudflareImageSteps: intEnv("CLOUDFLARE_IMAGE_STEPS", 6, 1, 8),
    imageProvider: process.env.IMAGE_PROVIDER || "cloudflare",
    brandName: process.env.BRAND_NAME || "UPSC BRIEF",
    outputDir: path.resolve(process.env.OUTPUT_DIR || "output"),
    port: intEnv("PORT", 8787, 1, 65535),
    relevanceThreshold: intEnv("UPSC_RELEVANCE_THRESHOLD", 35, 0, 100),
    requestTimeoutMs: intEnv("REQUEST_TIMEOUT_MS", 30000, 1000, 120000),
    imageRetryCount: intEnv("IMAGE_RETRY_COUNT", 3, 0, 6),
    ...overrides,
  };
}
