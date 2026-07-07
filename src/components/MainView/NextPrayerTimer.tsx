import { memo, useMemo, useState, useEffect } from 'react';
import {
  useCurrentPrayer, useNextPrayer, useTimeUntilNext,
  useSkyPhase, useSolarPosition, useMoonPosition, usePrayerInfoList, useHijriDate,
} from '../../hooks/usePrayerTimes';
import { useStore } from '../../store';
import { calculateSunPosition, determineSkyPhase } from '../../utils/skyEngine';
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

const MoonCraters = () => (
  <>
    <div style={{ width: '16%', height: '16%', top: '22%', left: '42%', background: 'rgba(200,180,100,0.15)', borderRadius: '50%', position: 'absolute' }} />
    <div style={{ width: '11%', height: '11%', top: '48%', left: '28%', background: 'rgba(200,180,100,0.12)', borderRadius: '50%', position: 'absolute' }} />
    <div style={{ width: '9%',  height: '9%',  top: '16%', left: '60%', background: 'rgba(200,180,100,0.1)',  borderRadius: '50%', position: 'absolute' }} />
    <div style={{ width: '7%',  height: '7%',  top: '60%', left: '50%', background: 'rgba(200,180,100,0.08)', borderRadius: '50%', position: 'absolute' }} />
  </>
);

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

