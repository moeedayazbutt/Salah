import { useEffect } from 'react';
import { useStore } from '../store';

/** True when `now` falls inside a [start,end] HH:MM window (handles midnight wrap). */
function withinWindow(now: Date, start: string, end: string): boolean {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return false;
  const cur = now.getHours() * 60 + now.getMinutes();
  const s = sh * 60 + sm;
  const e = eh * 60 + em;
  if (s === e) return false;
  return s < e ? cur >= s && cur < e : cur >= s || cur < e;
}

/**
 * Auto-toggles AOD ("night mode") based on the user's schedule:
 *  - 'fixed'          → between the configured start/end times
 *  - 'sunsetSunrise'  → whenever the sun is below the horizon
 * Re-evaluated every 30s. Does nothing (leaves AOD to manual control) when disabled.
 */
export function useAutoNightMode() {
  const autoNightMode = useStore((s) => s.settings.autoNightMode);

  useEffect(() => {
    if (!autoNightMode?.enabled) return;

    const evaluate = () => {
      const st = useStore.getState();
      const night =
        autoNightMode.mode === 'sunsetSunrise'
          ? (st.solarPosition?.elevation ?? 0) < 0
          : withinWindow(new Date(), autoNightMode.start, autoNightMode.end);
      if (st.aodMode !== night) st.setAodMode(night);
    };

    evaluate();
    const id = setInterval(evaluate, 30000);
    return () => clearInterval(id);
  }, [autoNightMode]);
}
