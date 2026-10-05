import { escapeXml, stableId } from "../utils.js";

function seedNumber(text) {
  return Number.parseInt(stableId(text || "editorial").slice(0, 8), 16);
}

export function fallbackArtSvg(article, width = 1080, height = 1350) {
  const seed = seedNumber(article?.title || "India Editorial");
  const sunX = 720 + (seed % 140);

  return Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <!-- Atmospheric Daylight Sky Gradient -->
      <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#1e5799"/>
        <stop offset="25%" stop-color="#3a7bd5"/>
        <stop offset="55%" stop-color="#76b2fe"/>
        <stop offset="78%" stop-color="#f6d365"/>
        <stop offset="92%" stop-color="#fda085"/>
        <stop offset="100%" stop-color="#cf7a58"/>
      </linearGradient>

      <!-- Ocean / Harbor Water Gradient -->
      <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#1a4a6e"/>
        <stop offset="40%" stop-color="#123550"/>
        <stop offset="100%" stop-color="#0a1d2e"/>
      </linearGradient>

      <!-- Ship Hull Gradient -->
      <linearGradient id="hullGrad" x1="0" y1="0" x2="1" y2="0.3">
        <stop offset="0%" stop-color="#1c2430"/>
        <stop offset="60%" stop-color="#2a3848"/>
        <stop offset="100%" stop-color="#171f28"/>
      </linearGradient>

      <!-- Warm Golden Grain / Burlap Sacks Gradient -->
      <linearGradient id="grainGrad1" x1="0" y1="0" x2="0.8" y2="1">
        <stop offset="0%" stop-color="#f5d77f"/>
        <stop offset="45%" stop-color="#d4a34b"/>
        <stop offset="100%" stop-color="#8a5a20"/>
      </linearGradient>

      <linearGradient id="grainGrad2" x1="0" y1="0" x2="0.8" y2="1">
        <stop offset="0%" stop-color="#e9c36a"/>
        <stop offset="50%" stop-color="#bc8b38"/>
        <stop offset="100%" stop-color="#734716"/>
      </linearGradient>

      <!-- Soft Clouds Filter -->
      <filter id="cloudSoft" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="18"/>
      </filter>

      <!-- Subtle Canvas Texture -->
      <filter id="canvasGrain">
        <feTurbulence baseFrequency="0.65" numOctaves="3" seed="${seed % 99}" result="noise"/>
        <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.08 0"/>
      </filter>
    </defs>

    <!-- Sky Canvas -->
    <rect width="100%" height="100%" fill="url(#skyGrad)"/>

    <!-- Radiant Sun -->
    <circle cx="${sunX}" cy="380" r="140" fill="#fff6d6" opacity="0.35" filter="url(#cloudSoft)"/>
    <circle cx="${sunX}" cy="380" r="85" fill="#fff9e6" opacity="0.85"/>

    <!-- Soft Cloud Formations in Upper Sky -->
    <g fill="#ffffff" opacity="0.45" filter="url(#cloudSoft)">
      <ellipse cx="680" cy="220" rx="180" ry="55"/>
      <ellipse cx="760" cy="190" rx="140" ry="65"/>
      <ellipse cx="860" cy="230" rx="160" ry="50"/>
    </g>
    <g fill="#ffffff" opacity="0.35" filter="url(#cloudSoft)">
      <ellipse cx="940" cy="110" rx="150" ry="45"/>
      <ellipse cx="1020" cy="90" rx="120" ry="50"/>
    </g>
    <g fill="#ffffff" opacity="0.25" filter="url(#cloudSoft)">
      <ellipse cx="260" cy="180" rx="160" ry="40"/>
      <ellipse cx="180" cy="195" rx="110" ry="35"/>
    </g>

    <!-- Ocean / Water at Horizon -->
    <rect x="0" y="680" width="1080" height="670" fill="url(#waterGrad)"/>

    <!-- Distant Harbor Silhouettes -->
    <rect x="360" y="620" width="90" height="65" fill="#1b3347" opacity="0.7"/>
    <rect x="420" y="580" width="45" height="105" fill="#1b3347" opacity="0.6"/>
    <polygon points="430,580 440,510 445,510 455,580" fill="#1b3347" opacity="0.6"/>

    <!-- Massive Cargo Freighter (Midground Right) -->
    <path d="M410 720 L960 700 Q1040 702 1080 730 L1080 920 L360 880 Q370 780 410 720 Z" fill="url(#hullGrad)"/>
    <path d="M360 860 L1080 895 L1080 935 L355 895 Z" fill="#9e2a22" opacity="0.9"/>
    <rect x="780" y="590" width="220" height="115" fill="#e8edf2" rx="4"/>
    <rect x="830" y="525" width="130" height="68" fill="#d9e2eb" rx="3"/>
    <g fill="#213243">
      <rect x="845" y="545" width="14" height="12" rx="2"/>
      <rect x="870" y="545" width="14" height="12" rx="2"/>
      <rect x="895" y="545" width="14" height="12" rx="2"/>
      <rect x="920" y="545" width="14" height="12" rx="2"/>
    </g>
    <rect x="875" y="445" width="46" height="82" fill="#d89b28" rx="2"/>
    <rect x="875" y="445" width="46" height="22" fill="#222222" rx="2"/>

    <!-- Harbor Cranes & Cargo Rigging -->
    <g stroke="#243342" stroke-width="7" stroke-linecap="round" opacity="0.95">
      <line x1="680" y1="730" x2="720" y2="310"/>
      <line x1="720" y1="730" x2="720" y2="310"/>
      <line x1="760" y1="730" x2="720" y2="310"/>
      <line x1="695" y1="580" x2="745" y2="580" stroke-width="4"/>
      <line x1="705" y1="460" x2="735" y2="460" stroke-width="4"/>
      <line x1="720" y1="310" x2="940" y2="180" stroke-width="8"/>
      <line x1="720" y1="310" x2="560" y2="390" stroke-width="6"/>
      <line x1="940" y1="180" x2="940" y2="340" stroke="#1a2530" stroke-width="3"/>
      <line x1="720" y1="310" x2="930" y2="185" stroke="#1a2530" stroke-width="2.5"/>
    </g>

    <!-- Suspended Sling of Burlap Grain Sacks -->
    <g transform="translate(940, 340)">
      <path d="M0 0 L0 15 Q0 24 8 20 Q16 16 12 8" fill="none" stroke="#222" stroke-width="4"/>
      <line x1="0" y1="18" x2="-35" y2="50" stroke="#8a5e2d" stroke-width="3"/>
      <line x1="0" y1="18" x2="35" y2="50" stroke="#8a5e2d" stroke-width="3"/>
      <line x1="0" y1="18" x2="0" y2="52" stroke="#8a5e2d" stroke-width="3"/>
      <g transform="translate(0, 65)">
        <ellipse cx="-16" cy="-10" rx="26" ry="16" fill="url(#grainGrad1)"/>
        <ellipse cx="16" cy="-10" rx="26" ry="16" fill="url(#grainGrad2)"/>
        <ellipse cx="0" cy="5" rx="32" ry="18" fill="url(#grainGrad1)"/>
        <ellipse cx="-12" cy="18" rx="28" ry="16" fill="url(#grainGrad2)"/>
        <ellipse cx="14" cy="18" rx="28" ry="16" fill="url(#grainGrad1)"/>
      </g>
    </g>

    <!-- Dock Gangways & Port Wharf -->
    <polygon points="120,960 1080,880 1080,1050 0,1130" fill="#4d3725"/>
    <polygon points="0,1100 1080,1020 1080,1350 0,1350" fill="#2d1f14"/>

    <!-- Piles of Burlap Grain Sacks Overflowing in Foreground -->
    <g>
      <ellipse cx="640" cy="1060" rx="140" ry="60" fill="url(#grainGrad2)"/>
      <ellipse cx="820" cy="1040" rx="160" ry="65" fill="url(#grainGrad1)"/>
      <ellipse cx="980" cy="1020" rx="150" ry="65" fill="url(#grainGrad2)"/>

      <ellipse cx="560" cy="1120" rx="150" ry="65" fill="url(#grainGrad1)"/>
      <ellipse cx="760" cy="1110" rx="170" ry="70" fill="url(#grainGrad2)"/>
      <ellipse cx="960" cy="1090" rx="160" ry="68" fill="url(#grainGrad1)"/>

      <ellipse cx="680" cy="1180" rx="180" ry="75" fill="url(#grainGrad1)"/>
      <ellipse cx="880" cy="1170" rx="190" ry="78" fill="url(#grainGrad2)"/>
      <ellipse cx="480" cy="1220" rx="160" ry="70" fill="url(#grainGrad2)"/>

      <path d="M380 1260 Q600 1190 850 1240 Q1020 1200 1080 1260 L1080 1350 L300 1350 Z" fill="#e5b854" opacity="0.9"/>
      <path d="M450 1290 Q650 1230 920 1280 L1080 1350 L400 1350 Z" fill="#f7cf6d"/>
    </g>

    <!-- Contemplative Historical Leader Figure (Foreground Form) -->
    <g transform="translate(380, 890)">
      <path d="M-90 320 C-80 200 -20 170 40 160 C100 170 160 200 170 320 Z" fill="#2b231d"/>
      <path d="M-60 320 C-50 220 0 190 40 185 C80 190 130 220 140 320 Z" fill="#e6ded3"/>
      <path d="M-40 320 C-35 240 0 210 40 210 C80 210 115 240 120 320 Z" fill="#3c2f25"/>

      <ellipse cx="40" cy="115" rx="42" ry="52" fill="#c9976b"/>
      <path d="M-8 88 C-10 52 20 42 42 42 C64 42 92 52 88 88 Z" fill="#faf6ef"/>
      <ellipse cx="40" cy="86" rx="48" ry="12" fill="#ede6da"/>

      <path d="M12 170 C16 145 28 135 34 132 C40 130 46 135 44 145 C42 155 36 185 24 195 Z" fill="#b8855a"/>
      <path d="M-2 195 C10 170 24 165 30 185 C25 205 10 225 -2 225 Z" fill="#c9976b"/>
    </g>

    <rect width="100%" height="100%" filter="url(#canvasGrain)" opacity="0.3"/>
    <title>${escapeXml(article.title)}</title>
  </svg>`);
}
