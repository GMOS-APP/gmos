// Build-time prerender for the marketing SEO pages (feature + comparison + hubs).
// After `vite build`, this reads dist/index.html and writes a static
// dist/<route>/index.html per page with baked <title>, meta description,
// canonical, Open Graph/Twitter tags, and JSON-LD — so crawlers and non-JS
// social scrapers get correct metadata without executing the SPA. The app still
// hydrates and takes over normally.
//
// It also enhances the homepage dist/index.html in place with SoftwareApplication
// JSON-LD (homepage-only, so it is not inherited by the sub-pages generated from
// the clean base above).
//
// Resilient by design: any failure logs a warning and exits 0.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SITE, COMPARISONS, FEATURE_PAGES, COMPARE_HUB, FEATURES_HUB,
  comparisonFaq, featureFaq,
} from '../src/lib/seoPages.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = resolve(ROOT, 'dist');
const INDEX = resolve(DIST, 'index.html');
const DEFAULT_IMAGE = `${SITE}/og.png`;

const escAttr = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const escText = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

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

// Bake the common tags (title/description/canonical/OG/Twitter) for one page.
function renderMeta(baseHtml, { title, description, path, image = DEFAULT_IMAGE }) {
  const url = SITE + path;
  let html = setTitle(baseHtml, title);
  html = setMeta(html, 'name', 'description', description);
  html = setLink(html, 'canonical', url);
  html = setMeta(html, 'property', 'og:type', 'website');
  html = setMeta(html, 'property', 'og:site_name', 'GM/OS');
  html = setMeta(html, 'property', 'og:title', title);
  html = setMeta(html, 'property', 'og:description', description);
  html = setMeta(html, 'property', 'og:url', url);
  html = setMeta(html, 'property', 'og:image', image);
  html = setMeta(html, 'name', 'twitter:title', title);
  html = setMeta(html, 'name', 'twitter:description', description);
  html = setMeta(html, 'name', 'twitter:image', image);
  return html;
}

const faqLd = (faq) => ({
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: faq.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
});
const breadcrumbLd = (crumbs) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.item })),
});

async function writePage(relDir, html) {
  const dir = resolve(DIST, relDir);
  await mkdir(dir, { recursive: true });
  await writeFile(resolve(dir, 'index.html'), html);
}

async function main() {
  if (!existsSync(INDEX)) {
    console.warn('[prerender-marketing] dist/index.html not found — skipping.');
    return;
  }
  const baseHtml = await readFile(INDEX, 'utf8');
  let written = 0;

  // Hubs.
  try {
    await writePage('compare', renderMeta(baseHtml, COMPARE_HUB));
    await writePage('features', renderMeta(baseHtml, FEATURES_HUB));
    written += 2;
  } catch (e) { console.warn(`[prerender-marketing] hub write failed: ${e.message}`); }

  // Comparison pages.
  for (const c of COMPARISONS) {
    try {
      const path = `/compare/${c.slug}`;
      let html = renderMeta(baseHtml, { title: c.metaTitle, description: c.metaDescription, path });
      html = injectJsonLd(html, [
        faqLd(comparisonFaq(c)),
        breadcrumbLd([
          { name: 'Compare', item: `${SITE}/compare` },
          { name: `${c.competitor} alternative`, item: SITE + path },
        ]),
      ]);
      await writePage(`compare/${c.slug}`, html);
      written += 1;
    } catch (e) { console.warn(`[prerender-marketing] failed for compare/${c.slug}: ${e.message}`); }
  }

  // Feature pages.
  for (const f of FEATURE_PAGES) {
    try {
      const path = `/features/${f.slug}`;
      let html = renderMeta(baseHtml, { title: f.metaTitle, description: f.metaDescription, path });
      html = injectJsonLd(html, [
        faqLd(featureFaq(f)),
        breadcrumbLd([
          { name: 'Features', item: `${SITE}/features` },
          { name: f.h1, item: SITE + path },
        ]),
      ]);
      await writePage(`features/${f.slug}`, html);
      written += 1;
    } catch (e) { console.warn(`[prerender-marketing] failed for features/${f.slug}: ${e.message}`); }
  }

  // Homepage: bake SoftwareApplication JSON-LD (homepage-only). Done LAST and in
  // place, after the clean base was used for every sub-page above.
  try {
    const homeHtml = injectJsonLd(baseHtml, {
      '@context': 'https://schema.org', '@type': 'SoftwareApplication',
      name: 'GM/OS',
      alternateName: ['Game Master Operating System', 'GM OS', 'DM OS'],
      applicationCategory: 'GameApplication',
      operatingSystem: 'Web',
      url: `${SITE}/`,
      description: 'GM/OS is a campaign manager and dungeon master toolkit for tabletop RPGs — worldbuilding, guided session prep, a live battle map, an initiative tracker, dice, a relationship map, and a player view you control.',
      offers: [
        { '@type': 'Offer', price: '0', priceCurrency: 'USD', name: 'Free' },
        { '@type': 'Offer', price: '3.99', priceCurrency: 'USD', name: 'Monthly' },
        { '@type': 'Offer', price: '37.99', priceCurrency: 'USD', name: 'Yearly' },
        { '@type': 'Offer', price: '49.99', priceCurrency: 'USD', name: 'Lifetime' },
      ],
    });
    await writeFile(INDEX, homeHtml);
  } catch (e) { console.warn(`[prerender-marketing] homepage enhance failed: ${e.message}`); }

  console.log(`[prerender-marketing] wrote ${written} marketing page(s) + homepage schema.`);
}

main().catch((e) => {
  console.warn(`[prerender-marketing] unexpected error: ${e.message}`);
});
