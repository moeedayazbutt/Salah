import { useState, useEffect, useRef, useMemo, memo } from 'react';
import { useSkyPhase } from '../../hooks/usePrayerTimes';
import { useStore } from '../../store';
import { calculateSunPosition, determineSkyPhase } from '../../utils/skyEngine';

const DEFAULT_GRADIENT = 'linear-gradient(180deg, #080A1A 0%, #0E1230 25%, #151A3A 60%, #1A1F3E 100%)';

/* ── Scenery colour palettes per phase ──────────────────────── */
interface SceneryPalette {
  farMtn: string;
  midMtn: string;
  nearMtn: string;
  meadow: string;
  cloudOpacity: number;
  cloudColor: string;
}

function getPalette(phaseId: string): SceneryPalette {
  switch (phaseId) {
    case 'morning':
      return { farMtn: '#3a6a8a', midMtn: '#2d5a3a', nearMtn: '#3a7a3a', meadow: '#4a8a3a', cloudOpacity: 0.88, cloudColor: '#e8f4ff' };
    case 'midday':
      return { farMtn: '#2a5a7a', midMtn: '#286a28', nearMtn: '#38802a', meadow: '#4a9a38', cloudOpacity: 0.92, cloudColor: '#f0f8ff' };
    case 'afternoon':
      return { farMtn: '#4a6a7a', midMtn: '#3a6030', nearMtn: '#3a7030', meadow: '#4a8832', cloudOpacity: 0.85, cloudColor: '#fff8e8' };
    case 'sunrise':
      return { farMtn: '#4a304a', midMtn: '#2a2038', nearMtn: '#1e2a1e', meadow: '#2a3820', cloudOpacity: 0.7, cloudColor: '#ffd8b0' };
    case 'sunset':
      return { farMtn: '#5a3030', midMtn: '#3a2020', nearMtn: '#201818', meadow: '#282018', cloudOpacity: 0.65, cloudColor: '#ffb080' };
    case 'maghrib':
      return { farMtn: '#2a1838', midMtn: '#1a1028', nearMtn: '#100c18', meadow: '#0e100e', cloudOpacity: 0.3, cloudColor: '#c090d0' };
    case 'fajr':
      return { farMtn: '#1a1830', midMtn: '#101420', nearMtn: '#0a0e14', meadow: '#080c0a', cloudOpacity: 0.2, cloudColor: '#8090c0' };
    default: // night, isha
      return { farMtn: '#0e1020', midMtn: '#08100e', nearMtn: '#060c0a', meadow: '#040a06', cloudOpacity: 0.0, cloudColor: '#ffffff' };
  }
}

/* ── Animated Bird ──────────────────────────────────────────── */
const Bird = memo(({ style }: { style: React.CSSProperties }) => (
  <svg
    viewBox="0 0 40 14"
    fill="none"
    style={{ position: 'absolute', ...style }}
    aria-hidden="true"
  >
    <path d="M0,7 Q10,0 20,7 Q30,0 40,7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
  </svg>
));

/* ── Cloud blob ─────────────────────────────────────────────── */
const CloudBlob = memo(({ style, color }: { style: React.CSSProperties; color: string }) => (
  <div style={{
    position: 'absolute',
    ...style,
    background: color,
    borderRadius: '50% 50% 45% 45%',
    filter: 'blur(2px)',
  }} />
));

