import { normalizeArticle } from "../domain.js";
import { decodeEntities, stripHtml, fetchWithTimeout } from "../utils.js";

export const PIB_RSS_URL = "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=1";
export const PIB_BACKUP_RSS_URL = "https://pib.gov.in/RssMain.aspx?ModId=8&Lang=1&Regid=1";

function tag(xml, name) {
  const match = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i"));
  return match ? decodeEntities(match[1]) : "";
}

export function parsePibRss(xml) {
  const items = [...String(xml).matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)];
  return items.map(([, item]) =>
    normalizeArticle(
      {
        guid: tag(item, "guid"),
        title: tag(item, "title"),
        description: stripHtml(tag(item, "description")),
        link: tag(item, "link"),
        pubDate: tag(item, "pubDate"),
        category: tag(item, "category") || "Government",
      },
      { sourceName: "Press Information Bureau" },
    ),
  );
}

export async function fetchPibNews({ limit = 11, timeoutMs = 30000 } = {}) {
  const candidateUrls = [
    PIB_RSS_URL,
    PIB_BACKUP_RSS_URL,
    "https://pib.gov.in/RssMain.aspx?ModId=8&Lang=2&Regid=1",
  ];

  for (const url of candidateUrls) {
    try {
      const response = await fetchWithTimeout(url, {
        headers: { "user-agent": "UPSCBrief/0.1 (+news-card-generator)" },
      }, timeoutMs);
      const xml = await response.text();
      const articles = parsePibRss(xml);
      if (articles.length > 0) {
        return articles.slice(0, limit);
      }
    } catch {
      // try next candidate endpoint
    }
  }

  return [];
}
