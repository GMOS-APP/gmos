import React, { useState } from 'react';
import { UploadFile } from '@/api/entities';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, Link2, Loader2 } from 'lucide-react';

// Set a battle-map background by uploading a file or pasting an image URL.
export default function BackgroundPicker({ open, onOpenChange, onSelect }) {
  const [uploading, setUploading] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

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

  const applyLink = () => {
    const u = linkUrl.trim();
    if (!/^https?:\/\//i.test(u)) { alert('Enter a valid image URL (starts with http).'); return; }
    pick(u);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 max-w-md">
        <DialogHeader><DialogTitle className="text-zinc-900 dark:text-zinc-100">Battle map background</DialogTitle></DialogHeader>

        <label className="inline-flex items-center justify-center gap-1.5 text-sm px-3 py-2 rounded-md bg-amber-500 hover:bg-amber-400 text-zinc-950 font-medium cursor-pointer">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload an image
          <input type="file" accept="image/*" className="hidden" onChange={onFile} />
        </label>

        <div className="flex items-center gap-2 my-1">
          <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
          <span className="text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-600">or</span>
          <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        </div>

        <div className="flex gap-2">
          <input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyLink()}
            placeholder="Paste an image URL (https://…)"
            className="flex-1 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 px-2.5 py-2 focus:outline-none focus:border-amber-500/50"
          />
          <button onClick={applyLink} className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <Link2 className="w-4 h-4" /> Use
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
