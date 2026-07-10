// fetch-image
//
// Fetches (and caches) a vocabulary word's illustration/photo for use in
// worksheets and flashcards. Checks Supabase Storage (the "vocab-images"
// bucket) first -- Pixabay's terms prohibit permanent hotlinking of their
// URLs, so every image actually used by the app has to be re-hosted, not
// just cached in memory, before it's ever shown to a user.
//
// Cache layout: <category>/<slug>/original.<ext>, with any already-generated
// variants (blurred.jpg, grayscale.jpg, dotted.svg, silhouette.svg) sitting
// alongside it in the same folder -- that folder IS the cache key for a
// word, so a later request for the same word+category returns whatever's in
// it without recomputing anything.
//
// Variants are NOT generated here. sharp and potrace (blur/grayscale/trace)
// are native Node addons and don't run in the Deno edge runtime, so a
// separate script (scripts/generate-image-variants.mjs) fills them in after
// this function caches the original. This endpoint only guarantees the
// original exists and reports back whichever files are already present.
//
// Auth: caller must be an authenticated, active user (any role).

import { corsHeaders, json, withCors } from '../_shared/cors.ts';
import { requireUser } from '../_shared/auth.ts';
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const PIXABAY_API_KEY = Deno.env.get('PIXABAY_API_KEY');
const BUCKET = 'vocab-images';
const VALID_CATEGORIES = new Set(['photo', 'illustration']);

function slugify(word: string): string {
  return word
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildUrls(svc: SupabaseClient, folder: string, fileNames: Iterable<string>): Record<string, string> {
  const urls: Record<string, string> = {};
  for (const name of fileNames) {
    const variant = name.split('.')[0]; // "original" | "blurred" | "grayscale" | "dotted" | "silhouette"
    urls[variant] = svc.storage.from(BUCKET).getPublicUrl(`${folder}/${name}`).data.publicUrl;
  }
  return urls;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const { svc } = await requireUser(req);

    const { query, category } = await req.json();
    if (!query || typeof query !== 'string') {
      return json({ error: 'query is required' }, 400);
    }
    if (!category || !VALID_CATEGORIES.has(category)) {
      return json({ error: 'category must be "photo" or "illustration"' }, 400);
    }

    const slug = slugify(query);
    if (!slug) return json({ error: 'query must contain at least one letter or number' }, 400);

    const folder = `${category}/${slug}`;

    const { data: existing, error: listErr } = await svc.storage.from(BUCKET).list(folder);
    if (listErr) return json({ error: listErr.message }, 500);

    const existingNames = (existing ?? []).map((f) => f.name);
    const originalFile = existingNames.find((n) => n.startsWith('original.'));

    if (originalFile) {
      return json({
        word: query,
        slug,
        category,
        cached: true,
        urls: buildUrls(svc, folder, existingNames),
      });
    }

    // Not cached yet -- fetch from Pixabay and cache the original.
    if (!PIXABAY_API_KEY) {
      return json({ error: 'PIXABAY_API_KEY is not configured' }, 500);
    }

    const pixabayUrl =
      `https://pixabay.com/api/?key=${PIXABAY_API_KEY}` +
      `&q=${encodeURIComponent(query)}` +
      `&image_type=${category}` +
      `&safesearch=true` +
      `&per_page=3`;

    const pixabayRes = await fetch(pixabayUrl);
    if (pixabayRes.status === 429) {
      return json({ error: 'Pixabay rate limit exceeded -- try again later' }, 429);
    }
    if (!pixabayRes.ok) {
      return json({ error: `Pixabay request failed (${pixabayRes.status})` }, 502);
    }

    const pixabayData = await pixabayRes.json();
    const hit = pixabayData?.hits?.[0];
    if (!hit?.webformatURL) {
      return json({ error: `No ${category} results for "${query}"` }, 404);
    }

    const imageRes = await fetch(hit.webformatURL);
    if (!imageRes.ok) {
      return json({ error: 'Could not download image from Pixabay' }, 502);
    }
    const imageBlob = await imageRes.blob();
    const contentType = imageRes.headers.get('content-type') || 'image/jpeg';
    const ext = contentType.includes('png') ? 'png' : 'jpg';
    const originalPath = `${folder}/original.${ext}`;

    const { error: uploadErr } = await svc.storage
      .from(BUCKET)
      .upload(originalPath, imageBlob, { contentType, upsert: false });
    if (uploadErr && !uploadErr.message?.toLowerCase().includes('already exists')) {
      // "already exists" means a concurrent request cached this word between
      // our list() and upload() calls -- not a real failure, just use it.
      return json({ error: uploadErr.message }, 500);
    }

    return json({
      word: query,
      slug,
      category,
      cached: false,
      urls: {
        original: svc.storage.from(BUCKET).getPublicUrl(originalPath).data.publicUrl,
      },
    });
  } catch (e) {
    if (e instanceof Response) return await withCors(e);
    return json({ error: String(e) }, 500);
  }
});
