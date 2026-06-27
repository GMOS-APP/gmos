import React, { useEffect, useState } from 'react';

// A thin fixed bar at the top of the viewport that fills as the reader scrolls
// through the article. Purely decorative; reflects document scroll progress.
export default function ReadingProgress() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      setPct(max > 0 ? Math.min(100, (el.scrollTop / max) * 100) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-30 h-0.5 bg-transparent" aria-hidden>
      <div className="h-full bg-amber-500 transition-[width] duration-150 ease-out" style={{ width: `${pct}%` }} />
    </div>
  );
}
