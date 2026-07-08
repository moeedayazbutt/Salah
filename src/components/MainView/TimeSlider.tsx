import { useMemo } from 'react';
import { useStore } from '../../store';
import { calculateSunPosition, determineSkyPhase } from '../../utils/skyEngine';

export default function TimeSlider() {
  const skyDisplayHours = useStore((s) => s.skyDisplayHours);
  const skySliderAuto = useStore((s) => s.skySliderAuto);
  const setSkyDisplayHours = useStore((s) => s.setSkyDisplayHours);
  const setSkySliderAuto = useStore((s) => s.setSkySliderAuto);
  const setSkySliderDragging = useStore((s) => s.setSkySliderDragging);
  const aodMode = useStore((s) => s.aodMode);
  const settings = useStore((s) => s.settings);

  const now = new Date();
  const realHours = now.getHours() + now.getMinutes() / 60;
  const currentValue = skySliderAuto ? realHours : (skyDisplayHours ?? realHours);

  const trackGradient = useMemo(() => {
    const lat = settings.coordinates.latitude || 25;
    const lon = settings.coordinates.longitude || 45;
    const stops: string[] = [];
    for (let h = 0; h <= 24; h += 3) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, 0, 0);
      const pos = calculateSunPosition(d, lat, lon);
      const phase = determineSkyPhase(pos.elevation, pos.azimuth);
      const match = phase.gradient.match(/#[0-9a-fA-F]{6}/);
      const color = match ? match[0] : '#080A1A';
      stops.push(`${color} ${Math.round(h / 24 * 100)}%`);
    }
    return `linear-gradient(90deg, ${stops.join(', ')})`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.coordinates]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSkySliderAuto(false);
    setSkyDisplayHours(parseFloat(e.target.value));
  };

  const handleAuto = () => {
    setSkySliderAuto(true);
    setSkyDisplayHours(null);
  };

  const h = Math.floor(currentValue);
  const m = Math.round((currentValue - h) * 60);
  const h12 = h % 12 || 12;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const timeLabel = `${h12}:${String(m).padStart(2, '0')} ${ampm}`;

  if (aodMode) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-10 flex items-center"
      style={{
        height: 52,
        padding: '0 14px',
        gap: 10,
        background: 'rgba(8,10,26,0.65)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
      <span
        className="font-mono"
        style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', minWidth: 58, textAlign: 'right', letterSpacing: '0.05em' }}
      >
        {timeLabel}
      </span>
      <input
        type="range"
        min={0}
        max={24}
        step={0.25}
        value={currentValue}
        onChange={handleChange}
        onMouseDown={() => setSkySliderDragging(true)}
        onMouseUp={() => setSkySliderDragging(false)}
        onTouchStart={() => setSkySliderDragging(true)}
        onTouchEnd={() => setSkySliderDragging(false)}
        onBlur={() => setSkySliderDragging(false)}
        className="time-slider flex-1"
        style={{ background: trackGradient }}
        aria-label="Time of day sky preview"
      />
      <button
        onClick={handleAuto}
        className="font-ui border-none cursor-pointer transition-all duration-200"
        style={{
          fontSize: '0.7rem',
          padding: '5px 12px',
          borderRadius: 20,
          background: skySliderAuto ? 'rgba(245,158,11,0.18)' : 'rgba(255,255,255,0.06)',
          color: skySliderAuto ? '#F59E0B' : 'rgba(255,255,255,0.4)',
          border: `1px solid ${skySliderAuto ? 'rgba(245,158,11,0.35)' : 'rgba(255,255,255,0.1)'}`,
          letterSpacing: '0.08em',
          minWidth: 52,
          fontWeight: 500,
        }}
        aria-label="Auto-sync slider to current time"
        aria-pressed={skySliderAuto}
      >
        AUTO
      </button>
    </div>
  );
}
