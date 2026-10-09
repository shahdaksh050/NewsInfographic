import { escapeXml, stableId } from "../utils.js";

function seedNumber(text) {
  return Number.parseInt(stableId(text || "editorial").slice(0, 8), 16);
}

function visualTheme(category = "") {
  const value = category.toLowerCase();
  if (/environment|geography/.test(value)) return { colors: ["#073b3a", "#0f766e", "#84cc16", "#f4d35e"], motif: "nature" };
  if (/agriculture/.test(value)) return { colors: ["#294122", "#657a31", "#d9a441", "#f4e3a1"], motif: "fields" };
  if (/science|technology/.test(value)) return { colors: ["#0b163f", "#263ea8", "#22d3ee", "#dbeafe"], motif: "orbit" };
  if (/economy/.test(value)) return { colors: ["#102a43", "#176b87", "#e7b64b", "#f8e7b2"], motif: "growth" };
  if (/international/.test(value)) return { colors: ["#123c4a", "#17838b", "#f59e62", "#dff7f4"], motif: "globe" };
  if (/security|defence/.test(value)) return { colors: ["#171a1f", "#3f4c45", "#e87722", "#f5d0a9"], motif: "radar" };
  if (/society|social/.test(value)) return { colors: ["#5b2147", "#ae3f72", "#f59e8b", "#ffe5d9"], motif: "people" };
  if (/history|culture/.test(value)) return { colors: ["#4b2c1b", "#9b5e32", "#d9a441", "#f5dfb7"], motif: "heritage" };
  return { colors: ["#3b1830", "#8c2448", "#ed6a5a", "#f6d8ae"], motif: "columns" };
}

function motifSvg(kind, seed) {
  const shift = seed % 90;
  if (kind === "nature") return `<path d="M430 1350 C560 1010 775 730 1080 620 L1080 1350Z" fill="url(#accent)"/><path d="M620 1350 C690 1080 815 900 1030 790" fill="none" stroke="#d9f99d" stroke-width="18" opacity=".7"/><g fill="none" stroke="#ccfbf1" opacity=".42">${[0,1,2,3,4].map(i=>`<path d="M${510+i*62} 1220 Q${700+i*38} ${920-i*48} ${1030-i*12} ${760-i*34}" stroke-width="${4+i}"/>`).join("")}</g>`;
  if (kind === "fields") return `<circle cx="870" cy="350" r="118" fill="#ffe59a" opacity=".8"/><g fill="none" stroke="#f8df9b" opacity=".7">${[0,1,2,3,4,5].map(i=>`<path d="M${260+i*120} 1350 Q${520+i*70} ${920-i*22} 1080 ${780-i*34}" stroke-width="${16-i}"/>`).join("")}</g><path d="M440 1350 Q700 870 1080 720 L1080 1350Z" fill="url(#accent)" opacity=".7"/>`;
  if (kind === "orbit") return `<g fill="none" stroke="#a5f3fc" opacity=".62" transform="translate(${shift},0)"><ellipse cx="780" cy="830" rx="360" ry="190" stroke-width="7" transform="rotate(-28 780 830)"/><ellipse cx="780" cy="830" rx="310" ry="135" stroke-width="4" transform="rotate(31 780 830)"/><circle cx="780" cy="830" r="72" fill="#38bdf8" stroke="none"/><circle cx="1010" cy="600" r="25" fill="#dbeafe" stroke="none"/><circle cx="520" cy="1040" r="18" fill="#67e8f9" stroke="none"/></g><path d="M600 1350 L1080 880 L1080 1350Z" fill="url(#accent)" opacity=".45"/>`;
  if (kind === "growth") return `<g opacity=".86">${[0,1,2,3,4].map(i=>`<rect x="${500+i*112}" y="${1130-i*(92+shift/8)}" width="76" height="${220+i*(92+shift/8)}" rx="16" fill="${i===4?'#f6c453':'#d7e7f0'}" opacity="${.38+i*.1}"/>`).join("")}</g><path d="M500 1050 L690 910 L805 960 L1040 660" fill="none" stroke="#fff1b8" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/><path d="M960 670 L1040 660 L1025 742" fill="none" stroke="#fff1b8" stroke-width="22" stroke-linecap="round"/>`;
  if (kind === "globe") return `<circle cx="820" cy="850" r="330" fill="url(#accent)" opacity=".62"/><g fill="none" stroke="#dff7f4" opacity=".66"><circle cx="820" cy="850" r="300" stroke-width="7"/><ellipse cx="820" cy="850" rx="150" ry="300" stroke-width="5"/><ellipse cx="820" cy="850" rx="300" ry="120" stroke-width="5"/><path d="M540 760 Q820 620 1100 760M540 950 Q820 1080 1100 950" stroke-width="4"/></g>`;
  if (kind === "radar") return `<g transform="translate(820 860)" fill="none" stroke="#fed7aa"><circle r="320" opacity=".22" stroke-width="6"/><circle r="230" opacity=".32" stroke-width="5"/><circle r="140" opacity=".5" stroke-width="4"/><path d="M0 0 L${280-shift} -${150+shift}" stroke="#fb923c" stroke-width="18" stroke-linecap="round"/><path d="M0 0 L0 -330M0 0 L300 0M0 0 L0 330M0 0 L-300 0" opacity=".25" stroke-width="4"/><circle cx="150" cy="-175" r="22" fill="#fff7ed" stroke="none"/></g>`;
  if (kind === "people") return `<g transform="translate(430 610)">${[0,1,2,3].map(i=>`<g transform="translate(${i*165} ${i%2*70})"><circle cx="60" cy="95" r="58" fill="${i%2?'#ffe5d9':'#f59e8b'}"/><path d="M-20 390 Q0 190 60 185 Q120 190 140 390Z" fill="${i%2?'#d56a8e':'#f2b5a5'}" opacity=".9"/></g>`).join("")}</g><path d="M420 1240 Q760 1040 1080 1160 L1080 1350 L400 1350Z" fill="url(#accent)" opacity=".58"/>`;
  if (kind === "heritage") return `<path d="M470 1350 V720 Q470 520 660 520 Q850 520 850 720 V1350Z" fill="url(#accent)" opacity=".82"/><path d="M590 1350 V790 Q590 680 660 680 Q730 680 730 790 V1350Z" fill="#3f281d" opacity=".9"/><g stroke="#f5dfb7" fill="none" opacity=".48"><path d="M420 540 H900M450 470 H870" stroke-width="14"/><circle cx="660" cy="520" r="225" stroke-width="8"/></g>`;
  return `<g transform="translate(500 600)" fill="url(#accent)">${[0,1,2,3].map(i=>`<rect x="${i*135}" y="160" width="84" height="520" rx="8"/><rect x="${i*135-18}" y="120" width="120" height="48" rx="8"/>`).join("")}<path d="M-60 120 L250 -40 L560 120Z"/></g>`;
}

