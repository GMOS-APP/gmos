import React, { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { UploadFile } from '@/api/entities';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, Link2, Loader2, Search, Image as ImageIcon } from 'lucide-react';

// Set a battle-map background three ways: upload a file, search Unsplash (via the
// `unsplash` edge function — needs UNSPLASH_ACCESS_KEY), or paste an image URL.
export default function BackgroundPicker({ open, onOpenChange, onSelect }) {
  const [uploading, setUploading] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [msg, setMsg] = useState(null);

  const pick = (url) => { if (url) { onSelect(url); onOpenChange(false); } };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try { const { file_url } = await UploadFile({ file }); pick(file_url); }
    catch (err) { alert(err?.message || 'Upload failed'); }
    finally { setUploading(false); }
  };

  const useLink = () => {
    const u = linkUrl.trim();
    if (!/^https?:\/\//i.test(u)) { alert('Enter a valid image URL (starts with http).'); return; }
    pick(u);
  };

  const search = async (e) => {
    e?.preventDefault?.();
    setSearching(true); setMsg(null);
    try {
      const { data } = await supabase.functions.invoke('unsplash', { body: { action: 'search', query: q || 'fantasy battle map' } });
      if (data?.notConfigured) { setMsg('Unsplash isn’t set up yet — paste a link or upload instead.'); setResults([]); }
      else if (data?.error) { setMsg(data.error); setResults([]); }
      else { setResults(data?.results || []); if (!(data?.results || []).length) setMsg('No results — try another search.'); }
    } catch { setMsg('Search failed.'); }
    finally { setSearching(false); }
  };

  const pickUnsplash = (r) => {
    supabase.functions.invoke('unsplash', { body: { action: 'track', downloadLocation: r.downloadLocation } }).catch(() => {});
    pick(r.full);
  };

  const inputCls = 'text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 px-2.5 py-1.5 focus:outline-none focus:border-amber-500/50';
  const btnCls = 'inline-flex items-center gap-1.5 text-sm px-2.5 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 max-w-2xl">
        <DialogHeader><DialogTitle className="text-zinc-900 dark:text-zinc-100">Battle map background</DialogTitle></DialogHeader>

        {/* Upload + paste link */}
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-zinc-950 font-medium cursor-pointer">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload
            <input type="file" accept="image/*" className="hidden" onChange={onFile} />
          </label>
          <div className="flex-1 min-w-[220px] flex gap-2">
            <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="…or paste an image URL" className={`flex-1 ${inputCls}`} />
            <button onClick={useLink} className={btnCls}><Link2 className="w-4 h-4" /> Use</button>
          </div>
        </div>

        {/* Unsplash search */}
        <form onSubmit={search} className="flex gap-2 mt-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search Unsplash (dungeon, forest, tavern…)" className={`w-full pl-8 ${inputCls}`} />
          </div>
          <button type="submit" disabled={searching} className={btnCls}>{searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Search</button>
        </form>

        <div className="min-h-[180px] max-h-[44vh] overflow-y-auto -mx-1 px-1">
          {msg && <p className="text-sm text-zinc-500 text-center py-8">{msg}</p>}
          {results.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {results.map((r) => (
                <button key={r.id} onClick={() => pickUnsplash(r)} title={r.alt}
                  className="group relative aspect-video rounded-md overflow-hidden border border-zinc-200 dark:border-zinc-800 hover:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50">
                  <img src={r.thumb} alt={r.alt} loading="lazy" className="w-full h-full object-cover" />
                  <span className="absolute inset-x-0 bottom-0 px-1 py-0.5 text-[9px] text-white/90 bg-black/50 opacity-0 group-hover:opacity-100 truncate">{r.author}</span>
                </button>
              ))}
            </div>
          )}
          {!msg && results.length === 0 && !searching && (
            <div className="flex flex-col items-center gap-2 text-center py-8 text-xs text-zinc-500">
              <ImageIcon className="w-6 h-6 text-zinc-600 dark:text-zinc-700" />
              Search Unsplash for a battle-map background.
            </div>
          )}
        </div>

        <p className="text-[10px] text-zinc-500">Photos via <a href="https://unsplash.com" target="_blank" rel="noreferrer" className="underline">Unsplash</a>.</p>
      </DialogContent>
    </Dialog>
  );
}
