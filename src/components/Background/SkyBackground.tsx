import { useState, useEffect, useRef, useMemo, memo } from 'react';
import { useSkyPhase } from '../../hooks/usePrayerTimes';
import { useStore } from '../../store';
import { calculateSunPosition, determineSkyPhase } from '../../utils/skyEngine';

const DEFAULT_GRADIENT = 'linear-gradient(180deg, #080A1A 0%, #0E1230 25%, #151A3A 60%, #1A1F3E 100%)';

/* ── Phase-aware scenery palette ─────────────────────────── */
interface Palette {
  farMtn: string; midMtn: string; nearMtn: string; meadow: string;
  treeColor: string; cloudFill: string; cloudOpacity: number;
  birdColor: string; horizonGlow: string;
}
function getPalette(id: string): Palette {
  switch (id) {
    case 'morning':
      return { farMtn:'#3a6a8a', midMtn:'#234a22', nearMtn:'#2a5a22', meadow:'#3a7228',
               treeColor:'#1a3a18', cloudFill:'#eef6ff', cloudOpacity:0.92, birdColor:'rgba(0,0,0,0.38)', horizonGlow:'rgba(255,200,100,0)' };
    case 'midday':
      return { farMtn:'#2a5a7a', midMtn:'#1a4a1a', nearMtn:'#246a20', meadow:'#2e7a22',
               treeColor:'#133a12', cloudFill:'#f4f9ff', cloudOpacity:0.94, birdColor:'rgba(20,40,60,0.35)', horizonGlow:'rgba(255,255,200,0)' };
    case 'afternoon':
      return { farMtn:'#4a6275', midMtn:'#2a4820', nearMtn:'#2e5820', meadow:'#387028',
               treeColor:'#1a3410', cloudFill:'#fff8ee', cloudOpacity:0.88, birdColor:'rgba(40,30,0,0.36)', horizonGlow:'rgba(255,180,50,0.06)' };
    case 'sunrise':
      return { farMtn:'#503060', midMtn:'#20182a', nearMtn:'#18201a', meadow:'#101810',
               treeColor:'#0c1008', cloudFill:'#ffd8a8', cloudOpacity:0.72, birdColor:'rgba(60,20,0,0.5)', horizonGlow:'rgba(255,120,30,0.35)' };
    case 'sunset':
      return { farMtn:'#5a3028', midMtn:'#28180e', nearMtn:'#1a1008', meadow:'#100a04',
               treeColor:'#0c0804', cloudFill:'#ffaa70', cloudOpacity:0.68, birdColor:'rgba(60,20,0,0.55)', horizonGlow:'rgba(240,80,10,0.45)' };
    case 'maghrib':
      return { farMtn:'#2a1040', midMtn:'#12081e', nearMtn:'#0c0812', meadow:'#080608',
               treeColor:'#060408', cloudFill:'#c080d8', cloudOpacity:0.28, birdColor:'rgba(80,40,120,0.5)', horizonGlow:'rgba(180,40,200,0.2)' };
    case 'fajr':
      return { farMtn:'#1a1838', midMtn:'#0c101c', nearMtn:'#080c10', meadow:'#060808',
               treeColor:'#040608', cloudFill:'#8090c0', cloudOpacity:0.18, birdColor:'rgba(60,60,100,0.4)', horizonGlow:'rgba(80,80,180,0.15)' };
    default: // night, isha
      return { farMtn:'#0c0e1c', midMtn:'#07090e', nearMtn:'#05080a', meadow:'#040607',
               treeColor:'#030406', cloudFill:'#ffffff', cloudOpacity:0, birdColor:'rgba(0,0,0,0)', horizonGlow:'rgba(0,0,0,0)' };
  }
}

/* ── Mountain paths (1440×340 viewBox) ───────────────────── */
// Far peaks: very tall, sharp, distant (y=50-95 range)
const FAR_MTN = `M0,220
L0,155 L40,125 L80,140 L130,98 L175,118 L225,82 L275,108 L330,70 L380,97
L435,60 L485,88 L538,55 L588,80 L640,62 L695,80 L748,54 L800,75
L855,57 L910,74 L965,52 L1020,70 L1078,50 L1135,68 L1190,52
L1248,70 L1305,52 L1360,68 L1440,58 L1440,340 L0,340 Z`;

