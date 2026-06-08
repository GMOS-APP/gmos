import React from 'react';

// Suspense fallback for lazy-loaded pages. Minimal + centered so it reads as a
// brief loading beat, not a layout shift.
export default function PageLoader() {
  return (
    <div className="h-full min-h-[200px] w-full flex items-center justify-center">
      <div className="w-7 h-7 border-[3px] border-zinc-300 dark:border-zinc-800 border-t-amber-500 rounded-full animate-spin" />
    </div>
  );
}