/* ── Prayer icons (horizon-based sun position) ──────── */
// All icons share a horizon line at y=19. Sun circle moves to show
// its position in the sky for each prayer time.
function PrayerIcon({ prayerKey, size = 22, color = 'rgba(255,255,255,0.6)' }: { prayerKey: string; size?: number; color?: string }) {
  const s = size;
  const stroke = color;
  const fill = color;

  // Fajr: sun deep below horizon on the east — only a soft glow arc visible
  if (prayerKey === 'fajr') return (
    <svg width={s} height={s} viewBox="0 0 28 28" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      {/* horizon */}
      <line x1="2" y1="20" x2="26" y2="20" strokeOpacity="0.5" />
      {/* glow arc below horizon */}
      <path d="M7 20 Q14 28 21 20" strokeOpacity="0.4" />
      {/* sun well below horizon, just a halo */}
      <circle cx="14" cy="24" r="3" fill={fill} fillOpacity="0.12" strokeOpacity="0.3" />
      {/* stars above */}
      <circle cx="7"  cy="8"  r="0.9" fill={fill} stroke="none" opacity="0.7" />
      <circle cx="20" cy="5"  r="0.7" fill={fill} stroke="none" opacity="0.6" />
      <circle cx="14" cy="11" r="0.8" fill={fill} stroke="none" opacity="0.5" />
    </svg>
  );

  // Sunrise (Shuruq): sun half-risen above horizon at centre
  if (prayerKey === 'sunrise') return (
    <svg width={s} height={s} viewBox="0 0 28 28" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      {/* horizon */}
      <line x1="2" y1="20" x2="26" y2="20" strokeOpacity="0.5" />
      {/* sun half above horizon */}
      <path d="M8 20 A6 6 0 0 1 20 20" fill={fill} fillOpacity="0.2" />
      <path d="M8 20 A6 6 0 0 1 20 20" />
      {/* rays */}
      <line x1="14" y1="5"  x2="14" y2="8"  strokeOpacity="0.7" />
      <line x1="22" y1="9"  x2="20" y2="11" strokeOpacity="0.6" />
      <line x1="6"  y1="9"  x2="8"  y2="11" strokeOpacity="0.6" />
      <line x1="24" y1="14" x2="22" y2="14" strokeOpacity="0.5" />
      <line x1="4"  y1="14" x2="6"  y2="14" strokeOpacity="0.5" />
    </svg>
  );

  // Dhuhr: sun high at zenith (top-centre), full circle, horizon at bottom
  if (prayerKey === 'dhuhr') return (
    <svg width={s} height={s} viewBox="0 0 28 28" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      {/* horizon */}
      <line x1="2" y1="22" x2="26" y2="22" strokeOpacity="0.4" />
      {/* sun at zenith */}
      <circle cx="14" cy="8" r="4.5" fill={fill} fillOpacity="0.25" />
      {/* rays */}
      <line x1="14" y1="1"  x2="14" y2="2.5" />
      <line x1="21" y1="3"  x2="20" y2="4.2" />
      <line x1="7"  y1="3"  x2="8"  y2="4.2" />
      <line x1="24" y1="8"  x2="22.5" y2="8" />
      <line x1="4"  y1="8"  x2="5.5"  y2="8" />
      <line x1="21" y1="13" x2="20"   y2="11.8" />
      <line x1="7"  y1="13" x2="8"    y2="11.8" />
      {/* vertical line from sun to horizon */}
      <line x1="14" y1="12.5" x2="14" y2="22" strokeOpacity="0.2" strokeDasharray="2 2" />
    </svg>
  );

  // Asr: keep as-is (user said don't change Asr)
  if (prayerKey === 'asr') return (
    <svg width={s} height={s} viewBox="0 0 28 28" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      {/* horizon */}
      <line x1="2" y1="22" x2="26" y2="22" strokeOpacity="0.4" />
      {/* sun at ~45° in afternoon sky, west side */}
      <circle cx="19" cy="11" r="4" fill={fill} fillOpacity="0.2" />
      <line x1="19" y1="4"    x2="19" y2="5.5" />
      <line x1="25" y1="7"    x2="23.9" y2="8.1" />
      <line x1="26" y1="11"   x2="24.5" y2="11" />
      <line x1="25" y1="15"   x2="23.9" y2="13.9" />
      {/* shadow line extending from base */}
      <line x1="19" y1="15" x2="5" y2="22" strokeOpacity="0.35" />
    </svg>
  );

  // Maghrib: sun setting on the right (west), half below horizon
  if (prayerKey === 'maghrib') return (
    <svg width={s} height={s} viewBox="0 0 28 28" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      {/* horizon */}
      <line x1="2" y1="18" x2="26" y2="18" strokeOpacity="0.5" />
      {/* sun half-set on the right */}
      <path d="M15 18 A6 6 0 0 0 27 18" fill={fill} fillOpacity="0.2" />
      <path d="M15 18 A6 6 0 0 0 27 18" />
      {/* rays above horizon */}
      <line x1="21" y1="5"  x2="21" y2="7"  strokeOpacity="0.7" />
      <line x1="27" y1="10" x2="25.5" y2="10.8" strokeOpacity="0.6" />
      <line x1="15" y1="10" x2="16.5" y2="11"   strokeOpacity="0.6" />
      {/* fading glow below */}
      <line x1="2" y1="23" x2="12" y2="23" strokeOpacity="0.2" />
    </svg>
  );

  // Isha: keep as moon + stars (user said don't change Isha)
  return (
    <svg width={s} height={s} viewBox="0 0 28 28" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      {/* horizon */}
      <line x1="2" y1="22" x2="26" y2="22" strokeOpacity="0.3" />
      {/* crescent moon */}
      <path d="M22 14a8 8 0 1 1-9-9 6 6 0 0 0 9 9z" fill={fill} fillOpacity="0.18" />
      {/* stars */}
      <circle cx="7"  cy="7"  r="1"    fill={fill} stroke="none" opacity="0.8" />
      <circle cx="20" cy="4"  r="0.8"  fill={fill} stroke="none" opacity="0.7" />
      <circle cx="5"  cy="15" r="0.7"  fill={fill} stroke="none" opacity="0.6" />
      <circle cx="24" cy="10" r="0.65" fill={fill} stroke="none" opacity="0.6" />
    </svg>
  );
}