/* ── Scenery layer ──────────────────────────────────────────── */
function SceneryLayer({ phaseId }: { phaseId: string }) {
  const p = getPalette(phaseId);
  const isDay = ['morning', 'midday', 'afternoon', 'sunrise', 'sunset'].includes(phaseId);

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ transition: 'opacity 3s ease-in-out' }}
    >
      {/* ── Clouds ── */}
      {isDay && (
        <div style={{ position: 'absolute', inset: 0, opacity: p.cloudOpacity, transition: 'opacity 3s ease-in-out' }}>
          {/* Cloud 1 — slow */}
          <div className="cloud-drift-slow" style={{ position: 'absolute', top: '8%', left: '5%' }}>
            <CloudBlob color={p.cloudColor} style={{ width: 180, height: 52, top: 0, left: 0, opacity: 0.9 }} />
            <CloudBlob color={p.cloudColor} style={{ width: 120, height: 42, top: -18, left: 30, opacity: 0.95 }} />
            <CloudBlob color={p.cloudColor} style={{ width: 90, height: 36, top: -10, left: 70, opacity: 0.8 }} />
          </div>
          {/* Cloud 2 — medium */}
          <div className="cloud-drift-medium" style={{ position: 'absolute', top: '5%', left: '40%' }}>
            <CloudBlob color={p.cloudColor} style={{ width: 140, height: 44, top: 0, left: 0, opacity: 0.88 }} />
            <CloudBlob color={p.cloudColor} style={{ width: 100, height: 38, top: -14, left: 22, opacity: 0.92 }} />
            <CloudBlob color={p.cloudColor} style={{ width: 70, height: 30, top: -6, left: 55, opacity: 0.78 }} />
          </div>
          {/* Cloud 3 — fast */}
          <div className="cloud-drift-fast" style={{ position: 'absolute', top: '12%', left: '70%' }}>
            <CloudBlob color={p.cloudColor} style={{ width: 110, height: 38, top: 0, left: 0, opacity: 0.82 }} />
            <CloudBlob color={p.cloudColor} style={{ width: 80, height: 30, top: -12, left: 18, opacity: 0.88 }} />
          </div>
          {/* Cloud 4 — very slow, large */}
          <div className="cloud-drift-xslow" style={{ position: 'absolute', top: '3%', left: '-10%' }}>
            <CloudBlob color={p.cloudColor} style={{ width: 220, height: 64, top: 0, left: 0, opacity: 0.7 }} />
            <CloudBlob color={p.cloudColor} style={{ width: 150, height: 50, top: -22, left: 42, opacity: 0.78 }} />
            <CloudBlob color={p.cloudColor} style={{ width: 110, height: 42, top: -12, left: 90, opacity: 0.65 }} />
          </div>
        </div>
      )}

      {/* ── Birds ── */}
      {isDay && (
        <div style={{ position: 'absolute', inset: 0, color: 'rgba(0,0,0,0.35)', transition: 'opacity 3s ease' }}>
          <Bird style={{ width: 28, top: '18%', animation: 'bird-fly-1 28s linear 0s infinite' }} />
          <Bird style={{ width: 22, top: '22%', animation: 'bird-fly-2 36s linear 4s infinite', opacity: 0.8 }} />
          <Bird style={{ width: 18, top: '15%', animation: 'bird-fly-1 44s linear 8s infinite', opacity: 0.7 }} />
          <Bird style={{ width: 24, top: '26%', animation: 'bird-fly-3 32s linear 14s infinite', opacity: 0.9 }} />
          <Bird style={{ width: 16, top: '20%', animation: 'bird-fly-2 50s linear 20s infinite', opacity: 0.6 }} />
          <Bird style={{ width: 20, top: '14%', animation: 'bird-fly-3 38s linear 2s infinite', opacity: 0.75 }} />
        </div>
      )}

      {/* ── Mountains ── */}
      <svg
        viewBox="0 0 1440 340"
        preserveAspectRatio="xMidYMax slice"
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, width: '100%', height: '65%' }}
        aria-hidden="true"
      >
        {/* Far mountain range */}
        <path
          d="M0,240 C60,210 130,225 200,195 C260,172 320,185 400,160 C470,140 540,155 620,138 C690,122 760,130 840,118 C910,108 980,125 1060,110 C1130,98 1210,115 1290,105 C1350,98 1400,112 1440,108 L1440,340 L0,340 Z"
          fill={p.farMtn}
          style={{ transition: 'fill 3s ease-in-out' }}
          opacity="0.85"
        />
        {/* Mid mountain range */}
        <path
          d="M0,268 C50,248 110,258 180,238 C240,220 310,242 390,224 C460,208 530,230 610,218 C680,208 750,225 830,212 C900,200 970,220 1050,208 C1120,196 1200,215 1280,205 C1360,195 1410,212 1440,208 L1440,340 L0,340 Z"
          fill={p.midMtn}
          style={{ transition: 'fill 3s ease-in-out' }}
          opacity="0.9"
        />
        {/* Near mountain / rolling hills */}
        <path
          d="M0,292 C80,278 160,285 260,272 C360,260 440,278 560,268 C660,260 740,274 860,264 C960,256 1060,272 1180,262 C1280,254 1360,268 1440,264 L1440,340 L0,340 Z"
          fill={p.nearMtn}
          style={{ transition: 'fill 3s ease-in-out' }}
          opacity="0.92"
        />
        {/* Meadow foreground — rolling hills */}
        <path
          d="M0,314 C120,302 240,308 380,298 C500,290 620,302 760,295 C880,288 1000,298 1140,292 C1260,286 1360,296 1440,292 L1440,340 L0,340 Z"
          fill={p.meadow}
          style={{ transition: 'fill 3s ease-in-out' }}
          opacity="0.95"
        />
        {/* Tree silhouettes on near mountain */}
        {[100, 180, 260, 400, 500, 620, 740, 870, 980, 1100, 1220, 1340].map((x, i) => (
          <g key={i} transform={`translate(${x}, ${i % 3 === 0 ? 262 : i % 3 === 1 ? 268 : 264})`} opacity="0.85">
            {/* Pine tree */}
            <polygon points="0,-28 -8,0 8,0" fill={p.nearMtn} style={{ transition: 'fill 3s ease-in-out', filter: 'brightness(0.7)' }} />
            <polygon points="0,-20 -7,4 7,4" fill={p.nearMtn} style={{ transition: 'fill 3s ease-in-out', filter: 'brightness(0.65)' }} />
            <rect x="-2" y="0" width="4" height="8" fill={p.nearMtn} style={{ transition: 'fill 3s ease-in-out', filter: 'brightness(0.55)' }} />
          </g>
        ))}
      </svg>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────── */
