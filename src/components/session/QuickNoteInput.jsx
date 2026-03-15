import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EntityMentionTextarea from '@/components/common/EntityMentionTextarea';

export default function QuickNoteInput({ onSubmit, isSubmitting, placeholder = "Capture a note...", campaignId }) {
  const [content, setContent] = useState('');

  const handleSubmit = () => {
    if (!content.trim()) return;
    onSubmit(content.trim());
    setContent('');
  };

  return (
    <div
      className="relative"
      onKeyDown={(e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          handleSubmit();
        }
      }}
    >
      <EntityMentionTextarea
        value={content}
        onChange={setContent}
        campaignId={campaignId}
        placeholder={placeholder}
        rows={3}
        className="dark:bg-zinc-900/80 dark:border-zinc-800 dark:text-zinc-200 dark:placeholder:text-zinc-600 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 resize-none pr-12"
      />
      <Button
        onClick={handleSubmit}
        disabled={!content.trim() || isSubmitting}
        size="icon"
        className="absolute bottom-3 right-3 h-7 w-7 bg-amber-500 hover:bg-amber-400 text-zinc-950"
      >
        {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
      </Button>
      <p className="text-[10px] dark:text-zinc-500 text-gray-400 mt-1">⌘+Enter to send</p>
    </div>
  );
}