// Build-time prerender for blog SEO. After `vite build`, this reads the built
// dist/index.html and writes a static dist/blog/<slug>/index.html per published
// post with per-post <title>, meta description, Open Graph/Twitter tags, and
// JSON-LD baked into the HTML — so non-JS social scrapers (X, Facebook, Slack,
// Discord, LinkedIn) get correct link previews. The SPA still hydrates normally.
//
// Resilient by design: any failure logs a warning and exits 0, leaving the SPA
// (served via the catch-all rewrite) untouched. Missing files simply fall back
// to the client-rendered page, exactly as before.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = 'https://gmos.app';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = resolve(ROOT, 'dist');
const INDEX = resolve(DIST, 'index.html');

const clean = (v) => (v || '').replace(/\s+/g, '');
const SUPABASE_URL = clean(process.env.VITE_SUPABASE_URL) || 'https://suofaewpbrzbixplwzvs.supabase.co';
const ANON_KEY = clean(process.env.VITE_SUPABASE_ANON_KEY) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1b2ZhZXdwYnJ6Yml4cGx3enZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxODg0MzUsImV4cCI6MjA4ODc2NDQzNX0.ziB-ol7U-RCbTFti38CnAbLYRBneucoFRtxO1flHKSo';

const DEFAULT_IMAGE = `${SITE}/og.png`;

const escAttr = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const escText = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Replace a meta tag's content by name/property, or inject it if absent.
function setMeta(html, attr, key, value) {
  if (value == null || value === '') return html;
  const re = new RegExp(`(<meta ${attr}="${key}"[^>]*content=")[^"]*(")`);
  if (re.test(html)) return html.replace(re, `$1${escAttr(value)}$2`);
  return html.replace('</head>', `    <meta ${attr}="${key}" content="${escAttr(value)}" />\n  </head>`);
}
function setLink(html, rel, href) {
  const re = new RegExp(`(<link rel="${rel}"[^>]*href=")[^"]*(")`);
  if (re.test(html)) return html.replace(re, `$1${escAttr(href)}$2`);
  return html.replace('</head>', `    <link rel="${rel}" href="${escAttr(href)}" />\n  </head>`);
}
function setTitle(html, title) {
  return html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escText(title)}</title>`);
}
function injectJsonLd(html, obj) {
  const json = JSON.stringify(obj).replace(/</g, '\\u003c');
  return html.replace('</head>', `    <script id="seo-jsonld" type="application/ld+json">${json}</script>\n  </head>`);
}

function renderPost(baseHtml, post) {
  const url = `${SITE}/blog/${post.slug}`;
  const img = post.cover_image || DEFAULT_IMAGE;
  const title = `${post.title} — GM/OS`;
  const desc = post.excerpt || '';
  let html = setTitle(baseHtml, title);
  html = setMeta(html, 'name', 'description', desc);
  html = setLink(html, 'canonical', url);
  html = setMeta(html, 'property', 'og:type', 'article');
  html = setMeta(html, 'property', 'og:site_name', 'GM/OS');
  html = setMeta(html, 'property', 'og:title', title);
  html = setMeta(html, 'property', 'og:description', desc);
  html = setMeta(html, 'property', 'og:url', url);
  html = setMeta(html, 'property', 'og:image', img);
  html = setMeta(html, 'property', 'og:image:alt', post.title);
  html = setMeta(html, 'property', 'article:published_time', post.published_at);
  html = setMeta(html, 'property', 'article:author', post.author || 'GM/OS');
  html = setMeta(html, 'name', 'twitter:title', title);
  html = setMeta(html, 'name', 'twitter:description', desc);
  html = setMeta(html, 'name', 'twitter:image', img);
  html = injectJsonLd(html, [
    {
      '@context': 'https://schema.org', '@type': 'Article',
      headline: post.title, description: desc || undefined,
      image: post.cover_image ? [post.cover_image] : undefined,
      datePublished: post.published_at, dateModified: post.published_at,
      author: { '@type': 'Organization', name: post.author || 'GM/OS', url: SITE },
      publisher: { '@type': 'Organization', name: 'GM/OS', logo: { '@type': 'ImageObject', url: DEFAULT_IMAGE } },
      articleSection: post.category || undefined,
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Blog', item: `${SITE}/blog` },
        { '@type': 'ListItem', position: 2, name: post.title, item: url },
      ],
    },
  ]);
  return html;
}

function renderIndex(baseHtml) {
  const url = `${SITE}/blog`;
  const title = 'Blog — GM tips & deep dives | GM/OS';
  const desc = 'GM tips, prep methods, and feature deep-dives for running better tabletop RPG sessions, from the team behind GM/OS.';
  let html = setTitle(baseHtml, title);
  html = setMeta(html, 'name', 'description', desc);
  html = setLink(html, 'canonical', url);
  html = setMeta(html, 'property', 'og:site_name', 'GM/OS');
  html = setMeta(html, 'property', 'og:title', title);
  html = setMeta(html, 'property', 'og:description', desc);
  html = setMeta(html, 'property', 'og:url', url);
  html = setMeta(html, 'name', 'twitter:title', title);
  html = setMeta(html, 'name', 'twitter:description', desc);
  html = injectJsonLd(html, {
    '@context': 'https://schema.org', '@type': 'Blog',
    name: 'The GM/OS Blog', description: desc, url,
    publisher: { '@type': 'Organization', name: 'GM/OS', url: SITE },
  });
  return html;
}

async function main() {
  if (!existsSync(INDEX)) {
    console.warn('[prerender-blog] dist/index.html not found — skipping.');
    return;
  }
  const baseHtml = await readFile(INDEX, 'utf8');

  let posts = [];
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/blog_posts?select=slug,title,excerpt,cover_image,category,author,published_at&published=eq.true`,
      { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } },
    );
    if (r.ok) posts = await r.json();
    else console.warn(`[prerender-blog] post fetch returned ${r.status} — skipping posts.`);
  } catch (e) {
    console.warn(`[prerender-blog] post fetch failed (${e.message}) — skipping posts.`);
  }

  // Blog index.
  try {
    await mkdir(resolve(DIST, 'blog'), { recursive: true });
    await writeFile(resolve(DIST, 'blog', 'index.html'), renderIndex(baseHtml));
  } catch (e) {
    console.warn(`[prerender-blog] index write failed: ${e.message}`);
  }

  let written = 0;
  for (const post of posts) {
    if (!post?.slug) continue;
    try {
      const dir = resolve(DIST, 'blog', post.slug);
      await mkdir(dir, { recursive: true });
      await writeFile(resolve(dir, 'index.html'), renderPost(baseHtml, post));
      written += 1;
    } catch (e) {
      console.warn(`[prerender-blog] failed for ${post.slug}: ${e.message}`);
    }
  }
  console.log(`[prerender-blog] wrote ${written} post page(s) + blog index.`);
}

main().catch((e) => {
  // Never fail the build over SEO prerendering.
  console.warn(`[prerender-blog] unexpected error: ${e.message}`);
});
