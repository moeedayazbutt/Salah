import { memo, useMemo } from 'react';
import { useStore } from '../../store';
import { useCurrentPrayer, useNextPrayer, useTimeUntilNext, useSkyPhase, useSolarPosition, useMoonPosition } from '../../hooks/usePrayerTimes';

function generateStars(seed: number, count: number) {
  let s = seed;
  const next = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  const stars: Array<{ left: string; top: string; delay: string; duration: string; size: string; opacity: number }> = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      left: `${next() * 100}%`, top: `${next() * 80}%`,
      delay: `${next() * 8}s`, duration: `${2 + next() * 5}s`,
      size: `${0.5 + next() * 2.5}px`, opacity: 0.3 + next() * 0.7,
    });
  }
  return stars;
}

const starSeed = new Date().getTime();
const stars = generateStars(starSeed, 90);

const Star = memo(({ style }: { style: React.CSSProperties }) => (
  <div className="absolute rounded-full bg-white" style={style} />
));
Star.displayName = 'Star';

const MoonCraters = () => (
  <>
    <div style={{ width: '16%', height: '16%', top: '22%', left: '42%', background: 'rgba(200,180,100,0.15)', borderRadius: '50%', position: 'absolute' }} />
    <div style={{ width: '11%', height: '11%', top: '48%', left: '28%', background: 'rgba(200,180,100,0.12)', borderRadius: '50%', position: 'absolute' }} />
    <div style={{ width: '9%',  height: '9%',  top: '16%', left: '60%', background: 'rgba(200,180,100,0.10)', borderRadius: '50%', position: 'absolute' }} />
  </>
);

function Clouds() {
  const s: React.CSSProperties = { position: 'absolute', borderRadius: '50%', filter: 'blur(12px)', pointerEvents: 'none' };
  return (
    <div className="absolute inset-x-0" style={{ bottom: '8%', height: '22%', pointerEvents: 'none' }}>
      <div style={{ ...s, width: '28%', height: '38%', left: '6%',  bottom: '20%', background: 'rgba(255,255,255,0.032)' }} />
      <div style={{ ...s, width: '22%', height: '30%', left: '32%', bottom: '28%', background: 'rgba(255,255,255,0.025)' }} />
      <div style={{ ...s, width: '32%', height: '42%', right: '10%',bottom: '12%', background: 'rgba(255,255,255,0.038)' }} />
    </div>
  );
}

