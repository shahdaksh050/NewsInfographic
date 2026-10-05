import { stableId, stripHtml } from "./utils.js";

function first(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function parseDate(value) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

export function normalizeArticle(input, defaults = {}) {
  if (!input || typeof input !== "object") throw new TypeError("Article must be an object");

  const title = stripHtml(first(input.title, input.headline, input.name));
  if (!title) throw new TypeError("Article title is required");

  const url = String(first(input.url, input.link, input.source_url, defaults.url, ""));
  const description = stripHtml(
    first(input.description, input.summary, input.content, input.excerpt, input.body, ""),
  );
  const sourceName = stripHtml(
    first(
      input.source_name,
      typeof input.source === "string" ? input.source : input.source?.name,
      defaults.sourceName,
      "Unknown source",
    ),
  );
  const rawUpstreamId = first(input.id, input.guid);
  const upstreamId = rawUpstreamId == null ? "" : String(rawUpstreamId);
  const id = upstreamId && /^[a-zA-Z0-9_.-]+$/.test(upstreamId)
    ? upstreamId
    : stableId(upstreamId, url, title);

  return {
    id,
    upstreamId,
    title,
    description,
    url,
    sourceName,
    publishedAt: parseDate(first(input.published_at, input.publishedAt, input.published, input.pubDate)),
    imageUrl: String(first(input.image_url, input.imageUrl, input.urlToImage, "")),
    category: stripHtml(first(input.category, defaults.category, "Current Affairs")),
    raw: input,
  };
}

export function articleListFromPayload(payload) {
  if (Array.isArray(payload)) return payload;
  for (const key of ["articles", "items", "results", "data", "news"]) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  throw new TypeError("Expected an array or an object containing articles/items/results/data/news");
}
