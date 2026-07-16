import { useMemo, useState, useEffect } from 'react';
import {
  useCurrentPrayer, useNextPrayer, useTimeUntilNext,
  useSkyPhase, useSolarPosition, usePrayerInfoList, useHijriDate,
} from '../../hooks/usePrayerTimes';
import { useStore } from '../../store';
import { calculateSunPosition, calculateSunPositionFromPrayers, determineSkyPhase } from '../../utils/skyEngine';
import { useWeather } from '../../hooks/useWeather';
import { formatTime } from '../../utils/prayerTimes';

/* ── Prayer icons (horizon-based sun position) ──────── */
function PrayerIcon({ prayerKey, size = 22, color = 'rgba(255,255,255,0.6)' }: { prayerKey: string; size?: number; color?: string }) {
  const s = size;
  const stroke = color;
  const fill = color;

  if (prayerKey === 'fajr') return (
    <svg width={s} height={s} viewBox="0 0 28 28" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <line x1="2" y1="20" x2="26" y2="20" strokeOpacity="0.5" />
      <path d="M7 20 Q14 28 21 20" strokeOpacity="0.4" />
      <circle cx="14" cy="24" r="3" fill={fill} fillOpacity="0.12" strokeOpacity="0.3" />
      <circle cx="7"  cy="8"  r="0.9" fill={fill} stroke="none" opacity="0.7" />
      <circle cx="20" cy="5"  r="0.7" fill={fill} stroke="none" opacity="0.6" />
      <circle cx="14" cy="11" r="0.8" fill={fill} stroke="none" opacity="0.5" />
    </svg>
  );

  if (prayerKey === 'sunrise') return (
    <svg width={s} height={s} viewBox="0 0 28 28" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <line x1="2" y1="20" x2="26" y2="20" strokeOpacity="0.5" />
      <path d="M8 20 A6 6 0 0 1 20 20" fill={fill} fillOpacity="0.2" />
      <path d="M8 20 A6 6 0 0 1 20 20" />
      <line x1="14" y1="5"  x2="14" y2="8"  strokeOpacity="0.7" />
      <line x1="22" y1="9"  x2="20" y2="11" strokeOpacity="0.6" />
      <line x1="6"  y1="9"  x2="8"  y2="11" strokeOpacity="0.6" />
      <line x1="24" y1="14" x2="22" y2="14" strokeOpacity="0.5" />
      <line x1="4"  y1="14" x2="6"  y2="14" strokeOpacity="0.5" />
    </svg>
  );

  if (prayerKey === 'dhuhr') return (
    <svg width={s} height={s} viewBox="0 0 28 28" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <line x1="2" y1="22" x2="26" y2="22" strokeOpacity="0.4" />
      <circle cx="14" cy="8" r="4.5" fill={fill} fillOpacity="0.25" />
      <line x1="14" y1="1"  x2="14" y2="2.5" />
      <line x1="21" y1="3"  x2="20" y2="4.2" />
      <line x1="7"  y1="3"  x2="8"  y2="4.2" />
      <line x1="24" y1="8"  x2="22.5" y2="8" />
      <line x1="4"  y1="8"  x2="5.5"  y2="8" />
      <line x1="21" y1="13" x2="20"   y2="11.8" />
      <line x1="7"  y1="13" x2="8"    y2="11.8" />
      <line x1="14" y1="12.5" x2="14" y2="22" strokeOpacity="0.2" strokeDasharray="2 2" />
    </svg>
  );

  if (prayerKey === 'asr') return (
    <svg width={s} height={s} viewBox="0 0 28 28" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <line x1="2" y1="22" x2="26" y2="22" strokeOpacity="0.4" />
      <circle cx="19" cy="11" r="4" fill={fill} fillOpacity="0.2" />
      <line x1="19" y1="4"    x2="19" y2="5.5" />
      <line x1="25" y1="7"    x2="23.9" y2="8.1" />
      <line x1="26" y1="11"   x2="24.5" y2="11" />
      <line x1="25" y1="15"   x2="23.9" y2="13.9" />
      <line x1="19" y1="15" x2="5" y2="22" strokeOpacity="0.35" />
    </svg>
  );

  if (prayerKey === 'maghrib') return (
    <svg width={s} height={s} viewBox="0 0 28 28" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <line x1="2" y1="18" x2="26" y2="18" strokeOpacity="0.5" />
      <path d="M15 18 A6 6 0 0 0 27 18" fill={fill} fillOpacity="0.2" />
      <path d="M15 18 A6 6 0 0 0 27 18" />
      <line x1="21" y1="5"  x2="21" y2="7"  strokeOpacity="0.7" />
      <line x1="27" y1="10" x2="25.5" y2="10.8" strokeOpacity="0.6" />
      <line x1="15" y1="10" x2="16.5" y2="11"   strokeOpacity="0.6" />
      <line x1="2" y1="23" x2="12" y2="23" strokeOpacity="0.2" />
    </svg>
  );

  // Isha — moon + stars
  return (
    <svg width={s} height={s} viewBox="0 0 28 28" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <line x1="2" y1="22" x2="26" y2="22" strokeOpacity="0.3" />
      <path d="M22 14a8 8 0 1 1-9-9 6 6 0 0 0 9 9z" fill={fill} fillOpacity="0.18" />
      <circle cx="7"  cy="7"  r="1"    fill={fill} stroke="none" opacity="0.8" />
      <circle cx="20" cy="4"  r="0.8"  fill={fill} stroke="none" opacity="0.7" />
      <circle cx="5"  cy="15" r="0.7"  fill={fill} stroke="none" opacity="0.6" />
      <circle cx="24" cy="10" r="0.65" fill={fill} stroke="none" opacity="0.6" />
    </svg>
  );
}

