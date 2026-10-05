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

export function heuristicEnrichment(article) {
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
