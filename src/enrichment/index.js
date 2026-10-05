import { enrichWithGemini } from "./gemini.js";
import { heuristicEnrichment } from "./heuristic.js";

export async function enrichArticle(article, config, { useAi = true } = {}) {
  const fallback = heuristicEnrichment(article);
  if (!useAi || !config.geminiApiKey) return fallback;
  try {
    const result = await enrichWithGemini(article, config);
    return {
      ...fallback,
      ...result,
      headline: String(result.headline).slice(0, 62).toUpperCase(),
      summaryPoints: result.summaryPoints.slice(0, 3).map((point) => String(point).slice(0, 82)),
      relevanceScore: Math.min(100, Math.max(0, Number(result.relevanceScore) || 0)),
    };
  } catch (error) {
    return { ...fallback, warning: `Gemini fallback: ${error.message}` };
  }
}