/* ── Mini weather icon ──────────────────────────────── */
function MiniWeatherIcon({ condition }: { condition: string }) {
  return (
    <svg width="1.15em" height="1.15em" viewBox="0 0 40 40" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.2em', marginTop: '-0.05em' }}>
      {condition === 'sunny' && (
        <g fill="#FFFFFF">
          <circle cx="20" cy="18" r="7" />
          <g stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round">
            <line x1="20" y1="3" x2="20" y2="8" /><line x1="20" y1="28" x2="20" y2="33" />
            <line x1="7" y1="18" x2="12" y2="18" /><line x1="28" y1="18" x2="33" y2="18" />
            <line x1="10.5" y1="8.5" x2="14" y2="12" /><line x1="26" y1="12" x2="29.5" y2="8.5" />
            <line x1="10.5" y1="27.5" x2="14" y2="24" /><line x1="26" y1="24" x2="29.5" y2="27.5" />
          </g>
        </g>
      )}
      {condition === 'partly-cloudy' && (
        <g fill="#FFFFFF">
          <circle cx="16" cy="16" r="6" />
          <ellipse cx="26" cy="23" rx="11" ry="6.5" />
        </g>
      )}
      {condition === 'cloudy' && (
        <g fill="#FFFFFF">
          <ellipse cx="18" cy="22" rx="10" ry="6" />
          <ellipse cx="28" cy="24" rx="11" ry="6.5" />
        </g>
      )}
      {condition === 'rainy' && (
        <g>
          <ellipse cx="24" cy="20" rx="12" ry="6" fill="#FFFFFF" />
          <g stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" fill="none">
            <line x1="17" y1="29" x2="15" y2="36" />
            <line x1="24" y1="30" x2="22" y2="37" />
            <line x1="31" y1="29" x2="29" y2="36" />
          </g>
        </g>
      )}
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
  const prayers         = usePrayerInfoList();
  const hijri           = useHijriDate();
  const settings        = useStore((s) => s.settings);
  const skyDisplayHours = useStore((s) => s.skyDisplayHours);
  const skySliderAuto   = useStore((s) => s.skySliderAuto);
  const aodMode         = useStore((s) => s.aodMode);
  const isAzaanPlaying  = useStore((s) => s.isAzaanPlaying);
  const { current: weatherCurrent } = useWeather(settings.coordinates.latitude, settings.coordinates.longitude);

  /* Live clock */
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  /* Phase drives the next-prayer name gradient (slider-aware) */
  const prayerTimes = useStore((s) => s.prayerTimes);
  const displayPhase = useMemo(() => {
    if (!skySliderAuto && skyDisplayHours !== null) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      d.setHours(Math.floor(skyDisplayHours), Math.round((skyDisplayHours % 1) * 60), 0, 0);
      const pos = prayerTimes
        ? calculateSunPositionFromPrayers(d, prayerTimes)
        : calculateSunPosition(d, settings.coordinates.latitude || 25, settings.coordinates.longitude || 45);
      return determineSkyPhase(pos.elevation, pos.azimuth);
    }
    return phase;
  }, [skySliderAuto, skyDisplayHours, solarPos, settings.coordinates, phase, now, prayerTimes]);

  const prayerNameStyle = useMemo((): React.CSSProperties => {
    const phaseId = displayPhase?.id as string | undefined;
    const shadowFilter = 'drop-shadow(0 4px 12px rgba(0,0,0,0.45)) drop-shadow(0 2px 4px rgba(0,0,0,0.4))';
    
    let gradient = '';
    switch (phaseId) {
      case 'fajr':
        // Dawn: soft violet-purple to peach-pink
        gradient = 'linear-gradient(135deg, #703E78 0%, #99533D 100%)';
        break;
      case 'sunrise':
        // Sunrise: vibrant orange-red to golden yellow
        gradient = 'linear-gradient(135deg, #992500 0%, #997600 100%)';
        break;
      case 'morning':
        // Morning: bright cream yellow to light sky blue
        gradient = 'linear-gradient(135deg, #99935E 0%, #196D94 100%)';
        break;
      case 'midday':
        // Midday: bright pure yellow to intense sky blue
        gradient = 'linear-gradient(135deg, #998D23 0%, #006A99 100%)';
        break;
      case 'afternoon':
        // Afternoon: amber gold to bright cyan-blue
        gradient = 'linear-gradient(135deg, #997404 0%, #008999 100%)';
        break;
      case 'sunset':
        // Sunset: fiery orange-red to deep magenta/purple
        gradient = 'linear-gradient(135deg, #993414 0%, #551666 100%)';
        break;
      case 'maghrib':
        // Maghrib: deep twilight pink/magenta to deep blue
        gradient = 'linear-gradient(135deg, #8C123B 0%, #26316D 100%)';
        break;
      case 'isha':
        // Isha: royal purple to bright blue
        gradient = 'linear-gradient(135deg, #4A1361 0%, #194999 100%)';
        break;
      case 'night':
      default:
        // Night: deep violet purple to electric blue
        gradient = 'linear-gradient(135deg, #5E176A 0%, #008999 100%)';
        break;
    }

    return {
      backgroundImage: gradient,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      filter: shadowFilter,
    };
  }, [displayPhase]);

  const showUpcoming = currentPrayer?.key === 'sunrise';
  const displayPrayer = showUpcoming ? nextPrayer : (currentPrayer || nextPrayer);

  const timeStr  = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr  = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const hijriStr = hijri ? `${hijri.day} ${hijri.monthNameEn} ${hijri.year} AH` : '';

  const shadow = '0 2px 12px rgba(0,0,0,0.55)';


  const formattedTime = useMemo(() => {
    return timeStr.split('').map((char, index) => {
      const isColonOrSpace = char === ':' || char === ' ';
      const isAmPm = char === 'A' || char === 'P' || char === 'M';
      const width = isColonOrSpace ? '0.3em' : isAmPm ? '0.85em' : '0.62em';
      return (
        <span key={index} style={{ display: 'inline-block', width, textAlign: 'center' }}>
          {char}
        </span>
      );
    });
  }, [timeStr]);

  return (
    <div className="flex-1 relative overflow-hidden flex flex-col">
      <div className={`azaan-glow-container ${isAzaanPlaying ? 'active' : ''}`}>
        {/* Top Side - Red/Magenta Blob */}
        <div className="absolute rounded-full pointer-events-none" style={{
          top: '-20%', left: '20%', width: '60vw', height: '28vh',
          background: 'radial-gradient(circle, rgba(239, 68, 68, 0.98) 0%, rgba(236, 72, 153, 0.88) 45%, rgba(236, 72, 153, 0.15) 75%, transparent 95%)',
          filter: 'blur(50px)',
          mixBlendMode: 'screen',
          opacity: 0.98,
          animation: 'gemini-blob-1 3.2s ease-in-out infinite alternate',
        }} />
        {/* Bottom Side - Cyan/Blue Blob */}
        <div className="absolute rounded-full pointer-events-none" style={{
          bottom: '-20%', left: '15%', width: '70vw', height: '28vh',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.98) 0%, rgba(59, 130, 246, 0.88) 45%, rgba(59, 130, 246, 0.15) 75%, transparent 95%)',
          filter: 'blur(50px)',
          mixBlendMode: 'screen',
          opacity: 0.98,
          animation: 'gemini-blob-2 3.8s ease-in-out infinite alternate',
        }} />
        {/* Left Side - Yellow/Orange Blob */}
        <div className="absolute rounded-full pointer-events-none" style={{
          top: '15%', left: '-15%', width: '22vw', height: '70vh',
          background: 'radial-gradient(circle, rgba(234, 179, 8, 0.98) 0%, rgba(245, 158, 11, 0.88) 45%, rgba(245, 158, 11, 0.15) 75%, transparent 95%)',
          filter: 'blur(55px)',
          mixBlendMode: 'screen',
          opacity: 0.98,
          animation: 'gemini-blob-3 3.5s ease-in-out infinite alternate',
        }} />
        {/* Right Side - Purple/Blue Blob */}
        <div className="absolute rounded-full pointer-events-none" style={{
          top: '15%', right: '-15%', width: '22vw', height: '70vh',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.98) 0%, rgba(59, 130, 246, 0.88) 45%, rgba(59, 130, 246, 0.15) 75%, transparent 95%)',
          filter: 'blur(55px)',
          mixBlendMode: 'screen',
          opacity: 0.98,
          animation: 'gemini-blob-4 4.2s ease-in-out infinite alternate',
        }} />
      </div>

      {/* ── CONTENT (floats over the layered SkyBackground) ── */}
      <div className="relative flex flex-col h-full z-10" style={{ padding: '18px 36px 10px' }}>

        {/* TOP: Date + Clock */}
        <div className="flex items-start justify-between flex-shrink-0" style={{ marginBottom: 0 }}>
          <div className="flex flex-col" style={{ gap: 1 }}>
            <span className="font-ui" style={{ fontSize: 'clamp(1.1rem, 2.2vw, 2.3rem)', color: 'rgba(255,255,255,0.92)', fontWeight: 400, lineHeight: 1.2, textShadow: shadow }}>
              {dateStr}
            </span>
            {hijriStr && (
              <span className="font-ui" style={{ fontSize: 'clamp(1.1rem, 2.2vw, 2.3rem)', color: 'rgba(255,255,255,0.92)', lineHeight: 1.2, textShadow: shadow }}>
                {hijriStr}
              </span>
            )}
            {weatherCurrent && (
              <span className="font-ui" style={{ fontSize: 'clamp(1.1rem, 2.2vw, 2.3rem)', color: 'rgba(255,255,255,0.92)', lineHeight: 1.2, textShadow: shadow }}>
                <MiniWeatherIcon condition={weatherCurrent.condition.icon} />
                {weatherCurrent.temp}°C
              </span>
            )}
          </div>
          <span style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 400, fontSize: 'clamp(1.2rem, 2.4vw, 2.8rem)', color: '#FFFFFF', letterSpacing: '0.04em', lineHeight: 1, marginTop: 2, fontVariantNumeric: 'tabular-nums', textShadow: shadow }}>
            {formattedTime}
          </span>
        </div>

        {/* MIDDLE GROUP — vertically centred between top bar and strip */}
        <div className="flex-1 flex flex-col items-center justify-center relative" style={{ minHeight: 0, gap: 0 }}>
          {/* Soft scrim so the prayer name + countdown never merge into the scenery */}
          <div aria-hidden="true" style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            width: '96%', height: '118%', zIndex: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse 62% 54% at 50% 48%, rgba(6,9,22,0.5) 0%, rgba(6,9,22,0.32) 46%, rgba(6,9,22,0.12) 68%, transparent 82%)',
            filter: 'blur(6px)',
          }} />
          <div className="flex flex-col items-center relative" style={{ gap: 6, zIndex: 1 }}>
            <span className="font-ui tracking-widest uppercase" style={{ fontSize: 'clamp(0.75rem, 1.3vw, 1.4rem)', color: 'rgba(255,255,255,0.55)', letterSpacing: '0.22em', textShadow: shadow }}>
              {showUpcoming ? 'UPCOMING PRAYER' : 'CURRENT PRAYER'}
            </span>
            <div className="flex items-baseline justify-center gap-4 flex-wrap">
              <span
                key={displayPrayer?.nameAr}
                dir="rtl" lang="ar"
                className="font-arabic-display hero-arabic-name"
                style={{
                  fontSize: 'clamp(4.94rem, 14.3vw, 13rem)',
                  lineHeight: 1.28,
                  paddingBottom: '0.14em',
                  whiteSpace: 'nowrap',
                  overflow: 'visible',
                  ...prayerNameStyle,
                }}
              >
                {displayPrayer?.nameAr || '—'}
              </span>
              <span className="font-ui font-light uppercase flex-shrink-0" style={{ fontSize: 'clamp(1.3rem, 2.6vw, 2.86rem)', color: 'rgba(255,255,255,0.6)', textShadow: shadow }}>
                {displayPrayer?.nameEn || '—'}
              </span>
            </div>
          </div>

          {/* COUNTDOWN */}
          <span
            className="leading-none hero-countdown relative"
            style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: 'clamp(6.5rem, 23.4vw, 20.8rem)',
              fontWeight: 600,
              letterSpacing: 'clamp(2px, 0.5vw, 8px)',
              zIndex: 1,
              marginTop: '-0.10em',
              filter: prayerNameStyle.filter,
            }}
          >
            {countdown.split('').map((char, index) => {
              const isColon = char === ':';
              return (
                <span
                  key={index}
                  style={{
                    display: 'inline-block',
                    width: isColon ? '0.3em' : '0.62em',
                    textAlign: 'center',
                    backgroundImage: prayerNameStyle.backgroundImage,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {char}
                </span>
              );
            })}
          </span>
        </div>

        {/* PRAYER STRIP */}
        <div className="flex-shrink-0 flex items-stretch justify-around" style={{ gap: 4, marginBottom: 8 }}>
          {prayers.map((prayer) => (
            <div key={prayer.key} className="flex flex-col items-center" style={{
              flex: '1 1 0%',
              padding: 'clamp(4px, 0.8vh, 10px) 6px',
              borderRadius: 10,
              background: prayer.isCurrent
                ? (aodMode ? 'rgba(255,255,255,0.1)' : 'rgba(255,215,0,0.20)')
                : 'rgba(20,26,55,0.30)',
              border: `1px solid ${prayer.isCurrent ? (aodMode ? 'rgba(255,255,255,0.4)' : 'rgba(255,215,0,0.5)') : 'rgba(255,255,255,0.18)'}`,
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              gap: 3,
              boxShadow: (prayer.isCurrent && isAzaanPlaying)
                ? '0 0 20px rgba(245, 158, 11, 0.45), inset 0 0 15px rgba(245, 158, 11, 0.25)'
                : undefined,
              animation: (prayer.isCurrent && isAzaanPlaying)
                ? 'pulseSoft 2s ease-in-out infinite'
                : undefined,
            }}>
              <PrayerIcon
                prayerKey={prayer.key}
                size={Math.max(16, Math.min(26, window.innerWidth / 60))}
                color={aodMode ? '#FFFFFF' : (prayer.isCurrent ? '#FFD600' : 'rgba(255,255,255,0.6)')}
              />
              <span dir="rtl" lang="ar" className="font-arabic" style={{
                fontSize: 'clamp(1.1rem, 2vw, 2.2rem)',
                color: aodMode ? '#FFFFFF' : (prayer.isCurrent ? '#FFD600' : 'rgba(255,255,255,0.9)'),
                lineHeight: 1.1,
                textShadow: shadow,
              }}>
                {prayer.nameAr}
              </span>
              <span style={{
                fontFamily: "'Oswald', sans-serif",
                fontSize: 'clamp(0.85rem, 1.4vw, 1.5rem)',
                fontWeight: 400,
                color: aodMode ? '#FFFFFF' : (prayer.isCurrent ? 'rgba(255,215,0,0.95)' : 'rgba(255,255,255,0.75)'),
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '0.02em',
                textShadow: shadow,
              }}>
                {formatTime(prayer.time, settings.timeFormat, settings.timezone)}
              </span>
              {prayer.isCurrent && (
                <div className="prayer-active-dot" style={{ width: 5, height: 5, borderRadius: '50%', background: aodMode ? '#FFFFFF' : '#F59E0B', flexShrink: 0 }} />
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
