import PrayerRow from './PrayerRow';
import { usePrayerInfoList, useHijriDate, useMoonPosition } from '../../hooks/usePrayerTimes';
import { formatTime } from '../../utils/prayerTimes';
import { useStore } from '../../store';
import { getForecast } from '../../utils/weatherForecast';
import { useMemo } from 'react';

function WeatherIcon({ condition, size = 14 }: { condition: string; size?: number }) {
  const c = condition === 'sunny' ? '#FFD600' : condition === 'partly-cloudy' ? '#E8C84A' : condition === 'cloudy' ? '#AAA' : '#5B8DEF';
  const labelAr = condition === 'sunny' ? 'مشمس' : condition === 'partly-cloudy' ? 'غائم جزئياً' : condition === 'cloudy' ? 'غائم' : 'ممطر';
  const labelEn = condition === 'sunny' ? 'Sunny' : condition === 'partly-cloudy' ? 'Partly cloudy' : condition === 'cloudy' ? 'Cloudy' : 'Rainy';
  return (
    <svg role="img" aria-label={`${labelEn} · ${labelAr}`} width={size} height={size} viewBox="0 0 40 40">
      <circle cx="20" cy="18" r="7" fill={c} opacity="0.9" />
      {condition === 'sunny' && (
        <g stroke={c} strokeWidth="1.5" opacity="0.5">
          <line x1="20" y1="4" x2="20" y2="8" />
          <line x1="20" y1="28" x2="20" y2="32" />
          <line x1="8" y1="18" x2="12" y2="18" />
          <line x1="28" y1="18" x2="32" y2="18" />
          <line x1="11.5" y1="9.5" x2="14.5" y2="12.5" />
          <line x1="25.5" y1="12.5" x2="28.5" y2="9.5" />
          <line x1="11.5" y1="26.5" x2="14.5" y2="23.5" />
          <line x1="25.5" y1="23.5" x2="28.5" y2="26.5" />
        </g>
      )}
      {condition === 'partly-cloudy' && (
        <>
          <g stroke={c} strokeWidth="1.2" opacity="0.4">
            <line x1="20" y1="6" x2="20" y2="9" />
            <line x1="10" y1="18" x2="13" y2="18" />
            <line x1="27" y1="18" x2="30" y2="18" />
          </g>
          <ellipse cx="28" cy="22" rx="10" ry="5" fill="rgba(255,255,255,0.2)" />
        </>
      )}
      {condition === 'cloudy' && (
        <ellipse cx="28" cy="22" rx="12" ry="5" fill="rgba(255,255,255,0.25)" />
      )}
      {condition === 'rainy' && (
        <>
          <ellipse cx="28" cy="22" rx="12" ry="5" fill="rgba(255,255,255,0.25)" />
          <g stroke="#5B8DEF" strokeWidth="1.5" opacity="0.6">
            <line x1="24" y1="28" x2="22" y2="34" />
            <line x1="28" y1="28" x2="26" y2="34" />
            <line x1="32" y1="28" x2="30" y2="34" />
          </g>
        </>
      )}
      <ellipse cx="24" cy="30" rx="12" ry="5" fill="rgba(255,255,255,0.05)" />
    </svg>
  );
}

