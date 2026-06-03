import React, { createContext, useContext, useRef, useState, useEffect, useCallback } from 'react';

const AudioPlayerContext = createContext(null);
export const useAudioPlayer = () => useContext(AudioPlayerContext);

// Parse a YouTube URL (or raw 11-char id) into { videoId, listId }.
function parseYouTube(input) {
  if (!input) return null;
  const s = input.trim();
  try {
    const url = new URL(s);
    const listId = url.searchParams.get('list');
    let videoId = url.searchParams.get('v');
    if (url.hostname === 'youtu.be') videoId = url.pathname.slice(1) || videoId;
    if (url.pathname.startsWith('/embed/')) videoId = url.pathname.split('/embed/')[1];
    if (videoId || listId) return { videoId: videoId || null, listId: listId || null };
  } catch {
    if (/^[\w-]{11}$/.test(s)) return { videoId: s, listId: null };
  }
  return null;
}

let apiPromise = null;
function loadYouTubeAPI() {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    const prev = window.onYouTubeIframeAPIReady;
    const timer = setTimeout(() => { apiPromise = null; reject(new Error('YouTube API load timed out')); }, 10000);
    window.onYouTubeIframeAPIReady = () => { clearTimeout(timer); if (prev) prev(); resolve(window.YT); };
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.onerror = () => { clearTimeout(timer); apiPromise = null; reject(new Error('Failed to load YouTube API')); };
    document.head.appendChild(tag);
  });
  return apiPromise;
}

// Persistent audio engine. Mounted once above the router so playback survives
// page navigation; the tray UI controls it through this context.
export function AudioPlayerProvider({ children }) {
  const playerRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [hasMedia, setHasMedia] = useState(false);
  const [track, setTrack] = useState(null);
  const [volume, setVolume] = useState(() => {
    const v = Number(typeof localStorage !== 'undefined' && localStorage.getItem('gmos_audio_vol'));
    return Number.isFinite(v) && v > 0 ? v : 60;
  });
  const volumeRef = useRef(volume);
  useEffect(() => { volumeRef.current = volume; }, [volume]);

  // Lazily create the hidden player on first use (avoids loading YT for users
  // who never open the audio app).
  const ensurePlayer = useCallback(async () => {
    if (playerRef.current) return playerRef.current;
    const YT = await loadYouTubeAPI();
    await new Promise((resolve) => {
      playerRef.current = new YT.Player('gmos-yt-audio', {
        height: '0',
        width: '0',
        playerVars: { playsinline: 1 },
        events: {
          onReady: (e) => { e.target.setVolume(volumeRef.current); resolve(); },
          onStateChange: (e) => {
            const PS = window.YT.PlayerState;
            // Ignore BUFFERING/CUED so the play state doesn't flicker mid-playback.
            if (e.data === PS.PLAYING) setPlaying(true);
            else if (e.data === PS.PAUSED || e.data === PS.ENDED) setPlaying(false);
            if (e.data === PS.PLAYING || e.data === PS.PAUSED) {
              const data = playerRef.current?.getVideoData?.();
              if (data?.title) setTrack({ title: data.title });
            }
          },
        },
      });
    });
    return playerRef.current;
  }, []);

  const load = useCallback(async (input) => {
    const parsed = parseYouTube(input);
    if (!parsed) return false;
    let p;
    try { p = await ensurePlayer(); } catch { return false; }
    if (parsed.listId) {
      p.loadPlaylist({ list: parsed.listId, listType: 'playlist', index: 0 });
    } else if (parsed.videoId) {
      p.loadVideoById(parsed.videoId);
    } else {
      return false;
    }
    try { localStorage.setItem('gmos_audio_last', input.trim()); } catch { /* ignore */ }
    setHasMedia(true);
    return true;
  }, [ensurePlayer]);

  const toggle = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (playing) p.pauseVideo(); else p.playVideo();
  }, [playing]);

  const stop = useCallback(() => {
    playerRef.current?.stopVideo?.();
    setPlaying(false);
    setHasMedia(false);
    setTrack(null);
  }, []);

  const changeVolume = useCallback((v) => {
    setVolume(v);
    playerRef.current?.setVolume?.(v);
    try { localStorage.setItem('gmos_audio_vol', String(v)); } catch { /* ignore */ }
  }, []);

  const lastUrl = useCallback(() => {
    try { return localStorage.getItem('gmos_audio_last') || ''; } catch { return ''; }
  }, []);

  const value = { playing, hasMedia, track, volume, load, toggle, stop, setVolume: changeVolume, lastUrl };

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
      <div aria-hidden style={{ position: 'fixed', width: 0, height: 0, overflow: 'hidden', left: '-9999px', top: 0 }}>
        <div id="gmos-yt-audio" />
      </div>
    </AudioPlayerContext.Provider>
  );
}