// Mid mountains: forested slopes (y=130-168)
const MID_MTN = `M0,260
L0,210 L55,182 L115,200 L180,165 L248,188 L318,155 L390,178
L462,148 L535,170 L610,142 L682,163 L758,138 L832,158
L908,134 L982,154 L1058,130 L1132,150 L1208,132 L1285,150
L1365,134 L1440,142 L1440,340 L0,340 Z`;

// Near mountains: rocky ridgeline (y=200-248)
const NEAR_MTN = `M0,290
L0,248 L52,228 L108,246 L172,218 L242,240 L318,212 L398,236
L480,208 L565,232 L650,205 L735,228 L820,202 L908,225
L996,200 L1085,222 L1174,200 L1265,220 L1358,204 L1440,215
L1440,340 L0,340 Z`;

// Meadow foreground: smooth rolling hills
const MEADOW = `M0,310 C80,300 170,305 280,300 C390,295 500,302 620,298
C740,294 860,301 980,297 C1100,293 1220,299 1340,296
C1380,295 1420,297 1440,296 L1440,340 L0,340 Z`;

/* ── Tree rendering ──────────────────────────────────────── */
type TreeType = 'pine' | 'spruce' | 'deciduous' | 'dead' | 'bush';

function PineTree({ x, y, h, fill }: { x: number; y: number; h: number; fill: string }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <polygon points={`0,0 ${-h*0.38},${h} ${h*0.38},${h}`} fill={fill} fillOpacity="0.92" />
      <polygon points={`0,${h*0.45} ${-h*0.44},${h*1.05} ${h*0.44},${h*1.05}`} fill={fill} fillOpacity="0.85" />
      <rect x={-h*0.06} y={h*1.02} width={h*0.12} height={h*0.22} fill={fill} fillOpacity="0.7" />
    </g>
  );
}

function SpruceTree({ x, y, h, fill }: { x: number; y: number; h: number; fill: string }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <polygon points={`0,0 ${-h*0.28},${h*0.5} ${h*0.28},${h*0.5}`} fill={fill} fillOpacity="0.95" />
      <polygon points={`0,${h*0.32} ${-h*0.38},${h*0.72} ${h*0.38},${h*0.72}`} fill={fill} fillOpacity="0.9" />
      <polygon points={`0,${h*0.58} ${-h*0.46},${h} ${h*0.46},${h}`} fill={fill} fillOpacity="0.85" />
      <rect x={-h*0.07} y={h} width={h*0.14} height={h*0.2} fill={fill} fillOpacity="0.65" />
    </g>
  );
}

function DeciduousTree({ x, y, h, fill }: { x: number; y: number; h: number; fill: string }) {
  const rx = h * 0.42, ry = h * 0.36;
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x={-h*0.06} y={h*0.5} width={h*0.12} height={h*0.55} fill={fill} fillOpacity="0.65" />
      <ellipse cx={0} cy={h*0.38} rx={rx} ry={ry} fill={fill} fillOpacity="0.88" />
      <ellipse cx={-rx*0.45} cy={h*0.48} rx={rx*0.62} ry={ry*0.58} fill={fill} fillOpacity="0.75" />
      <ellipse cx={rx*0.45} cy={h*0.46} rx={rx*0.55} ry={ry*0.52} fill={fill} fillOpacity="0.72" />
    </g>
  );
}

function DeadTree({ x, y, h, fill }: { x: number; y: number; h: number; fill: string }) {
  const s = `${fill}`;
  return (
    <g transform={`translate(${x},${y})`} stroke={s} strokeWidth={h*0.06} fill="none" strokeLinecap="round">
      <line x1="0" y1="0" x2="0" y2={h} />
      <line x1="0" y1={h*0.3} x2={-h*0.28} y2={h*0.55} />
      <line x1="0" y1={h*0.3} x2={h*0.24} y2={h*0.52} />
      <line x1="-${h*0.28}" y1={h*0.55} x2={-h*0.38} y2={h*0.42} />
      <line x1="0" y1={h*0.55} x2={-h*0.18} y2={h*0.72} />
    </g>
  );
}

function BushTree({ x, y, h, fill }: { x: number; y: number; h: number; fill: string }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <ellipse cx={0}       cy={0}      rx={h*0.52} ry={h*0.42} fill={fill} fillOpacity="0.88" />
      <ellipse cx={-h*0.3}  cy={h*0.15} rx={h*0.35} ry={h*0.30} fill={fill} fillOpacity="0.75" />
      <ellipse cx={h*0.3}   cy={h*0.12} rx={h*0.32} ry={h*0.28} fill={fill} fillOpacity="0.72" />
    </g>
  );
}

