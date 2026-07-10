// Generates the blurred/grayscale/dotted/silhouette variants for every
// vocab-images/<category>/<slug>/original.* that doesn't have them yet.
//
// Runs sharp (blur/grayscale) and potrace (outline tracing) locally --
// both are native Node addons and can't run inside the Deno edge function
// (supabase/functions/fetch-image), which only ever caches the original.
// This script is the other half of that pipeline: run it after new words
// get cached (manually, on a schedule, whatever) and it fills in whatever's
// missing. Idempotent -- already-complete words are skipped.
//
// Usage:
//   node scripts/generate-image-variants.mjs                 # scan the whole bucket
//   node scripts/generate-image-variants.mjs elephant photo  # just one word/category
//
// Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import potrace from 'potrace';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
  process.exit(1);
}

const svc = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BUCKET = 'vocab-images';
const CATEGORIES = ['photo', 'illustration'];
const DOT_COUNT = 40;

// ─── Supabase Storage helpers ──────────────────────────────────────────────

async function listWordFolders(category) {
  const { data, error } = await svc.storage.from(BUCKET).list(category, { limit: 1000 });
  if (error) throw new Error(`list(${category}) failed: ${error.message}`);
  // Folders come back with id: null (they aren't real objects, just prefixes).
  return (data ?? []).filter((e) => e.id === null).map((e) => e.name);
}

async function listFiles(folder) {
  const { data, error } = await svc.storage.from(BUCKET).list(folder);
  if (error) throw new Error(`list(${folder}) failed: ${error.message}`);
  return new Set((data ?? []).map((f) => f.name));
}

async function download(path) {
  const { data, error } = await svc.storage.from(BUCKET).download(path);
  if (error) throw new Error(`download(${path}) failed: ${error.message}`);
  return Buffer.from(await data.arrayBuffer());
}

async function upload(path, buffer, contentType) {
  const { error } = await svc.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType, upsert: true });
  if (error) throw new Error(`upload(${path}) failed: ${error.message}`);
}

// ─── sharp variants ─────────────────────────────────────────────────────────

// flatten() to white before the JPEG conversion -- sharp otherwise fills any
// transparent pixels with black, which happens silently and looks broken on
// a printed (white-background) worksheet. Real Pixabay photos are already
// opaque, but "illustration"-category results can be transparent PNGs.
async function makeBlurred(originalBuffer) {
  return sharp(originalBuffer).flatten({ background: '#ffffff' }).blur(15).jpeg({ quality: 80 }).toBuffer();
}

async function makeGrayscale(originalBuffer) {
  return sharp(originalBuffer).flatten({ background: '#ffffff' }).grayscale().jpeg({ quality: 85 }).toBuffer();
}

// ─── potrace tracing + dot-sampling geometry ───────────────────────────────

// potrace works on a clean, modestly-sized bitmap -- resizing keeps tracing
// fast and the resulting path from being absurdly over-detailed. PNG (not
// JPEG) going in, so compression artifacts don't turn into noise in the
// traced outline.
async function resizeForTracing(originalBuffer) {
  return sharp(originalBuffer).resize(400, 400, { fit: 'inside' }).png().toBuffer();
}

function traceToPathData(buffer) {
  return new Promise((resolve, reject) => {
    potrace.trace(buffer, {}, (err, svg) => {
      if (err) return reject(err);
      const pathMatch = svg.match(/<path[^>]*\sd="([^"]+)"/);
      const viewBoxMatch = svg.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/);
      if (!pathMatch) return reject(new Error('potrace produced no path data'));
      resolve({
        d: pathMatch[1],
        svg,
        width: viewBoxMatch ? Number(viewBoxMatch[1]) : undefined,
        height: viewBoxMatch ? Number(viewBoxMatch[2]) : undefined,
      });
    });
  });
}

function cubicBezierPoint(p0, p1, p2, p3, t) {
  const mt = 1 - t;
  return {
    x: mt * mt * mt * p0.x + 3 * mt * mt * t * p1.x + 3 * mt * t * t * p2.x + t * t * t * p3.x,
    y: mt * mt * mt * p0.y + 3 * mt * mt * t * p1.y + 3 * mt * t * t * p2.y + t * t * t * p3.y,
  };
}

// Parses an SVG path's M/L/C commands into a list of subpaths (one per M),
// flattening every cubic bezier into short line segments so arc length --
// and therefore even spacing along the outline -- can be measured. Potrace
// only ever emits M, C, L and a trailing z per subpath, never quadratic/arc
// commands, so that's all this needs to handle. z carries no coordinates, so
// it's stripped before parsing rather than treated as its own command.
function parsePathToSubpaths(d, segmentsPerCurve = 20) {
  const commands = d.replace(/[Zz]/g, ' ').match(/[MLC][^MLC]*/g) ?? [];
  const subpaths = [];
  let current = { x: 0, y: 0 };
  let currentSubpath = null;

  for (const cmd of commands) {
    const type = cmd[0];
    const nums = cmd.slice(1).trim().split(/[\s,]+/).filter(Boolean).map(Number);

    if (type === 'M') {
      currentSubpath = [];
      subpaths.push(currentSubpath);
      current = { x: nums[0], y: nums[1] };
      currentSubpath.push({ ...current });
      for (let i = 2; i + 1 < nums.length; i += 2) {
        current = { x: nums[i], y: nums[i + 1] };
        currentSubpath.push({ ...current });
      }
    } else if (type === 'L') {
      for (let i = 0; i + 1 < nums.length; i += 2) {
        current = { x: nums[i], y: nums[i + 1] };
        currentSubpath?.push({ ...current });
      }
    } else if (type === 'C') {
      for (let i = 0; i + 5 < nums.length; i += 6) {
        const p0 = current;
        const p1 = { x: nums[i], y: nums[i + 1] };
        const p2 = { x: nums[i + 2], y: nums[i + 3] };
        const p3 = { x: nums[i + 4], y: nums[i + 5] };
        for (let s = 1; s <= segmentsPerCurve; s++) {
          currentSubpath?.push(cubicBezierPoint(p0, p1, p2, p3, s / segmentsPerCurve));
        }
        current = p3;
      }
    }
  }
  return subpaths;
}

