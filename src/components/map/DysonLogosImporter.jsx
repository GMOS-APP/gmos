import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, ChevronLeft, ChevronRight, ExternalLink, ImageOff } from 'lucide-react';

const CATEGORY_ID = 75205030;
const API = 'https://public-api.wordpress.com/wp/v2/sites/dysonlogos.blog';
const PER_PAGE = 20;

function decodeHtml(html) {
  const el = document.createElement('textarea');
  el.innerHTML = html;
  return el.value;
}

// Extract last image src from HTML content (map image is typically last; header comes first)
function extractMapImage(html) {
  const matches = [...html.matchAll(/src="(https:\/\/[^"]+\.(png|jpg|jpeg|webp))(?:\?[^"]*)?"(?:[^>]*)>/gi)];
  if (!matches.length) return null;
  // Prefer PNG (higher quality), otherwise last match
  const png = matches.findLast(m => m[2].toLowerCase() === 'png');
  const url = (png || matches[matches.length - 1])[1];
  return url;
}

async function fetchMaps(search, page) {
  const params = new URLSearchParams({
    categories: CATEGORY_ID,
    per_page: PER_PAGE,
    page,
    orderby: 'date',
    order: 'desc',
    ...(search && { search }),
  });
  const res = await fetch(`${API}/posts?${params}`);
  if (!res.ok) throw new Error('Failed to fetch maps');
  const total = parseInt(res.headers.get('X-WP-Total') || '0', 10);
  const totalPages = parseInt(res.headers.get('X-WP-TotalPages') || '1', 10);
  const posts = await res.json();
  return {
    results: posts.map(p => {
      const imageUrl = extractMapImage(p.content.rendered);
      return {
        title: decodeHtml(p.title.rendered).replace(/<[^>]+>/g, ''),
        image_url: imageUrl,
        thumbnail_url: imageUrl ? `${imageUrl}?w=300` : null,
        post_url: p.link,
      };
    }),
    total,
    totalPages,
  };
}

export default function DysonLogosImporter({ open, onClose, onImport, isImporting }) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => { setPage(1); }, [debouncedQuery]);

  // Reset on open
  useEffect(() => {
    if (open) { setQuery(''); setDebouncedQuery(''); setPage(1); }
  }, [open]);

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['dyson-logos', debouncedQuery, page],
    queryFn: () => fetchMaps(debouncedQuery, page),
    enabled: open,
    placeholderData: (prev) => prev,
  });

  const results = data?.results ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  const handleSelect = (map) => {
    if (!map.image_url) return;
    onImport({ name: map.title, image_url: map.image_url });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col gap-0 p-0 dark:bg-zinc-900 dark:border-zinc-800 bg-white border-zinc-200">
        <DialogHeader className="px-5 pt-5 pb-3 flex-shrink-0">
          <DialogTitle className="text-base font-semibold dark:text-zinc-100 text-zinc-900">
            Browse Dyson Logos Maps
          </DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="px-5 pb-3 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-zinc-500 text-zinc-400" />
            <Input
              placeholder="Search maps…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="pl-9 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-100 bg-zinc-100 border-zinc-200 text-zinc-900"
            />
          </div>
          {total > 0 && (
            <p className="text-[11px] dark:text-zinc-600 text-zinc-500 mt-1.5">
              {total.toLocaleString()} maps · click to add to campaign
            </p>
          )}
        </div>

        {/* Grid */}
        <ScrollArea className="flex-1 min-h-0 px-5">
          {isLoading ? (
            <div className="grid grid-cols-4 gap-3 pb-3">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="rounded-lg overflow-hidden dark:bg-zinc-800 bg-zinc-100 animate-pulse">
                  <div className="aspect-square" />
                  <div className="p-2 space-y-1.5">
                    <div className="h-2.5 dark:bg-zinc-700 bg-zinc-200 rounded w-full" />
                    <div className="h-2.5 dark:bg-zinc-700 bg-zinc-200 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2">
              <p className="dark:text-zinc-400 text-zinc-600 text-sm">Couldn't reach Dyson Logos — check your connection.</p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2">
              <p className="dark:text-zinc-400 text-zinc-600 text-sm">No maps found for "{debouncedQuery}"</p>
            </div>
          ) : (
            <div className={`grid grid-cols-4 gap-3 pb-3 transition-opacity ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
              {results.map((map, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(map)}
                  disabled={!map.image_url || isImporting}
                  className="group rounded-lg overflow-hidden text-left border dark:border-zinc-800 border-zinc-200 dark:hover:border-amber-500/60 hover:border-amber-400/60 dark:bg-zinc-950 bg-zinc-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  <div className="aspect-square dark:bg-zinc-800 bg-zinc-200 overflow-hidden">
                    {map.thumbnail_url ? (
                      <img
                        src={map.thumbnail_url}
                        alt={map.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                        onError={e => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageOff className="w-6 h-6 dark:text-zinc-700 text-zinc-400" />
                      </div>
                    )}
                  </div>
                  <div className="px-2 py-1.5">
                    <p className="text-[11px] dark:text-zinc-300 text-zinc-700 leading-snug line-clamp-2 group-hover:dark:text-amber-400 group-hover:text-amber-600 transition-colors">
                      {map.title}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer: pagination + attribution */}
        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0 dark:border-t dark:border-zinc-800 border-t border-zinc-200">
          <a
            href="https://dysonlogos.blog/maps/commercial-maps/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] dark:text-zinc-600 text-zinc-500 hover:dark:text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            Maps by Dyson Logos · CC licensed
            <ExternalLink className="w-3 h-3" />
          </a>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1 || isFetching}
                className="h-7 w-7 p-0 dark:text-zinc-400 text-zinc-600"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs dark:text-zinc-500 text-zinc-600 tabular-nums">
                {page} / {totalPages}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || isFetching}
                className="h-7 w-7 p-0 dark:text-zinc-400 text-zinc-600"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
