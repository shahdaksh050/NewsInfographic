import sharp from "sharp";
import path from "node:path";
import { dateLabel, ensureDir, escapeXml } from "./utils.js";

const WIDTH = 1080;
const HEIGHT = 1350;

function paletteFor(category = "") {
  const value = category.toLowerCase();
  if (/environment|geography|agriculture/.test(value)) return { dark: "#123f32", mid: "#1f6b4f", accent: "#f4c95d" };
  if (/science|technology/.test(value)) return { dark: "#172554", mid: "#3346a8", accent: "#67e8f9" };
  if (/economy/.test(value)) return { dark: "#172b4d", mid: "#1f5f8b", accent: "#f6c453" };
  if (/international/.test(value)) return { dark: "#123c4a", mid: "#147d83", accent: "#ffb15c" };
  if (/security|defence/.test(value)) return { dark: "#292524", mid: "#57534e", accent: "#fb923c" };
  if (/society|social/.test(value)) return { dark: "#6b214b", mid: "#a83f6d", accent: "#ffd166" };
  if (/history|culture/.test(value)) return { dark: "#56341f", mid: "#9a5c2f", accent: "#f7d488" };
  return { dark: "#5f1020", mid: "#a71930", accent: "#ffc820" };
}

function wrap(text, maxChars, maxLines) {
  const words = String(text).trim().split(/\s+/);
  const allLines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length <= maxChars || !line) line = next;
    else {
      allLines.push(line);
      line = word;
    }
  }
  if (line) allLines.push(line);
  if (allLines.length <= maxLines) return allLines;
  const lines = allLines.slice(0, maxLines);
  lines[maxLines - 1] = `${lines[maxLines - 1].replace(/[.,;:]?$/, "")}…`;
  return lines;
}

async function prepareArt(artBuffer) {
  // Preserve full vibrant cinematic colors, optimize resolution and crispness
  return sharp(artBuffer)
    .resize(WIDTH, HEIGHT, { fit: "cover", position: "attention" })
    .modulate({ brightness: 1.02, saturation: 1.08 })
    .sharpen({ sigma: 0.8, m1: 0.5, m2: 2 })
    .jpeg({ quality: 95 })
    .toBuffer();
}