export function fallbackArtSvg(article, width = 1080, height = 1350) {
  const seed = seedNumber(article?.title || "India Editorial");
  const theme = visualTheme(article?.category || "");
  const [dark, mid, accent, light] = theme.colors;
  return Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="base" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${light}"/><stop offset=".46" stop-color="${mid}"/><stop offset="1" stop-color="${dark}"/></linearGradient>
      <linearGradient id="accent" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${accent}"/><stop offset="1" stop-color="${dark}"/></linearGradient>
      <radialGradient id="quiet" cx="0" cy="0" r="1"><stop stop-color="#fffdf7" stop-opacity=".98"/><stop offset=".7" stop-color="#fffdf7" stop-opacity=".36"/><stop offset="1" stop-color="#fffdf7" stop-opacity="0"/></radialGradient>
      <pattern id="grid" width="54" height="54" patternUnits="userSpaceOnUse"><path d="M54 0H0V54" fill="none" stroke="#fff" stroke-opacity=".09" stroke-width="2"/></pattern>
      <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".7" numOctaves="3" seed="${seed % 97}"/><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 .08 0"/></filter>
    </defs>
    <rect width="100%" height="100%" fill="url(#base)"/>
    <rect width="100%" height="100%" fill="url(#grid)"/>
    <ellipse cx="70" cy="230" rx="690" ry="620" fill="url(#quiet)"/>
    ${motifSvg(theme.motif, seed)}
    <circle cx="${880 + seed % 80}" cy="${180 + seed % 90}" r="${42 + seed % 36}" fill="${accent}" opacity=".55"/>
    <rect width="100%" height="100%" filter="url(#grain)" opacity=".45"/>
    <title>${escapeXml(article?.title || "UPSC current affairs editorial")}</title>
  </svg>`);
}