/* ── Main component ─────────────────────────────────── */
export default function NextPrayerTimer() {
  const currentPrayer   = useCurrentPrayer();
  const nextPrayer      = useNextPrayer();
  const countdown       = useTimeUntilNext();
  const phase           = useSkyPhase();
  const solarPos        = useSolarPosition();
  const moonPos         = useMoonPosition();
  const prayers         = usePrayerInfoList();
  const hijri           = useHijriDate();
  const settings        = useStore((s) => s.settings);
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
      return calculateSunPosition(d, settings.coordinates.latitude || 25, settings.coordinates.longitude || 45);
    }
    return solarPos ?? { elevation: -30, azimuth: 90 };
  }, [skyDisplayHours, skySliderAuto, solarPos, settings.coordinates, now]);

  const elevation = displayPos.elevation;
  const azimuth   = displayPos.azimuth;
  const isNight   = elevation < 0;
  // Stars fade in gradually from elevation +3 (twilight) down to -15 (full night)
  const starFade = elevation >= 3 ? 0 : elevation <= -15 ? 1 : (-elevation + 3) / 18;

  const displayPhase = useMemo(() => {
    if (!skySliderAuto && skyDisplayHours !== null) return determineSkyPhase(elevation, azimuth);
    return phase;
  }, [skySliderAuto, skyDisplayHours, elevation, azimuth, phase]);

  const gradient = displayPhase?.gradient ?? 'linear-gradient(180deg, #080A1A 0%, #0E1230 25%, #151A3A 60%, #1A1F3E 100%)';

  const prayerNameStyle = useMemo((): React.CSSProperties => {
    const phase = displayPhase?.name as string | undefined;
    switch (phase) {
      case 'morning':
      case 'midday':
      case 'afternoon':
        return {
          background: 'linear-gradient(135deg, #ffffff 0%, #FFF9C4 50%, #FFE082 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          filter: 'drop-shadow(0 2px 20px rgba(0,0,0,0.7))',
        };
      case 'sunrise':
        return {
          background: 'linear-gradient(135deg, #FFFFFF 0%, #FFE0B2 45%, #FF8F00 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          filter: 'drop-shadow(0 2px 20px rgba(0,0,0,0.5))',
        };
      case 'sunset':
      case 'maghrib':
        return {
          background: 'linear-gradient(135deg, #FFFFFF 0%, #FCE4EC 45%, #E91E63 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          filter: 'drop-shadow(0 2px 20px rgba(0,0,0,0.5))',
        };
      default: // night, fajr, isha
        return {
          background: 'linear-gradient(135deg, #FFD600 0%, #F59E0B 30%, #14B8A6 70%, #0D9488 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          filter: 'drop-shadow(0 0 40px rgba(245,158,11,0.2))',
        };
    }
  }, [displayPhase]);

  /* Sun/moon sizing */
  const bodySize = typeof window !== 'undefined' ? Math.max(45, Math.min(90, window.innerWidth * 0.055)) : 65;

  // Sun starts low behind mountains (elevation=0 → ~62% down), clears them around elevation=8°
  const sunTop  = `${Math.min(62, Math.max(4, 62 - elevation * 0.9))}%`;
  const sunLeft = azimuth < 180 ? `${10 + (azimuth / 180) * 38}%` : `${48 + ((azimuth - 180) / 180) * 38}%`;

  const moonPct    = Math.max(0, Math.min(100, ((elevation + 20) / 40) * 100));
  const moonTop    = `${5 + moonPct * 0.25}%`;
  const moonRight  = `${14 - moonPct * 0.04}%`;
  const moonIllum  = moonPos?.illumination ?? 0.5;
  const moonBright = 0.4 + moonIllum * 0.6;

  /* Prayer display */
  const displayPrayer = nextPrayer || currentPrayer;

  /* Date strings */
  const timeStr  = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr  = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const hijriStr = hijri ? `${hijri.day} ${hijri.monthNameEn} ${hijri.year} AH` : '';

  return (
    <div className="flex-1 relative overflow-hidden rounded-xl flex flex-col" style={{
      border: '1px solid rgba(255,255,255,0.06)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      {/* Sky gradient bleed */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: gradient.replace('180deg', '135deg'), opacity: 0.12, transition: 'background 2s ease-in-out' }} />

      {/* Stars — appear gradually from twilight, full at deep night */}
      {starFade > 0 && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          {STARS.map((star, i) => (
            <Star key={i} style={{
              left: star.left, top: star.top, width: star.size, height: star.size,
              animation: `twinkle ${star.dur} ease-in-out ${star.delay} infinite`,
              opacity: star.op * starFade,
              transition: 'opacity 3s ease-in-out',
            }} />
          ))}
        </div>
      )}

      {/* Moon */}
      {starFade > 0 && (
        <div className="absolute pointer-events-none" style={{
          top: moonTop, right: moonRight, width: bodySize, height: bodySize,
          transition: 'all 1.5s cubic-bezier(0.4,0,0.2,1)', zIndex: 1,
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
          top: sunTop, left: sunLeft, width: bodySize * 1.1, height: bodySize * 1.1,
          transform: 'translate(-50%, -50%)', transition: 'all 1.5s cubic-bezier(0.4,0,0.2,1)', zIndex: 1,
          opacity: Math.max(0, Math.min(1, elevation / 5)),
        }}>
          <div className="absolute" style={{ top: '-60%', left: '-60%', width: '220%', height: '220%', borderRadius: '50%', background: elevation < 5 ? 'radial-gradient(circle, rgba(245,158,11,0.18) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(255,214,0,0.12) 0%, transparent 70%)' }} />
          <div className="absolute" style={{ top: '-40%', left: '-40%', width: '180%', height: '180%', borderRadius: '50%', animation: 'rotateRays 30s linear infinite', background: 'conic-gradient(from 0deg, transparent 0deg, rgba(255,214,0,0.04) 10deg, transparent 20deg, rgba(255,214,0,0.04) 30deg, transparent 40deg, rgba(255,214,0,0.04) 50deg, transparent 60deg, rgba(255,214,0,0.04) 70deg, transparent 80deg, rgba(255,214,0,0.04) 90deg, transparent 100deg)' }} />
          <div className="w-full h-full rounded-full" style={{
            background: elevation < 5 ? 'radial-gradient(circle at 45% 45%, #FFE34F 0%, #F59E0B 40%, #E67E22 100%)' : 'radial-gradient(circle at 45% 45%, #FFF8E1 0%, #FFD600 40%, #F59E0B 100%)',
            boxShadow: elevation < 5 ? `0 0 ${bodySize * 0.7}px rgba(245,158,11,0.4)` : `0 0 ${bodySize * 0.5}px rgba(255,214,0,0.3)`,
          }} />
        </div>
      )}

      {elevation > -6 && <Clouds />}

      {/* Pattern overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        zIndex: 2, opacity: displayPhase?.patternOpacity ?? 0.025,
        backgroundImage: 'linear-gradient(30deg, rgba(26,35,126,0.5) 12%, transparent 12.5%, transparent 87%, rgba(26,35,126,0.5) 87.5%), linear-gradient(150deg, rgba(26,35,126,0.5) 12%, transparent 12.5%, transparent 87%, rgba(26,35,126,0.5) 87.5%)',
        backgroundSize: '80px 140px', backgroundPosition: '0 0, 40px 70px',
        mixBlendMode: 'overlay', transition: 'opacity 1.5s ease-in-out',
      }} />

      {/* ── CONTENT ─────────────────────────────────── */}
      <div className="relative flex flex-col h-full z-10" style={{ padding: '10px 20px 10px' }}>

        {/* TOP: Date + Clock */}
        <div className="flex items-start justify-between flex-shrink-0" style={{ marginBottom: 0 }}>
          <div className="flex flex-col" style={{ gap: 1 }}>
            <span className="font-ui" style={{ fontSize: 'clamp(0.9rem, 1.8vw, 1.9rem)', color: 'rgba(255,255,255,0.8)', fontWeight: 400, lineHeight: 1.2 }}>
              {dateStr}
            </span>
            {hijriStr && (
              <span className="font-ui" style={{ fontSize: 'clamp(0.7rem, 1.3vw, 1.3rem)', color: 'rgba(255,255,255,0.4)', lineHeight: 1.2 }}>
                {hijriStr}
              </span>
            )}
          </div>
          <span style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 400, fontSize: 'clamp(1.2rem, 2.4vw, 2.8rem)', color: '#FAFAFA', letterSpacing: '0.04em', lineHeight: 1, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
            {timeStr}
          </span>
        </div>

        {/* PRAYER NAME — tighter gap with top clock row */}
        <div className="flex flex-col items-center flex-shrink-0" style={{ marginTop: 'clamp(4px, 1vh, 10px)', gap: 4 }}>
          <span className="font-ui tracking-widest uppercase" style={{ fontSize: 'clamp(0.75rem, 1.3vw, 1.4rem)', color: 'rgba(255,255,255,0.38)', letterSpacing: '0.22em' }}>
            NEXT PRAYER
          </span>
          <div className="flex items-baseline justify-center gap-4 flex-wrap">
            <span
              key={displayPrayer?.nameAr}
              dir="rtl" lang="ar"
              className="font-arabic-display leading-none hero-arabic-name"
              style={{
                fontSize: 'clamp(3.8rem, 11vw, 10rem)',
                whiteSpace: 'nowrap',
                transition: 'filter 2s ease, background 2s ease',
                ...prayerNameStyle,
              }}
            >
              {displayPrayer?.nameAr || '—'}
            </span>
            <span className="font-ui font-light uppercase flex-shrink-0" style={{ fontSize: 'clamp(1rem, 2vw, 2.2rem)', color: 'rgba(255,255,255,0.4)' }}>
              {displayPrayer?.nameEn || '—'}
            </span>
          </div>
        </div>

        {/* COUNTDOWN — Oswald, fills remaining vertical space */}
        <div className="flex-1 flex items-center justify-center" style={{ minHeight: 0 }}>
          <span
            className="leading-none hero-countdown"
            style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: 'clamp(5rem, 18vw, 16rem)',
              fontWeight: 600,
              letterSpacing: 'clamp(2px, 0.5vw, 8px)',
              color: '#FFFFFF',
              textShadow: '0 2px 40px rgba(255,255,255,0.08)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {countdown}
          </span>
        </div>

        {/* PRAYER STRIP — directly under countdown */}
        <div className="flex-shrink-0 flex items-stretch justify-around" style={{ gap: 4, marginBottom: 8 }}>
          {prayers.map((prayer) => (
            <div key={prayer.key} className="flex flex-col items-center" style={{
              flex: '1 1 0%',
              padding: 'clamp(4px, 0.8vh, 10px) 6px',
              borderRadius: 10,
              background: prayer.isCurrent
                ? 'rgba(255,215,0,0.18)'
                : 'rgba(255,255,255,0.10)',
              border: `1px solid ${prayer.isCurrent ? 'rgba(255,215,0,0.45)' : 'rgba(255,255,255,0.18)'}`,
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              gap: 3,
            }}>
              <PrayerIcon
                prayerKey={prayer.key}
                size={Math.max(16, Math.min(26, window.innerWidth / 60))}
                color={prayer.isCurrent ? '#FFD600' : 'rgba(255,255,255,0.5)'}
              />
              <span dir="rtl" lang="ar" className="font-arabic" style={{
                fontSize: 'clamp(0.95rem, 1.7vw, 1.8rem)',
                color: prayer.isCurrent ? '#FFD600' : 'rgba(255,255,255,0.8)',
                lineHeight: 1.1,
              }}>
                {prayer.nameAr}
              </span>
              <span style={{
                fontFamily: "'Oswald', sans-serif",
                fontSize: 'clamp(0.7rem, 1.1vw, 1.2rem)',
                fontWeight: 400,
                color: prayer.isCurrent ? 'rgba(255,215,0,0.9)' : 'rgba(255,255,255,0.65)',
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '0.02em',
              }}>
                {formatTime(prayer.time, settings.timeFormat, settings.timezone)}
              </span>
              {prayer.isCurrent && (
                <div className="prayer-active-dot" style={{ width: 5, height: 5, borderRadius: '50%', background: '#F59E0B', flexShrink: 0 }} />
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
