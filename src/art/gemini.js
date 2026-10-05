import { fetchWithTimeout } from "../utils.js";

const INTERACTIONS_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";

function imageFromInteraction(payload) {
  for (const step of payload?.steps || []) {
    if (step.type !== "model_output") continue;
    for (const content of step.content || []) {
      if (content.type === "image" && content.data) return content;
    }
  }
  return payload?.output_image || payload?.outputImage || null;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryDelay(error, attempt) {
  const seconds = Number(error.retryAfter);
  if (Number.isFinite(seconds) && seconds > 0) return Math.min(60000, seconds * 1000);
  return Math.min(30000, 1000 * 2 ** attempt + Math.floor(Math.random() * 500));
}

export function shouldRetryGeminiImageError(error) {
  if (![429, 503].includes(error.status)) return false;
  // A free-tier RPD limit of zero is a billing/tier constraint, not a transient quota spike.
  if (/limit:\s*0|free tier|upgrade your tier/i.test(error.message)) return false;
  return true;
}

export function estimatedGeminiImageCost(model, size = "1K") {
  if (size !== "1K") return null;
  if (model === "gemini-3.1-flash-lite-image") return 0.0336;
  if (model === "gemini-3.1-flash-image") return 0.067;
  if (model === "gemini-3-pro-image") return 0.134;
  return null;
}

export async function generateGeminiArt(prompt, config) {
  const body = {
    model: config.geminiImageModel,
    input: [{ type: "text", text: prompt }],
    response_format: {
      type: "image",
      mime_type: "image/jpeg",
      aspect_ratio: config.geminiImageAspectRatio,
      image_size: config.geminiImageSize,
    },
    store: false,
  };

  let lastError;
  for (let attempt = 0; attempt <= config.imageRetryCount; attempt += 1) {
    try {
      const response = await fetchWithTimeout(
        INTERACTIONS_URL,
        {
          method: "POST",
          headers: {
            "x-goog-api-key": config.geminiImageApiKey,
            "content-type": "application/json",
          },
          body: JSON.stringify(body),
        },
        Math.max(config.requestTimeoutMs, 120000),
      );
      const payload = await response.json();
      if (payload.status && payload.status !== "completed") {
        throw new Error(`Gemini interaction ended with status ${payload.status}`);
      }
      const image = imageFromInteraction(payload);
      if (!image?.data) throw new Error(`Gemini returned no image: ${JSON.stringify(payload).slice(0, 700)}`);
      return {
        buffer: Buffer.from(image.data, "base64"),
        mimeType: image.mime_type || image.mimeType || "image/jpeg",
        interactionId: payload.id || null,
        usage: payload.usage || null,
        estimatedCostUsd: estimatedGeminiImageCost(config.geminiImageModel, config.geminiImageSize),
      };
    } catch (error) {
      lastError = error;
      if (!shouldRetryGeminiImageError(error) || attempt === config.imageRetryCount) break;
      await wait(retryDelay(error, attempt));
    }
  }
  throw lastError;
}

export function hasGeminiArt(config) {
  return Boolean(config.geminiImageApiKey);
}
