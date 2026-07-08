import { useState, useEffect, useRef, useMemo, useId, memo } from 'react';
import { useSkyPhase, useMoonPosition } from '../../hooks/usePrayerTimes';
import { useStore } from '../../store';
import { calculateSunPosition, determineSkyPhase } from '../../utils/skyEngine';

const DEFAULT_GRADIENT = 'linear-gradient(180deg, #080A1A 0%, #0E1230 25%, #151A3A 60%, #1A1F3E 100%)';

/* ═══════════════════════════════════════════════════════════
   PALETTE — recolours the whole scene per time-of-day.
   Composition & tones inspired by the serene-lake reference:
   two-tone (sunlit/shadow) peaks, layered ridges, mirror lake.
   ═══════════════════════════════════════════════════════════ */
interface Palette {
  cloud: string; cloudUnder: string; cloudOpacity: number;
  farRidge: string;
  warmLight: string; warmDark: string;
  peakSun: string; peakShadow: string; peak2: string;
  midHill: string; ridgeTree: string;
  fgDark: string; fgRust: string;
  bank: string; bankLight: string;
  water: string; waterWarm: string; waterLight: string; reflOpacity: number;
  hazeWarm: string;
  sunCore: string; sunEdge: string; sunGlow: string;
  birdColor: string;
}

