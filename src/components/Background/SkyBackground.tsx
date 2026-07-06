import { useMemo } from 'react';
import { useSkyPhase } from '../../hooks/usePrayerTimes';
import { useStore } from '../../store';
import { calculateSunPosition, determineSkyPhase } from '../../utils/skyEngine';

function SkyBackground() {
  const phase = useSkyPhase();
  const skyDisplayHours = useStore((s) => s.skyDisplayHours);
  const skySliderAuto = useStore((s) => s.skySliderAuto);
  const aodMode = useStore((s) => s.aodMode);
  const settings = useStore((s) => s.settings);

  const displayGradient = useMemo(() => {
    if (aodMode) return '#000000';
    if (!skySliderAuto && skyDisplayHours !== null) {
      const now = new Date();
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const h = Math.floor(skyDisplayHours);
      const m = Math.round((skyDisplayHours - h) * 60);
      d.setHours(h, m, 0, 0);
      const lat = settings.coordinates.latitude || 25;
      const lon = settings.coordinates.longitude || 45;
      const pos = calculateSunPosition(d, lat, lon);
      return determineSkyPhase(pos.elevation, pos.azimuth).gradient;
    }
    return phase?.gradient ?? 'linear-gradient(180deg, #080A1A 0%, #0E1230 25%, #151A3A 60%, #1A1F3E 100%)';
  }, [phase, skyDisplayHours, skySliderAuto, aodMode, settings.coordinates]);

  return (
    <div
      className="absolute inset-0 z-0 overflow-hidden sky-bg"
      style={{ background: displayGradient, transition: 'background 1.2s ease-in-out' }}
    />
  );
}

export default SkyBackground;