function WeatherWidget({ forecast }: { forecast: ReturnType<typeof getForecast> }) {
  const today = forecast[0];
  const tempBase = today?.high ?? 22;
  const feelsTemp = Math.round(tempBase + (tempBase > 30 ? -3 : 2) + Math.sin(tempBase * 0.4) * 3);
  const humidity = Math.round(25 + Math.sin(tempBase * 0.7 + 2) * 20 + Math.cos(tempBase * 0.3) * 10);
  const windSpeed = Math.round(4 + Math.sin(tempBase * 0.5 + 4) * 8 + Math.cos(tempBase * 0.8) * 5);
  const settings = useStore((s) => s.settings);
  return (
    <div
      className="min-h-0 rounded-xl flex flex-col"
      style={{
        flex: '0.7 1 0%',
        padding: '4px 8px',
        background: 'rgba(15, 18, 48, 0.4)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      <div className="flex items-center justify-between flex-shrink-0" style={{ marginBottom: '2px' }}>
        <div className="flex items-center" style={{ gap: '5px' }}>
          <WeatherIcon condition={today?.condition.icon ?? 'sunny'} size={22} />
          <div className="flex items-start">
            <span className="font-mono font-medium leading-none text-white" style={{ fontSize: 'clamp(1rem, 2vw, 2.2rem)' }}>
              {tempBase}
            </span>
            <span className="font-ui" style={{ fontSize: 'clamp(0.6rem, 0.9vw, 1rem)', color: 'rgba(255,255,255,0.25)' }}>°C</span>
          </div>
          <span className="font-ui" style={{ fontSize: 'clamp(0.65rem, 0.9vw, 1rem)', color: 'rgba(255,255,255,0.4)' }}>
            {today?.condition.en ?? 'Clear'} · {today?.condition.ar ?? 'صافية'}
          </span>
        </div>
        <div className="flex items-center" style={{ gap: '4px' }}>
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span className="font-ui" style={{ fontSize: 'clamp(0.45rem, 0.7vw, 0.8rem)', color: 'rgba(255,255,255,0.45)' }}>
            {settings.coordinates.latitude !== 0 || settings.coordinates.longitude !== 0
              ? `${Math.abs(settings.coordinates.latitude).toFixed(1)}°${settings.coordinates.latitude >= 0 ? 'N' : 'S'}, ${Math.abs(settings.coordinates.longitude).toFixed(1)}°${settings.coordinates.longitude >= 0 ? 'E' : 'W'}`
              : 'No location'}
          </span>
        </div>
      </div>
      <div className="flex-shrink-0" style={{ marginBottom: '3px' }}>
        <span className="font-ui" style={{ fontSize: 'clamp(0.65rem, 0.8vw, 0.85rem)', color: 'rgba(255,255,255,0.35)' }}>
          Feels·يشعر {feelsTemp}° · Hum·الرطوبة {humidity}% · Wind·الرياح {windSpeed}km/h
        </span>
      </div>
      <div className="flex-1 min-h-0 flex items-center overflow-x-auto" style={{ gap: '1px' }}>
        {forecast.map((day, i) => (
          <div key={day.date.toISOString()} className="flex flex-col items-center flex-shrink-0" style={{ minWidth: 'clamp(36px, 6vw, 60px)', padding: '1px 2px' }}>
            <span className="font-ui" style={{ fontSize: 'clamp(0.6rem, 0.75vw, 0.85rem)', color: i === 0 ? 'rgba(255,215,0,0.7)' : 'rgba(255,255,255,0.4)', marginBottom: '2px' }}>
              {i === 0 ? 'Today' : day.dayNameEn.slice(0, 3)}
            </span>
            <WeatherIcon condition={day.condition.icon} size={i === 0 ? 16 : 13} />
            <span className="font-mono" style={{ fontSize: 'clamp(0.65rem, 0.8vw, 0.9rem)', color: 'rgba(255,255,255,0.6)', lineHeight: 1.2 }}>
              {day.high}°
            </span>
            <span className="font-mono" style={{ fontSize: 'clamp(0.55rem, 0.7vw, 0.8rem)', color: 'rgba(255,255,255,0.35)', lineHeight: 1.2 }}>
              {day.low}°
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RightPanel() {
  const settings = useStore((s) => s.settings);
  const forecast = useMemo(() => getForecast(settings.coordinates.latitude, settings.coordinates.longitude), [settings.coordinates.latitude, settings.coordinates.longitude]);
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
          flex: '0.7 1 0%',
          padding: '10px 14px',
          background: 'rgba(15, 18, 48, 0.5)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.3), 0 0 60px rgba(255, 215, 0, 0.04)',
        }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(circle at 70% 20%, rgba(255, 215, 0, 0.04) 0%, transparent 60%)',
        }} />

        <div className="flex items-center justify-between" style={{ marginBottom: 1 }}>
          <div className="flex flex-col">
            <span className="font-arabic leading-tight" style={{
              fontSize: 'clamp(1.5rem, 4vw, 4rem)',
              background: 'linear-gradient(135deg, #FFD600 0%, #F59E0B 50%, #14B8A6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 30px rgba(245, 158, 11, 0.15))',
            }}>
              {hijri
                ? `${String(hijri.year).padStart(4, '0')}/${String(hijri.month).padStart(2, '0')}/${String(hijri.day).padStart(2, '0')}`
                : '—'}
            </span>
            <span className="font-ui" style={{ fontSize: 'clamp(0.6rem, 1vw, 1.2rem)', color: 'rgba(255,255,255,0.35)' }}>
              Hijri · هجري
            </span>
          </div>

          <div className="flex items-center" style={{ gap: '4px' }}>
            <div className="rounded-full flex-shrink-0 relative" style={{
              width: 'clamp(26px, 4vw, 50px)',
              height: 'clamp(26px, 4vw, 50px)',
              background: 'radial-gradient(circle at 35% 35%, #FFD600, #B8860B)',
              boxShadow: '0 0 20px rgba(255, 215, 0, 0.15)',
            }}>
              <div className="rounded-full" style={{
                position: 'absolute', top: '-2px', left: '-4px', width: '88%', height: '88%',
                borderRadius: '50%', background: 'rgba(15, 18, 48, 0.7)',
              }} />
            </div>
            <span className="font-ui" style={{ fontSize: 'clamp(0.6rem, 1.2vw, 1.4rem)', color: 'rgba(255,255,255,0.35)', lineHeight: 1.1 }}>
              {moon?.phaseName || '—'}<br />
              {moon ? `${Math.round(moon.illumination * 100)}%` : ''}
            </span>
          </div>
        </div>

        <div className="flex items-center" style={{ gap: '4px', flexWrap: 'wrap' }}>
            <span dir="rtl" lang="ar" className="font-arabic" style={{ fontSize: 'clamp(0.9rem, 1.6vw, 2rem)', color: 'rgba(255,255,255,0.65)' }}>
              {hijri?.dayNameAr || '—'}
            </span>
            <span className="font-ui" style={{ fontSize: 'clamp(0.6rem, 1vw, 1.2rem)', color: 'rgba(255,255,255,0.4)' }}>
              {hijri?.dayNameEn || '—'}
            </span>
            <span style={{ width: 2, height: 2, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }} />
            <span className="font-ui" style={{ fontSize: 'clamp(0.6rem, 1vw, 1.2rem)', color: 'rgba(255,255,255,0.4)' }}>
              {hijri ? `${hijri.day} ${hijri.monthNameEn} ${hijri.year} AH` : '—'}
            </span>
            <span style={{ width: 2, height: 2, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }} />
            <span className="font-ui" style={{ fontSize: 'clamp(0.5rem, 0.8vw, 0.9rem)', color: 'rgba(255,255,255,0.3)' }}>
              {settings.timezone.split('/').pop() || settings.timezone}
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
          <span className="font-ui uppercase" style={{ fontSize: 'clamp(0.6rem, 1vw, 1.2rem)', color: 'rgba(255,255,255,0.45)' }}>
            Prayer Times · أوقات الصلاة
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

      {/* Weather Card */}
      <WeatherWidget forecast={forecast} />
    </div>
  );
}