export default function NextPrayerTimer() {
  const aodMode = useStore((s) => s.aodMode);
  const currentPrayer = useCurrentPrayer();
  const nextPrayer = useNextPrayer();
  const countdown = useTimeUntilNext();
  const phase = useSkyPhase();
  const solarPos = useSolarPosition();
  const moonPos = useMoonPosition();
  const elevation = solarPos?.elevation ?? -30;

  const displayPrayer = nextPrayer || currentPrayer;
  const progress = currentPrayer?.progress ?? 0;
  const isNight = elevation < 0;

  const gradient = phase?.gradient || 'linear-gradient(180deg, #060810 0%, #0A0D1E 40%, #0E1230 100%)';

  const moonSize = useMemo(() => {
    const base = window.innerWidth * 0.05;
    return Math.max(40, Math.min(72, base));
  }, []);

  const moonTop = useMemo(() => {
    const p = Math.max(0, Math.min(100, ((elevation + 20) / 40) * 100));
    return `${5 + p * 0.22}%`;
  }, [elevation]);

  const moonRight = useMemo(() => {
    const p = Math.max(0, Math.min(100, ((elevation + 20) / 40) * 100));
    return `${13 - p * 0.04}%`;
  }, [elevation]);

  const moonIllumination = moonPos?.illumination ?? 0.5;
  const moonBrightness = 0.4 + moonIllumination * 0.6;
  const showClouds = !isNight || elevation > -6;

  // AOD colour tokens
  const nameColor = aodMode
    ? { background: 'rgba(255,255,255,0.88)', WebkitBackgroundClip: 'text' as const, WebkitTextFillColor: 'transparent', backgroundClip: 'text' as const }
    : { background: 'linear-gradient(135deg, #FFD600 0%, #F59E0B 25%, #14B8A6 60%, #0D9488 100%)', WebkitBackgroundClip: 'text' as const, WebkitTextFillColor: 'transparent', backgroundClip: 'text' as const };
  const labelColor = aodMode ? 'rgba(255,255,255,0.42)' : 'rgba(255,255,255,0.42)';
  const countdownColor = aodMode ? 'rgba(255,255,255,0.90)' : '#FAFAFA';
  const cardBg = aodMode ? 'rgba(0,0,0,0.6)' : 'rgba(8,10,26,0.45)';
  const cardBorder = aodMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.06)';

  return (
    <div className="flex-1 min-h-0 relative overflow-hidden rounded-2xl card-surface" style={{
      background: cardBg,
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: `1px solid ${cardBorder}`,
      boxShadow: aodMode ? 'none' : '0 8px 32px rgba(0,0,0,0.4)',
    }}>
      {/* Gradient bleed */}
      {!aodMode && (
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `${gradient.replace('180deg', '145deg')}`,
          opacity: 0.10,
        }} />
      )}

      {/* Stars */}
      {isNight && !aodMode && (
        <div className="absolute inset-0">
          {stars.map((star, i) => (
            <Star key={i} style={{
              left: star.left, top: star.top, width: star.size, height: star.size,
              animation: `twinkle ${star.duration} ease-in-out ${star.delay} infinite`,
              opacity: elevation < -12 ? star.opacity * 0.9 : star.opacity * Math.max(0.05, (elevation + 18) / 18 * 0.8),
            }} />
          ))}
        </div>
      )}

      {/* Moon */}
      {isNight && !aodMode && (
        <div className="absolute" style={{ top: moonTop, right: moonRight, width: moonSize, height: moonSize, transition: 'all 600ms ease-in-out', zIndex: 1 }}>
          <div className="absolute" style={{ top: '-30%', left: '-30%', width: '160%', height: '160%', borderRadius: '50%', background: `radial-gradient(circle, rgba(255,214,0,${0.07 * moonBrightness}) 0%, transparent 70%)` }} />
          <div className="w-full h-full rounded-full" style={{ background: `radial-gradient(circle at 35% 35%, #fff 0%, #f0e68c ${40 * moonBrightness}%, #daa520 100%)`, boxShadow: `0 0 ${moonSize * 0.5}px rgba(255,215,0,${0.28 * moonBrightness})` }}>
            <div className="rounded-full" style={{ position: 'absolute', top: '-5%', left: '-10%', width: '92%', height: '92%', borderRadius: '50%', background: gradient }} />
            <MoonCraters />
          </div>
        </div>
      )}

      {/* Sun */}
      {!isNight && !aodMode && (
        <div className="absolute" style={{ top: `${Math.min(52, Math.max(4, 52 - elevation * 0.65))}%`, left: `${elevation < 10 ? 8 : 42}%`, width: moonSize * 1.1, height: moonSize * 1.1, transform: 'translate(-50%,-50%)', transition: 'all 800ms ease-in-out', zIndex: 1 }}>
          <div className="absolute" style={{ top: '-60%', left: '-60%', width: '220%', height: '220%', borderRadius: '50%', background: elevation < 5 ? 'radial-gradient(circle, rgba(245,158,11,0.14) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(255,214,0,0.09) 0%, transparent 70%)' }} />
          <div className="w-full h-full rounded-full" style={{
            background: elevation < 5 ? 'radial-gradient(circle at 45% 45%, #FFE34F 0%, #F59E0B 40%, #E67E22 100%)' : 'radial-gradient(circle at 45% 45%, #FFF8E1 0%, #FFD600 40%, #F59E0B 100%)',
            boxShadow: elevation < 5 ? `0 0 ${moonSize * 0.7}px rgba(245,158,11,0.38)` : `0 0 ${moonSize * 0.5}px rgba(255,214,0,0.28)`,
          }} />
        </div>
      )}

      {/* Clouds */}
      {showClouds && !aodMode && <Clouds />}

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center z-10" style={{ padding: '8px 12px', gap: '4px' }}>

        {/* Label */}
        <span style={{
          fontFamily: 'Roboto, sans-serif',
          fontWeight: 500,
          fontSize: 'clamp(0.65rem, 1.2vw, 1rem)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: labelColor,
        }}>
          Next Prayer
        </span>

        {/* Arabic name */}
        <div className="flex items-baseline justify-center gap-3 w-full flex-wrap">
          <span
            key={displayPrayer?.nameAr}
            dir="rtl" lang="ar"
            className="font-arabic-display leading-none hero-arabic-name"
            style={{
              fontSize: 'clamp(3.2rem, 11vw, 9rem)',
              whiteSpace: 'nowrap',
              ...nameColor,
              filter: aodMode ? 'none' : 'drop-shadow(0 0 30px rgba(245,158,11,0.18))',
              animation: 'inkFlow 0.8s ease-out both',
            }}
          >
            {displayPrayer?.nameAr || '—'}
          </span>
          <span style={{
            fontFamily: 'Roboto, sans-serif',
            fontWeight: 300,
            fontSize: 'clamp(0.85rem, 1.6vw, 1.8rem)',
            color: labelColor,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
          }}>
            {displayPrayer?.nameEn || '—'}
          </span>
        </div>

        {/* Countdown */}
        <div className="flex flex-col items-center">
          <span
            className="hero-countdown"
            style={{
              fontFamily: 'Roboto Mono, monospace',
              fontWeight: 100,
              fontSize: 'clamp(3.5rem, 13vw, 10rem)',
              letterSpacing: 'clamp(3px, 0.8vw, 10px)',
              color: countdownColor,
              lineHeight: 1,
              textShadow: aodMode ? 'none' : '0 0 40px rgba(255,255,255,0.06)',
            }}
          >
            {countdown}
          </span>
          <span style={{
            fontFamily: 'Roboto, sans-serif',
            fontWeight: 400,
            fontSize: 'clamp(0.65rem, 1vw, 1rem)',
            marginTop: 2,
            color: aodMode ? 'rgba(255,255,255,0.30)' : 'rgba(255,255,255,0.35)',
            letterSpacing: '0.06em',
          }}>
            time until next prayer
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full" style={{ maxWidth: 'min(580px, 82%)' }}>
          <div className="w-full rounded-full overflow-hidden" style={{ height: 3, background: 'rgba(255,255,255,0.07)' }}>
            <div className="h-full rounded-full transition-all duration-300 ease-out" style={{
              width: `${progress}%`,
              background: aodMode ? 'rgba(255,255,255,0.5)' : 'linear-gradient(90deg, #F59E0B, #14B8A6)',
              boxShadow: aodMode ? 'none' : '0 0 10px rgba(245,158,11,0.28)',
            }} />
          </div>
          <div className="flex justify-between" style={{ marginTop: 3 }}>
            <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'clamp(9px, 0.85vw, 11px)', color: aodMode ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.30)' }}>
              {Math.round(progress)}% elapsed
            </span>
            {nextPrayer && (
              <span style={{ fontFamily: 'Roboto Mono, monospace', fontWeight: 400, fontSize: 'clamp(9px, 0.85vw, 11px)', color: aodMode ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.30)' }}>
                {nextPrayer.time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
