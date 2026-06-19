import { useEffect } from 'react';

const SITE = 'https://gmos.app';
const DEFAULT_IMAGE = `${SITE}/og.png`;

function meta(attr, key, content) {
  if (content == null) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function link(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * Per-page SEO: title, description, canonical, Open Graph, Twitter, and optional
 * JSON-LD. Google renders client JS so it picks these up; non-JS social scrapers
 * fall back to the defaults baked into index.html.
 */
export function useSeo({ title, description, path, image, type = 'website', jsonLd } = {}) {
  const ld = jsonLd ? JSON.stringify(jsonLd) : '';
  useEffect(() => {
    const url = SITE + (path ?? window.location.pathname);
    const img = image || DEFAULT_IMAGE;
    if (title) document.title = title;
    meta('name', 'description', description);
    link('canonical', url);
    meta('property', 'og:title', title);
    meta('property', 'og:description', description);
    meta('property', 'og:url', url);
    meta('property', 'og:type', type);
    meta('property', 'og:image', img);
    meta('name', 'twitter:card', 'summary_large_image');
    meta('name', 'twitter:title', title);
    meta('name', 'twitter:description', description);
    meta('name', 'twitter:image', img);

    let el = document.getElementById('seo-jsonld');
    if (ld) {
      if (!el) {
        el = document.createElement('script');
        el.id = 'seo-jsonld';
        el.type = 'application/ld+json';
        document.head.appendChild(el);
      }
      el.textContent = ld;
    } else if (el) {
      el.remove();
    }
  }, [title, description, path, image, type, ld]);
}