function Tree({ x, y, h, type, fill }: { x: number; y: number; h: number; type: TreeType; fill: string }) {
  switch (type) {
    case 'pine':       return <PineTree       x={x} y={y} h={h} fill={fill} />;
    case 'spruce':     return <SpruceTree     x={x} y={y} h={h} fill={fill} />;
    case 'deciduous':  return <DeciduousTree  x={x} y={y} h={h} fill={fill} />;
    case 'dead':       return <DeadTree       x={x} y={y} h={h} fill={fill} />;
    case 'bush':       return <BushTree       x={x} y={y} h={h} fill={fill} />;
  }
}

// Trees placed along near-mountain ridge
// [x, y_base, type, height]
const TREE_LIST: [number, number, TreeType, number][] = [
  [30,  248,'pine',26],  [65,  240,'spruce',22], [100, 248,'pine',18],
  [140, 233,'deciduous',20], [175,240,'pine',24],  [210, 232,'spruce',28],
  [255, 242,'pine',20],  [295, 235,'bush',12],   [340, 218,'pine',30],
  [375, 228,'spruce',24],[415, 236,'pine',22],   [455, 222,'deciduous',26],
  [498, 215,'pine',28],  [530, 222,'spruce',22], [568, 232,'pine',18],
  [605, 220,'pine',24],  [645, 215,'dead',22],   [680, 224,'bush',14],
  [718, 230,'pine',20],  [755, 220,'spruce',26], [795, 218,'pine',22],
  [832, 215,'pine',28],  [870, 212,'deciduous',24],[908, 220,'spruce',20],
  [942, 214,'pine',26],  [980, 200,'pine',32],   [1012,208,'spruce',24],
  [1048,216,'bush',14],  [1085,208,'pine',24],   [1120,200,'pine',30],
  [1158,216,'spruce',22],[1196,210,'deciduous',26],[1235,200,'pine',28],
  [1272,208,'pine',22],  [1308,218,'spruce',20], [1345,210,'pine',26],
  [1382,215,'dead',20],  [1415,220,'pine',20],   [1435,215,'bush',12],
];

/* ── Crisp SVG Cloud shapes ──────────────────────────────── */
interface CloudProps { x: number; y: number; scale: number; fill: string; opacity: number; }

function CloudA({ x, y, scale: s, fill, opacity }: CloudProps) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} fill={fill} opacity={opacity}>
      <ellipse cx="60"  cy="38" rx="54" ry="26" />
      <ellipse cx="32"  cy="46" rx="30" ry="20" />
      <ellipse cx="90"  cy="44" rx="38" ry="22" />
      <ellipse cx="120" cy="48" rx="26" ry="18" />
    </g>
  );
}

function CloudB({ x, y, scale: s, fill, opacity }: CloudProps) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} fill={fill} opacity={opacity}>
      <ellipse cx="80"  cy="28" rx="76" ry="22" />
      <ellipse cx="42"  cy="38" rx="40" ry="20" />
      <ellipse cx="118" cy="36" rx="48" ry="22" />
      <ellipse cx="156" cy="42" rx="32" ry="18" />
    </g>
  );
}

function CloudC({ x, y, scale: s, fill, opacity }: CloudProps) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} fill={fill} opacity={opacity}>
      <ellipse cx="44"  cy="30" rx="40" ry="22" />
      <ellipse cx="22"  cy="38" rx="22" ry="16" />
      <ellipse cx="68"  cy="36" rx="32" ry="20" />
      <ellipse cx="92"  cy="42" rx="20" ry="14" />
    </g>
  );
}

function CloudD({ x, y, scale: s, fill, opacity }: CloudProps) {
  // Wispy long cloud
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} fill={fill} opacity={opacity}>
      <ellipse cx="90"  cy="22" rx="88" ry="16" />
      <ellipse cx="50"  cy="30" rx="48" ry="18" />
      <ellipse cx="130" cy="28" rx="60" ry="18" />
      <ellipse cx="172" cy="34" rx="38" ry="16" />
    </g>
  );
}

/* ── Bird flock system ───────────────────────────────────── */
interface FlockDef {
  id: number; top: number; duration: number; delay: number;
  dir: 'rtl' | 'ltr'; birdSize: number;
  offsets: [number, number][];
}

