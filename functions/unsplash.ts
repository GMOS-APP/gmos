// unsplash — proxies Unsplash photo search so the access key stays server-side.
// Set the key once:  supabase secrets set UNSPLASH_ACCESS_KEY=<your key>
// (register a free app at https://unsplash.com/developers). Returns a soft error
// (HTTP 200 + {error}) when not configured so the UI can fall back gracefully.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const KEY = Deno.env.get('UNSPLASH_ACCESS_KEY');
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    if (!KEY) return json({ error: 'Unsplash is not configured.', notConfigured: true });
    const body = await req.json().catch(() => ({}));
    const action = body?.action || 'search';
    const auth = { Authorization: `Client-ID ${KEY}`, 'Accept-Version': 'v1' };

    // Per Unsplash API terms, ping the download endpoint when a photo is chosen.
    if (action === 'track') {
      if (body.downloadLocation) await fetch(body.downloadLocation, { headers: auth }).catch(() => {});
      return json({ ok: true });
    }

    const query = String(body.query || 'fantasy landscape').slice(0, 100);
    const page = Math.max(1, Math.min(20, parseInt(String(body.page), 10) || 1));
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=24&page=${page}&orientation=landscape&content_filter=high`;
    const r = await fetch(url, { headers: auth });
    if (!r.ok) return json({ error: `Unsplash error (${r.status}).` });
    const data = await r.json();
    const results = (data.results || []).map((p: Record<string, any>) => ({
      id: p.id,
      thumb: p.urls?.small,
      full: p.urls?.regular,
      alt: p.alt_description || p.description || '',
      author: p.user?.name,
      authorLink: p.user?.links?.html,
      downloadLocation: p.links?.download_location,
    }));
    return json({ results, total: data.total || 0 });
  } catch (e) {
    return json({ error: (e as Error).message });
  }
});
