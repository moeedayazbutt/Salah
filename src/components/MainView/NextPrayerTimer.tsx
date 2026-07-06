import { memo, useMemo } from 'react';
import { useCurrentPrayer, useNextPrayer, useTimeUntilNext, useSkyPhase, useSolarPosition, useMoonPosition } from '../../hooks/usePrayerTimes';

function generateStars(seed: number, count: number) {
  let s = seed;
  const next = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  const stars: Array<{ left: string; top: string; delay: string; duration: string; size: string; opacity: number }> = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      left: `${next() * 100}%`,
      top: `${next() * 85}%`,
      delay: `${next() * 8}s`,
      duration: `${2 + next() * 5}s`,
      size: `${0.5 + next() * 2.5}px`,
      opacity: 0.3 + next() * 0.7,
    });
  }
  return stars;
}

const starSeed = new Date().getTime();
const stars = generateStars(starSeed, 100);

const Star = memo(({ style }: { style: React.CSSProperties }) => (
  <div className="absolute rounded-full bg-white" style={style} />
));

const MoonCraters = () => (
  <>
    <div style={{ width: '16%', height: '16%', top: '22%', left: '42%', background: 'rgba(200,180,100,0.15)', borderRadius: '50%', position: 'absolute' }} />
    <div style={{ width: '11%', height: '11%', top: '48%', left: '28%', background: 'rgba(200,180,100,0.12)', borderRadius: '50%', position: 'absolute' }} />
    <div style={{ width: '9%', height: '9%', top: '16%', left: '60%', background: 'rgba(200,180,100,0.1)', borderRadius: '50%', position: 'absolute' }} />
    <div style={{ width: '7%', height: '7%', top: '60%', left: '50%', background: 'rgba(200,180,100,0.08)', borderRadius: '50%', position: 'absolute' }} />
    <div style={{ width: '5%', height: '5%', top: '35%', left: '72%', background: 'rgba(200,180,100,0.1)', borderRadius: '50%', position: 'absolute' }} />
  </>
);

function Clouds() {
  const s: React.CSSProperties = { position: 'absolute', borderRadius: '50%', filter: 'blur(12px)', pointerEvents: 'none' };
  return (
    <div className="absolute inset-x-0" style={{ bottom: '10%', height: '20%', pointerEvents: 'none' }}>
      <div style={{ ...s, width: '25%', height: '35%', left: '8%', bottom: '20%', background: 'rgba(255,255,255,0.035)' }} />
      <div style={{ ...s, width: '20%', height: '28%', left: '30%', bottom: '30%', background: 'rgba(255,255,255,0.03)' }} />
      <div style={{ ...s, width: '30%', height: '40%', right: '12%', bottom: '15%', background: 'rgba(255,255,255,0.04)' }} />
      <div style={{ ...s, width: '15%', height: '22%', left: '55%', bottom: '8%', background: 'rgba(255,255,255,0.025)' }} />
      <div style={{ ...s, width: '22%', height: '30%', right: '40%', bottom: '25%', background: 'rgba(255,255,255,0.03)' }} />
    </div>
  );
}

