import fs from "node:fs/promises";
import { articleListFromPayload, normalizeArticle } from "../domain.js";
import { fetchWithTimeout } from "../utils.js";

export async function fetchJsonNews({ url, file, limit = 11, timeoutMs = 30000 } = {}) {
  let payload;
  if (file) payload = JSON.parse(await fs.readFile(file, "utf8"));
  else if (url) payload = await (await fetchWithTimeout(url, {}, timeoutMs)).json();
  else throw new Error("JSON source requires a URL or fixture file");

  return articleListFromPayload(payload).map((item) => normalizeArticle(item)).slice(0, limit);
}
