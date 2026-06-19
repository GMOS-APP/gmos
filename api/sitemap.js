// Dynamic sitemap — lists static routes plus every published blog post, so new
// posts appear without a redeploy. Served at /sitemap.xml via a vercel.json rewrite.
const SITE = 'https://gmos.app';
// Strip whitespace — the Vercel env value can carry a stray newline that breaks
// the request header (same gotcha as the client). Fall back to the public anon
// key (already shipped in the client bundle; only reads published rows).
const clean = (v) => (v || '').replace(/\s+/g, '');
const SUPABASE_URL = clean(process.env.VITE_SUPABASE_URL) || 'https://suofaewpbrzbixplwzvs.supabase.co';
const ANON_KEY = clean(process.env.VITE_SUPABASE_ANON_KEY) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1b2ZhZXdwYnJ6Yml4cGx3enZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxODg0MzUsImV4cCI6MjA4ODc2NDQzNX0.ziB-ol7U-RCbTFti38CnAbLYRBneucoFRtxO1flHKSo';

const STATIC = ['/', '/blog', '/Help', '/PrivacyPolicy', '/Terms'];

export default async function handler(req, res) {
  let posts = [];
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/blog_posts?select=slug,published_at&published=eq.true&order=published_at.desc`,
      { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } },
    );
    if (r.ok) posts = await r.json();
  } catch { /* fall back to static routes only */ }

  const esc = (s) => String(s).replace(/&/g, '&amp;');
  const entries = [
    ...STATIC.map((p) => ({ loc: SITE + p })),
    ...posts.map((p) => ({ loc: `${SITE}/blog/${p.slug}`, lastmod: p.published_at })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map((e) => `  <url><loc>${esc(e.loc)}</loc>${e.lastmod ? `<lastmod>${new Date(e.lastmod).toISOString()}</lastmod>` : ''}</url>`).join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(xml);
}