function getPalette(id: string): Palette {
  switch (id) {
    case 'morning':
      return { cloud:'#f6f2e6', cloudUnder:'#f0d2b0', cloudOpacity:0.92,
        farRidge:'#9cbdd2', warmLight:'#e6b088', warmDark:'#c895a0',
        peakSun:'#eaa47e', peakShadow:'#40608c', peak2:'#6080aa',
        midHill:'#3a7098', ridgeTree:'#2a4a6a', fgDark:'#163640', fgRust:'#7e5040',
        bank:'#508048', bankLight:'#74a656',
        water:'#34889a', waterWarm:'#e6b49c', waterLight:'#7cc6d0', reflOpacity:0.48,
        hazeWarm:'rgba(245,200,150,0.5)',
        sunCore:'#fff4cf', sunEdge:'#ffc233', sunGlow:'rgba(255,198,70,0.5)',
        birdColor:'rgba(20,40,55,0.55)' };
    case 'midday':
      return { cloud:'#f7ecd8', cloudUnder:'#f3c9a0', cloudOpacity:0.95,
        farRidge:'#93b4cb', warmLight:'#e9a878', warmDark:'#c58a92',
        peakSun:'#ea9a70', peakShadow:'#3c5c88', peak2:'#5a7aa6',
        midHill:'#366a94', ridgeTree:'#274766', fgDark:'#14323f', fgRust:'#7c4a38',
        bank:'#4c7c48', bankLight:'#6fa054',
        water:'#2f8296', waterWarm:'#e0a48c', waterLight:'#74c2cc', reflOpacity:0.5,
        hazeWarm:'rgba(240,185,135,0.55)',
        sunCore:'#fff1c0', sunEdge:'#ffb81a', sunGlow:'rgba(255,190,50,0.5)',
        birdColor:'rgba(18,38,52,0.55)' };
    case 'afternoon':
      return { cloud:'#fbeeda', cloudUnder:'#f6c69a', cloudOpacity:0.88,
        farRidge:'#a6b0c2', warmLight:'#e89a6a', warmDark:'#c07e84',
        peakSun:'#ec8f60', peakShadow:'#46567e', peak2:'#64749c',
        midHill:'#486a8a', ridgeTree:'#2e4660', fgDark:'#182e38', fgRust:'#855038',
        bank:'#567e42', bankLight:'#7ba24e',
        water:'#3c8496', waterWarm:'#eaa886', waterLight:'#78c0c4', reflOpacity:0.5,
        hazeWarm:'rgba(250,190,120,0.55)',
        sunCore:'#ffe9b0', sunEdge:'#ff9e18', sunGlow:'rgba(255,160,40,0.52)',
        birdColor:'rgba(40,30,15,0.5)' };
    case 'sunrise':
      return { cloud:'#ffd9b4', cloudUnder:'#ffb488', cloudOpacity:0.72,
        farRidge:'#b78fa0', warmLight:'#f0a878', warmDark:'#cf7f80',
        peakSun:'#ffb07a', peakShadow:'#6a4f7e', peak2:'#8a6a8e',
        midHill:'#7a5a80', ridgeTree:'#4a3550', fgDark:'#2a1f30', fgRust:'#8a4a40',
        bank:'#6a6a48', bankLight:'#94925a',
        water:'#b98a80', waterWarm:'#ffce9e', waterLight:'#d9b0a4', reflOpacity:0.55,
        hazeWarm:'rgba(255,180,110,0.6)',
        sunCore:'#fff0c8', sunEdge:'#ff9020', sunGlow:'rgba(255,140,40,0.6)',
        birdColor:'rgba(60,30,15,0.5)' };
    case 'sunset':
      return { cloud:'#ff9f68', cloudUnder:'#e07850', cloudOpacity:0.7,
        farRidge:'#8a5a78', warmLight:'#e07850', warmDark:'#a85462',
        peakSun:'#ff9a5c', peakShadow:'#4a3560', peak2:'#6e4a6e',
        midHill:'#5a3a5e', ridgeTree:'#341f3c', fgDark:'#1f0f1c', fgRust:'#7a3a30',
        bank:'#5a5236', bankLight:'#7e6e40',
        water:'#a5605e', waterWarm:'#ff9a6a', waterLight:'#c98a86', reflOpacity:0.55,
        hazeWarm:'rgba(255,120,50,0.6)',
        sunCore:'#ffe6b0', sunEdge:'#ff6a12', sunGlow:'rgba(255,90,20,0.6)',
        birdColor:'rgba(50,18,8,0.5)' };
    case 'maghrib':
      return { cloud:'#b070cc', cloudUnder:'#8a4aa0', cloudOpacity:0.32,
        farRidge:'#4a3560', warmLight:'#7a4a6a', warmDark:'#5a3452',
        peakSun:'#8a5a72', peakShadow:'#2c1c42', peak2:'#3e2a4e',
        midHill:'#2e1e42', ridgeTree:'#1a1028', fgDark:'#100a1a', fgRust:'#40202c',
        bank:'#2e2a30', bankLight:'#403c42',
        water:'#241a3e', waterWarm:'#4a2c50', waterLight:'#3a2c58', reflOpacity:0.42,
        hazeWarm:'rgba(150,50,120,0.4)',
        sunCore:'#ffc9a0', sunEdge:'#d8483a', sunGlow:'rgba(200,50,80,0.45)',
        birdColor:'rgba(0,0,0,0)' };
    case 'fajr':
      return { cloud:'#7d84b8', cloudUnder:'#5a5c90', cloudOpacity:0.28,
        farRidge:'#34365e', warmLight:'#4a4470', warmDark:'#383056',
        peakSun:'#5a5488', peakShadow:'#22213e', peak2:'#2e2c4e',
        midHill:'#24243e', ridgeTree:'#14142a', fgDark:'#0c0c1a', fgRust:'#2a2440',
        bank:'#22243a', bankLight:'#303452',
        water:'#141a38', waterWarm:'#2f2f60', waterLight:'#2a3768', reflOpacity:0.38,
        hazeWarm:'rgba(90,90,180,0.3)',
        sunCore:'#dfe4ff', sunEdge:'#8a90c8', sunGlow:'rgba(90,90,180,0.28)',
        birdColor:'rgba(0,0,0,0)' };
    default: // night, isha
      return { cloud:'#3a4268', cloudUnder:'#2a3050', cloudOpacity:0.12,
        farRidge:'#1e2848', warmLight:'#2a3252', warmDark:'#1e2440',
        peakSun:'#2a3458', peakShadow:'#141b34', peak2:'#1a2340',
        midHill:'#141d38', ridgeTree:'#0c1226', fgDark:'#070a16', fgRust:'#1a1e34',
        bank:'#0e1626', bankLight:'#16203a',
        water:'#0a1028', waterWarm:'#182046', waterLight:'#1a2a55', reflOpacity:0.34,
        hazeWarm:'rgba(40,50,110,0.25)',
        sunCore:'#ffffff', sunEdge:'#c8d2ff', sunGlow:'rgba(200,215,255,0.32)',
        birdColor:'rgba(0,0,0,0)' };
  }
}

/* ═══════════════════════════════════════════════════════════
   GEOMETRY — viewBox 1440 × 900, horizon (waterline) at y=560.
   ═══════════════════════════════════════════════════════════ */
