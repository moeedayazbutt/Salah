import { memo, useMemo, useState, useEffect } from 'react';
import {
  useCurrentPrayer, useNextPrayer, useTimeUntilNext,
  useSkyPhase, useSolarPosition, useMoonPosition, usePrayerInfoList, useHijriDate,
} from '../../hooks/usePrayerTimes';
import { useStore } from '../../store';
import { calculateSunPosition, determineSkyPhase } from '../../utils/skyEngine';
import { getHourlyForecast } from '../../utils/weatherForecast';
import { formatTime } from '../../utils/prayerTimes';

/* ── Stars ─────────────────────────────────────────── */
function seededArr(seed: number, count: number) {
  let s = seed;
  const r = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  return Array.from({ length: count }, () => ({
    left: `${r() * 100}%`, top: `${r() * 80}%`,
    delay: `${r() * 8}s`, dur: `${2 + r() * 5}s`,
    size: `${0.6 + r() * 2.2}px`, op: 0.3 + r() * 0.7,
  }));
}
const STARS = seededArr(20250707, 120);
const Star = memo(({ style }: { style: React.CSSProperties }) => (
  <div className="absolute rounded-full bg-white" style={style} />
));

/* ── Moon craters ───────────────────────────────────── */
const MoonCraters = () => (
  <>
    <div style={{ width: '16%', height: '16%', top: '22%', left: '42%', background: 'rgba(200,180,100,0.15)', borderRadius: '50%', position: 'absolute' }} />
    <div style={{ width: '11%', height: '11%', top: '48%', left: '28%', background: 'rgba(200,180,100,0.12)', borderRadius: '50%', position: 'absolute' }} />
    <div style={{ width: '9%',  height: '9%',  top: '16%', left: '60%', background: 'rgba(200,180,100,0.1)',  borderRadius: '50%', position: 'absolute' }} />
    <div style={{ width: '7%',  height: '7%',  top: '60%', left: '50%', background: 'rgba(200,180,100,0.08)', borderRadius: '50%', position: 'absolute' }} />
  </>
);

/* ── Clouds ─────────────────────────────────────────── */
function Clouds() {
  const s: React.CSSProperties = { position: 'absolute', borderRadius: '50%', filter: 'blur(14px)', pointerEvents: 'none' };
  return (
    <div className="absolute inset-x-0" style={{ bottom: '8%', height: '22%', pointerEvents: 'none' }}>
      <div style={{ ...s, width: '28%', height: '38%', left: '6%',  bottom: '20%', background: 'rgba(255,255,255,0.03)' }} />
      <div style={{ ...s, width: '22%', height: '30%', left: '30%', bottom: '30%', background: 'rgba(255,255,255,0.025)' }} />
      <div style={{ ...s, width: '32%', height: '44%', right: '8%', bottom: '14%', background: 'rgba(255,255,255,0.035)' }} />
      <div style={{ ...s, width: '18%', height: '26%', left: '52%', bottom: '8%',  background: 'rgba(255,255,255,0.02)' }} />
    </div>
  );
}

/* ── Weather icon ───────────────────────────────────── */
function WeatherIcon({ condition, size = 22 }: { condition: string; size?: number }) {
  const c = condition === 'sunny' ? '#FFD600'
    : condition === 'partly-cloudy' ? '#E8C84A'
    : condition === 'cloudy' ? '#9CA3AF'
    : '#60A5FA';
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="18" r="7" fill={c} opacity="0.9" />
      {condition === 'sunny' && (
        <g stroke={c} strokeWidth="1.5" opacity="0.5">
          <line x1="20" y1="4" x2="20" y2="8" /><line x1="20" y1="28" x2="20" y2="32" />
          <line x1="8"  y1="18" x2="12" y2="18" /><line x1="28" y1="18" x2="32" y2="18" />
          <line x1="11.5" y1="9.5"  x2="14.5" y2="12.5" /><line x1="25.5" y1="12.5" x2="28.5" y2="9.5" />
          <line x1="11.5" y1="26.5" x2="14.5" y2="23.5" /><line x1="25.5" y1="23.5" x2="28.5" y2="26.5" />
        </g>
      )}
      {condition === 'partly-cloudy' && (
        <><g stroke={c} strokeWidth="1.2" opacity="0.4"><line x1="20" y1="6" x2="20" y2="9" /><line x1="10" y1="18" x2="13" y2="18" /><line x1="27" y1="18" x2="30" y2="18" /></g>
          <ellipse cx="28" cy="22" rx="10" ry="5" fill="rgba(255,255,255,0.22)" /></>
      )}
      {condition === 'cloudy' && <ellipse cx="26" cy="22" rx="13" ry="6" fill="rgba(255,255,255,0.28)" />}
      {condition === 'rainy' && (
        <><ellipse cx="26" cy="20" rx="12" ry="5.5" fill="rgba(255,255,255,0.22)" />
          <g stroke="#60A5FA" strokeWidth="1.5" opacity="0.7" strokeLinecap="round">
            <line x1="22" y1="28" x2="20" y2="34" /><line x1="27" y1="28" x2="25" y2="34" /><line x1="32" y1="28" x2="30" y2="34" />
          </g></>
      )}
    </svg>
  );
}

