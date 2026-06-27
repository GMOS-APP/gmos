// RSS 2.0 feed of published blog posts, served at /rss.xml via a vercel.json
// rewrite. Mirrors api/sitemap.js: no build step, reads published rows with the
// public anon key, and falls back to an empty feed if the fetch fails.
const SITE = 'https://gmos.app';
const clean = (v) => (v || '').replace(/\s+/g, '');
const SUPABASE_URL = clean(process.env.VITE_SUPABASE_URL) || 'https://suofaewpbrzbixplwzvs.supabase.co';
const ANON_KEY = clean(process.env.VITE_SUPABASE_ANON_KEY) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1b2ZhZXdwYnJ6Yml4cGx3enZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxODg0MzUsImV4cCI6MjA4ODc2NDQzNX0.ziB-ol7U-RCbTFti38CnAbLYRBneucoFRtxO1flHKSo';

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

export default async function handler(req, res) {
  let posts = [];
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/blog_posts?select=slug,title,excerpt,category,author,published_at&published=eq.true&order=published_at.desc&limit=50`,
      { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } },
    );
    if (r.ok) posts = await r.json();
  } catch { /* fall back to an empty feed */ }

  const items = posts.map((p) => `    <item>
      <title>${esc(p.title)}</title>
      <link>${SITE}/blog/${esc(p.slug)}</link>
      <guid isPermaLink="true">${SITE}/blog/${esc(p.slug)}</guid>
      ${p.category ? `<category>${esc(p.category)}</category>` : ''}
      ${p.author ? `<dc:creator>${esc(p.author)}</dc:creator>` : ''}
      <pubDate>${new Date(p.published_at).toUTCString()}</pubDate>
      <description>${esc(p.excerpt)}</description>
    </item>`).join('\n');

  const lastBuild = posts[0]?.published_at ? new Date(posts[0].published_at).toUTCString() : new Date().toUTCString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>GM/OS Blog</title>
    <link>${SITE}/blog</link>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml" />
    <description>GM tips, prep methods, and feature deep-dives for running better tabletop RPG sessions.</description>
    <language>en</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
${items}
  </channel>
</rss>`;

  res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(xml);
}