const HORIZON = 560;

// Far pale ridge (right, behind hero peak)
const FAR_RIDGE = 'M720,560 L860,412 L950,452 L1050,388 L1160,448 L1270,402 L1380,452 L1440,424 L1440,560 Z';

// Left warm hills — back (darker) + front (lighter sunlit)
const WARM_BACK  = 'M0,560 L0,452 L120,410 L240,462 L360,414 L470,470 L540,560 Z';
const WARM_FRONT = 'M0,560 L0,504 L110,472 L235,508 L350,478 L470,512 L540,560 Z';

// Hero peak — shadow silhouette + sunlit left face
const PEAK_SHADOW = 'M430,560 L710,150 L800,300 L858,238 L1010,560 Z';
const PEAK_SUN    = 'M710,150 L430,560 L648,560 Z';
// crease detail lines on the sunlit face
const PEAK_CREASE = 'M710,150 L560,404 M710,150 L636,352';
// secondary blue peak (right of hero)
const PEAK2 = 'M820,560 L980,332 L1060,398 L1150,340 L1250,560 Z';

// Mid blue rounded hills (in front of peaks)
const MID_HILL = 'M0,560 C150,486 320,480 460,506 C620,536 760,486 900,508 C1040,530 1200,486 1330,508 C1400,520 1430,512 1440,514 L1440,560 Z';

// Foreground banks (green, at the waterline)
const BANK_LEFT  = 'M0,560 L0,540 C70,528 160,544 250,556 L250,560 Z';
const BANK_RIGHT = 'M1440,560 L1440,512 C1350,500 1230,522 1130,552 L1130,560 Z';
// Foreground dark landmasses under the banks
const FG_LEFT_MASS  = 'M0,560 L0,500 C70,486 150,506 220,540 L250,560 Z';
const FG_RIGHT_MASS = 'M1440,560 L1440,528 C1360,516 1250,532 1150,556 L1150,560 Z';

/* Pine tree — layered silhouette as one path (+ optional trunk) */
const Pine = memo(function Pine({ x, base, h, fill, trunk=false }:
  { x:number; base:number; h:number; fill:string; trunk?:boolean }) {
  const w = h * 0.5;
  const d =
    `M0,${-h} L${w*0.27},${-h*0.60} L${w*0.13},${-h*0.60} ` +
    `L${w*0.5},${-h*0.30} L${w*0.28},${-h*0.30} L${w*0.72},0 ` +
    `L${-w*0.72},0 L${-w*0.28},${-h*0.30} L${-w*0.5},${-h*0.30} ` +
    `L${-w*0.13},${-h*0.60} L${-w*0.27},${-h*0.60} Z`;
  return (
    <g transform={`translate(${x},${base})`} fill={fill}>
      {trunk && <rect x={-h*0.028} y={-h*0.02} width={h*0.056} height={h*0.14} />}
      <path d={d} />
    </g>
  );
});

// Foreground pines (large, with trunk) [x, base, h, kind]
const FG_PINES: [number, number, number, 'dark'|'rust'][] = [
  [44,559,208,'dark'],[112,561,252,'dark'],[178,557,176,'dark'],[228,561,138,'dark'],
  [1150,561,150,'dark'],[1212,563,222,'rust'],[1272,559,190,'dark'],
  [1334,565,256,'rust'],[1392,557,200,'dark'],[1436,561,158,'rust'],
];
// Small mid-distance pines scattered on ridges
const MID_PINES: [number, number, number][] = [
  [260,505,30],[298,508,24],[344,502,36],[392,509,26],[440,506,32],[300,472,26],
  [520,500,28],[250,455,22],[210,470,26],
];

/* ═══════════════════════════════════════════════════════════
   MOUNTAINS + TREES fragment (reused for the mirror reflection)
   ═══════════════════════════════════════════════════════════ */