/* ── Main component ─────────────────────────────────── */
export default function NextPrayerTimer() {
  const currentPrayer = useCurrentPrayer();
  const nextPrayer    = useNextPrayer();
  const countdown     = useTimeUntilNext();
  const phase         = useSkyPhase();
  const solarPos      = useSolarPosition();
  const moonPos       = useMoonPosition();
  const prayers       = usePrayerInfoList();
  const hijri         = useHijriDate();
  const settings      = useStore((s) => s.settings);
  const skyDisplayHours = useStore((s) => s.skyDisplayHours);
  const skySliderAuto   = useStore((s) => s.skySliderAuto);
  useStore((s) => s.aodMode); // consumed by CSS class on root

  /* Live clock */
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  /* Slider-aware sun position */
  const displayPos = useMemo(() => {
    if (!skySliderAuto && skyDisplayHours !== null) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      d.setHours(Math.floor(skyDisplayHours), Math.round((skyDisplayHours % 1) * 60), 0, 0);
      const lat = settings.coordinates.latitude || 25;
      const lon = settings.coordinates.longitude || 45;
      return calculateSunPosition(d, lat, lon);
    }
    return solarPos ?? { elevation: -30, azimuth: 90 };
  }, [skyDisplayHours, skySliderAuto, solarPos, settings.coordinates, now]);

  const elevation  = displayPos.elevation;
  const azimuth    = displayPos.azimuth;
  const isNight    = elevation < 0;
  const displayPhase = useMemo(() => {
    if (!skySliderAuto && skyDisplayHours !== null) {
      return determineSkyPhase(elevation, azimuth);
    }
    return phase;
  }, [skySliderAuto, skyDisplayHours, elevation, azimuth, phase]);

  const gradient = displayPhase?.gradient ?? 'linear-gradient(180deg, #080A1A 0%, #0E1230 25%, #151A3A 60%, #1A1F3E 100%)';

  /* Hourly weather — follows slider hour */
  const sliderHour = (!skySliderAuto && skyDisplayHours !== null) ? Math.floor(skyDisplayHours) : undefined;
  const hourly = useMemo(
    () => getHourlyForecast(settings.coordinates.latitude, settings.coordinates.longitude, sliderHour),
    [settings.coordinates.latitude, settings.coordinates.longitude, sliderHour],
  );

  /* Sun/moon sizing */
  const bodySize = typeof window !== 'undefined' ? Math.max(45, Math.min(80, window.innerWidth * 0.05)) : 60;

  /* Sun position on screen */
  const sunTop   = `${Math.min(58, Math.max(4, 58 - elevation * 0.75))}%`;
  const sunLeft  = azimuth < 180
    ? `${8 + (azimuth / 180) * 40}%`
    : `${48 + ((azimuth - 180) / 180) * 40}%`;

  /* Moon position */
  const moonPct   = Math.max(0, Math.min(100, ((elevation + 20) / 40) * 100));
  const moonTop   = `${5 + moonPct * 0.25}%`;
  const moonRight = `${14 - moonPct * 0.04}%`;
  const moonIllum = moonPos?.illumination ?? 0.5;
  const moonBright = 0.4 + moonIllum * 0.6;

  const showClouds = elevation > -6;

  /* Prayer display */
  const displayPrayer = nextPrayer || currentPrayer;
  const progress = currentPrayer?.progress ?? 0;

  /* Date strings */
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const hijriStr = hijri ? `${hijri.day} ${hijri.monthNameEn} ${hijri.year} AH` : '';

  /* Current weather (first hourly slot) */
  const currentWeather = hourly[0];

  return (
    <div className="flex-1 relative overflow-hidden rounded-xl flex flex-col" style={{
      border: '1px solid rgba(255,255,255,0.06)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      {/* Sky gradient bleed */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: gradient.replace('180deg', '135deg'), opacity: 0.12,
        transition: 'background 2s ease-in-out',
      }} />

      {/* Stars */}
      {isNight && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          {STARS.map((star, i) => (
            <Star key={i} style={{
              left: star.left, top: star.top, width: star.size, height: star.size,
              animation: `twinkle ${star.dur} ease-in-out ${star.delay} infinite`,
              opacity: elevation < -12 ? star.op * 0.9 : star.op * Math.max(0.05, (elevation + 18) / 18 * 0.85),
              transition: 'opacity 2s ease-in-out',
            }} />
          ))}
        </div>
      )}

      {/* Moon */}
      {isNight && (
        <div className="absolute pointer-events-none" style={{
          top: moonTop, right: moonRight,
          width: bodySize, height: bodySize,
          transition: 'all 1.5s cubic-bezier(0.4,0,0.2,1)',
          zIndex: 1,
          opacity: Math.max(0, Math.min(1, (0 - elevation) / 6)),
        }}>
          <div className="absolute" style={{ top: '-30%', left: '-30%', width: '160%', height: '160%', borderRadius: '50%', background: `radial-gradient(circle, rgba(255,214,0,${0.08 * moonBright}) 0%, transparent 70%)` }} />
          <div className="w-full h-full rounded-full" style={{
            background: `radial-gradient(circle at 35% 35%, #fff 0%, #f0e68c ${40 * moonBright}%, #daa520 100%)`,
            boxShadow: `0 0 ${bodySize * 0.5}px rgba(255,215,0,${0.3 * moonBright})`,
          }}>
            <div style={{ position: 'absolute', top: '-5%', left: '-10%', width: '92%', height: '92%', borderRadius: '50%', background: gradient }} />
            <MoonCraters />
          </div>
        </div>
      )}

      {/* Sun */}
      {!isNight && (
        <div className="absolute pointer-events-none" style={{
          top: sunTop, left: sunLeft,
          width: bodySize * 1.1, height: bodySize * 1.1,
          transform: 'translate(-50%, -50%)',
          transition: 'all 1.5s cubic-bezier(0.4,0,0.2,1)',
          zIndex: 1,
          opacity: Math.max(0, Math.min(1, elevation / 5)),
        }}>
          <div className="absolute" style={{ top: '-60%', left: '-60%', width: '220%', height: '220%', borderRadius: '50%', background: elevation < 5 ? 'radial-gradient(circle, rgba(245,158,11,0.18) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(255,214,0,0.12) 0%, transparent 70%)' }} />
          <div className="absolute" style={{ top: '-40%', left: '-40%', width: '180%', height: '180%', borderRadius: '50%', animation: 'rotateRays 30s linear infinite', background: 'conic-gradient(from 0deg, transparent 0deg, rgba(255,214,0,0.04) 10deg, transparent 20deg, rgba(255,214,0,0.04) 30deg, transparent 40deg, rgba(255,214,0,0.04) 50deg, transparent 60deg, rgba(255,214,0,0.04) 70deg, transparent 80deg, rgba(255,214,0,0.04) 90deg, transparent 100deg)' }} />
          <div className="w-full h-full rounded-full" style={{
            background: elevation < 5
              ? 'radial-gradient(circle at 45% 45%, #FFE34F 0%, #F59E0B 40%, #E67E22 100%)'
              : 'radial-gradient(circle at 45% 45%, #FFF8E1 0%, #FFD600 40%, #F59E0B 100%)',
            boxShadow: elevation < 5
              ? `0 0 ${bodySize * 0.7}px rgba(245,158,11,0.4)`
              : `0 0 ${bodySize * 0.5}px rgba(255,214,0,0.3)`,
          }} />
        </div>
      )}

      {/* Clouds */}
      {showClouds && <Clouds />}

      {/* Islamic pattern overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        zIndex: 2, opacity: displayPhase?.patternOpacity ?? 0.025,
        backgroundImage: 'linear-gradient(30deg, rgba(26,35,126,0.5) 12%, transparent 12.5%, transparent 87%, rgba(26,35,126,0.5) 87.5%), linear-gradient(150deg, rgba(26,35,126,0.5) 12%, transparent 12.5%, transparent 87%, rgba(26,35,126,0.5) 87.5%)',
        backgroundSize: '80px 140px', backgroundPosition: '0 0, 40px 70px',
        mixBlendMode: 'overlay', transition: 'opacity 1.5s ease-in-out',
      }} />

      {/* ── CONTENT LAYER ──────────────────────────────── */}
      <div className="relative flex flex-col h-full z-10" style={{ padding: '10px 16px 8px', gap: 0 }}>

        {/* TOP: Date + Clock */}
        <div className="flex items-start justify-between flex-shrink-0" style={{ marginBottom: 4 }}>
          <div className="flex flex-col">
            <span className="font-ui" style={{ fontSize: 'clamp(0.85rem, 1.8vw, 1.8rem)', color: 'rgba(255,255,255,0.75)', fontWeight: 400, lineHeight: 1.2 }}>
              {dateStr}
            </span>
            {hijriStr && (
              <span className="font-ui" style={{ fontSize: 'clamp(0.7rem, 1.3vw, 1.3rem)', color: 'rgba(255,255,255,0.4)', lineHeight: 1.2 }}>
                {hijriStr}
              </span>
            )}
          </div>
          <span className="font-mono" style={{
            fontSize: 'clamp(1.1rem, 2.5vw, 2.8rem)',
            fontWeight: 300,
            color: '#FAFAFA',
            letterSpacing: '0.05em',
            lineHeight: 1,
            marginTop: 2,
          }}>
            {timeStr}
          </span>
        </div>

        {/* MIDDLE: Prayer countdown (flex-1 to take available space) */}
        <div className="flex-1 flex flex-col items-center justify-center" style={{ gap: 4 }}>
          <span className="font-ui tracking-widest uppercase" style={{
            fontSize: 'clamp(0.75rem, 1.4vw, 1.5rem)',
            color: 'rgba(255,255,255,0.4)',
            letterSpacing: '0.2em',
          }}>
            NEXT PRAYER
          </span>

          <div className="flex items-baseline justify-center gap-4 w-full flex-wrap">
            <span
              key={displayPrayer?.nameAr}
              dir="rtl" lang="ar"
              className="font-arabic-display leading-none hero-arabic-name"
              style={{
                fontSize: 'clamp(4rem, 13vw, 11rem)',
                whiteSpace: 'nowrap',
                background: 'linear-gradient(135deg, #FFD600 0%, #F59E0B 30%, #14B8A6 70%, #0D9488 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 0 40px rgba(245,158,11,0.2))',
              }}
            >
              {displayPrayer?.nameAr || '—'}
            </span>
            <span className="font-ui font-light uppercase flex-shrink-0" style={{
              fontSize: 'clamp(1rem, 2vw, 2.2rem)',
              color: 'rgba(255,255,255,0.45)',
            }}>
              {displayPrayer?.nameEn || '—'}
            </span>
          </div>

          <span className="font-mono leading-none hero-countdown" style={{
            fontSize: 'clamp(4.5rem, 16vw, 13rem)',
            letterSpacing: 'clamp(4px, 1.2vw, 16px)',
            fontWeight: 300,
            color: '#FAFAFA',
            textShadow: '0 0 40px rgba(255,255,255,0.06)',
          }}>
            {countdown}
          </span>

          {/* Progress bar */}
          <div style={{ width: 'min(600px, 80%)', marginTop: 4 }}>
            <div className="w-full rounded-full overflow-hidden" style={{ height: 3, background: 'rgba(255,255,255,0.07)' }}>
              <div className="h-full rounded-full progress-fill transition-all duration-300 ease-out" style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #F59E0B, #14B8A6)',
                boxShadow: '0 0 10px rgba(245,158,11,0.3)',
              }} />
            </div>
            <div className="flex justify-between" style={{ marginTop: 2 }}>
              <span className="font-ui" style={{ fontSize: 'clamp(0.55rem, 0.9vw, 1rem)', color: 'rgba(255,255,255,0.3)' }}>
                {Math.round(progress)}% elapsed
              </span>
              {nextPrayer && (
                <span className="font-ui" style={{ fontSize: 'clamp(0.55rem, 0.9vw, 1rem)', color: 'rgba(255,255,255,0.3)' }}>
                  {nextPrayer.time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION */}
        <div className="flex-shrink-0 flex flex-col" style={{ gap: 6, marginTop: 4 }}>

          {/* Weather: current + hourly */}
          <div className="rounded-xl" style={{
            padding: '8px 12px',
            background: 'rgba(0,0,0,0.25)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div className="flex items-center" style={{ gap: 10, marginBottom: 6 }}>
              <WeatherIcon condition={currentWeather?.condition.icon ?? 'sunny'} size={32} />
              <div className="flex items-end" style={{ gap: 3 }}>
                <span className="font-mono" style={{ fontSize: 'clamp(1.4rem, 3vw, 3rem)', fontWeight: 300, color: '#FAFAFA', lineHeight: 1 }}>
                  {currentWeather?.temp ?? '—'}
                </span>
                <span className="font-ui" style={{ fontSize: 'clamp(0.7rem, 1.2vw, 1.2rem)', color: 'rgba(255,255,255,0.4)', marginBottom: '0.15em' }}>°C</span>
              </div>
              <span className="font-ui" style={{ fontSize: 'clamp(0.7rem, 1.2vw, 1.2rem)', color: 'rgba(255,255,255,0.5)' }}>
                {currentWeather?.condition.en ?? 'Clear'}
              </span>
            </div>
            <div className="hourly-scroll">
              <div className="flex" style={{ gap: 3, minWidth: 'max-content' }}>
                {hourly.map((h) => (
                  <div key={`${h.hour}-${h.timeLabel}`} className="flex flex-col items-center rounded-lg" style={{
                    padding: '4px 7px', minWidth: 46,
                    background: h.isNow ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${h.isNow ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.05)'}`,
                    gap: 2,
                  }}>
                    <span className="font-ui" style={{ fontSize: 'clamp(0.55rem, 0.85vw, 0.9rem)', color: h.isNow ? '#F59E0B' : 'rgba(255,255,255,0.45)' }}>
                      {h.timeLabel}
                    </span>
                    <WeatherIcon condition={h.condition.icon} size={16} />
                    <span className="font-mono" style={{ fontSize: 'clamp(0.6rem, 0.9vw, 0.95rem)', color: 'rgba(255,255,255,0.8)', fontWeight: 400 }}>
                      {h.temp}°
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Prayer times strip */}
          <div className="flex items-center justify-around flex-wrap" style={{ gap: '2px 8px', padding: '4px 0' }}>
            {prayers.map((prayer) => (
              <div key={prayer.key} className="flex flex-col items-center" style={{
                padding: '3px 8px',
                borderRadius: 8,
                background: prayer.isCurrent ? 'rgba(245,158,11,0.1)' : 'transparent',
                border: `1px solid ${prayer.isCurrent ? 'rgba(245,158,11,0.3)' : 'transparent'}`,
                minWidth: 60,
              }}>
                <span dir="rtl" lang="ar" className="font-arabic" style={{
                  fontSize: 'clamp(0.85rem, 1.6vw, 1.7rem)',
                  color: prayer.isCurrent ? '#FFD600' : 'rgba(255,255,255,0.75)',
                  lineHeight: 1.1,
                }}>
                  {prayer.nameAr}
                </span>
                <span className="font-mono" style={{
                  fontSize: 'clamp(0.6rem, 1vw, 1.1rem)',
                  color: prayer.isCurrent ? 'rgba(255,215,0,0.8)' : 'rgba(255,255,255,0.45)',
                  fontWeight: 300,
                }}>
                  {formatTime(prayer.time, settings.timeFormat, settings.timezone)}
                </span>
                {prayer.isCurrent && (
                  <div className="prayer-active-dot" style={{ width: 4, height: 4, borderRadius: '50%', background: '#F59E0B', marginTop: 1 }} />
                )}
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
