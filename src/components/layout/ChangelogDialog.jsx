import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CURRENT_VERSION, CHANGELOG } from '@/lib/changelog';

const STORAGE_KEY = 'gmos_changelog_version';

const TYPE_STYLES = {
  new:      'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  improved: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  fixed:    'bg-amber-500/15 text-amber-400 border border-amber-500/30',
};

const TYPE_LABELS = {
  new:      'New',
  improved: 'Improved',
  fixed:    'Fixed',
};

function getUnseenVersions(lastSeen) {
  return CHANGELOG.filter(entry =>
    !lastSeen || entry.version > lastSeen
  );
}

export default function ChangelogDialog() {
  const [open, setOpen] = useState(false);
  const [unseenVersions, setUnseenVersions] = useState([]);

  useEffect(() => {
    const lastSeen = localStorage.getItem(STORAGE_KEY);
    if (lastSeen === CURRENT_VERSION) return;
    const unseen = getUnseenVersions(lastSeen);
    if (unseen.length > 0) {
      setUnseenVersions(unseen);
      setOpen(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, CURRENT_VERSION);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) dismiss(); }}>
      <DialogContent className="max-w-md bg-zinc-900 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-zinc-100">
            {"What's new"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-1">
          <div className="space-y-6 pb-1">
            {unseenVersions.map((release) => (
              <div key={release.version}>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-xs font-mono text-zinc-500">{release.date}</span>
                </div>
                <ul className="space-y-2">
                  {release.entries.map((entry, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TYPE_STYLES[entry.type]}`}>
                        {TYPE_LABELS[entry.type]}
                      </span>
                      <span className="text-sm text-zinc-300 leading-snug">{entry.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex justify-end pt-1">
          <Button onClick={dismiss} className="bg-amber-600 hover:bg-amber-500 text-white">
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
