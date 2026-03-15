import React, { useState } from 'react';
import EntityMentionTextarea from '@/components/common/EntityMentionTextarea';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import AiGate from '@/components/ui/AiGate';

export default function AIGenerateTextarea({ value, onChange, placeholder, rows = 4, onGenerate, className = '' }) {
  const [generating, setGenerating] = useState(false);
  const [pendingContent, setPendingContent] = useState(null);
  const [showDialog, setShowDialog] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    const result = await onGenerate();
    setGenerating(false);
    if (!result) return;
    if (value && value.trim().length > 0) {
      setPendingContent(result);
      setShowDialog(true);
    } else {
      onChange(result);
    }
  };

  const handleReplace = () => {
    onChange(pendingContent);
    setPendingContent(null);
    setShowDialog(false);
  };

  const handleAppend = () => {
    onChange((value ? value + '\n\n' : '') + pendingContent);
    setPendingContent(null);
    setShowDialog(false);
  };

  return (
    <>
      <div className="relative">
        <EntityMentionTextarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          className={`dark:bg-zinc-950/60 dark:border-zinc-800 dark:text-zinc-200 dark:placeholder:text-zinc-600 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 resize-y text-sm pr-[130px] ${className}`}
        />
        <AiGate>
          <Button
            onClick={handleGenerate}
            disabled={generating}
            size="sm"
            variant="outline"
            className="absolute top-2 right-2 border-amber-500/30 text-amber-400 hover:bg-amber-500/10 text-xs h-7 px-2.5"
          >
            {generating
              ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Generating</>
              : <><Sparkles className="w-3 h-3 mr-1" />Generate</>
            }
          </Button>
        </AiGate>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 bg-white border-gray-200 text-gray-900 max-w-lg">
          <DialogHeader>
            <DialogTitle>AI Generated Content</DialogTitle>
          </DialogHeader>
          <p className="text-sm dark:text-zinc-400 text-gray-600">This field already has content. Would you like to replace it or append the new content?</p>
          {pendingContent && (
            <div className="p-3 rounded-lg dark:bg-zinc-800/60 dark:border-zinc-700 dark:text-zinc-300 bg-gray-100 border-gray-300 text-gray-800 text-sm max-h-44 overflow-y-auto whitespace-pre-wrap">
              {pendingContent}
            </div>
          )}
          <DialogFooter className="gap-2 flex-wrap">
            <Button onClick={() => setShowDialog(false)} variant="ghost" className="dark:text-zinc-500 text-gray-500">
              Cancel
            </Button>
            <Button onClick={handleAppend} variant="outline" className="dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800 border-gray-300 text-gray-700 hover:bg-gray-100">
              Append
            </Button>
            <Button onClick={handleReplace} className="bg-amber-500 text-zinc-950 hover:bg-amber-400">
              Replace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}