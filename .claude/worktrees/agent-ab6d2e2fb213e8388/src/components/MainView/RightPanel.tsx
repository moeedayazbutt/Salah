import PrayerRow from './PrayerRow';
import WeatherWidget from './WeatherWidget';
import { usePrayerInfoList, useHijriDate, useMoonPosition } from '../../hooks/usePrayerTimes';
import { formatTime } from '../../utils/prayerTimes';
import { useStore } from '../../store';

export default function RightPanel() {
  const settings = useStore((s) => s.settings);
  const aodMode = useStore((s) => s.aodMode);
  const prayers = usePrayerInfoList();
  const hijri = useHijriDate();
  const moon = useMoonPosition();
  const setTimeFormat = (fmt: '12h' | '24h') => useStore.getState().updateSettings({ timeFormat: fmt });

  const card: React.CSSProperties = {
    background: aodMode ? 'rgba(255,255,255,0.04)' : 'rgba(12,15,45,0.50)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: `1px solid ${aodMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.07)'}`,
    borderRadius: 16,
  };

  const textHigh = 'rgba(255,255,255,0.88)';
  const textMed  = 'rgba(255,255,255,0.55)';
  const textLow  = 'rgba(255,255,255,0.32)';

  return (
    <div className="right-panel min-w-0 flex flex-col" style={{ flex: '0 0 calc(42% - 6px)', gap: 6 }}>

      {/* ── Hijri Date + Moon ─────────────────────────── */}
      <div style={{ ...card, padding: '10px 14px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{
              fontFamily: 'Roboto Mono, monospace',
              fontWeight: 300,
              fontSize: 'clamp(1.3rem, 3vw, 2.6rem)',
              color: aodMode ? 'rgba(255,255,255,0.85)' : undefined,
              background: aodMode ? undefined : 'linear-gradient(135deg, #FFD600 0%, #F59E0B 50%, #14B8A6 100%)',
              WebkitBackgroundClip: aodMode ? undefined : 'text',
              WebkitTextFillColor: aodMode ? undefined : 'transparent',
              backgroundClip: aodMode ? undefined : 'text',
              lineHeight: 1.1,
            }}>
              {hijri ? `${hijri.day} ${hijri.monthNameEn} ${hijri.year}` : '—'}
            </div>
            <div style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 400, fontSize: 12, color: textLow, marginTop: 2 }}>
              {hijri?.dayNameEn || '—'} · {hijri ? `${hijri.year} AH` : ''} · {settings.timezone.split('/').pop()}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 'clamp(24px, 3.5vw, 44px)',
              height: 'clamp(24px, 3.5vw, 44px)',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, #FFD600, #B8860B)',
              boxShadow: '0 0 16px rgba(255,215,0,0.14)',
              position: 'relative',
              flexShrink: 0,
            }}>
              <div style={{ position: 'absolute', top: '-2px', left: '-4px', width: '88%', height: '88%', borderRadius: '50%', background: aodMode ? '#000' : 'rgba(12,15,45,0.75)' }} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 500, fontSize: 13, color: textMed, lineHeight: 1.2 }}>
                {moon?.phaseName || '—'}
              </div>
              <div style={{ fontFamily: 'Roboto Mono, monospace', fontWeight: 400, fontSize: 12, color: textLow }}>
                {moon ? `${Math.round(moon.illumination * 100)}%` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Prayer Times ──────────────────────────────── */}
      <div style={{ ...card, padding: '8px 10px', flex: '1 1 0', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexShrink: 0 }}>
          <span style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 500, fontSize: 11, color: textLow, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Prayer Times
          </span>
          <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', background: 'rgba(255,255,255,0.05)' }}>
            {(['12h', '24h'] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setTimeFormat(fmt)}
                style={{
                  fontFamily: 'Roboto, sans-serif',
                  fontWeight: 500,
                  fontSize: 11,
                  padding: '3px 8px',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: 5,
                  background: settings.timeFormat === fmt ? 'rgba(255,255,255,0.12)' : 'transparent',
                  color: settings.timeFormat === fmt ? '#FAFAFA' : 'rgba(255,255,255,0.38)',
                  transition: 'all 0.15s',
                }}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {prayers.map((prayer) => (
            <PrayerRow
              key={prayer.key}
              prayer={prayer}
              timeStr={formatTime(prayer.time, settings.timeFormat, settings.timezone)}
              aodMode={aodMode}
            />
          ))}
        </div>
      </div>

      {/* ── Weather ───────────────────────────────────── */}
      <WeatherWidget />

    </div>
  );
}