function SkyBackground() {
  const phase = useSkyPhase();
  const skyDisplayHours = useStore((s) => s.skyDisplayHours);
  const skySliderAuto = useStore((s) => s.skySliderAuto);
  const aodMode = useStore((s) => s.aodMode);
  const settings = useStore((s) => s.settings);

  const { targetGradient, phaseId } = useMemo(() => {
    if (aodMode) return { targetGradient: '#000000', phaseId: 'night' };
    if (!skySliderAuto && skyDisplayHours !== null) {
      const now = new Date();
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      d.setHours(Math.floor(skyDisplayHours), Math.round((skyDisplayHours % 1) * 60), 0, 0);
      const lat = settings.coordinates.latitude || 25;
      const lon = settings.coordinates.longitude || 45;
      const pos = calculateSunPosition(d, lat, lon);
      const sp = determineSkyPhase(pos.elevation, pos.azimuth);
      return { targetGradient: sp.gradient, phaseId: sp.id };
    }
    return { targetGradient: phase?.gradient ?? DEFAULT_GRADIENT, phaseId: phase?.id ?? 'night' };
  }, [phase, skyDisplayHours, skySliderAuto, aodMode, settings.coordinates]);

  const [layerA, setLayerA] = useState(targetGradient);
  const [layerB, setLayerB] = useState(targetGradient);
  const [active, setActive] = useState<'a' | 'b'>('a');
  const prevRef = useRef(targetGradient);

  useEffect(() => {
    if (targetGradient === prevRef.current) return;
    prevRef.current = targetGradient;
    if (active === 'a') {
      setLayerB(targetGradient);
      setActive('b');
    } else {
      setLayerA(targetGradient);
      setActive('a');
    }
  }, [targetGradient, active]);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden sky-bg">
      {/* Sky gradient crossfade layers */}
      <div style={{
        position: 'absolute', inset: 0,
        background: layerA,
        opacity: active === 'a' ? 1 : 0,
        transition: 'opacity 2s cubic-bezier(0.4,0,0.2,1)',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: layerB,
        opacity: active === 'b' ? 1 : 0,
        transition: 'opacity 2s cubic-bezier(0.4,0,0.2,1)',
      }} />

      {/* Animated natural scenery */}
      {!aodMode && <SceneryLayer phaseId={phaseId} />}
    </div>
  );
}

export default SkyBackground;
