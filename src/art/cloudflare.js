import { fetchWithTimeout } from "../utils.js";

export async function generateCloudflareArt(prompt, config) {
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(config.cloudflareAccountId)}/ai/run/${config.cloudflareImageModel}`;
  const response = await fetchWithTimeout(
    endpoint,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${config.cloudflareApiToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        prompt: [
          "Create a vertical 4:5 rich cinematic historical editorial scene with dramatic lighting and vibrant natural colors.",
          "The look is premium documentary realism: warm natural sunlight, vivid lifelike colors, atmospheric depth, and a detailed storytelling environment.",
          "Make a strong topic-relevant person, dramatic action, or symbolic object anchor the lower foreground or right side.",
          "CRITICAL COMPOSITION: Keep the upper-left quadrant clear, bright, and uncluttered with open daylight sky or calm background for an editorial headline.",
          "Do not generate any text, letters, words, captions, signs, logos, watermarks, frames, borders, fake UI, or red headline boxes.",
          prompt,
        ].join(" "),
        steps: config.cloudflareImageSteps,
      }),
    },
    Math.max(config.requestTimeoutMs, 120000),
  );
  const payload = await response.json();
  if (payload.success === false) {
    throw new Error(`Cloudflare Workers AI error: ${JSON.stringify(payload.errors || []).slice(0, 500)}`);
  }
  const base64 = payload?.result?.image || payload?.image;
  if (!base64) throw new Error(`Cloudflare returned no image: ${JSON.stringify(payload).slice(0, 700)}`);
  return {
    buffer: Buffer.from(base64, "base64"),
    usage: payload?.result?.usage || null,
    estimatedCostUsd: 0,
  };
}

export function hasCloudflareArt(config) {
  return Boolean(config.cloudflareAccountId && config.cloudflareApiToken);
}
