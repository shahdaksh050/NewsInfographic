const TOPICS = [
  { category: "Polity & Governance", papers: ["GS2"], words: ["constitution", "court", "parliament", "bill", "act", "ministry", "governance", "election", "rights", "policy"] },
  { category: "Economy", papers: ["GS3"], words: ["economy", "inflation", "gdp", "bank", "trade", "export", "import", "budget", "tax", "employment", "agriculture", "food"] },
  { category: "Environment", papers: ["GS3"], words: ["climate", "forest", "wildlife", "pollution", "environment", "biodiversity", "river", "energy", "disaster"] },
  { category: "International Relations", papers: ["GS2"], words: ["summit", "treaty", "bilateral", "united nations", "foreign", "diplomatic", "global", "international"] },
  { category: "Science & Technology", papers: ["GS3"], words: ["science", "technology", "space", "satellite", "ai", "nuclear", "research", "digital", "cyber"] },
  { category: "History & Culture", papers: ["GS1"], words: ["history", "heritage", "culture", "archaeology", "museum", "anniversary", "freedom"] },
  { category: "Society", papers: ["GS1", "GS2"], words: ["health", "education", "women", "children", "poverty", "caste", "tribal", "welfare", "population"] },
];

function sentences(text) {
  return String(text)
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 20);
}

function clampText(text, max = 82) {
  if (text.length <= max) return text;
  const clipped = text.slice(0, max - 1).replace(/\s+\S*$/, "");
  return `${clipped}…`;
}

function verifiedEnrichment(article) {
  const raw = article.raw || {};
  if (!raw.verified || !Array.isArray(raw.summary_points) || raw.summary_points.length < 2) return null;
  const papers = Array.isArray(raw.upsc_papers) && raw.upsc_papers.length
    ? raw.upsc_papers.map(String)
    : ["Prelims"];
  let topic = article.title
    .replace(/^(?:national conclave on|cabinet approves?|government (?:of india )?|union (?:minister|government)|ministry of [^:]+)\s+/i, "")
    .replace(/:\s*(?:dr\.|shri|smt\.).*$/i, "")
    .replace(/\bto give fresh impetus to\b/i, "—");
  const firstClause = topic.split(/\s*;\s*/)[0];
  if (firstClause.length >= 28 && firstClause.length <= 76) topic = firstClause;
  return {
    headline: clampText(topic.toUpperCase(), 76),
    summaryPoints: raw.summary_points.slice(0, 3).map((item) => clampText(String(item), 140)),
    category: article.category || "Current Affairs",
    upscPapers: papers,
    relevanceScore: Math.min(100, Math.max(0, Number(raw.relevance_score) || 85)),
    visualPrompt: [
      "Create a text-free premium Indian current-affairs editorial illustration.",
      `Verified topic: ${article.title}.`,
      `UPSC theme: ${article.category}; syllabus: ${papers.join(", ")}.`,
      "Use a distinctive topic-specific subject, institution, landscape, technology, or infrastructure—not generic politicians.",
      "Contemporary documentary realism, sophisticated Indian editorial color palette, natural light, and strong depth.",
      "Keep the upper-left and central-left areas calm enough for readable editorial copy; concentrate detail on the right and lower third.",
      "No text, letters, numbers, captions, logos, watermarks, borders, flags as decoration, or fake interface elements.",
    ].join(" "),
    method: "verified-extractive",
    verified: true,
  };
}

export function heuristicEnrichment(article) {
  const verified = verifiedEnrichment(article);
  if (verified) return verified;
  const haystack = `${article.title} ${article.description}`.toLowerCase();
  const matches = TOPICS.map((topic) => ({
    ...topic,
    hits: topic.words.filter((word) => haystack.includes(word)).length,
  })).sort((a, b) => b.hits - a.hits);
  const best = matches[0];
  const hasOfficialSource = /press information bureau|pib|government/i.test(article.sourceName);
  const relevanceScore = Math.min(100, 18 + best.hits * 18 + (hasOfficialSource ? 12 : 0));
  const sourceSentences = sentences(article.description);
  const fallbacks = [
    sourceSentences[0] || article.title,
    sourceSentences[1] || `The development is relevant to ${best.category.toLowerCase()}.`,
    sourceSentences[2] || `For UPSC, connect it with ${best.papers.join(" and ")} syllabus themes.`,
  ];

  return {
    headline: clampText(article.title.toUpperCase(), 62),
    summaryPoints: fallbacks.slice(0, 3).map((item) => clampText(item, 82)),
    category: best.hits ? best.category : article.category || "Current Affairs",
    upscPapers: best.hits ? best.papers : ["Prelims"],
    relevanceScore,
    visualPrompt: [
      "Create a text-free cinematic editorial scene for Indian current affairs.",
      `Topic: ${article.title}.`,
      "Rich photorealistic documentary realism, vibrant natural colors, dramatic warm daylight, and deep environmental storytelling.",
      "Use one strong human or symbolic subject concentrated in the lower half and right side.",
      "Vertical composition with generous clear bright daylight sky in the upper-left quadrant.",
      "Historically and geographically plausible, authentic and non-sensational.",
      "No words, letters, captions, logos, watermarks, flags used as decoration, or fake UI.",
    ].join(" "),
    method: "heuristic",
  };
}
