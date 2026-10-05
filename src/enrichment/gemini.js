import { fetchWithTimeout } from "../utils.js";

const schema = {
  type: "OBJECT",
  properties: {
    headline: { type: "STRING" },
    summaryPoints: { type: "ARRAY", items: { type: "STRING" }, minItems: 3, maxItems: 3 },
    category: { type: "STRING" },
    upscPapers: { type: "ARRAY", items: { type: "STRING" } },
    relevanceScore: { type: "INTEGER", minimum: 0, maximum: 100 },
    visualPrompt: { type: "STRING" },
  },
  required: ["headline", "summaryPoints", "category", "upscPapers", "relevanceScore", "visualPrompt"],
};

export async function enrichWithGemini(article, config) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.geminiModel)}:generateContent`;
  const prompt = `You are an exacting UPSC current-affairs editor. Use ONLY the supplied article fields. Do not invent facts. Create a concise social card with:
1. Headline: A punchy, dramatic 2-line editorial headline in UPPERCASE (20-45 characters total, e.g. "INDIA WAS RUNNING SHORT OF FOOD" or "CRITICAL SHORTAGES RESHAPE POLICY"). Part 1 introduces the context, Part 2 delivers the dramatic hook.
2. Summary Points: Exactly three punchy, conversational, independently understandable editorial facts (40-78 characters each), written in a compelling journalistic voice (e.g. "The country wasn't producing enough grain to meet its needs.").
3. Visual Prompt: Request a text-free cinematic historical editorial scene with vibrant natural colors and dramatic daylight lighting (NOT sepia, NOT monochrome, NOT a flat collage). Include a clear, bright daylight sky with soft clouds in the upper-left for text overlay, and detailed environmental storytelling with relevant human subjects or infrastructure concentrated in the lower half and right side. Prohibit words, letters, captions, logos, watermarks, borders, and fake UI.
4. Score UPSC relevance 0-100 and map to GS1, GS2, GS3, GS4, Essay, or Prelims.

ARTICLE:
${JSON.stringify({ title: article.title, description: article.description, source: article.sourceName, url: article.url, publishedAt: article.publishedAt })}`;

  const response = await fetchWithTimeout(
    `${endpoint}?key=${encodeURIComponent(config.geminiApiKey)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
          responseJsonSchema: schema,
        },
      }),
    },
    config.requestTimeoutMs,
  );
  const payload = await response.json();
  const text = payload?.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text;
  if (!text) throw new Error(`Gemini returned no structured content: ${JSON.stringify(payload).slice(0, 500)}`);
  const result = JSON.parse(text);
  return { ...result, method: "gemini" };
}
