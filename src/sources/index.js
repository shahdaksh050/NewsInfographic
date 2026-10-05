import path from "node:path";
import { fetchPibNews } from "./pib.js";
import { fetchJsonNews } from "./json.js";
import { fetchOpenNews } from "./opennews.js";

export async function fetchNews(config, overrides = {}) {
  const source = overrides.source || config.source;
  const limit = overrides.limit || config.limit;
  const timeoutMs = config.requestTimeoutMs;

  if (source === "pib") return fetchPibNews({ limit, timeoutMs });
  if (source === "opennews") {
    return fetchOpenNews({ url: config.openNewsUrl, limit, timeoutMs });
  }
  if (source === "fixture") {
    const file = overrides.file || path.resolve("fixtures/news.json");
    return fetchJsonNews({ file, limit, timeoutMs });
  }
  if (source === "json") {
    return fetchJsonNews({ url: overrides.url || config.sourceUrl, limit, timeoutMs });
  }
  throw new Error(`Unknown news source: ${source}`);
}
