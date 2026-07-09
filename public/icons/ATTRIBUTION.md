# Icon attribution

Icons in `color/` and `outline/` are extracted from **OpenMoji** (https://openmoji.org),
the open-source emoji and icon project, licensed under **CC BY-SA 4.0**.

> All emojis designed by OpenMoji – the open-source emoji and icon project.
> License: CC BY-SA 4.0

This is a curated subset (not the full OpenMoji set) containing only the icons this
app's topics currently use, matched by Unicode codepoint to the emoji already in
`src/worksheetContent.js`. Each icon exists in two matching styles under the same
filename (`{hexcode}.svg`):

- `color/` — full-color version
- `outline/` — black-outline-only version of the same icon (used for shadow-matching,
  colour-by-numbers, and other line-art exercises)

`src/emojiIconManifest.json` maps each emoji string (e.g. `"🐶"`) to its hexcode
(e.g. `"1F436"`), so the app can resolve `public/icons/color/1F436.svg` /
`public/icons/outline/1F436.svg` from a word's existing emoji field without any
per-word manual mapping.

## Regenerating this set

If new topics/words are added with new emoji, re-run `scripts/build-icon-manifest.mjs`
after downloading the two full OpenMoji release packs:

- https://github.com/hfg-gmuend/openmoji/releases/latest/download/openmoji-svg-color.zip
- https://github.com/hfg-gmuend/openmoji/releases/latest/download/openmoji-svg-black.zip

```
node scripts/build-icon-manifest.mjs <extracted-color-dir> <extracted-black-dir>
```

It scans `src/worksheetContent.js` for every `emoji: "..."` and letter-emoji entry,
resolves each to an OpenMoji hexcode (trying with and without the FE0F variation
selector, since OpenMoji's own filenames are inconsistent about it), copies only the
matched files into `public/icons/`, and rewrites `src/emojiIconManifest.json`.

Two emoji currently have no OpenMoji equivalent and are skipped (the app falls back to
rendering them as plain text, same as before this icon set existed): `1️⃣1️⃣` and `1️⃣2️⃣`
("eleven"/"twelve" in the Numbers topic) — these are two concatenated keycap emoji, not
single Unicode characters, so no single icon exists for them.
