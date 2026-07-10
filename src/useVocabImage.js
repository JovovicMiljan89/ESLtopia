import { useCallback, useState } from 'react';
import { supabase } from './supabaseClient.js';

// Calls the fetch-image edge function for a vocab word, returning whichever
// cached image URLs exist for it (original + any precomputed variants —
// blurred/grayscale/dotted/silhouette — see
// scripts/generate-image-variants.mjs for how those get filled in).
export function useVocabImage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchImage = useCallback(async (query, category = 'photo') => {
    setLoading(true);
    setError('');
    const { data, error: fnErr } = await supabase.functions.invoke('fetch-image', {
      body: { query, category },
    });
    setLoading(false);
    if (fnErr || data?.error) {
      const message = data?.error || fnErr?.message || 'Could not fetch image.';
      setError(message);
      return null;
    }
    return data;
  }, []);

  return { fetchImage, loading, error };
}
