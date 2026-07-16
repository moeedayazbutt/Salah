import PrayerRow from './PrayerRow';
import WeatherWidget from './WeatherWidget';
import { usePrayerInfoList, useHijriDate, useMoonPosition } from '../../hooks/usePrayerTimes';
import { formatTime } from '../../utils/prayerTimes';
import { useStore } from '../../store';

export default function RightPanel() {
  const settings = useStore((s) => s.settings);
  const prayers = usePrayerInfoList();
  const hijri = useHijriDate();
  const moon = useMoonPosition();
  const setTimeFormat = (fmt: '12h' | '24h') => useStore.getState().updateSettings({ timeFormat: fmt });

  return (
    <div className="flex-[0_0_calc(40%-10px)] min-w-0 flex flex-col right-panel" style={{ gap: '4px' }}>
      {/* Hijri Date Card */}
      <div
        className="relative overflow-hidden rounded-xl flex flex-col justify-center min-h-0"
        style={{
          flex: '0 0 auto',
          padding: '10px 14px',
          background: 'rgba(15, 18, 48, 0.5)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(circle at 70% 20%, rgba(255, 215, 0, 0.04) 0%, transparent 60%)',
        }} />

        <div className="flex items-center justify-between" style={{ gap: 8 }}>
          <div className="flex flex-col min-w-0">
            <span className="font-mono" style={{
              fontSize: 'clamp(1.3rem, 2.9vw, 2.85rem)',
              fontWeight: 300,
              background: 'linear-gradient(135deg, #FFD600 0%, #F59E0B 50%, #14B8A6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: 1.1,
            }}>
              {hijri ? `${hijri.day} ${hijri.monthNameEn} ${hijri.year} AH` : '—'}
            </span>
            <span className="font-ui" style={{ fontSize: 'clamp(0.75rem, 1.1vw, 1.15rem)', color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
              {hijri?.dayNameEn ?? '—'} · Hijri Calendar
            </span>
          </div>

          <div className="flex items-center flex-shrink-0" style={{ gap: 6 }}>
            <div className="rounded-full relative" style={{
              width: 'clamp(26px, 3.5vw, 44px)',
              height: 'clamp(26px, 3.5vw, 44px)',
              background: 'radial-gradient(circle at 35% 35%, #FFD600, #B8860B)',
              boxShadow: '0 0 16px rgba(255, 215, 0, 0.15)',
            }}>
              <div className="rounded-full" style={{
                position: 'absolute', top: '-2px', left: '-4px', width: '88%', height: '88%',
                borderRadius: '50%', background: 'rgba(15, 18, 48, 0.7)',
              }} />
            </div>
            <div className="flex flex-col" style={{ gap: 0 }}>
              <span className="font-ui" style={{ fontSize: 'clamp(0.75rem, 1.1vw, 1.2rem)', color: 'rgba(255,255,255,0.45)', lineHeight: 1.2 }}>
                {moon?.phaseName || '—'}
              </span>
              <span className="font-mono" style={{ fontSize: 'clamp(0.65rem, 1.0vw, 1.05rem)', color: 'rgba(255,255,255,0.28)', lineHeight: 1.2 }}>
                {moon ? `${Math.round(moon.illumination * 100)}%` : ''}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap" style={{ gap: 4, marginTop: 3 }}>
          <span className="font-ui" style={{ fontSize: 'clamp(0.65rem, 1.0vw, 1.0rem)', color: 'rgba(255,255,255,0.3)' }}>
            {settings.timezone.split('/').pop()?.replace('_', ' ') || settings.timezone}
          </span>
        </div>
      </div>

      {/* Prayer List */}
      <div
        className="flex-1 min-h-0 rounded-xl flex flex-col"
        style={{
          padding: '5px 8px',
          background: 'rgba(15, 18, 48, 0.4)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div className="flex justify-between items-center flex-shrink-0" style={{ marginBottom: '2px' }}>
          <span className="font-ui uppercase" style={{ fontSize: 'clamp(0.6rem, 1vw, 1.1rem)', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em' }}>
            Prayer Times
          </span>
          <div className="flex rounded-[4px]" style={{ gap: 0, padding: '1px', background: 'rgba(255,255,255,0.04)' }}>
            {(['12h', '24h'] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setTimeFormat(fmt)}
                className="font-ui border-none cursor-pointer transition-all duration-200"
                style={{
                  fontSize: 'clamp(0.5rem, 0.8vw, 0.9rem)',
                  padding: '1px 5px',
                  borderRadius: 3,
                  background: settings.timeFormat === fmt ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: settings.timeFormat === fmt ? '#FAFAFA' : 'rgba(255,255,255,0.35)',
                }}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 flex flex-col" style={{ gap: '2px' }}>
          {prayers.map((prayer) => (
            <PrayerRow
              key={prayer.key}
              prayer={prayer}
              timeStr={formatTime(prayer.time, settings.timeFormat, settings.timezone)}
            />
          ))}
        </div>
      </div>

      {/* Weather Widget */}
      <WeatherWidget />
    </div>
  );
}
