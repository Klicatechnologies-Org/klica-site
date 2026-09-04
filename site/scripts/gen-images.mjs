// One-off generator for the raster assets the browser and social platforms need
// but that cannot be SVG: the Open Graph card and the Apple touch icon.
//
// Run with:  node scripts/gen-images.mjs
// Re-run only if the brand mark or the OG wording changes.

import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

// fileURLToPath, not URL.pathname -- on Windows the latter yields "/C:/..." with
// percent-encoded spaces, which the fs layer rejects.
const OUT = fileURLToPath(new URL("../public/", import.meta.url));
await mkdir(OUT, { recursive: true });

const monogram = (stroke) => `
  <g stroke="${stroke}" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <ellipse cx="33" cy="40" rx="25" ry="33" stroke-width="3.2"/>
    <path d="M27 22v36" stroke-width="3.6"/>
    <path d="M45 21 26 42" stroke-width="3.6"/>
    <path d="M32 37c7 4 12 10 13 21" stroke-width="3.6"/>
  </g>`;

const gold = `
  <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#e8c860"/>
    <stop offset="45%" stop-color="#d4af37"/>
    <stop offset="100%" stop-color="#a8801f"/>
  </linearGradient>`;

/* ---- Open Graph card: 1200x630, dark ground, gold mark ---- */
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    ${gold}
    <radialGradient id="glow" cx="50%" cy="0%" r="70%">
      <stop offset="0%" stop-color="#d4af37" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#d4af37" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1200" height="630" fill="#121109"/>
  <rect width="1200" height="630" fill="url(#glow)"/>

  <g transform="translate(490,86) scale(3.1)">${monogram("url(#g)")}</g>

  <text x="600" y="452" text-anchor="middle" fill="url(#g)"
        font-family="Segoe UI, Roboto, Helvetica, Arial, sans-serif"
        font-size="62" font-weight="500" letter-spacing="14">KLICA</text>

  <text x="600" y="516" text-anchor="middle" fill="#cfc9b8"
        font-family="Segoe UI, Roboto, Helvetica, Arial, sans-serif"
        font-size="27" font-weight="400">Your Best Shot for Exam Preparation</text>

  <text x="600" y="562" text-anchor="middle" fill="#7c7768"
        font-family="Segoe UI, Roboto, Helvetica, Arial, sans-serif"
        font-size="21">JAMB &#183; WAEC &#183; NECO &#183; BECE &#183; Post UTME</text>
</svg>`;

/* ---- Apple touch icon: 180x180, opaque (iOS ignores transparency) ---- */
const touch = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
  <defs>${gold}</defs>
  <rect width="180" height="180" rx="40" fill="#121109"/>
  <g transform="translate(57,46) scale(1.1)">${monogram("url(#g)")}</g>
</svg>`;

const write = async (svg, name) => {
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(join(OUT, name));
  console.log("wrote", name);
};

await write(og, "og.png");
await write(touch, "apple-touch-icon.png");
