import { deduplicateArticles, extractTopicTokens, normalizeArticle, topicSimilarity } from "../domain.js";
import { decodeEntities, fetchWithTimeout, stripHtml } from "../utils.js";

export const PIB_RSS_URL = "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3";
export const PIB_BACKUP_RSS_URL = "https://pib.gov.in/RssMain.aspx?ModId=8&Lang=1&Regid=3";
export const PIB_RELEASE_INDEX_URL = "https://www.pib.gov.in/AllRelease.aspx?lang=1&reg=1";

const UPSC_AREAS = [
  {
    category: "Polity & Governance",
    papers: ["GS2"],
    score: 18,
    terms: ["constitution", "constitutional", "parliament", "election", "judiciary", "court", "justice", "rights", "governance", "commission", "authority", "tribal", "panchayat", "federal", "regulation", "guidelines"],
  },
  {
    category: "Economy",
    papers: ["GS3"],
    score: 17,
    terms: ["economy", "economic", "gdp", "inflation", "fiscal", "monetary", "bank", "finance", "investment", "fund", "trade", "export", "import", "tax", "msme", "industry", "manufacturing", "logistics", "infrastructure", "capex", "statistics", "index"],
  },
  {
    category: "Agriculture & Food Security",
    papers: ["GS3"],
    score: 17,
    terms: ["agriculture", "farmer", "crop", "food", "irrigation", "fisheries", "livestock", "fertilizer", "storage", "fpo", "rural", "land", "water supply"],
  },
  {
    category: "Environment & Geography",
    papers: ["GS1", "GS3"],
    score: 18,
    terms: ["climate", "environment", "forest", "wildlife", "biodiversity", "pollution", "wetland", "tiger", "cheetah", "river", "ocean", "renewable", "green energy", "grid", "transmission", "battery", "disaster", "weather", "mineral", "waste", "carbon", "energy security"],
  },
  {
    category: "Science & Technology",
    papers: ["GS3"],
    score: 18,
    terms: ["science", "technology", "space", "satellite", "quantum", "semiconductor", "artificial intelligence", " ai ", "cyber", "digital", "research", "nuclear", "biotechnology", "supercomput", "telecom", "innovation"],
  },
  {
    category: "International Relations",
    papers: ["GS2"],
    score: 16,
    terms: ["bilateral", "strategic partnership", "g20", "brics", "united nations", "international", "joint declaration", "cooperation", "wto", "global", "foreign", "diplomatic", "indo-", "india-"],
  },
  {
    category: "Security & Defence",
    papers: ["GS3"],
    score: 17,
    terms: ["defence", "defense", "drdo", "navy", "army", "air force", "missile", "brahmos", "maritime", "border", "counter terror", "security", "military", "indigenous fleet", "aero-engine"],
  },
  {
    category: "Society & Social Justice",
    papers: ["GS1", "GS2"],
    score: 16,
    terms: ["health", "education", "women", "children", "nutrition", "employment", "labour", "skill", "housing", "social justice", "disability", "divyang", "tribal communities", "sanitation", "poverty"],
  },
  {
    category: "History, Art & Culture",
    papers: ["GS1"],
    score: 15,
    terms: ["heritage", "culture", "archaeology", "classical language", "museum", "archive", "restoration", "monument", "unesco", "traditional", "craft"],
  },
];

const LOW_VALUE = [
  /congratulat/i,
  /greetings? on/i,
  /pays? tribute/i,
  /meets? (?:the )?(?:prime minister|president|minister)/i,
  /birthday/i,
  /cleanliness drive/i,
  /swachhata hi seva/i,
  /special campaign 6/i,
  /blood donation/i,
  /to visit/i,
  /attends? .*event/i,
  /inaugurates? .*office/i,
  /photo feature/i,
  /^press release$/i,
];

const HIGH_VALUE = [
  /cabinet approves/i,
  /launch(?:es|ed)?/i,
  /notifies?|rules?|policy|scheme|mission|framework|survey|report|index|guidelines?/i,
  /first|indigenous|record|milestone/i,
  /agreement|treaty|memorandum|mou/i,
];

