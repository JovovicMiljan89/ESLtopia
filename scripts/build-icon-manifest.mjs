// Rebuilds public/icons/{color,outline}/*.svg and src/emojiIconManifest.json
// from a local extraction of the OpenMoji release packs. See
// public/icons/ATTRIBUTION.md for where to download those packs and why this
// exists.
//
// Usage:
//   node scripts/build-icon-manifest.mjs <extracted-color-dir> <extracted-black-dir>

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, rmSync } from 'node:fs';
import path from 'node:path';

const [, , colorDirArg, blackDirArg] = process.argv;
if (!colorDirArg || !blackDirArg) {
  console.error('Usage: node scripts/build-icon-manifest.mjs <extracted-color-dir> <extracted-black-dir>');
  process.exit(1);
}

const src = readFileSync('src/worksheetContent.js', 'utf8');
const found = new Set();
for (const m of src.matchAll(/emoji:\s*"([^"]*)"/g)) found.add(m[1]);
for (const m of src.matchAll(/[A-Z]:\s*"([^"]*)"/g)) found.add(m[1]);
const emojiList = [...found].filter(Boolean).sort();

function codepoints(emoji) {
  return [...emoji].map(ch => ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0'));
}

// OpenMoji keeps VS16 (FE0F) in some filenames but strips it in others
// (text-presentation-selector glyphs like ✏️ 🌤️ 🛋️ are filed under their
// base codepoint only) — try both.
function candidateHexcodes(emoji) {
  const withVS = codepoints(emoji).join('-');
  const withoutVS = codepoints(emoji).filter(cp => cp !== 'FE0F').join('-');
  return [...new Set([withVS, withoutVS])];
}

const OUT_COLOR = 'public/icons/color';
const OUT_OUTLINE = 'public/icons/outline';
rmSync(OUT_COLOR, { recursive: true, force: true });
rmSync(OUT_OUTLINE, { recursive: true, force: true });
mkdirSync(OUT_COLOR, { recursive: true });
mkdirSync(OUT_OUTLINE, { recursive: true });

const matched = [];
const unmatched = [];

for (const emoji of emojiList) {
  let hexUsed = null;
  for (const hex of candidateHexcodes(emoji)) {
    const colorSrc = path.join(colorDirArg, `${hex}.svg`);
    const blackSrc = path.join(blackDirArg, `${hex}.svg`);
    if (existsSync(colorSrc) && existsSync(blackSrc)) {
      copyFileSync(colorSrc, path.join(OUT_COLOR, `${hex}.svg`));
      copyFileSync(blackSrc, path.join(OUT_OUTLINE, `${hex}.svg`));
      hexUsed = hex;
      break;
    }
  }
  if (hexUsed) matched.push({ emoji, hex: hexUsed });
  else unmatched.push(emoji);
}

const manifest = Object.fromEntries(matched.map(m => [m.emoji, m.hex]));
writeFileSync('src/emojiIconManifest.json', JSON.stringify(manifest, null, 2) + '\n', 'utf8');

console.log(`Matched ${matched.length}/${emojiList.length} emoji.`);
if (unmatched.length) {
  console.log('No OpenMoji equivalent found for:', unmatched.join(' '));
}