function polylineLength(points) {
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    length += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  return length;
}

// Walks a polyline's cumulative arc length and samples `count` points at
// even DISTANCE intervals -- not even index intervals, since potrace emits
// far more points along tightly-curved sections than straight ones, and
// indexing evenly would bunch dots up on curves and leave gaps on straights.
function sampleEvenlySpaced(points, count) {
  if (points.length < 2) return points;
  const cumulative = [0];
  for (let i = 1; i < points.length; i++) {
    cumulative.push(cumulative[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y));
  }
  const totalLength = cumulative[cumulative.length - 1];
  const sampled = [];
  let seg = 1;
  for (let k = 0; k < count; k++) {
    const target = (totalLength * k) / count;
    while (seg < cumulative.length - 1 && cumulative[seg] < target) seg++;
    const segStart = cumulative[seg - 1];
    const segEnd = cumulative[seg];
    const t = segEnd === segStart ? 0 : (target - segStart) / (segEnd - segStart);
    const a = points[seg - 1];
    const b = points[seg];
    sampled.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  }
  return sampled;
}

async function makeDotted(originalBuffer) {
  const resized = await resizeForTracing(originalBuffer);
  const { d, width, height } = await traceToPathData(resized);

  const subpaths = parsePathToSubpaths(d);
  if (subpaths.length === 0) throw new Error('no traceable outline found');
  // A traced photo can produce several disconnected blobs (shadow, background
  // noise, etc) -- connect-the-dots wants ONE clean outline of the main
  // subject, so only the longest subpath is sampled.
  const mainOutline = subpaths.reduce((a, b) => (polylineLength(b) > polylineLength(a) ? b : a));
  const dots = sampleEvenlySpaced(mainOutline, DOT_COUNT);

  const w = width ?? Math.max(...mainOutline.map((p) => p.x)) + 10;
  const h = height ?? Math.max(...mainOutline.map((p) => p.y)) + 10;

  const dotMarkup = dots
    .map(
      (p, i) =>
        `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3" fill="#333"/>` +
        `<text x="${(p.x + 5).toFixed(1)}" y="${(p.y - 5).toFixed(1)}" font-size="9" font-family="sans-serif" fill="#333">${i + 1}</text>`,
    )
    .join('\n  ');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">\n  ${dotMarkup}\n</svg>\n`;
}

async function makeSilhouette(originalBuffer) {
  const resized = await resizeForTracing(originalBuffer);
  const { svg } = await traceToPathData(resized);
  // potrace.trace() already returns a full <svg> with a filled path -- that
  // IS the silhouette, no further processing needed.
  return svg;
}

// ─── orchestration ──────────────────────────────────────────────────────────

function slugify(word) {
  return word.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function processWord(category, slug) {
  const folder = `${category}/${slug}`;
  const files = await listFiles(folder);
  const originalName = [...files].find((n) => n.startsWith('original.'));
  if (!originalName) {
    console.warn(`  skip ${folder}: no original found`);
    return;
  }

  const needed = {
    blurred: !files.has('blurred.jpg'),
    grayscale: !files.has('grayscale.jpg'),
    dotted: !files.has('dotted.svg'),
    silhouette: !files.has('silhouette.svg'),
  };
  const todo = Object.keys(needed).filter((k) => needed[k]);
  if (todo.length === 0) {
    console.log(`  ${folder}: already complete, skipping`);
    return;
  }

  console.log(`  ${folder}: generating ${todo.join(', ')}`);
  const original = await download(`${folder}/${originalName}`);

  if (needed.blurred) await upload(`${folder}/blurred.jpg`, await makeBlurred(original), 'image/jpeg');
  if (needed.grayscale) await upload(`${folder}/grayscale.jpg`, await makeGrayscale(original), 'image/jpeg');
  if (needed.dotted) await upload(`${folder}/dotted.svg`, Buffer.from(await makeDotted(original)), 'image/svg+xml');
  if (needed.silhouette) await upload(`${folder}/silhouette.svg`, Buffer.from(await makeSilhouette(original)), 'image/svg+xml');
}

async function main() {
  const [, , wordArg, categoryArg] = process.argv;

  if (wordArg && categoryArg) {
    if (!CATEGORIES.includes(categoryArg)) {
      console.error(`category must be one of: ${CATEGORIES.join(', ')}`);
      process.exit(1);
    }
    const slug = slugify(wordArg);
    console.log(`Processing single word: ${categoryArg}/${slug}`);
    await processWord(categoryArg, slug);
    return;
  }

  for (const category of CATEGORIES) {
    console.log(`Scanning ${category}/ ...`);
    const slugs = await listWordFolders(category);
    for (const slug of slugs) {
      await processWord(category, slug);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