function tag(xml, name) {
  const match = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i"));
  return match ? decodeEntities(match[1]) : "";
}

function hiddenFields(html) {
  const fields = {};
  for (const match of String(html).matchAll(/<input[^>]+type=["']hidden["'][^>]*>/gi)) {
    const tagText = match[0];
    const name = /\bname=["']([^"']+)["']/i.exec(tagText)?.[1];
    const value = /\bvalue=["']([^"']*)["']/i.exec(tagText)?.[1] || "";
    if (name) fields[name] = decodeEntities(value);
  }
  return fields;
}

function elementById(html, id) {
  const pattern = new RegExp(`<[^>]+id=["']${id}["'][^>]*>([\\s\\S]*?)<\\/[^>]+>`, "i");
  return stripHtml(pattern.exec(html)?.[1] || "");
}

function sentences(text) {
  return String(text)
    .replace(/\s+/g, " ")
    .replace(/\b(Dr|Mr|Mrs|Ms|Smt|Nos)\./g, "$1")
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 35 && part.length <= 360);
}

function clampAtWord(text, max = 140) {
  const clean = String(text)
    .replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  if (clean.length <= max) return clean;
  const prefix = clean.slice(0, max);
  const boundaries = [prefix.lastIndexOf(";"), prefix.lastIndexOf(":"), prefix.lastIndexOf(",")]
    .filter((index) => index >= 45);
  if (boundaries.length) return `${prefix.slice(0, Math.max(...boundaries)).replace(/[,:;\s]+$/, "")}.`;
  const clipped = clean.slice(0, max - 1).replace(/\s+\S*$/, "").replace(/[,:;\s]+$/, "");
  return `${clipped}…`;
}

function parsePibDate(value) {
  const match = String(value).match(/(\d{1,2})\s+([A-Z]{3})\s+(\d{4})\s+(\d{1,2}):(\d{2})(AM|PM)/i);
  if (!match) return value;
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const month = months.indexOf(match[2].toUpperCase());
  if (month < 0) return value;
  let hour = Number(match[4]) % 12;
  if (match[6].toUpperCase() === "PM") hour += 12;
  const utc = Date.UTC(Number(match[3]), month, Number(match[1]), hour, Number(match[5])) - (330 * 60 * 1000);
  return new Date(utc).toISOString();
}

function factScore(value) {
  const text = String(value).toLowerCase();
  let score = 0;
  if (/\d/.test(text)) score += 5;
  for (const term of ["approved", "launched", "covers", "provides", "target", "scheme", "mission", "policy", "framework", "agreement", "report", "survey", "first", "will", "aims", "includes"]) {
    if (text.includes(term)) score += 2;
  }
  for (const term of ["said", "urged", "today", "attended", "address", "shared", "social media", "participated", "felicitated"]) {
    if (text.includes(term)) score -= 3;
  }
  if (/#|welcome to the world|programme was structured|event celebrates|sports competitions|photo|click here/.test(text)) score -= 10;
  if (value.length >= 45 && value.length <= 125) score += 3;
  return score;
}

function uniqueFacts(values, limit = 3) {
  const selected = [];
  const ranked = values
    .filter(Boolean)
    .map((value, index) => ({ value, score: factScore(value) + (index === 0 ? 2 : 0), index }))
    .sort((a, b) => b.score - a.score || a.index - b.index);
  for (const { value } of ranked) {
    const fact = clampAtWord(value);
    if (fact.length < 20) continue;
    const key = fact.toLowerCase().replace(/[^a-z0-9]+/g, " ");
    if (selected.some((item) => item.key === key)) continue;
    selected.push({ key, fact });
    if (selected.length === limit) break;
  }
  return selected.map((item) => item.fact);
}

export function classifyPibTopic(title, ministry = "", body = "") {
  const haystack = ` ${title} ${ministry} ${body.slice(0, 1200)} `.toLowerCase();
  const matches = UPSC_AREAS.map((area) => ({
    ...area,
    hits: area.terms.filter((term) => haystack.includes(term)).length,
  })).sort((a, b) => (b.hits * b.score) - (a.hits * a.score));
  const best = matches[0];
  const matchedAreas = matches.filter((area) => area.hits > 0);
  const papers = [...new Set(matchedAreas.slice(0, 2).flatMap((area) => area.papers))].slice(0, 3);
  const penalty = LOW_VALUE.some((pattern) => pattern.test(title)) ? 45 : 0;
  const bonus = HIGH_VALUE.filter((pattern) => pattern.test(title)).length * 7;
  const rawScore = 32 + (best?.hits || 0) * (best?.score || 10) + bonus - penalty;
  return {
    category: best?.hits ? best.category : "Current Affairs",
    upscPapers: papers.length ? papers : ["Prelims"],
    relevanceScore: Math.max(0, Math.min(100, rawScore)),
  };
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

export function parsePibReleaseIndex(html) {
  const content = String(html);
  const result = [];
  const tokenPattern = /<h3[^>]*>([\s\S]*?)<\/h3>|<li[^>]*>\s*<a[^>]+href=["']([^"']*(?:PressReleseDetail|PressReleasePage)\.aspx\?[^"']*PRID=(\d+)[^"']*)["'][^>]*>([\s\S]*?)<\/a>[\s\S]*?<span[^>]*class=["']publishdatesmall["'][^>]*>\s*Posted on:\s*([^<]+)/gi;
  let ministry = "Press Information Bureau";
  for (const match of content.matchAll(tokenPattern)) {
    if (match[1]) {
      ministry = stripHtml(match[1]);
      continue;
    }
    const title = stripHtml(match[4]);
    const prid = match[3];
    if (!title || !prid) continue;
    result.push({
      prid,
      title,
      ministry,
      publishedLabel: stripHtml(match[5]),
      url: `https://www.pib.gov.in/PressReleasePage.aspx?PRID=${prid}&lang=1&reg=3`,
    });
  }
  return result;
}

export function parsePibReleasePage(html, fallback = {}) {
  const content = String(html);
  const title = elementById(content, "Titleh2") || fallback.title || "";
  const ministry = elementById(content, "MinistryName") || fallback.ministry || "Press Information Bureau";
  const subtitle = elementById(content, "Subtitleh3");
  const posted = elementById(content, "PrDateTime").replace(/^Posted On:\s*/i, "");
  const bodyStart = content.search(/id=["']PrDateTime["']/i);
  const bodyEnd = content.search(/id=["']ReleaseId["']/i);
  const bodyHtml = bodyStart >= 0
    ? content.slice(bodyStart, bodyEnd > bodyStart ? bodyEnd : bodyStart + 30000)
    : content;
  const paragraphs = [...bodyHtml.matchAll(/<(?:p|li)(?:\s[^>]*)?>([\s\S]*?)<\/(?:p|li)>/gi)]
    .map((match) => stripHtml(match[1]))
    .filter((part) => part && !/^\*+$/.test(part) && !/^image$/i.test(part));
  const body = paragraphs.join(" ");
  const titleTokens = extractTopicTokens(title);
  const factCandidates = [subtitle, ...paragraphs.flatMap(sentences)].filter((value) =>
    !/^\s*\d+[,.]\s/.test(value) &&
    topicSimilarity(titleTokens, extractTopicTokens(value)) < 0.72,
  );
  const facts = uniqueFacts(factCandidates);
  const classification = classifyPibTopic(title, ministry);
  const publishedAt = parsePibDate(posted || fallback.publishedLabel || new Date().toISOString());
  const url = fallback.url || "";

  return normalizeArticle({
    id: `pib-${fallback.prid || /Release ID:\s*(\d+)/i.exec(content)?.[1] || "release"}`,
    title,
    description: facts.join(" "),
    url,
    source_name: `${ministry} · Press Information Bureau`,
    published_at: publishedAt,
    category: classification.category,
    verified: true,
    verification: {
      publisher: "Press Information Bureau, Government of India",
      sourceUrl: url,
      checkedAt: new Date().toISOString(),
      method: "Extractive: facts are selected from the official release text",
    },
    summary_points: facts,
    upsc_papers: classification.upscPapers,
    relevance_score: classification.relevanceScore,
  });
}

async function fetchRelease(release, timeoutMs) {
  const response = await fetchWithTimeout(release.url, {
    headers: { "user-agent": "UPSCBrief/0.2 (+source-verification)" },
  }, timeoutMs);
  return parsePibReleasePage(await response.text(), release);
}

async function fetchArchiveIndexes(timeoutMs) {
  const headers = { "user-agent": "UPSCBrief/0.2 (+news-card-generator)" };
  const currentResponse = await fetchWithTimeout(PIB_RELEASE_INDEX_URL, { headers }, timeoutMs);
  const currentHtml = await currentResponse.text();
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const previous = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const form = new URLSearchParams({
    ...hiddenFields(currentHtml),
    __EVENTTARGET: "ctl00$ContentPlaceHolder1$ddlMonth",
    __EVENTARGUMENT: "",
    "ctl00$ContentPlaceHolder1$ddlMinistry": "0",
    "ctl00$ContentPlaceHolder1$ddlday": "0",
    "ctl00$ContentPlaceHolder1$ddlMonth": String(previous.getUTCMonth() + 1),
    "ctl00$ContentPlaceHolder1$ddlYear": String(previous.getUTCFullYear()),
  });
  const cookie = currentResponse.headers.get("set-cookie") || "";
  const previousResponse = await fetchWithTimeout(PIB_RELEASE_INDEX_URL, {
    method: "POST",
    headers: { ...headers, "content-type": "application/x-www-form-urlencoded", cookie },
    body: form,
  }, Math.max(timeoutMs, 60000));
  const previousHtml = await previousResponse.text();
  return currentMonth === previous.getUTCMonth() + 1 ? [currentHtml] : [currentHtml, previousHtml];
}

async function concurrentMap(items, concurrency, mapper) {
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      try {
        results[index] = await mapper(items[index], index);
      } catch {
        results[index] = null;
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results.filter(Boolean);
}

function balancedSelection(items, limit) {
  const buckets = new Map();
  for (const item of items) {
    if (!buckets.has(item.category)) buckets.set(item.category, []);
    buckets.get(item.category).push(item);
  }
  const selected = [];
  const selectedIds = new Set();
  while (selected.length < limit) {
    let added = false;
    for (const bucket of buckets.values()) {
      const item = bucket.shift();
      if (!item) continue;
      selected.push(item);
      selectedIds.add(item.prid);
      added = true;
      if (selected.length === limit) break;
    }
    if (!added) break;
  }
  if (selected.length < limit) {
    for (const item of items) {
      if (selectedIds.has(item.prid)) continue;
      selected.push(item);
      if (selected.length === limit) break;
    }
  }
  return selected;
}

export async function fetchPibNews({ limit = 110, timeoutMs = 30000 } = {}) {
  const archivePages = await fetchArchiveIndexes(timeoutMs);
  const releases = [...new Map(
    archivePages.flatMap(parsePibReleaseIndex).map((release) => [release.prid, release]),
  ).values()];
  if (releases.length === 0) return [];

  const ranked = releases
    .map((release) => ({ ...release, ...classifyPibTopic(release.title, release.ministry) }))
    .filter((release) => release.relevanceScore >= 55 && !LOW_VALUE.some((pattern) => pattern.test(release.title)))
    .sort((a, b) => b.relevanceScore - a.relevanceScore || b.prid.localeCompare(a.prid));
  const candidateCount = Math.min(ranked.length, Math.max(limit + 60, Math.ceil(limit * 1.8)));
  const candidates = balancedSelection(ranked, candidateCount);
  const detailed = await concurrentMap(candidates, 8, (release) => fetchRelease(release, timeoutMs));
  return deduplicateArticles(detailed)
    .filter((article) => (article.raw?.relevance_score || 0) >= 55 && article.raw?.summary_points?.length >= 2)
    .slice(0, limit);
}
