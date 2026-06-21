// Shared CORS + JSON helpers for the school/teacher edge functions.

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Re-emit a thrown Response with CORS headers attached.
export async function withCors(res: Response): Promise<Response> {
  const text = await res.text();
  return new Response(text || res.statusText, {
    status: res.status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
