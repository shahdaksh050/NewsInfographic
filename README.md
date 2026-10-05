# UPSC Social News Pipeline

This service turns a list of news articles into one source-backed Instagram post per article. It follows the visual direction in `example.png`: bold editorial typography on a painted crimson brush banner, vibrant cinematic documentary artwork, short facts with red accent dividers, and clear visual hierarchy.

The image model never renders factual copy. AI creates only a text-free illustration; this service places the headline, facts, date, source, syllabus tags, brand, and AI disclosure deterministically.

## What is included

- A live open-source Indian news API placeholder, filtered for UPSC relevance.
- Official PIB RSS ingestion as an optional source.
- Generic JSON adapter for your app's future endpoint.
- Direct article ingestion through `POST /api/generate`.
- UPSC relevance scoring and GS-paper classification.
- Optional Gemini structured copy enrichment.
- Cloudflare Workers AI FLUX.1 Schnell background generation using its free daily allocation.
- Optional Gemini Nano Banana image generation through the Interactions API.
- A no-key procedural art fallback for local development.
- One `1080x1350` PNG per accepted article.
- Batch manifests, per-item failure isolation, and duplicate removal.
- Draft/approve/reject workflow. Nothing is posted to Instagram automatically.

## Requirements

- Node.js 20 or newer.

Install:

```powershell
npm.cmd install
```

## Generate a local demo

### Interactive launcher

On Windows, double-click `start.cmd`, or run either launcher from a terminal:

```powershell
.\start.cmd
# or
.\start.ps1
```

The terminal menu can generate live or demo batches, inspect earlier runs, approve or reject drafts, show Gemini configuration status, and start the HTTP API. Dependencies are installed automatically on the first launch.

You can also open the menu through npm:

```powershell
npm.cmd run cli
```

### Direct generation

No API keys are needed:

```powershell
npm.cmd run generate -- --source fixture --limit 2 --no-ai --include-low-relevance
```

Each run is written to `output/<run-id>/` with a PNG for every article and a `manifest.json` file.

Fetch current India-category news from the open-source placeholder and generate up to 11 UPSC-relevant posts:

```powershell
npm.cmd run generate -- --source opennews --limit 11
```

The placeholder is the public API from the open-source [RapidScoop news API system](https://github.com/Gearupstudios/news-api-system). Replace `OPEN_NEWS_URL` when your app endpoint is ready. Use `--source pib` for official PIB RSS releases; the PIB feed can occasionally return an empty channel.

Use any JSON news endpoint:

```powershell
$env:NEWS_SOURCE="json"
$env:NEWS_SOURCE_URL="https://your-app.example/api/news"
npm.cmd run generate
```

The JSON adapter accepts either a top-level array or an object containing `articles`, `items`, `results`, `data`, or `news`. Common field aliases such as `headline`, `summary`, `link`, `published_at`, and `source.name` are normalized automatically.

## Enable AI enrichment

Copy `.env.example` values into environment variables. The project intentionally does not load or commit `.env` files by itself; inject secrets through your shell or deployment platform.

Gemini handles concise, structured editorial copy:

```powershell
$env:GEMINI_API_KEY="your-key"
$env:GEMINI_MODEL="gemini-3.1-flash-lite"
```

Cloudflare Workers AI is the default image provider:

```powershell
$env:CLOUDFLARE_ACCOUNT_ID="your-account-id"
$env:CLOUDFLARE_API_TOKEN="your-workers-ai-token"
$env:IMAGE_PROVIDER="cloudflare"
```

Gemini Nano Banana 2 Lite generates the text-free illustration. The image API has no free tier, so billing must be enabled for the Google AI project:

```powershell
$env:GEMINI_IMAGE_API_KEY="your-key" # optional; GEMINI_API_KEY is reused if absent
$env:GEMINI_IMAGE_MODEL="gemini-3.1-flash-lite-image"
```

The renderer requests a 1K `4:5` JPEG through the stateless Interactions API and converts it to the final `1080x1350` post. The Lite model is the default because it is the cheapest image model and natively supports `4:5`. Switch to `gemini-3.1-flash-image` for stronger prompt adherence and reference consistency.

Current operational facts from Google's official documentation:

- Lite supports 1K output only, with a 65,536-token input limit and 4,096-token output limit.
- Image generation has no free API tier. Lite standard generation is approximately `$0.0336` per 1K image; Batch is approximately `$0.0168`.
- Standard limits are project- and tier-specific and must be read from AI Studio. Quotas can apply as RPM, input TPM, RPD, and images per minute.
- Paid Tier 1 has a `$10` rolling 10-minute spend guard. A `429 RESOURCE_EXHAUSTED` response is retried with exponential backoff.
- Batch API permits 100 concurrent batch requests and, for Lite Image at Tier 1, 2,000,000 enqueued tokens.
- Generated images always include SynthID and C2PA metadata.

Official references: [image generation](https://ai.google.dev/gemini-api/docs/image-generation), [Lite Image model](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite-image), [pricing](https://ai.google.dev/gemini-api/docs/pricing), and [rate limits](https://ai.google.dev/gemini-api/docs/rate-limits).

If either provider fails, that stage falls back safely and records the warning in the manifest.

## HTTP API

Start the service:

```powershell
npm.cmd start
```

It listens on `http://localhost:8787` by default.

### Health and provider configuration

```http
GET /health
```

### Preview normalized source stories

```http
GET /api/news?source=pib&limit=11
```

### Generate from your app payload

```http
POST /api/generate
Content-Type: application/json

{
  "articles": [
    {
      "id": "story-123",
      "title": "Article headline",
      "description": "The source-backed article summary or body.",
      "url": "https://source.example/story-123",
      "source_name": "Source name",
      "published_at": "2026-10-05T09:00:00+05:30"
    }
  ],
  "useAi": true,
  "includeLowRelevance": false
}
```

The response is the completed run manifest. Every generated post begins in `draft` state with approval `pending`.

### Review a post

```http
POST /api/runs/{runId}/posts/{postId}/review
Content-Type: application/json

{
  "status": "approved",
  "note": "Facts and source checked"
}
```

Valid review states are `pending`, `approved`, and `rejected`.

Other endpoints:

- `GET /api/runs`
- `GET /api/runs/{runId}`
- `GET /outputs/{runId}/{image.png}`

## Editorial safety

- Provide source descriptions or article bodies, not headlines alone, when possible.
- Keep the review gate for politics, elections, conflict, deaths, communal subjects, disputed claims, and identifiable people.
- Generated visuals are illustrative, not documentary evidence. The renderer adds an explicit disclosure.
- Verify content reuse rights for every upstream news source. Linking and attribution do not automatically grant republication rights.
- Automatic Instagram publishing is intentionally outside this MVP. Add it only after an approval event.

## Tests

```powershell
npm.cmd test
npm.cmd run check
```

The tests cover source normalization, RSS parsing, UPSC enrichment, and deterministic overlay content.
