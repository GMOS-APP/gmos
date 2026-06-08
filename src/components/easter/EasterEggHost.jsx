import React, { useEffect, useState } from 'react';
import DeepDelve from './DeepDelve';

// Listens for the global easter-egg event (dispatched by the command palette's
// hidden command) and renders the minigame overlay. Mounted once, app-wide.
export default function EasterEggHost() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onEgg = (e) => { if (!e.detail || e.detail === 'delve') setOpen(true); };
    window.addEventListener('gmos:easter-egg', onEgg);
    return () => window.removeEventListener('gmos:easter-egg', onEgg);
  }, []);

  if (!open) return null;
  return <DeepDelve onClose={() => setOpen(false)} />;
}