const FLOCKS: FlockDef[] = [
  { id:1, top:13, duration:36, delay:0,  dir:'rtl', birdSize:26,
    offsets:[[0,0],[28,-8],[28,8],[56,-15],[56,15]] },
  { id:2, top:21, duration:50, delay:11, dir:'ltr', birdSize:20,
    offsets:[[0,0],[-24,-7],[-24,7],[-48,-13]] },
  { id:3, top:9,  duration:42, delay:6,  dir:'rtl', birdSize:18,
    offsets:[[0,0],[22,-6],[22,6]] },
  { id:4, top:17, duration:58, delay:24, dir:'ltr', birdSize:24,
    offsets:[[0,0],[-30,-9],[-30,9],[-60,-16],[-60,16]] },
  { id:5, top:26, duration:33, delay:9,  dir:'rtl', birdSize:16,
    offsets:[[0,0],[20,-5],[20,5],[40,-9]] },
  { id:6, top:15, duration:65, delay:38, dir:'ltr', birdSize:22,
    offsets:[[0,0],[-26,-7],[-26,7]] },
  { id:7, top:19, duration:44, delay:18, dir:'rtl', birdSize:20,
    offsets:[[0,0],[24,-6],[24,6],[48,-11],[48,11]] },
];

// Bird SVG — realistic soaring silhouette
function BirdSvg({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 32 10" width={size} height={size * 0.32} fill="none"
      style={{ display:'block', overflow:'visible' }} aria-hidden="true">
      <path d="M0,4 C6,-2 13,-3 16,0 C19,-3 26,-2 32,4"
        stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

const Flock = memo(({ flock, color }: { flock: FlockDef; color: string }) => {
  const anim = `${flock.dir === 'rtl' ? 'fly-rtl' : 'fly-ltr'} ${flock.duration}s linear ${flock.delay}s infinite`;
  return (
    <div style={{
      position: 'absolute', top: `${flock.top}%`, left: 0,
      animation: anim, color, pointerEvents: 'none',
    }}>
      {flock.offsets.map(([ox, oy], i) => (
        <div key={i} style={{ position: 'absolute', left: ox, top: oy }}>
          <BirdSvg size={flock.birdSize} />
        </div>
      ))}
    </div>
  );
});

/* ── Horizon glow (sunrise/sunset) ───────────────────────── */
function HorizonGlow({ color }: { color: string }) {
  if (color === 'rgba(0,0,0,0)') return null;
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      background: `radial-gradient(ellipse 80% 30% at 50% 100%, ${color}, transparent)`,
      transition: 'background 3s ease-in-out',
    }} />
  );
}