function PalmTrees() {
  return (
    <div className="absolute inset-x-0 pointer-events-none" style={{ bottom: 0, height: '28%', zIndex: 1 }}>
      <svg viewBox="0 0 120 200" className="absolute" style={{ left: '3%', bottom: 0, height: '65%', opacity: 0.25 }}>
        <path d="M60 200 L58 60" stroke="rgba(139,90,43,0.4)" strokeWidth="4" fill="none" />
        <path d="M58 60 Q30 30 10 40" stroke="rgba(34,139,34,0.3)" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M58 60 Q40 20 28 15" stroke="rgba(34,139,34,0.25)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M58 60 Q55 18 50 8" stroke="rgba(34,139,34,0.2)" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M58 60 Q75 25 90 30" stroke="rgba(34,139,34,0.25)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M58 60 Q80 32 100 50" stroke="rgba(34,139,34,0.2)" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
      <svg viewBox="0 0 120 200" className="absolute" style={{ right: '5%', bottom: 0, height: '55%', opacity: 0.2 }}>
        <path d="M60 200 L62 70" stroke="rgba(139,90,43,0.4)" strokeWidth="3.5" fill="none" />
        <path d="M62 70 Q35 35 15 45" stroke="rgba(34,139,34,0.25)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M62 70 Q42 25 30 20" stroke="rgba(34,139,34,0.2)" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M62 70 Q60 20 55 10" stroke="rgba(34,139,34,0.18)" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M62 70 Q78 28 95 35" stroke="rgba(34,139,34,0.2)" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
      <svg viewBox="0 0 80 160" className="absolute" style={{ left: '12%', bottom: 0, height: '40%', opacity: 0.15 }}>
        <path d="M40 160 L42 70" stroke="rgba(139,90,43,0.35)" strokeWidth="3" fill="none" />
        <path d="M42 70 Q22 45 8 50" stroke="rgba(34,139,34,0.2)" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M42 70 Q30 35 22 28" stroke="rgba(34,139,34,0.18)" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M42 70 Q55 40 68 48" stroke="rgba(34,139,34,0.18)" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default function NextPrayerTimer() {
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

  const gradient = phase?.gradient || 'linear-gradient(180deg, #080A1A 0%, #0E1230 25%, #151A3A 60%, #1A1F3E 100%)';

  const moonSize = useMemo(() => {
    const base = window.innerWidth * 0.05;
    return Math.max(45, Math.min(80, base));
  }, []);

  const moonTop = useMemo(() => {
    const p = Math.max(0, Math.min(100, ((elevation + 20) / 40) * 100));
    return `${5 + p * 0.25}%`;
  }, [elevation]);

  const moonRight = useMemo(() => {
    const p = Math.max(0, Math.min(100, ((elevation + 20) / 40) * 100));
    return `${14 - p * 0.04}%`;
  }, [elevation]);

  const moonIllumination = moonPos?.illumination ?? 0.5;
  const moonBrightness = 0.4 + moonIllumination * 0.6;
  const showClouds = !isNight || (isNight && elevation > -6);

  const birds = useMemo(() => {
    if (elevation < 5 || elevation > 60) return null;
    return Array.from({ length: 3 + Math.floor(Math.random() * 4) }, (_, i) => ({
      left: `${15 + Math.random() * 70}%`,
      top: `${18 + Math.random() * 28}%`,
      delay: `${Math.random() * 10}s`,
      duration: `${9 + Math.random() * 7}s`,
      size: 20 + Math.random() * 20,
    }));
  }, [elevation]);

  return (
    <div className="flex-1 min-h-0 relative overflow-hidden rounded-xl" style={{
      background: 'rgba(8, 10, 26, 0.5)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.06)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 80px rgba(255, 215, 0, 0.05)'
    }}>
      {/* Gradient bleed */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `${gradient.replace('180deg', '135deg')}`,
        opacity: 0.1,
      }} />

      {/* Stars */}
      {isNight && (
        <div className="absolute inset-0">
          {stars.map((star, i) => (
            <Star key={i} style={{
              left: star.left, top: star.top, width: star.size, height: star.size,
              animation: `twinkle ${star.duration} ease-in-out ${star.delay} infinite`,
              opacity: elevation < -12 ? star.opacity * 0.9 : star.opacity * Math.max(0.05, (elevation + 18) / 18 * 0.8),
            }} />
          ))}
          <Star style={{ left: '22%', top: '12%', width: 3, height: 3, animation: 'twinkle 3s ease-in-out 0.5s infinite', opacity: 0.6 }} />
          <Star style={{ left: '68%', top: '8%', width: 2.5, height: 2.5, animation: 'twinkle 4s ease-in-out 1.2s infinite', opacity: 0.5 }} />
          <Star style={{ left: '45%', top: '25%', width: 3.5, height: 3.5, animation: 'twinkle 3.5s ease-in-out 2s infinite', opacity: 0.55 }} />
        </div>
      )}

      {/* Moon */}
      {isNight && (
        <div className="absolute" style={{ top: moonTop, right: moonRight, width: moonSize, height: moonSize, transition: 'all 600ms ease-in-out', zIndex: 1 }}>
          <div className="absolute" style={{ top: '-30%', left: '-30%', width: '160%', height: '160%', borderRadius: '50%', background: `radial-gradient(circle, rgba(255,214,0,${0.08 * moonBrightness}) 0%, transparent 70%)` }} />
          <div className="w-full h-full rounded-full" style={{ background: `radial-gradient(circle at 35% 35%, #fff 0%, #f0e68c ${40 * moonBrightness}%, #daa520 100%)`, boxShadow: `0 0 ${moonSize * 0.5}px rgba(255, 215, 0, ${0.3 * moonBrightness})` }}>
            <div className="rounded-full" style={{ position: 'absolute', top: '-5%', left: '-10%', width: '92%', height: '92%', borderRadius: '50%', background: gradient }} />
            <MoonCraters />
          </div>
        </div>
      )}

      {/* Sun */}
      {!isNight && (
        <div className="absolute" style={{ top: `${Math.min(55, Math.max(4, 55 - elevation * 0.7))}%`, left: `${elevation < 10 ? 8 : 42}%`, width: moonSize * 1.1, height: moonSize * 1.1, transform: 'translate(-50%, -50%)', transition: 'all 800ms ease-in-out', zIndex: 1 }}>
          <div className="absolute" style={{ top: '-60%', left: '-60%', width: '220%', height: '220%', borderRadius: '50%', background: elevation < 5 ? 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(255,214,0,0.1) 0%, transparent 70%)' }} />
          <div className="absolute" style={{ top: '-40%', left: '-40%', width: '180%', height: '180%', borderRadius: '50%', background: 'conic-gradient(from 0deg, transparent 0deg, rgba(255,214,0,0.03) 10deg, transparent 20deg, rgba(255,214,0,0.03) 30deg, transparent 40deg, rgba(255,214,0,0.03) 50deg, transparent 60deg, rgba(255,214,0,0.03) 70deg, transparent 80deg, rgba(255,214,0,0.03) 90deg, transparent 100deg)', animation: 'rotateRays 30s linear infinite' }} />
          <div className="w-full h-full rounded-full" style={{
            background: elevation < 5 ? 'radial-gradient(circle at 45% 45%, #FFE34F 0%, #F59E0B 40%, #E67E22 100%)' : 'radial-gradient(circle at 45% 45%, #FFF8E1 0%, #FFD600 40%, #F59E0B 100%)',
            boxShadow: elevation < 5 ? `0 0 ${moonSize * 0.7}px rgba(245, 158, 11, 0.4)` : `0 0 ${moonSize * 0.5}px rgba(255, 214, 0, 0.3)`,
          }} />
        </div>
      )}

      {/* Clouds */}
      {showClouds && <Clouds />}

      {/* Birds */}
      {birds && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
          {birds.map((b, i) => (
            <svg key={i} viewBox="0 0 40 18" className="absolute" style={{ left: b.left, top: b.top, width: `${b.size}px`, animation: `birdFly ${b.duration} ease-in-out infinite`, animationDelay: b.delay }}>
              <path d="M2 9 Q10 1 18 7 Q26 1 34 7" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          ))}
        </div>
      )}

      {/* Palm Trees */}
      <PalmTrees />

      {/* Islamic pattern overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        zIndex: 2, opacity: phase?.patternOpacity ?? 0.03,
        backgroundImage: `linear-gradient(30deg, rgba(26,35,126,0.5) 12%, transparent 12.5%, transparent 87%, rgba(26,35,126,0.5) 87.5%), linear-gradient(150deg, rgba(26,35,126,0.5) 12%, transparent 12.5%, transparent 87%, rgba(26,35,126,0.5) 87.5%), linear-gradient(270deg, rgba(26,35,126,0.5) 12%, transparent 12.5%, transparent 87%, rgba(26,35,126,0.5) 87.5%), linear-gradient(30deg, rgba(26,35,126,0.5) 12%, transparent 12.5%, transparent 87%, rgba(26,35,126,0.5) 87.5%)`,
        backgroundSize: '80px 140px', backgroundPosition: '0 0, 0 0, 40px 70px, 40px 70px',
        mixBlendMode: 'overlay', transition: 'opacity 600ms ease-in-out',
      }} />

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center z-3" style={{ padding: '6px 10px', gap: '2px' }}>
        <span className="font-ui tracking-[2px] uppercase" style={{ fontSize: 'clamp(0.8rem, 1.5vw, 1.6rem)', color: 'rgba(255,255,255,0.45)' }}>
          NEXT PRAYER · الصلاة القادمة
        </span>

        <div className="flex items-baseline justify-center gap-3 w-full flex-wrap" style={{ padding: 0 }}>
          <span key={displayPrayer?.nameAr} dir="rtl" lang="ar" className="font-arabic-display leading-none animate-ink-flow hero-arabic-name"
            style={{
              fontSize: 'clamp(3.5rem, 12vw, 10rem)',
              whiteSpace: 'nowrap',
              background: 'linear-gradient(135deg, #FFD600 0%, #F59E0B 25%, #14B8A6 60%, #0D9488 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 40px rgba(245, 158, 11, 0.2))',
            }}>
            {displayPrayer?.nameAr || '—'}
          </span>
          <span             className="font-ui font-normal uppercase flex-shrink-0"
            style={{ fontSize: 'clamp(0.9rem, 1.8vw, 2rem)', color: 'rgba(255,255,255,0.45)' }}>
            {displayPrayer?.nameEn || '—'}
          </span>
        </div>

        <div className="flex flex-col items-center">
          <span className="font-mono font-medium leading-none hero-countdown"
            style={{
              fontSize: 'clamp(4rem, 14vw, 11rem)',
              letterSpacing: 'clamp(4px, 1vw, 12px)',
              color: '#FAFAFA',
              textShadow: '0 0 30px rgba(255,255,255,0.08)',
            }}>
            {countdown}
          </span>
          <span className="font-ui" style={{ fontSize: 'clamp(0.7rem, 1.2vw, 1.4rem)', marginTop: 0, color: 'rgba(255,255,255,0.4)' }}>
            time · الوقت حتى الصلاة القادمة
          </span>
        </div>

        <div className="w-full" style={{ maxWidth: 'min(650px, 85%)' }}>
          <div className="w-full h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full transition-all duration-300 ease-out" style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #F59E0B, #14B8A6)',
              boxShadow: '0 0 12px rgba(245, 158, 11, 0.3)',
            }} />
          </div>
          <div className="flex justify-between" style={{ marginTop: 0 }}>
            <span className="font-ui" style={{ fontSize: 'clamp(5px, 0.9vw, 10px)', color: 'rgba(255,255,255,0.35)' }}>
              {Math.round(progress)}% · منقضي
            </span>
            {nextPrayer && (
              <span className="font-ui" style={{ fontSize: 'clamp(5px, 0.9vw, 10px)', color: 'rgba(255,255,255,0.35)' }}>
                {nextPrayer.time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} · ينتهي
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}