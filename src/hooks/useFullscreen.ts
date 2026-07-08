import { useState, useEffect, useCallback } from 'react';

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

  const enter = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen({ navigationUI: 'hide' } as FullscreenOptions);
    } catch {}
    // On Android PWA the Fullscreen API may not trigger fullscreenchange, so attempt
    // orientation lock which can trigger immersive mode on some devices.
    try {
      if ('orientation' in screen && 'lock' in screen.orientation) {
        await screen.orientation.lock('any').catch(() => {});
      }
    } catch {}
  }, []);

  const exit = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch {}
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // Detect fullscreen via display-mode (catches PWA launch in fullscreen)
  useEffect(() => {
    const mq = window.matchMedia('(display-mode: fullscreen)');
    if (mq.matches) setIsFullscreen(true);
    const handler = () => { if (mq.matches) setIsFullscreen(true); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return { isFullscreen, enter, exit };
}
