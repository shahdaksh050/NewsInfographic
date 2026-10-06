import { articleListFromPayload, normalizeArticle } from "../domain.js";
import { fetchWithTimeout } from "../utils.js";

export async function fetchOpenNews({ url, limit = 110, timeoutMs = 30000 } = {}) {
  const endpoint = new URL(url);
  endpoint.searchParams.set("limit", String(Math.min(500, Math.max(1, limit))));
  endpoint.searchParams.set("category", "india");
  const response = await fetchWithTimeout(endpoint, {
    headers: { "user-agent": "UPSCBrief/0.1 (+news-card-generator)" },
  }, timeoutMs);
  const payload = await response.json();
  return articleListFromPayload(payload)
    .map((item) => normalizeArticle(item))
    .slice(0, limit);
}