/* ── Scenery composite ───────────────────────────────────── */
function SceneryLayer({ phaseId }: { phaseId: string }) {
  const p = getPalette(phaseId);
  const isDay = ['morning','midday','afternoon','sunrise','sunset','maghrib','fajr'].includes(phaseId);
  const showClouds = p.cloudOpacity > 0.1;
  const showBirds  = ['morning','midday','afternoon'].includes(phaseId);

  // Darken tree color a bit
  const tc = p.treeColor;

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">

      {/* Horizon glow */}
      <HorizonGlow color={p.horizonGlow} />

      {/* Birds (daytime only) */}
      {showBirds && (
        <div style={{ position:'absolute', inset:0, overflow:'hidden' }}>
          {FLOCKS.map(f => <Flock key={f.id} flock={f} color={p.birdColor} />)}
        </div>
      )}

      {/* SVG: mountains + trees + clouds */}
      <svg
        viewBox="0 0 1440 340"
        preserveAspectRatio="xMidYMax slice"
        style={{ position:'absolute', bottom:0, left:0, width:'100%', height:'68%' }}
      >
        {/* Far mountains */}
        <path d={FAR_MTN} fill={p.farMtn} opacity="0.82" style={{ transition:'fill 3s ease' }} />

        {/* Subtle snow caps on far mountain peaks */}
        {isDay && (
          <g opacity="0.35" fill="white">
            <polygon points="435,60 420,80 450,80" />
            <polygon points="538,55 522,76 554,76" />
            <polygon points="640,62 624,80 656,80" />
            <polygon points="748,54 732,74 764,74" />
            <polygon points="855,57 840,76 870,76" />
            <polygon points="965,52 950,72 980,72" />
            <polygon points="1078,50 1063,70 1093,70" />
            <polygon points="1190,52 1175,70 1205,70" />
            <polygon points="1305,52 1290,70 1320,70" />
          </g>
        )}

        {/* Mid mountains */}
        <path d={MID_MTN} fill={p.midMtn} opacity="0.9" style={{ transition:'fill 3s ease' }} />

        {/* Near mountains */}
        <path d={NEAR_MTN} fill={p.nearMtn} opacity="0.95" style={{ transition:'fill 3s ease' }} />

        {/* Trees on near mountain */}
        {TREE_LIST.map(([x, y, type, h], i) => (
          <Tree key={i} x={x} y={y} h={h} type={type} fill={tc} />
        ))}

        {/* Meadow */}
        <path d={MEADOW} fill={p.meadow} opacity="0.97" style={{ transition:'fill 3s ease' }} />

        {/* Clouds (in SVG so they're above mountains but respect scenery layer) */}
        {showClouds && (
          <g style={{ transition: 'opacity 3s ease' }}>
            <g style={{ animation: 'cloud-drift 90s linear 0s infinite' }}>
              <CloudB x={80}  y={18} scale={1.1} fill={p.cloudFill} opacity={p.cloudOpacity * 0.95} />
            </g>
            <g style={{ animation: 'cloud-drift 130s linear 15s infinite' }}>
              <CloudD x={350} y={8}  scale={0.95} fill={p.cloudFill} opacity={p.cloudOpacity * 0.85} />
            </g>
            <g style={{ animation: 'cloud-drift-rev 75s linear 8s infinite' }}>
              <CloudA x={680} y={22} scale={0.9}  fill={p.cloudFill} opacity={p.cloudOpacity * 0.90} />
            </g>
            <g style={{ animation: 'cloud-drift 110s linear 30s infinite' }}>
              <CloudC x={920} y={12} scale={1.05} fill={p.cloudFill} opacity={p.cloudOpacity * 0.88} />
            </g>
            <g style={{ animation: 'cloud-drift-rev 95s linear 45s infinite' }}>
              <CloudB x={1160}y={28} scale={0.85} fill={p.cloudFill} opacity={p.cloudOpacity * 0.82} />
            </g>
            <g style={{ animation: 'cloud-drift 160s linear 5s infinite' }}>
              <CloudD x={-200}y={5}  scale={1.2}  fill={p.cloudFill} opacity={p.cloudOpacity * 0.78} />
            </g>
            <g style={{ animation: 'cloud-drift-rev 120s linear 60s infinite' }}>
              <CloudA x={500} y={35} scale={0.75} fill={p.cloudFill} opacity={p.cloudOpacity * 0.70} />
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────── */
function SkyBackground() {
  const phase = useSkyPhase();
  const skyDisplayHours = useStore((s) => s.skyDisplayHours);
  const skySliderAuto   = useStore((s) => s.skySliderAuto);
  const aodMode         = useStore((s) => s.aodMode);
  const settings        = useStore((s) => s.settings);

  const { targetGradient, phaseId } = useMemo(() => {
    if (aodMode) return { targetGradient: '#000000', phaseId: 'night' };
    if (!skySliderAuto && skyDisplayHours !== null) {
      const now = new Date();
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      d.setHours(Math.floor(skyDisplayHours), Math.round((skyDisplayHours % 1) * 60), 0, 0);
      const lat = settings.coordinates.latitude || 25;
      const lon = settings.coordinates.longitude || 45;
      const pos = calculateSunPosition(d, lat, lon);
      const sp  = determineSkyPhase(pos.elevation, pos.azimuth);
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
    if (active === 'a') { setLayerB(targetGradient); setActive('b'); }
    else                { setLayerA(targetGradient); setActive('a'); }
  }, [targetGradient, active]);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden sky-bg">
      <div style={{ position:'absolute', inset:0, background:layerA,
        opacity: active==='a'?1:0, transition:'opacity 2s cubic-bezier(0.4,0,0.2,1)' }} />
      <div style={{ position:'absolute', inset:0, background:layerB,
        opacity: active==='b'?1:0, transition:'opacity 2s cubic-bezier(0.4,0,0.2,1)' }} />
      {!aodMode && <SceneryLayer phaseId={phaseId} />}
    </div>
  );
}

export default SkyBackground;
