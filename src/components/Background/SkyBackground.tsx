import { useState, useEffect, useRef, useMemo } from 'react';
import { useSkyPhase } from '../../hooks/usePrayerTimes';
import { useStore } from '../../store';
import { calculateSunPosition, determineSkyPhase } from '../../utils/skyEngine';

const DEFAULT_GRADIENT = 'linear-gradient(180deg, #080A1A 0%, #0E1230 25%, #151A3A 60%, #1A1F3E 100%)';

function SkyBackground() {
  const phase = useSkyPhase();
  const skyDisplayHours = useStore((s) => s.skyDisplayHours);
  const skySliderAuto = useStore((s) => s.skySliderAuto);
  const aodMode = useStore((s) => s.aodMode);
  const settings = useStore((s) => s.settings);

  const targetGradient = useMemo(() => {
    if (aodMode) return '#000000';
    if (!skySliderAuto && skyDisplayHours !== null) {
      const now = new Date();
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      d.setHours(Math.floor(skyDisplayHours), Math.round((skyDisplayHours % 1) * 60), 0, 0);
      const lat = settings.coordinates.latitude || 25;
      const lon = settings.coordinates.longitude || 45;
      const pos = calculateSunPosition(d, lat, lon);
      return determineSkyPhase(pos.elevation, pos.azimuth).gradient;
    }
    return phase?.gradient ?? DEFAULT_GRADIENT;
  }, [phase, skyDisplayHours, skySliderAuto, aodMode, settings.coordinates]);

  const [layerA, setLayerA] = useState(targetGradient);
  const [layerB, setLayerB] = useState(targetGradient);
  const [active, setActive] = useState<'a' | 'b'>('a');
  const prevRef = useRef(targetGradient);

  useEffect(() => {
    if (targetGradient === prevRef.current) return;
    prevRef.current = targetGradient;
    if (active === 'a') {
      setLayerB(targetGradient);
      setActive('b');
    } else {
      setLayerA(targetGradient);
      setActive('a');
    }
  }, [targetGradient, active]);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden sky-bg">
      <div style={{
        position: 'absolute', inset: 0,
        background: layerA,
        opacity: active === 'a' ? 1 : 0,
        transition: 'opacity 2s cubic-bezier(0.4,0,0.2,1)',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: layerB,
        opacity: active === 'b' ? 1 : 0,
        transition: 'opacity 2s cubic-bezier(0.4,0,0.2,1)',
      }} />
    </div>
  );
}

export default SkyBackground;
