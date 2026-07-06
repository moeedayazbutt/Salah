import { useEffect, useCallback } from 'react';
import { useStore } from '../../store';

function formatHourLabel(h: number): string {
  const hour = Math.floor(h) % 24;
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
}

// Approximate sky colors at each hour for the gradient track
const SKY_TRACK_GRADIENT =
  'linear-gradient(to right,' +
  '#060810 0%,' +   // 0:00 night
  '#0A0D1E 17%,' +  // 4:00 deep night
  '#3D2060 21%,' +  // 5:00 pre-dawn
  '#9A5040 25%,' +  // 6:00 sunrise
  '#C8A060 29%,' +  // 7:00 morning gold
  '#5AAEE0 38%,' +  // 9:00 morning blue
  '#2880C0 50%,' +  // 12:00 midday
  '#3898D8 62%,' +  // 15:00 afternoon
  '#D07030 71%,' +  // 17:00 sunset approach
  '#B02020 75%,' +  // 18:00 sunset
  '#501058 79%,' +  // 19:00 maghrib
  '#200828 83%,' +  // 20:00 dusk
  '#060810 92%,' +  // 22:00 night
  '#060810 100%' +  // 24:00 night
  ')';

export default function TimeSlider() {
  const skyDisplayHours = useStore((s) => s.skyDisplayHours);
  const setSkyDisplayHours = useStore((s) => s.setSkyDisplayHours);
  const skySliderAuto = useStore((s) => s.skySliderAuto);
  const setSkySliderAuto = useStore((s) => s.setSkySliderAuto);
  const aodMode = useStore((s) => s.aodMode);

  const getRealHours = useCallback(() => {
    const n = new Date();
    return n.getHours() + n.getMinutes() / 60 + n.getSeconds() / 3600;
  }, []);

  // In auto mode, keep the display hours in sync with real time
  useEffect(() => {
    if (!skySliderAuto) return;
    setSkyDisplayHours(getRealHours());
    const id = setInterval(() => setSkyDisplayHours(getRealHours()), 10000);
    return () => clearInterval(id);
  }, [skySliderAuto, setSkyDisplayHours, getRealHours]);

  const displayHours = skyDisplayHours ?? getRealHours();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSkySliderAuto(false);
    setSkyDisplayHours(parseFloat(e.target.value));
  };

  const handleAutoClick = () => {
    setSkySliderAuto(true);
    setSkyDisplayHours(getRealHours());
  };

  const pct = (displayHours / 24) * 100;

  return (
    <div
      style={{
        flexShrink: 0,
        height: 52,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 16px',
        background: aodMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.35)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: `1px solid ${aodMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.06)'}`,
      }}
    >
      {/* Moon icon */}
      <span style={{ fontSize: 14, opacity: 0.5, flexShrink: 0 }}>🌙</span>

      {/* Slider + labels */}
      <div style={{ flex: 1, position: 'relative' }}>
        <input
          type="range"
          min="0"
          max="24"
          step="0.1"
          value={displayHours}
          onChange={handleChange}
          className="time-slider-track"
          style={{
            background: SKY_TRACK_GRADIENT,
            width: '100%',
            display: 'block',
          }}
        />
        {/* Time label above thumb */}
        <div
          style={{
            position: 'absolute',
            top: -18,
            left: `clamp(20px, ${pct}%, calc(100% - 30px))`,
            transform: 'translateX(-50%)',
            fontSize: 11,
            fontFamily: 'Roboto, sans-serif',
            fontWeight: 500,
            color: 'rgba(255,255,255,0.7)',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          {formatHourLabel(displayHours)}
        </div>
      </div>

      {/* Sun icon */}
      <span style={{ fontSize: 14, opacity: 0.5, flexShrink: 0 }}>☀️</span>

      {/* Auto button */}
      <button
        onClick={handleAutoClick}
        title="Sync to current time"
        style={{
          flexShrink: 0,
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: `1px solid ${skySliderAuto ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.15)'}`,
          background: skySliderAuto ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.05)',
          color: skySliderAuto ? 'rgba(245,158,11,0.9)' : 'rgba(255,255,255,0.5)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
        }}
      >
        ⏱
      </button>
    </div>
  );
}