export function buildOverlaySvg(article, enriched, config, { artMethod = "ai" } = {}) {
  const palette = paletteFor(enriched.category);
  // Format headline into punchy, condensed lines
  let headlineLines = wrap(enriched.headline.toUpperCase(), 25, 3);

  // Ensure last line has a period if not present, for punchy editorial feel
  if (headlineLines.length > 0) {
    const lastIdx = headlineLines.length - 1;
    if (!/[.!?]$/.test(headlineLines[lastIdx])) {
      headlineLines[lastIdx] += ".";
    }
  }

  const isThreeLines = headlineLines.length >= 3;
  const headlineSize = isThreeLines ? 55 : 64;
  const headlineLeading = isThreeLines ? 62 : 70;
  const bannerTop = 44;
  const bannerLeft = 36;
  const bannerPaddingTop = 26;
  const bannerPaddingBottom = 30;
  const bannerHeight = headlineLines.length * headlineLeading + bannerPaddingTop + bannerPaddingBottom;
  const longestCharCount = Math.max(...headlineLines.map((l) => l.length));
  const bannerWidth = Math.min(860, Math.max(680, longestCharCount * (isThreeLines ? 35 : 40) + 100));

  const renderedHeadline = headlineLines.map((line, index) => {
    const isLast = index === headlineLines.length - 1;
    const color = isLast ? palette.accent : "#FFFFFF";
    const yPos = bannerTop + bannerPaddingTop + (index + 0.82) * headlineLeading;
    return `<text x="${bannerLeft + 32}" y="${yPos}" font-family="Impact, 'Arial Black', 'Bebas Neue', 'Arial Narrow', sans-serif" font-size="${headlineSize}" font-weight="900" letter-spacing="0.5" fill="${color}">${escapeXml(line)}</text>`;
  }).join("\n    ");

  const points = (enriched.summaryPoints || []).slice(0, 3);
  let currentY = bannerTop + bannerHeight + 24;
  const renderedElements = [];

  points.forEach((point, index) => {
    if (index > 0) {
      currentY += 22;
      renderedElements.push(
        `<rect x="${bannerLeft + 32}" y="${currentY}" width="54" height="4" fill="${palette.mid}" rx="1.5" />`,
      );
      currentY += 16;
    }

    const lines = wrap(point, 39, 4);
    lines.forEach((line) => {
      currentY += 36;
      renderedElements.push(
        `<text x="${bannerLeft + 32}" y="${currentY}" font-family="Georgia, 'Times New Roman', serif" font-size="23.5" font-weight="700" fill="#141210">${escapeXml(line)}</text>`,
      );
    });
  });

  const disclosure = artMethod === "editorial-vector" ? "ORIGINAL EDITORIAL VECTOR" : "AI-GENERATED ILLUSTRATION";
  const brandTitle = config.brandName ? `${escapeXml(config.brandName.toUpperCase())} · ` : "";
  const categoryTitle = enriched.category ? escapeXml(enriched.category.toUpperCase()) : "";
  const papersLabel = enriched.upscPapers?.length ? ` · ${escapeXml(enriched.upscPapers.join(" / "))}` : "";

  return Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
    <defs>
      <!-- Luminous ambient text backdrop for maximum legibility while keeping art vibrant -->
      <radialGradient id="softBackdrop" cx="18%" cy="28%" r="68%" fx="12%" fy="18%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.65"/>
        <stop offset="30%" stop-color="#ffffff" stop-opacity="0.52"/>
        <stop offset="60%" stop-color="#fffef6" stop-opacity="0.25"/>
        <stop offset="85%" stop-color="#faf5ec" stop-opacity="0.06"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
      </radialGradient>

      <!-- Realistic paint brush edge distress filter -->
      <filter id="brush-distress" x="-15%" y="-25%" width="130%" height="150%">
        <feTurbulence type="fractalNoise" baseFrequency="0.045 0.08" numOctaves="4" seed="14" result="noise"/>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="18" xChannelSelector="R" yChannelSelector="G"/>
      </filter>

      <!-- Soft paint drop shadow -->
      <filter id="banner-shadow" x="-10%" y="-15%" width="125%" height="135%">
        <feDropShadow dx="2" dy="5" stdDeviation="6" flood-color="#000000" flood-opacity="0.48"/>
      </filter>

      <linearGradient id="brushGrad" x1="0" y1="0" x2="1" y2="0.15">
        <stop offset="0%" stop-color="${palette.dark}"/>
        <stop offset="8%" stop-color="${palette.mid}"/>
        <stop offset="45%" stop-color="${palette.mid}"/>
        <stop offset="85%" stop-color="${palette.dark}"/>
        <stop offset="100%" stop-color="#111827"/>
      </linearGradient>

      <!-- Crisp text halo for body points to guarantee high readability over any background -->
      <filter id="text-halo" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="1" stdDeviation="1.8" flood-color="#ffffff" flood-opacity="0.95"/>
      </filter>

      <filter id="icon-shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.6"/>
      </filter>
    </defs>

    <!-- Gentle ambient text backdrop -->
    <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="url(#softBackdrop)"/>

    <!-- Red Painted Brush Stroke Banner -->
    <g filter="url(#banner-shadow)">
      <!-- Frayed bristle streaks at the ends -->
      <g stroke="${palette.dark}" stroke-linecap="round" opacity="0.85">
        <!-- Left bristle tails -->
        <line x1="${bannerLeft - 16}" y1="${bannerTop + bannerHeight * 0.15}" x2="${bannerLeft + 25}" y2="${bannerTop + bannerHeight * 0.16}" stroke-width="4.5"/>
        <line x1="${bannerLeft - 24}" y1="${bannerTop + bannerHeight * 0.32}" x2="${bannerLeft + 20}" y2="${bannerTop + bannerHeight * 0.31}" stroke-width="7"/>
        <line x1="${bannerLeft - 20}" y1="${bannerTop + bannerHeight * 0.50}" x2="${bannerLeft + 30}" y2="${bannerTop + bannerHeight * 0.49}" stroke-width="9"/>
        <line x1="${bannerLeft - 28}" y1="${bannerTop + bannerHeight * 0.68}" x2="${bannerLeft + 22}" y2="${bannerTop + bannerHeight * 0.69}" stroke-width="8"/>
        <line x1="${bannerLeft - 14}" y1="${bannerTop + bannerHeight * 0.85}" x2="${bannerLeft + 28}" y2="${bannerTop + bannerHeight * 0.84}" stroke-width="5"/>

        <!-- Right bristle tails -->
        <line x1="${bannerLeft + bannerWidth - 25}" y1="${bannerTop + bannerHeight * 0.15}" x2="${bannerLeft + bannerWidth + 35}" y2="${bannerTop + bannerHeight * 0.14}" stroke-width="5"/>
        <line x1="${bannerLeft + bannerWidth - 15}" y1="${bannerTop + bannerHeight * 0.32}" x2="${bannerLeft + bannerWidth + 55}" y2="${bannerTop + bannerHeight * 0.33}" stroke-width="8"/>
        <line x1="${bannerLeft + bannerWidth - 10}" y1="${bannerTop + bannerHeight * 0.50}" x2="${bannerLeft + bannerWidth + 65}" y2="${bannerTop + bannerHeight * 0.48}" stroke-width="10"/>
        <line x1="${bannerLeft + bannerWidth - 18}" y1="${bannerTop + bannerHeight * 0.68}" x2="${bannerLeft + bannerWidth + 50}" y2="${bannerTop + bannerHeight * 0.70}" stroke-width="8"/>
        <line x1="${bannerLeft + bannerWidth - 22}" y1="${bannerTop + bannerHeight * 0.85}" x2="${bannerLeft + bannerWidth + 38}" y2="${bannerTop + bannerHeight * 0.84}" stroke-width="5"/>
      </g>

      <!-- Main painted stroke body with distressed edges -->
      <rect x="${bannerLeft}" y="${bannerTop}" width="${bannerWidth}" height="${bannerHeight}" fill="url(#brushGrad)" filter="url(#brush-distress)"/>

      <!-- Splatters and dry-brush flecks around the stroke -->
      <g fill="${palette.mid}" opacity="0.9">
        <circle cx="${bannerLeft - 22}" cy="${bannerTop + bannerHeight * 0.4}" r="3.2"/>
        <circle cx="${bannerLeft - 30}" cy="${bannerTop + bannerHeight * 0.6}" r="2.2"/>
        <circle cx="${bannerLeft + bannerWidth + 58}" cy="${bannerTop + bannerHeight * 0.35}" r="3.5"/>
        <circle cx="${bannerLeft + bannerWidth + 70}" cy="${bannerTop + bannerHeight * 0.52}" r="2.5"/>
        <circle cx="${bannerLeft + bannerWidth + 52}" cy="${bannerTop + bannerHeight * 0.72}" r="3.2"/>
      </g>
    </g>

    <!-- Headline Lines (Impact / Bebas Neue, Bold White + Vibrant Yellow) -->
    ${renderedHeadline}

    <!-- Editorial Fact Points with Red Dividers -->
    <g filter="url(#text-halo)">
      ${renderedElements.join("\n      ")}
    </g>

    <!-- Sleek Floating Source & Syllabus Metadata (Bottom Left) -->
    <g transform="translate(38, 1276)" filter="url(#icon-shadow)">
      <rect x="0" y="0" width="1004" height="42" rx="8" fill="#14110f" fill-opacity="0.82"/>
      <text x="14" y="17" font-family="Arial, sans-serif" font-size="11" font-weight="900" letter-spacing="1" fill="#f4dfb9">${brandTitle}${categoryTitle}</text>
      <text x="14" y="32" font-family="Arial, sans-serif" font-size="10.5" font-weight="600" fill="#d1b98e">VERIFIED SOURCE: ${escapeXml(article.sourceName.toUpperCase())} · ${escapeXml(dateLabel(article.publishedAt))}${papersLabel}</text>
      <rect x="840" y="9" width="148" height="24" rx="12" fill="${palette.mid}"/>
      <text x="914" y="25" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" font-weight="900" letter-spacing="0.8" fill="#ffffff">OFFICIAL RELEASE</text>
    </g>

    <!-- Subtle AI Disclosure Tag (Bottom Right) -->
    <text x="${WIDTH - 38}" y="1338" text-anchor="end" font-family="Arial, sans-serif" font-size="11" font-weight="700" letter-spacing="0.5" fill="#ffffff" fill-opacity="0.82" filter="url(#icon-shadow)">${disclosure}</text>
  </svg>`);
}

export function buildFactsPanelSvg(enriched) {
  const palette = paletteFor(enriched.category);
  const headlineLines = wrap(enriched.headline.toUpperCase(), 25, 3);
  if (headlineLines.length && !/[.!?]$/.test(headlineLines.at(-1))) headlineLines[headlineLines.length - 1] += ".";
  const isThreeLines = headlineLines.length >= 3;
  const headlineLeading = headlineLines.length >= 3 ? 62 : 70;
  const headlineSize = isThreeLines ? 55 : 64;
  const bannerHeight = headlineLines.length * headlineLeading + 56;
  const panelTop = 44 + bannerHeight + 14;
  const panelLeft = 34;
  const panelWidth = 650;
  let currentY = panelTop + 30;
  const elements = [];
  for (const [index, point] of (enriched.summaryPoints || []).slice(0, 3).entries()) {
    if (index > 0) {
      currentY += 19;
      elements.push(`<rect x="${panelLeft + 30}" y="${currentY}" width="54" height="4" fill="${palette.mid}" rx="2"/>`);
      currentY += 15;
    }
    for (const line of wrap(point, 39, 4)) {
      currentY += 33;
      elements.push(`<text x="${panelLeft + 30}" y="${currentY}" font-family="Georgia, 'Times New Roman', serif" font-size="23.5" font-weight="700" fill="#141210">${escapeXml(line)}</text>`);
    }
  }
  // Fixed height keeps campaign cards visually consistent and safely covers a prior copy layer on refresh.
  const panelHeight = 540;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
    <defs><filter id="panelShadow" x="-15%" y="-15%" width="140%" height="140%"><feDropShadow dx="0" dy="5" stdDeviation="10" flood-color="#111827" flood-opacity=".2"/></filter></defs>
    ${headlineLines.map((line, index) => `<text x="68" y="${44 + 26 + (index + 0.82) * headlineLeading}" font-family="Impact, 'Arial Black', 'Bebas Neue', 'Arial Narrow', sans-serif" font-size="${headlineSize}" font-weight="900" letter-spacing="0.5" fill="${index === headlineLines.length - 1 ? palette.accent : "#ffffff"}">${escapeXml(line)}</text>`).join("\n    ")}
    <rect x="${panelLeft}" y="${panelTop}" width="${panelWidth}" height="${panelHeight}" rx="18" fill="#fffdf7" stroke="${palette.mid}" stroke-opacity=".22" filter="url(#panelShadow)"/>
    ${elements.join("\n    ")}
  </svg>`);
}

export async function renderPost({ article, enriched, artBuffer, outputFile, config, artMethod = "ai" }) {
  await ensureDir(path.dirname(outputFile));
  const background = await prepareArt(artBuffer);
  const overlay = buildOverlaySvg(article, enriched, config, { artMethod });
  await sharp(background)
    .composite([{ input: overlay, top: 0, left: 0 }])
    .png({ compressionLevel: 8 })
    .toFile(outputFile);
  return outputFile;
}

export const POST_SIZE = { width: WIDTH, height: HEIGHT };
