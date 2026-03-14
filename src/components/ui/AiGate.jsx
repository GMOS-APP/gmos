import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

export default function AiGate({ children }) {
  const { isPlus } = useAuth();
  const [showModal, setShowModal] = useState(false);

  if (isPlus) return children;

  const child = React.Children.only(children);
  const childClassName = child.props.className || '';
  const isFullWidth = childClassName.includes('w-full');

  const gatedChild = React.cloneElement(child, {
    onClick: () => setShowModal(true),
    className: `${childClassName} opacity-60`.trim(),
  });

  return (
    <>
      <span className={`relative inline-flex${isFullWidth ? ' w-full' : ''}`}>
        {gatedChild}
        <span className="absolute -top-1 -right-1 text-[9px] text-amber-400 font-bold leading-none pointer-events-none z-10 select-none">✦</span>
      </span>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-sm dark:bg-zinc-900 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 dark:text-zinc-100 text-gray-900">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Unlock GM/OS+
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm dark:text-zinc-400 text-gray-600">
              AI features are part of <span className="text-amber-400 font-semibold">GM/OS+</span>. Upgrade to generate content, build NPCs, auto-write session recaps, and more.
            </p>
            <ul className="text-xs dark:text-zinc-500 text-gray-500 space-y-1">
              <li>✦ AI content generation for all entities</li>
              <li>✦ Session debrief &amp; auto-summaries</li>
              <li>✦ NPC builder with AI fields</li>
              <li>✦ Prep tab AI assistance</li>
            </ul>
            <Button
              disabled
              className="w-full bg-amber-500/40 text-zinc-950 dark:text-zinc-900 font-semibold cursor-not-allowed opacity-70"
            >
              Coming Soon
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