function Mountains({ pal }: { pal:Palette }) {
  return (
    <>
      <path d={FAR_RIDGE} fill={pal.farRidge} />
      <path d={WARM_BACK} fill={pal.warmDark} />
      <path d={PEAK2} fill={pal.peak2} />
      <path d={PEAK_SHADOW} fill={pal.peakShadow} />
      <path d={PEAK_SUN} fill={pal.peakSun} />
      <path d={PEAK_CREASE} stroke={pal.peakShadow} strokeWidth="6" strokeOpacity="0.35" fill="none" strokeLinecap="round" />
      <path d={WARM_FRONT} fill={pal.warmLight} />
      <path d={MID_HILL} fill={pal.midHill} />
      {MID_PINES.map(([x,b,h],i) => h>0 && <Pine key={`m${i}`} x={x} base={b} h={h} fill={pal.ridgeTree} />)}
      {/* Foreground masses + banks */}
      <path d={FG_LEFT_MASS} fill={pal.fgDark} />
      <path d={FG_RIGHT_MASS} fill={pal.fgDark} />
      <path d={BANK_LEFT} fill={pal.bank} />
      <path d={BANK_RIGHT} fill={pal.bankLight} />
      {FG_PINES.map(([x,b,h,k],i) => (
        <Pine key={`f${i}`} x={x} base={b} h={h} trunk fill={k==='rust'?pal.fgRust:pal.fgDark} />
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   SCENE — one full landscape for a palette. Crossfaded by opacity.
   ═══════════════════════════════════════════════════════════ */
const Scene = memo(function Scene({ pal, speed, sunLeftPct, sunGlowOpacity }:
  { pal:Palette; speed:number; sunLeftPct:number; sunGlowOpacity:number }) {
  const uid = useId().replace(/:/g,'');
  const reflId = `refl${uid}`;
  const warmId = `warm${uid}`;
  const shimmer = [
    { y:'70%', w:'50%', left:'10%', dur:9,  delay:0 },
    { y:'78%', w:'36%', left:'38%', dur:11, delay:2 },
    { y:'86%', w:'42%', left:'20%', dur:8,  delay:4 },
    { y:'74%', w:'30%', left:'60%', dur:12, delay:1 },
    { y:'92%', w:'46%', left:'30%', dur:10, delay:3 },
  ];
  return (
    <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
      {/* Sun reflection glint on the water */}
      {sunGlowOpacity > 0.02 && (
        <div style={{
          position:'absolute', top:`${(HORIZON/900)*100}%`, left:`${sunLeftPct}%`, transform:'translateX(-50%)',
          width:'11%', height:'34%', opacity:sunGlowOpacity*0.6,
          background:`linear-gradient(180deg, ${pal.sunGlow} 0%, ${pal.sunGlow} 18%, transparent 100%)`,
          filter:'blur(7px)', transition:'left 1.5s ease',
          animation:'reflect-waver 6s ease-in-out infinite',
        }} />
      )}

      <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice"
        style={{ position:'absolute', inset:0, width:'100%', height:'100%', overflow:'hidden' }}>
        <defs>
          <linearGradient id={reflId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor={pal.water} stopOpacity="0" />
            <stop offset="100%" stopColor={pal.water} stopOpacity="0.9" />
          </linearGradient>
          <radialGradient id={warmId} cx="28%" cy="100%" r="62%">
            <stop offset="0%"  stopColor={pal.hazeWarm} />
            <stop offset="100%" stopColor={pal.hazeWarm.replace(/[\d.]+\)$/,'0)')} />
          </radialGradient>
        </defs>

        {/* Warm horizon glow behind the mountains */}
        <rect x="0" y="300" width="1440" height="260" fill={`url(#${warmId})`} />

        {/* wispy high cloud streaks */}
        <path d="M120,70 Q520,44 900,86" stroke={pal.cloud} strokeWidth="5" strokeOpacity="0.16" fill="none" strokeLinecap="round" />
        <path d="M600,120 Q980,96 1360,140" stroke={pal.cloud} strokeWidth="4" strokeOpacity="0.12" fill="none" strokeLinecap="round" />

        {/* Mountains + trees */}
        <Mountains pal={pal} />

        {/* Water */}
        <rect x="0" y={HORIZON} width="1440" height={900-HORIZON} fill={pal.water} />
        <rect x="0" y={HORIZON} width="1440" height="48" fill={pal.waterWarm} opacity="0.55" />

        {/* Mirror reflection */}
        <g transform={`translate(0,${HORIZON*2}) scale(1,-1)`} opacity={pal.reflOpacity}>
          <Mountains pal={pal} />
        </g>
        <rect x="0" y={HORIZON} width="1440" height={900-HORIZON} fill={`url(#${reflId})`} />
      </svg>

      {/* Water shimmer glints */}
      {shimmer.map((s,i) => (
        <div key={i} style={{
          position:'absolute', top:s.y, left:s.left, width:s.w, height:2, borderRadius:2,
          background:`linear-gradient(90deg, transparent, ${pal.waterLight}, transparent)`,
          animation:`water-shimmer ${s.dur/Math.max(1,speed*0.5)}s ease-in-out ${s.delay}s infinite`,
          willChange:'transform,opacity',
        }} />
      ))}
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════
   CLOUDS — soft stacked cumulus, cream top + peach underside.
   ═══════════════════════════════════════════════════════════ */
function CloudCluster({ cloud, under, opacity, width }:
  { cloud:string; under:string; opacity:number; width:number }) {
  const h = width * 0.6;
  return (
    <svg viewBox="0 0 240 144" width={width} height={h} style={{ display:'block', overflow:'visible' }}>
      {/* peach underside */}
      <ellipse cx="120" cy="104" rx="108" ry="30" fill={under} fillOpacity={opacity*0.85} />
      <ellipse cx="70"  cy="100" rx="52"  ry="26" fill={under} fillOpacity={opacity*0.8} />
      <ellipse cx="168" cy="100" rx="60"  ry="28" fill={under} fillOpacity={opacity*0.82} />
      {/* cream body puffs */}
      <ellipse cx="72"  cy="80" rx="52" ry="42" fill={cloud} fillOpacity={opacity} />
      <ellipse cx="120" cy="60" rx="62" ry="52" fill={cloud} fillOpacity={opacity} />
      <ellipse cx="170" cy="82" rx="54" ry="44" fill={cloud} fillOpacity={opacity} />
      <ellipse cx="40"  cy="96" rx="34" ry="28" fill={cloud} fillOpacity={opacity*0.96} />
      <ellipse cx="204" cy="96" rx="36" ry="30" fill={cloud} fillOpacity={opacity*0.96} />
    </svg>
  );
}
interface CloudCfg { top:number; width:number; dir:'rtl'|'ltr'; duration:number; delay:number; opa:number; }
const CLOUD_CFG: CloudCfg[] = [
  { top:1,  width:420, dir:'rtl', duration:160, delay:0,  opa:1.0 },
  { top:8,  width:300, dir:'ltr', duration:130, delay:22, opa:0.9 },
  { top:3,  width:360, dir:'rtl', duration:185, delay:48, opa:0.8 },
  { top:14, width:240, dir:'ltr', duration:115, delay:12, opa:0.85 },
];
function CloudLayer({ pal, speed }: { pal:Palette; speed:number }) {
  if (pal.cloudOpacity <= 0.05) return null;
  return (
    <div style={{ position:'absolute', top:0, left:0, right:0, height:'44%', overflow:'hidden', pointerEvents:'none', zIndex:3 }}>
      {CLOUD_CFG.map((c,i) => (
        <div key={i} style={{
          position:'absolute', top:`${c.top}%`, left:0,
          animation:`${c.dir==='rtl'?'cloud-drift':'cloud-drift-rev'} ${c.duration/speed}s linear ${c.delay/speed}s infinite`,
          willChange:'transform',
        }}>
          <CloudCluster cloud={pal.cloud} under={pal.cloudUnder} opacity={pal.cloudOpacity*c.opa} width={c.width} />
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   BIRDS — a big flock of flapping gulls crossing the sky.
   ═══════════════════════════════════════════════════════════ */
interface Bird { x:number; y:number; size:number; flapDur:number; flapDelay:number; }
function makeFlock(seed:number, count:number, spreadX:number, spreadY:number): Bird[] {
  let s = seed;
  const r = () => { s = (s*9301+49297)%233280; return s/233280; };
  const birds: Bird[] = [];
  const arm = Math.ceil(count/2);
  for (let i=0;i<arm;i++) {
    const jx=(r()-0.5)*10, jy=(r()-0.5)*7;
    birds.push({ x:i*spreadX+jx, y:i*spreadY+jy, size:16-i*0.35+r()*3, flapDur:0.55+r()*0.5, flapDelay:r()*0.9 });
    if (i>0) birds.push({ x:i*spreadX+jx, y:-i*spreadY+jy, size:16-i*0.35+r()*3, flapDur:0.55+r()*0.5, flapDelay:r()*0.9 });
  }
  return birds;
}
const BIG_FLOCK   = makeFlock(1337, 26, 21, 9);
const SMALL_FLOCK = makeFlock(7,    12, 15, 7);

const Gull = memo(({ b }: { b:Bird }) => (
  <svg width={b.size} height={b.size*0.5} viewBox="0 0 24 12"
    style={{ position:'absolute', left:b.x, top:b.y, overflow:'visible' }} aria-hidden="true">
    <path d="M1,9 Q6,3 12,8 Q18,3 23,9" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
      style={{ transformOrigin:'12px 8px', animation:`flap ${b.flapDur}s ease-in-out ${b.flapDelay}s infinite` }} />
  </svg>
));

function FlockLayer({ birds, color, top, dir, duration, delay, speed }:
  { birds:Bird[]; color:string; top:number; dir:'rtl'|'ltr'; duration:number; delay:number; speed:number }) {
  return (
    <div style={{
      position:'absolute', top:`${top}%`, left:0, color,
      animation:`${dir==='rtl'?'fly-rtl':'fly-ltr'} ${duration/speed}s linear ${delay/speed}s infinite`,
    }}>
      {birds.map((b,i) => <Gull key={i} b={b} />)}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   STARS + SHOOTING STARS
   ═══════════════════════════════════════════════════════════ */
function seededStars(seed:number, count:number) {
  let s = seed;
  const r = () => { s = (s*1103515245+12345)&0x7fffffff; return s/0x7fffffff; };
  return Array.from({ length: count }, () => ({
    left:`${r()*100}%`, top:`${r()*52}%`, delay:`${r()*6}s`,
    dur:`${2.4+r()*4}s`, size:`${0.6+r()*2.1}px`, op:0.35+r()*0.65,
  }));
}
const STARS = seededStars(20250708, 120);
const SHOOTING = [
  { top:'8%',  left:'12%', dur:9,  delay:2,  len:150 },
  { top:'16%', left:'55%', dur:13, delay:7,  len:190 },
  { top:'5%',  left:'72%', dur:11, delay:11, len:130 },
];

/* ═══════════════════════════════════════════════════════════
   SUN / MOON
   ═══════════════════════════════════════════════════════════ */
function Sun({ topPct, leftPct, size, opacity, pal }:
  { topPct:number; leftPct:number; size:number; opacity:number; pal:Palette }) {
  return (
    <div style={{
      position:'absolute', top:`${topPct}%`, left:`${leftPct}%`, width:size, height:size,
      transform:'translate(-50%,-50%)', zIndex:2, pointerEvents:'none',
      opacity, transition:'opacity 2.5s ease-in-out, top 1.5s ease, left 1.5s ease',
    }}>
      <div style={{
        position:'absolute', top:'-70%', left:'-70%', width:'240%', height:'240%', borderRadius:'50%',
        background:`radial-gradient(circle, ${pal.sunGlow} 0%, transparent 68%)`,
        animation:'celestial-glow 7s ease-in-out infinite',
      }} />
      <div style={{
        width:'100%', height:'100%', borderRadius:'50%',
        background:`radial-gradient(circle at 44% 42%, ${pal.sunCore} 0%, ${pal.sunCore} 14%, ${pal.sunEdge} 66%, ${pal.sunEdge} 100%)`,
        boxShadow:`0 0 ${size*0.6}px ${pal.sunGlow}`,
      }} />
    </div>
  );
}

function Moon({ topPct, leftPct, size, opacity }:
  { topPct:number; leftPct:number; size:number; opacity:number }) {
  return (
    <div style={{
      position:'absolute', top:`${topPct}%`, left:`${leftPct}%`, width:size, height:size,
      transform:'translate(-50%,-50%)', zIndex:6, pointerEvents:'none',
      opacity, transition:'opacity 2.5s ease-in-out, top 1.5s ease, left 1.5s ease',
    }}>
      {/* soft outer glow */}
      <div style={{
        position:'absolute', top:'-85%', left:'-85%', width:'270%', height:'270%', borderRadius:'50%',
        background:'radial-gradient(circle, rgba(214,226,255,0.45) 0%, rgba(200,214,255,0.20) 34%, rgba(190,206,255,0.07) 56%, transparent 74%)',
        animation:'celestial-glow 9s ease-in-out infinite',
      }} />
      {/* disc */}
      <div style={{
        position:'relative', width:'100%', height:'100%', borderRadius:'50%',
        background:'radial-gradient(circle at 38% 34%, #ffffff 0%, #f3f5fb 42%, #dbe0ee 78%, #c3cadf 100%)',
        boxShadow:'0 0 40px rgba(210,222,255,0.75), 0 0 90px rgba(200,214,255,0.4), inset -6px -6px 16px rgba(150,160,190,0.35), inset 5px 5px 14px rgba(255,255,255,0.5)',
        overflow:'hidden',
      }}>
        {/* soft maria / craters */}
        <div style={{ position:'absolute', width:'26%', height:'26%', top:'20%', left:'40%', background:'radial-gradient(circle, rgba(150,160,190,0.30), transparent 70%)', borderRadius:'50%' }} />
        <div style={{ position:'absolute', width:'18%', height:'18%', top:'52%', left:'26%', background:'radial-gradient(circle, rgba(150,160,190,0.26), transparent 70%)', borderRadius:'50%' }} />
        <div style={{ position:'absolute', width:'13%', height:'13%', top:'60%', left:'58%', background:'radial-gradient(circle, rgba(150,160,190,0.22), transparent 70%)', borderRadius:'50%' }} />
        <div style={{ position:'absolute', width:'10%', height:'10%', top:'30%', left:'66%', background:'radial-gradient(circle, rgba(150,160,190,0.2), transparent 70%)', borderRadius:'50%' }} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════════════════ */
function SkyBackground() {
  const phase             = useSkyPhase();
  const skyDisplayHours   = useStore((s) => s.skyDisplayHours);
  const skySliderAuto     = useStore((s) => s.skySliderAuto);
  const skySliderDragging = useStore((s) => s.skySliderDragging);
  const aodMode           = useStore((s) => s.aodMode);
  const settings          = useStore((s) => s.settings);
  useMoonPosition();

  const speed = skySliderDragging ? 16 : 1;

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const { targetGradient, phaseId, elevation, azimuth } = useMemo(() => {
    const lat = settings.coordinates.latitude || 25;
    const lon = settings.coordinates.longitude || 45;
    if (aodMode) return { targetGradient:'#000000', phaseId:'night', elevation:-40, azimuth:0 };
    if (!skySliderAuto && skyDisplayHours !== null) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      d.setHours(Math.floor(skyDisplayHours), Math.round((skyDisplayHours%1)*60), 0, 0);
      const pos = calculateSunPosition(d, lat, lon);
      const sp = determineSkyPhase(pos.elevation, pos.azimuth);
      return { targetGradient: sp.gradient, phaseId: sp.id, elevation: pos.elevation, azimuth: pos.azimuth };
    }
    const pos = calculateSunPosition(now, lat, lon);
    return { targetGradient: phase?.gradient ?? DEFAULT_GRADIENT, phaseId: phase?.id ?? 'night', elevation: pos.elevation, azimuth: pos.azimuth };
  }, [phase, skyDisplayHours, skySliderAuto, aodMode, settings.coordinates, now]);

  const pal = useMemo(() => getPalette(phaseId), [phaseId]);

  /* Crossfade sky gradient + scenery palette */
  const [layerA, setLayerA] = useState({ gradient: targetGradient, pal });
  const [layerB, setLayerB] = useState({ gradient: targetGradient, pal });
  const [active, setActive] = useState<'a'|'b'>('a');
  const prevPhase = useRef(phaseId);
  useEffect(() => {
    if (phaseId === prevPhase.current) return;
    prevPhase.current = phaseId;
    const next = { gradient: targetGradient, pal };
    if (active === 'a') { setLayerB(next); setActive('b'); }
    else                { setLayerA(next); setActive('a'); }
  }, [phaseId, targetGradient, pal, active]);

  /* Celestial geometry */
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const sunSize  = Math.max(105, Math.min(200, vw * 0.13));
  const moonSize = Math.max(95,  Math.min(165, vw * 0.105));

  const sunTop     = Math.min(66, Math.max(5, 60 - elevation * 0.85));
  const sunLeft    = Math.min(95, Math.max(5, ((azimuth - 60) / 240) * 90 + 5));
  const sunOpacity = Math.max(0, Math.min(1, (elevation + 6) / 7));

  // Moon rides high in the open sky (in front of the peaks) so it is never
  // occluded by the mountains — visible whenever the sun is down.
  const moonElev    = -elevation;
  const moonAz      = (azimuth + 180) % 360;
  const moonTop     = Math.min(40, Math.max(6, 42 - moonElev * 0.55));
  const moonLeft    = Math.min(92, Math.max(8, ((moonAz - 60) / 240) * 84 + 8));
  const moonOpacity = Math.max(0, Math.min(1, (moonElev + 6) / 9));

  const starFade  = elevation >= 3 ? 0 : elevation <= -15 ? 1 : (-elevation + 3) / 18;
  const showBirds = ['morning','midday','afternoon'].includes(phaseId);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden sky-bg">
      {/* Sky gradient crossfade (z0) */}
      <div style={{ position:'absolute', inset:0, background:layerA.gradient, opacity:active==='a'?1:0, transition:'opacity 2.5s cubic-bezier(0.4,0,0.2,1)' }} />
      <div style={{ position:'absolute', inset:0, background:layerB.gradient, opacity:active==='b'?1:0, transition:'opacity 2.5s cubic-bezier(0.4,0,0.2,1)' }} />

      {!aodMode && (
        <>
          {/* Stars + shooting stars (z1) */}
          {starFade > 0 && (
            <div style={{ position:'absolute', inset:0, zIndex:1, pointerEvents:'none' }}>
              {STARS.map((st,i) => (
                <div key={i} className="absolute rounded-full bg-white" style={{
                  left:st.left, top:st.top, width:st.size, height:st.size,
                  animation:`star-twinkle ${st.dur} ease-in-out ${st.delay} infinite`,
                  opacity:st.op*starFade, transition:'opacity 2.5s ease-in-out',
                }} />
              ))}
              {SHOOTING.map((sh,i) => (
                <div key={`sh${i}`} style={{
                  position:'absolute', top:sh.top, left:sh.left, width:sh.len, height:2,
                  background:'linear-gradient(90deg, rgba(255,255,255,0.9), rgba(255,255,255,0))',
                  borderRadius:2, opacity:starFade,
                  animation:`shoot ${sh.dur}s ease-in ${sh.delay}s infinite`,
                  filter:'drop-shadow(0 0 4px rgba(255,255,255,0.8))',
                }} />
              ))}
            </div>
          )}

          {/* Moon (z2) */}
          {moonOpacity > 0.01 && <Moon topPct={moonTop} leftPct={moonLeft} size={moonSize} opacity={moonOpacity} />}
          {/* Sun (z2) */}
          {sunOpacity > 0.01 && <Sun topPct={sunTop} leftPct={sunLeft} size={sunSize} opacity={sunOpacity} pal={pal} />}

          {/* Clouds (z3, behind mountains) */}
          <CloudLayer pal={pal} speed={speed} />

          {/* Landscape crossfade (z4) */}
          <div style={{ position:'absolute', inset:0, zIndex:4, pointerEvents:'none', opacity:active==='a'?1:0, transition:'opacity 2.5s cubic-bezier(0.4,0,0.2,1)' }}>
            <Scene pal={layerA.pal} speed={speed} sunLeftPct={sunLeft} sunGlowOpacity={sunOpacity} />
          </div>
          <div style={{ position:'absolute', inset:0, zIndex:4, pointerEvents:'none', opacity:active==='b'?1:0, transition:'opacity 2.5s cubic-bezier(0.4,0,0.2,1)' }}>
            <Scene pal={layerB.pal} speed={speed} sunLeftPct={sunLeft} sunGlowOpacity={sunOpacity} />
          </div>

          {/* Birds (z5, big flock, daytime) */}
          {showBirds && (
            <div style={{ position:'absolute', inset:0, overflow:'hidden', zIndex:5, pointerEvents:'none' }}>
              <FlockLayer birds={BIG_FLOCK}   color={pal.birdColor} top={18} dir="rtl" duration={58} delay={0}  speed={speed} />
              <FlockLayer birds={SMALL_FLOCK} color={pal.birdColor} top={10} dir="rtl" duration={78} delay={24} speed={speed} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default SkyBackground;
