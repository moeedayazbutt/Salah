import { useState, useEffect, useRef, useMemo, useId, memo } from 'react';
import { useSkyPhase, useMoonPosition } from '../../hooks/usePrayerTimes';
import { useStore } from '../../store';
import { calculateSunPosition, calculateSunPositionFromPrayers, determineSkyPhase, getMoonPath } from '../../utils/skyEngine';
import birdGif from '../../assets/bird1.gif';
import mooseAnim from '../../assets/moose_anim.webp';

const DEFAULT_GRADIENT = 'linear-gradient(180deg, #080A1A 0%, #0E1230 25%, #151A3A 60%, #1A1F3E 100%)';

/* ═══════════════════════════════════════════════════════════
   PALETTE — recolours the whole scene per time-of-day.
   Composition & tones inspired by the serene-lake reference:
   two-tone (sunlit/shadow) peaks, layered ridges, mirror lake.
   ═══════════════════════════════════════════════════════════ */
export interface Palette {
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

export function getPalette(id: string): Palette {
  switch (id) {
    case 'morning':
      return { cloud:'#f6f2e6', cloudUnder:'#f0d2b0', cloudOpacity:0.92,
        farRidge:'#9cbdd2', warmLight:'#e6b088', warmDark:'#c895a0',
        peakSun:'#eaa47e', peakShadow:'#40608c', peak2:'#6080aa',
        midHill:'#3a7098', ridgeTree:'#2a4a6a', fgDark:'#163640', fgRust:'#7e5040',
        bank:'#508048', bankLight:'#74a656',
        water:'#34889a', waterWarm:'#e6b49c', waterLight:'#7cc6d0', reflOpacity:0.30,
        hazeWarm:'rgba(245,200,150,0.5)',
        sunCore:'#fff4cf', sunEdge:'#ffc233', sunGlow:'rgba(255,198,70,0.5)',
        birdColor:'rgba(20,40,55,0.55)' } as any;
    case 'midday':
      return { cloud:'#f7ecd8', cloudUnder:'#f3c9a0', cloudOpacity:0.95,
        farRidge:'#93b4cb', warmLight:'#e9a878', warmDark:'#c58a92',
        peakSun:'#ea9a70', peakShadow:'#3c5c88', peak2:'#5a7aa6',
        midHill:'#366a94', ridgeTree:'#274766', fgDark:'#14323f', fgRust:'#7c4a38',
        bank:'#4c7c48', bankLight:'#6fa054',
        water:'#2f8296', waterWarm:'#e0a48c', waterLight:'#74c2cc', reflOpacity:0.32,
        hazeWarm:'rgba(240,185,135,0.55)',
        sunCore:'#fff1c0', sunEdge:'#ffb81a', sunGlow:'rgba(255,190,50,0.5)',
        birdColor:'rgba(18,38,52,0.55)' } as any;
    case 'afternoon':
      return { cloud:'#fbeeda', cloudUnder:'#f6c69a', cloudOpacity:0.88,
        farRidge:'#a6b0c2', warmLight:'#e89a6a', warmDark:'#c07e84',
        peakSun:'#ec8f60', peakShadow:'#46567e', peak2:'#64749c',
        midHill:'#486a8a', ridgeTree:'#2e4660', fgDark:'#182e38', fgRust:'#855038',
        bank:'#567e42', bankLight:'#7ba24e',
        water:'#3c8496', waterWarm:'#eaa886', waterLight:'#78c0c4', reflOpacity:0.32,
        hazeWarm:'rgba(250,190,120,0.55)',
        sunCore:'#ffe9b0', sunEdge:'#ff9e18', sunGlow:'rgba(255,160,40,0.52)',
        birdColor:'rgba(40,30,15,0.5)' } as any;
    case 'sunrise':
      return { cloud:'#ffd9b4', cloudUnder:'#ffb488', cloudOpacity:0.72,
        farRidge:'#b78fa0', warmLight:'#f0a878', warmDark:'#cf7f80',
        peakSun:'#ffb07a', peakShadow:'#6a4f7e', peak2:'#8a6a8e',
        midHill:'#7a5a80', ridgeTree:'#4a3550', fgDark:'#2a1f30', fgRust:'#8a4a40',
        bank:'#6a6a48', bankLight:'#94925a',
        water:'#b98a80', waterWarm:'#ffce9e', waterLight:'#d9b0a4', reflOpacity:0.35,
        hazeWarm:'rgba(255,180,110,0.6)',
        sunCore:'#fff0c8', sunEdge:'#ff9020', sunGlow:'rgba(255,140,40,0.6)',
        birdColor:'rgba(60,30,15,0.5)' } as any;
    case 'sunset':
      return { cloud:'#ff9f68', cloudUnder:'#e07850', cloudOpacity:0.7,
        farRidge:'#8a5a78', warmLight:'#e07850', warmDark:'#a85462',
        peakSun:'#ff9a5c', peakShadow:'#4a3560', peak2:'#6e4a6e',
        midHill:'#5a3a5e', ridgeTree:'#341f3c', fgDark:'#1f0f1c', fgRust:'#7a3a30',
        bank:'#5a5236', bankLight:'#7e6e40',
        water:'#a5605e', waterWarm:'#ff9a6a', waterLight:'#c98a86', reflOpacity:0.35,
        hazeWarm:'rgba(255,120,50,0.6)',
        sunCore:'#ffe6b0', sunEdge:'#ff6a12', sunGlow:'rgba(255,90,20,0.6)',
        birdColor:'rgba(50,18,8,0.5)' } as any;
    case 'maghrib':
      return { cloud:'#b070cc', cloudUnder:'#8a4aa0', cloudOpacity:0.32,
        farRidge:'#4a3560', warmLight:'#7a4a6a', warmDark:'#5a3452',
        peakSun:'#8a5a72', peakShadow:'#2c1c42', peak2:'#3e2a4e',
        midHill:'#2e1e42', ridgeTree:'#1a1028', fgDark:'#100a1a', fgRust:'#40202c',
        bank:'#2e2a30', bankLight:'#403c42',
        water:'#241a3e', waterWarm:'#4a2c50', waterLight:'#3a2c58', reflOpacity:0.28,
        hazeWarm:'rgba(150,50,120,0.4)',
        sunCore:'#ffc9a0', sunEdge:'#d8483a', sunGlow:'rgba(200,50,80,0.45)',
        birdColor:'rgba(0,0,0,0)' } as any;
    case 'fajr':
      return { cloud:'#7d84b8', cloudUnder:'#5a5c90', cloudOpacity:0.28,
        farRidge:'#34365e', warmLight:'#4a4470', warmDark:'#383056',
        peakSun:'#5a5488', peakShadow:'#22213e', peak2:'#2e2c4e',
        midHill:'#24243e', ridgeTree:'#14142a', fgDark:'#0c0c1a', fgRust:'#2a2440',
        bank:'#22243a', bankLight:'#303452',
        water:'#141a38', waterWarm:'#2f2f60', waterLight:'#2a3768', reflOpacity:0.25,
        hazeWarm:'rgba(90,90,180,0.3)',
        sunCore:'#dfe4ff', sunEdge:'#8a90c8', sunGlow:'rgba(90,90,180,0.28)',
        birdColor:'rgba(0,0,0,0)' } as any;
    default: // night, isha
      return { cloud:'#3a4268', cloudUnder:'#2a3050', cloudOpacity:0.12,
        farRidge:'#1e2848', warmLight:'#2a3252', warmDark:'#1e2440',
        peakSun:'#2a3458', peakShadow:'#141b34', peak2:'#1a2340',
        midHill:'#141d38', ridgeTree:'#0c1226', fgDark:'#070a16', fgRust:'#1a1e34',
        bank:'#0e1626', bankLight:'#16203a',
        water:'#0a1028', waterWarm:'#182046', waterLight:'#1a2a55', reflOpacity:0.22,
        hazeWarm:'rgba(40,50,110,0.25)',
        sunCore:'#ffffff', sunEdge:'#c8d2ff', sunGlow:'rgba(200,215,255,0.32)',
        birdColor:'rgba(0,0,0,0)' } as any;
  }
}

/* ═══════════════════════════════════════════════════════════
   GEOMETRY — viewBox 1440 × 900, landscape horizon at y=560, waterline at y=575.
   ═══════════════════════════════════════════════════════════ */
const WATERLINE = 575;

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

      {/* Shore / beach ground strip where trees meet water */}
      <path
        d="M0,556 C30,558 90,562 180,560 C220,559 260,561 310,560 L310,570 L0,570 Z"
        fill={pal.bank} opacity="0.7"
      />
      <path
        d="M0,560 C40,563 120,566 200,563 C260,561 310,564 310,563 L310,572 L0,572 Z"
        fill={pal.bankLight} opacity="0.45"
      />
      <path
        d="M1100,556 C1150,558 1220,562 1300,560 C1360,559 1410,561 1440,560 L1440,570 L1100,570 Z"
        fill={pal.bank} opacity="0.7"
      />
      <path
        d="M1100,560 C1160,563 1250,566 1340,563 C1400,561 1440,564 1440,563 L1440,572 L1100,572 Z"
        fill={pal.bankLight} opacity="0.45"
      />

      {/* Moose/deer herd using the stock animation — WebP faces LEFT by default */}
      {/* Herd group 1: walks left-to-right, 4 animals — scaleX(-1) flips both direction and sprite */}
      {[
        { xOff: 0,  yBase: 532, size: 26, speed: 180, delay: 0 },
        { xOff: 28, yBase: 534, size: 22, speed: 180, delay: 0 },
        { xOff: 52, yBase: 531, size: 28, speed: 180, delay: 0 },
        { xOff: 72, yBase: 535, size: 20, speed: 180, delay: 0 },
      ].map((m, i) => (
        <g key={`moose-ltr-${i}`} style={{
          animation: `moose-walk-rtl ${m.speed}s linear ${m.delay}s infinite`,
          transform: 'scaleX(-1)',
        }}>
          <image href={mooseAnim} width={m.size * 2} height={m.size * 1.05} x={m.xOff - m.size} y={m.yBase - m.size * 0.8} />
        </g>
      ))}

      {/* Herd group 2: walks right-to-left, 3 animals — no flip needed (faces left by default) */}
      {[
        { xOff: 0,  yBase: 534, size: 24, speed: 210, delay: 40 },
        { xOff: 26, yBase: 532, size: 26, speed: 210, delay: 40 },
        { xOff: 50, yBase: 536, size: 20, speed: 210, delay: 40 },
      ].map((m, i) => (
        <g key={`moose-rtl-${i}`} style={{
          animation: `moose-walk-rtl ${m.speed}s linear ${m.delay}s infinite`,
        }}>
          <image href={mooseAnim} width={m.size * 2} height={m.size * 1.05} x={m.xOff - m.size} y={m.yBase - m.size * 0.8} />
        </g>
      ))}

      {FG_PINES.map(([x,b,h,k],i) => (
        <Pine key={`f${i}`} x={x} base={b} h={h} trunk fill={k==='rust'?pal.fgRust:pal.fgDark} />
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   SCENE — one full landscape for a palette. Crossfaded by opacity.
   ═══════════════════════════════════════════════════════════ */
const Scene = memo(function Scene({
  pal, speed, sunLeftPct, sunGlowOpacity,
  starFade, moonOpacity, moonTop, moonLeft, moonSize,
  sunOpacity, sunTop, sunSize
}: {
  pal:Palette; speed:number; sunLeftPct:number; sunGlowOpacity:number;
  starFade:number; moonOpacity:number; moonTop:number; moonLeft:number; moonSize:number;
  sunOpacity:number; sunTop:number; sunSize:number;
}) {
  const uid = useId().replace(/:/g,'');
  const reflId = `refl${uid}`;
  const warmId = `warm${uid}`;
  const shimmer = [
    { y:'74%', w:'50%', left:'10%', dur:14,  delay:0 },
    { y:'82%', w:'36%', left:'38%', dur:17, delay:3 },
    { y:'90%', w:'42%', left:'20%', dur:12,  delay:5 },
    { y:'78%', w:'30%', left:'60%', dur:18, delay:1 },
    { y:'95%', w:'46%', left:'30%', dur:15, delay:4 },
  ];
  return (
    <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
      {/* Sun reflection glint on the water */}
      {sunGlowOpacity > 0.02 && (
        <div style={{
          position:'absolute', top:`${(WATERLINE/900)*100}%`, left:`${sunLeftPct}%`, transform:'translateX(-50%)',
          width:'11%', height:'34%', opacity:sunGlowOpacity*0.6,
          background:`linear-gradient(180deg, ${pal.sunGlow} 0%, ${pal.sunGlow} 18%, transparent 100%)`,
          filter:'blur(7px)', transition:'left 1.5s ease',
          animation:'reflect-waver 12s ease-in-out infinite',
        }} />
      )}

      {/* Sun reflection in the water */}
      {sunOpacity > 0.01 && (
        <div className="portrait-scale-landscape" style={{
          position: 'absolute',
          top: `${62.2 + (62.2 - sunTop)}%`,
          left: `${sunLeftPct}%`,
          width: sunSize,
          height: sunSize,
          transform: 'translate(-50%, -50%) scaleY(-1)',
          opacity: sunOpacity * 0.45,
          filter: 'blur(3px) url(#water-waves)',
          pointerEvents: 'none',
          transition: 'opacity 2.5s ease-in-out, top 1.5s ease, left 1.5s ease',
        }}>
          {/* Sun core reflection */}
          <div style={{
            width: '100%', height: '100%', borderRadius: '50%',
            background: `radial-gradient(circle, ${pal.sunCore} 0%, ${pal.sunEdge} 70%, transparent 100%)`,
          }} />
        </div>
      )}

      {/* Moon reflection in the water */}
      {moonOpacity > 0.01 && (
        <div className="portrait-scale-landscape" style={{
          position: 'absolute',
          top: `${62.2 + (62.2 - moonTop)}%`,
          left: `${moonLeft}%`,
          width: moonSize,
          height: moonSize,
          transform: 'translate(-50%, -50%) scaleY(-1)',
          opacity: moonOpacity * 0.45,
          filter: 'blur(2.5px) url(#water-waves)',
          pointerEvents: 'none',
          transition: 'opacity 2.5s ease-in-out, top 1.5s ease, left 1.5s ease',
        }}>
          <Moon topPct={50} leftPct={50} size={moonSize} opacity={1} />
        </div>
      )}

      <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice"
        style={{ position:'absolute', inset:0, width:'100%', height:'100%', overflow:'hidden' }}>
        <defs>
          <linearGradient id={reflId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor={pal.water} stopOpacity="0" />
            <stop offset="100%" stopColor={pal.water} stopOpacity="0.9" />
          </linearGradient>
          <radialGradient id={warmId} cx={`${sunLeftPct}%`} cy="100%" r="62%">
            <stop offset="0%"  stopColor={pal.hazeWarm} />
            <stop offset="100%" stopColor={pal.hazeWarm.replace(/[\d.]+\)$/,'0)')} />
          </radialGradient>
          <filter id="water-waves" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.015 0.08" numOctaves="3" result="noise">
              <animate attributeName="baseFrequency" dur="40s" values="0.012 0.06;0.018 0.10;0.012 0.06" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="12" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>

        {/* Warm horizon glow behind the mountains */}
        <rect x="0" y="300" width="1440" height="260" fill={`url(#${warmId})`} />

        {/* wispy high cloud streaks */}
        <path d="M120,70 Q520,44 900,86" stroke={pal.cloud} strokeWidth="5" strokeOpacity="0.16" fill="none" strokeLinecap="round" />
        <path d="M600,120 Q980,96 1360,140" stroke={pal.cloud} strokeWidth="4" strokeOpacity="0.12" fill="none" strokeLinecap="round" />

        {/* Mountains + trees */}
        {/* Mountains + trees */}
        <g className="portrait-scale-landscape">
          {/* BACKGROUND FIREFLIES: Rendered behind mountains and trees (appear/disappear behind them) */}
          {starFade > 0.05 && (
            <g style={{ opacity: starFade }}>
              {[
                // Left cluster mid pines / tree bases (y closer to water horizon 560)
                { x: 50, y: 540, r: 0.8, dur: 5.2, delay: 0.5, drift: 'firefly-drift-1' },
                { x: 75, y: 535, r: 0.8, dur: 4.8, delay: 1.1, drift: 'firefly-drift-2' },
                { x: 90, y: 550, r: 1.1, dur: 5.8, delay: 0.3, drift: 'firefly-drift-2' },
                { x: 110, y: 530, r: 0.8, dur: 4.2, delay: 0.8, drift: 'firefly-drift-1' },
                { x: 135, y: 545, r: 0.8, dur: 5.0, delay: 1.7, drift: 'firefly-drift-2' },
                { x: 160, y: 540, r: 1.1, dur: 4.6, delay: 1.7, drift: 'firefly-drift-1' },
                { x: 190, y: 535, r: 0.8, dur: 6.0, delay: 2.2, drift: 'firefly-drift-2' },
                { x: 220, y: 548, r: 0.8, dur: 4.5, delay: 0.9, drift: 'firefly-drift-1' },
                
                // Mid distance hills
                { x: 260, y: 515, r: 0.8, dur: 5.3, delay: 0.6, drift: 'firefly-drift-2' },
                { x: 298, y: 520, r: 0.8, dur: 4.9, delay: 1.3, drift: 'firefly-drift-1' },
                { x: 344, y: 512, r: 0.8, dur: 5.7, delay: 2.5, drift: 'firefly-drift-2' },
                { x: 392, y: 518, r: 0.8, dur: 4.4, delay: 0.2, drift: 'firefly-drift-1' },
                { x: 440, y: 515, r: 0.8, dur: 6.2, delay: 1.9, drift: 'firefly-drift-2' },
                { x: 480, y: 510, r: 0.8, dur: 5.1, delay: 1.1, drift: 'firefly-drift-1' },
                { x: 520, y: 512, r: 0.8, dur: 4.7, delay: 0.4, drift: 'firefly-drift-2' },

                // Right cluster tree bases
                { x: 1160, y: 535, r: 0.8, dur: 5.4, delay: 0.7, drift: 'firefly-drift-1' },
                { x: 1190, y: 540, r: 1.1, dur: 5.3, delay: 0.8, drift: 'firefly-drift-2' },
                { x: 1220, y: 532, r: 0.8, dur: 4.6, delay: 1.5, drift: 'firefly-drift-1' },
                { x: 1260, y: 548, r: 0.8, dur: 6.1, delay: 2.1, drift: 'firefly-drift-2' },
                { x: 1300, y: 542, r: 1.1, dur: 4.9, delay: 2.0, drift: 'firefly-drift-1' },
                { x: 1350, y: 538, r: 0.8, dur: 5.6, delay: 1.2, drift: 'firefly-drift-2' },
                { x: 1410, y: 545, r: 0.8, dur: 4.3, delay: 0.5, drift: 'firefly-drift-1' },
              ].map((ff, i) => (
                <circle
                  key={`bg-ff-${i}`}
                  cx={ff.x}
                  cy={ff.y}
                  r={ff.r}
                  fill="#bfff00"
                  filter="drop-shadow(0 0 3px #bfff00)"
                  style={{
                    animation: `firefly-glow ${ff.dur}s ease-in-out ${ff.delay}s infinite, ${ff.drift} ${ff.dur + 2}s ease-in-out ${ff.delay}s infinite`,
                    transformOrigin: `${ff.x}px ${ff.y}px`,
                  }}
                />
              ))}
            </g>
          )}

          <Mountains pal={pal} />
          


          {/* FOREGROUND FIREFLIES: Rendered in front of trees, contains larger and traveling particles */}
          {starFade > 0.05 && (
            <g style={{ opacity: starFade }}>
              {[
                // Left cluster foreground (y closer to water horizon 560, radius 1.6)
                { x: 44, y: 535, r: 1.6, dur: 4.8, delay: 0.0, anim: 'firefly-drift-1' },
                { x: 70, y: 545, r: 1.6, dur: 5.2, delay: 1.3, anim: 'firefly-drift-2' },
                { x: 112, y: 520, r: 1.6, dur: 7.5, delay: 0.5, anim: 'firefly-travel-left' }, // travels!
                { x: 140, y: 542, r: 1.6, dur: 4.5, delay: 2.0, anim: 'firefly-drift-1' },
                { x: 178, y: 530, r: 1.6, dur: 5.0, delay: 1.5, anim: 'firefly-drift-2' },
                { x: 200, y: 548, r: 1.6, dur: 5.6, delay: 0.9, anim: 'firefly-drift-1' },
                { x: 228, y: 535, r: 1.6, dur: 4.7, delay: 0.8, anim: 'firefly-drift-2' },
                { x: 250, y: 540, r: 1.6, dur: 4.2, delay: 0.3, anim: 'firefly-drift-1' },

                // Right cluster foreground
                { x: 1150, y: 535, r: 1.6, dur: 4.9, delay: 0.2, anim: 'firefly-drift-2' },
                { x: 1175, y: 548, r: 1.6, dur: 5.3, delay: 1.0, anim: 'firefly-drift-1' },
                { x: 1212, y: 525, r: 1.6, dur: 8.0, delay: 1.7, anim: 'firefly-travel-right' }, // travels!
                { x: 1240, y: 540, r: 1.6, dur: 4.7, delay: 2.2, anim: 'firefly-drift-2' },
                { x: 1272, y: 530, r: 1.6, dur: 4.4, delay: 0.9, anim: 'firefly-drift-1' },
                { x: 1300, y: 545, r: 1.6, dur: 5.1, delay: 1.6, anim: 'firefly-drift-2' },
                { x: 1334, y: 532, r: 1.6, dur: 6.0, delay: 2.5, anim: 'firefly-drift-1' },
                { x: 1360, y: 548, r: 1.6, dur: 4.8, delay: 0.7, anim: 'firefly-drift-2' },
                { x: 1392, y: 538, r: 1.6, dur: 4.6, delay: 1.1, anim: 'firefly-drift-1' },
                { x: 1415, y: 546, r: 1.6, dur: 5.5, delay: 1.9, anim: 'firefly-drift-2' },
                { x: 1436, y: 535, r: 1.6, dur: 5.3, delay: 0.4, anim: 'firefly-drift-1' },
                { x: 1450, y: 542, r: 1.6, dur: 4.9, delay: 1.3, anim: 'firefly-drift-2' },
              ].map((ff, i) => (
                <circle
                  key={`fg-ff-${i}`}
                  cx={ff.x}
                  cy={ff.y}
                  r={ff.r}
                  fill="#bfff00"
                  filter="drop-shadow(0 0 3px #bfff00) drop-shadow(0 0 6px #bfff00)"
                  style={{
                    animation: `firefly-glow ${ff.dur}s ease-in-out ${ff.delay}s infinite, ${ff.anim} ${ff.dur + 2}s ease-in-out ${ff.delay}s infinite`,
                    transformOrigin: `${ff.x}px ${ff.y}px`,
                  }}
                />
              ))}
            </g>
          )}
        </g>

        {/* Water */}
        <rect x="0" y={WATERLINE} width="1440" height={900-WATERLINE} fill={pal.water} />
        <rect x="0" y={WATERLINE} width="1440" height="48" fill={pal.waterWarm} opacity="0.55" />
        {/* Milky white water overlay */}
        <rect x="0" y={WATERLINE} width="1440" height={900-WATERLINE} fill="rgba(255, 255, 255, 0.32)" style={{ mixBlendMode: 'overlay' }} />

        {/* Bubbles popping up from the water */}
        <g style={{ pointerEvents: 'none' }}>
          {[
            { x: 260, y: 880, r: 2.8, dur: 5.8, delay: 0.5 },
            { x: 340, y: 850, r: 3.5, dur: 6.5, delay: 2.2 },
            { x: 480, y: 890, r: 2.2, dur: 5.0, delay: 1.1 },
            { x: 610, y: 860, r: 3.0, dur: 7.2, delay: 3.8 },
            { x: 750, y: 875, r: 2.6, dur: 6.0, delay: 0.2 },
            { x: 890, y: 840, r: 3.8, dur: 8.0, delay: 4.5 },
            { x: 1020, y: 885, r: 2.4, dur: 5.4, delay: 1.7 },
            { x: 1180, y: 865, r: 3.2, dur: 6.8, delay: 3.1 },
            { x: 1320, y: 895, r: 2.0, dur: 4.8, delay: 0.9 },
            { x: 150, y: 870, r: 3.4, dur: 7.0, delay: 5.2 },
            { x: 540, y: 878, r: 2.7, dur: 6.3, delay: 2.7 },
            { x: 960, y: 892, r: 3.1, dur: 7.8, delay: 1.4 },
          ].map((b, i) => (
            <g key={`bubble-${i}`} transform={`translate(${b.x}, ${b.y})`}>
              <circle
                cx="0"
                cy="0"
                r={b.r}
                fill="rgba(255, 255, 255, 0.25)"
                stroke={pal.waterLight}
                strokeWidth="0.6"
                style={{
                  animation: `bubble-rise ${b.dur}s ease-in ${b.delay}s infinite, bubble-sway ${b.dur * 0.4}s ease-in-out infinite`,
                }}
              />
            </g>
          ))}
        </g>

        {/* Water reflections of celestial elements */}
        <foreignObject x="0" y={WATERLINE} width="1440" height={900-WATERLINE}>
          <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
            <div className="portrait-scale-landscape" style={{
              position: 'absolute', bottom: '100%', left: 0, right: 0, height: '900px',
              transform: 'scaleY(-1)', transformOrigin: 'bottom', filter: 'blur(3.5px) url(#water-waves)', opacity: 0.75
            }}>
              {/* Stars reflection */}
              {starFade > 0 && STARS.map((st,i) => (
                <div key={`refl-star-${i}`} className="absolute rounded-full bg-white" style={{
                  left:st.left, top:st.top, width:st.size, height:st.size,
                  animation:`star-twinkle ${st.dur} ease-in-out ${st.delay} infinite`,
                  opacity:st.op*starFade * 0.7,
                }} />
              ))}
              {/* Clouds reflection */}
              {pal.cloudOpacity > 0.05 && CLOUD_CFG.map((c,i) => (
                <div key={`refl-cloud-${i}`} style={{
                  position:'absolute', top:`${c.top}%`, left:0,
                  animation:`${c.dir==='rtl'?'cloud-drift':'cloud-drift-rev'} ${c.duration/speed}s linear ${c.delay/speed}s infinite`,
                }}>
                  <CloudCluster cloud={pal.cloud} under={pal.cloudUnder} opacity={pal.cloudOpacity*c.opa * 0.8} width={c.width} />
                </div>
              ))}
              {/* Birds reflection in water */}
              {starFade < 0.95 && [
                { top: '14%', speed: 120, delay: 0, size: 24 },
              ].map((b, i) => (
                <img key={`refl-bird-${i}`} src={birdGif} alt="" style={{
                  position: 'absolute', top: b.top,
                  width: `${b.size}px`, height: 'auto',
                  animation: `flock-fly-rtl ${b.speed}s linear ${b.delay}s infinite`,
                  filter: 'brightness(0) saturate(0%)',
                  opacity: 0.5,
                  pointerEvents: 'none',
                }} />
              ))}
              {/* Fireflies reflection in water */}
              {starFade > 0.05 && [
                { left: '4%',  top: '62%', dur: 4.8 },
                { left: '10%', top: '68%', dur: 5.2 },
                { left: '17%', top: '64%', dur: 5.8 },
                { left: '22%', top: '72%', dur: 4.5 },
                { left: '30%', top: '66%', dur: 5.0 },
                { left: '36%', top: '76%', dur: 6.2 },
                { left: '42%', top: '70%', dur: 4.2 },
                { left: '48%', top: '63%', dur: 5.5 },
                { left: '55%', top: '74%', dur: 4.9 },
                { left: '62%', top: '68%', dur: 5.3 },
                { left: '70%', top: '61%', dur: 6.0 },
                { left: '76%', top: '72%', dur: 4.6 },
                { left: '82%', top: '65%', dur: 5.1 },
                { left: '88%', top: '70%', dur: 4.7 },
                { left: '94%', top: '64%', dur: 5.6 },
              ].map((ff, i) => (
                <div key={`refl-ff-${i}`} className="rounded-full" style={{
                  position: 'absolute', left: ff.left, top: ff.top,
                  width: '3px', height: '3px',
                  background: '#bfff00',
                  boxShadow: '0 0 4px #bfff00',
                  opacity: starFade * 0.35,
                  animation: `firefly-glow ${ff.dur}s ease-in-out infinite`,
                }} />
              ))}
            </div>
          </div>
        </foreignObject>

        {/* Mirror reflection */}
        <g transform={`translate(0,${WATERLINE*2}) scale(1,-1)`} opacity={pal.reflOpacity} filter="url(#water-waves)" className="portrait-scale-landscape">
          <Mountains pal={pal} />
        </g>
        <rect x="0" y={WATERLINE} width="1440" height={900-WATERLINE} fill={`url(#${reflId})`} />
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
  { top:8,  width:300, dir:'ltr', duration:130, delay:-22, opa:0.9 },
  { top:3,  width:360, dir:'rtl', duration:185, delay:-48, opa:0.8 },
  { top:14, width:240, dir:'ltr', duration:115, delay:-12, opa:0.85 },
];
function CloudLayer({ pal, speed, foreground = false }: { pal:Palette; speed:number; foreground?: boolean }) {
  if (pal.cloudOpacity <= 0.05) return null;
  const clouds = CLOUD_CFG.filter((_, i) => foreground ? (i % 2 === 1) : (i % 2 === 0));
  return (
    <div style={{ position:'absolute', top:0, left:0, right:0, height:'44%', overflow:'hidden', pointerEvents:'none', zIndex: foreground ? 5 : 3 }}>
      {clouds.map((c,i) => (
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
      {/* Subtle non-overlapping Sunrays */}
      <div style={{
        position: 'absolute', top: '-60%', left: '-60%', width: '220%', height: '220%',
        background: `repeating-conic-gradient(from 0deg, ${pal.sunGlow} 0deg 8deg, transparent 8deg 20deg)`,
        borderRadius: '50%',
        opacity: 0.12,
        animation: 'rotateRays 180s linear infinite',
        mixBlendMode: 'screen',
        WebkitMaskImage: 'radial-gradient(circle, transparent 42%, black 48%)',
        maskImage: 'radial-gradient(circle, transparent 42%, black 48%)',
        zIndex: -1,
      }} />
      {/* Sun glow halo */}
      <div style={{
        position:'absolute', top:'-70%', left:'-70%', width:'240%', height:'240%', borderRadius:'50%',
        background:`radial-gradient(circle, ${pal.sunGlow} 0%, transparent 68%)`,
        animation:'celestial-glow 7s ease-in-out infinite',
      }} />
      {/* Boiling Sun Core */}
      <div style={{
        width:'100%', height:'100%', borderRadius:'50%',
        background:`radial-gradient(circle at 44% 42%, ${pal.sunCore} 0%, ${pal.sunCore} 14%, ${pal.sunEdge} 66%, ${pal.sunEdge} 100%)`,
        boxShadow:`0 0 ${size*0.6}px ${pal.sunGlow}`,
        animation: 'sun-boiling 6s ease-in-out infinite',
      }} />
    </div>
  );
}

function Moon({ topPct, leftPct, size, opacity }:
  { topPct:number; leftPct:number; size:number; opacity:number }) {
  const moonPosition = useStore((s) => s.moonPosition);
  const moonManualPhase = useStore((s) => s.moonManualPhase);
  const currentPhase = moonManualPhase !== null ? moonManualPhase : (moonPosition?.phase ?? 0.5);
  const pathD = getMoonPath(currentPhase);

  return (
    <div style={{
      position:'absolute', top:`${topPct}%`, left:`${leftPct}%`, width:size, height:size,
      transform:'translate(-50%,-50%)', zIndex:3, pointerEvents:'none',
      opacity, transition:'opacity 2.5s ease-in-out, top 1.5s ease, left 1.5s ease',
    }}>
      {/* soft outer glow */}
      <div style={{
        position:'absolute', top:'-85%', left:'-85%', width:'270%', height:'270%', borderRadius:'50%',
        background:'radial-gradient(circle, rgba(214,226,255,0.45) 0%, rgba(200,214,255,0.20) 34%, rgba(190,206,255,0.07) 56%, transparent 74%)',
        animation:'celestial-glow 9s ease-in-out infinite',
      }} />
      {/* disc outline / shadow backdrop */}
      <div style={{
        position:'relative', width:'100%', height:'100%', borderRadius:'50%',
        background: 'rgba(255, 255, 255, 0.05)',
        boxShadow: '0 0 10px rgba(210,222,255,0.15)',
        overflow:'hidden',
      }}>
        {pathD && (
          <svg viewBox="0 0 100 100" style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          }}>
            <path
              d={pathD}
              fill="url(#moon-glow-grad-detail)"
            />
            <defs>
              <radialGradient id="moon-glow-grad-detail" cx="38%" cy="34%" r="70%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="42%" stopColor="#f3f5fb" />
                <stop offset="78%" stopColor="#dbe0ee" />
                <stop offset="100%" stopColor="#c3cadf" />
              </radialGradient>
            </defs>
          </svg>
        )}
        {/* subtle maria texture */}
        <div style={{ position:'absolute', width:'26%', height:'26%', top:'20%', left:'40%', background:'radial-gradient(circle, rgba(150,160,190,0.18), transparent 70%)', borderRadius:'50%', mixBlendMode: 'multiply' }} />
        <div style={{ position:'absolute', width:'18%', height:'18%', top:'52%', left:'26%', background:'radial-gradient(circle, rgba(150,160,190,0.15), transparent 70%)', borderRadius:'50%', mixBlendMode: 'multiply' }} />
        <div style={{ position:'absolute', width:'13%', height:'13%', top:'60%', left:'58%', background:'radial-gradient(circle, rgba(150,160,190,0.12), transparent 70%)', borderRadius:'50%', mixBlendMode: 'multiply' }} />
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
  const prayerTimes       = useStore((s) => s.prayerTimes);
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

    if (prayerTimes) {
      if (!skySliderAuto && skyDisplayHours !== null) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        d.setHours(Math.floor(skyDisplayHours), Math.round((skyDisplayHours%1)*60), 0, 0);
        const pos = calculateSunPositionFromPrayers(d, prayerTimes);
        const sp = determineSkyPhase(pos.elevation, pos.azimuth);
        return { targetGradient: sp.gradient, phaseId: sp.id, elevation: pos.elevation, azimuth: pos.azimuth };
      }
      const pos = calculateSunPositionFromPrayers(now, prayerTimes);
      return { targetGradient: phase?.gradient ?? DEFAULT_GRADIENT, phaseId: phase?.id ?? 'night', elevation: pos.elevation, azimuth: pos.azimuth };
    }

    if (!skySliderAuto && skyDisplayHours !== null) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      d.setHours(Math.floor(skyDisplayHours), Math.round((skyDisplayHours%1)*60), 0, 0);
      const pos = calculateSunPosition(d, lat, lon);
      const sp = determineSkyPhase(pos.elevation, pos.azimuth);
      return { targetGradient: sp.gradient, phaseId: sp.id, elevation: pos.elevation, azimuth: pos.azimuth };
    }
    const pos = calculateSunPosition(now, lat, lon);
    return { targetGradient: phase?.gradient ?? DEFAULT_GRADIENT, phaseId: phase?.id ?? 'night', elevation: pos.elevation, azimuth: pos.azimuth };
  }, [phase, skyDisplayHours, skySliderAuto, aodMode, settings.coordinates, now, prayerTimes]);

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
  const moonSize = Math.max(66,  Math.min(115, vw * 0.0735));

  const sunTop     = Math.min(66, Math.max(5, 60 - elevation * 0.85));
  const sunLeft    = Math.min(95, Math.max(5, ((azimuth - 60) / 240) * 90 + 5));
  const sunOpacity = Math.max(0, Math.min(1, (elevation + 1) / 11));

  // Moon trajectory: goes high up (8%) at night, under mountains (75%) in day
  const moonElev    = -elevation;
  const moonTop     = Math.min(75, Math.max(8, 48 - moonElev * 1.1));
  const moonLeft    = 81;
  const moonOpacity = Math.max(0, Math.min(1, (moonElev - 4) / 10));

  const activeTime = useMemo(() => {
    if (!skySliderAuto && skyDisplayHours !== null) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      d.setHours(Math.floor(skyDisplayHours), Math.round((skyDisplayHours % 1) * 60), 0, 0);
      return d;
    }
    return now;
  }, [skySliderAuto, skyDisplayHours, now]);

  let finalSunOpacity = sunOpacity;
  let finalMoonOpacity = moonOpacity;
  let finalMoonTop = moonTop;

  if (prayerTimes) {
    const t = activeTime.getTime();
    
    // Fajr to Sunrise (Shuruq)
    const fajrMs = prayerTimes.fajr.getTime();
    const sunriseMs = prayerTimes.sunrise.getTime();
    if (t >= fajrMs && t <= sunriseMs) {
      const p = (t - fajrMs) / (sunriseMs - fajrMs);
      
      // Moon goes down within the first 20% time
      if (p <= 0.20) {
        finalMoonOpacity = Math.max(0, 1 - (p / 0.20));
        finalMoonTop = 20 + (p / 0.20) * (75 - 20);
      } else {
        finalMoonOpacity = 0;
        finalMoonTop = 75;
      }
      
      // Sunrise brightness starts from 8% and achieves target level by 70.7% progress (4:15 AM)
      if (p >= 0.08) {
        finalSunOpacity = Math.min(1, (p - 0.08) / 0.77);
      } else {
        finalSunOpacity = 0;
      }
    }

    // Maghrib to Isha
    const maghribMs = prayerTimes.maghrib.getTime();
    const ishaMs = prayerTimes.isha.getTime();
    if (t >= maghribMs && t <= ishaMs) {
      const p = (t - maghribMs) / (ishaMs - maghribMs);
      
      // Moon comes up from 70% to 100% time
      if (p >= 0.70) {
        const moonProgress = (p - 0.70) / (1 - 0.70);
        finalMoonOpacity = moonProgress;
        finalMoonTop = 75 - moonProgress * (75 - 20);
      } else {
        finalMoonOpacity = 0;
        finalMoonTop = 75;
      }
      finalSunOpacity = 0;
    }
  }

  const starFade  = elevation >= 3 ? 0 : elevation <= -15 ? 1 : (-elevation + 3) / 18;

  interface ShootingStar {
    top: string;
    left: string;
    len: number;
    dur: number;
    dir: 'up' | 'down';
  }
  const [shootingStar, setShootingStar] = useState<ShootingStar | null>(null);

  useEffect(() => {
    if (starFade <= 0.05) {
      setShootingStar(null);
      return;
    }

    let activeTimeout: any = null;
    let transitionTimeout: any = null;

    const triggerNext = () => {
      const nextDelay = 18000 + Math.random() * 14000;
      activeTimeout = setTimeout(() => {
        const dir = Math.random() > 0.4 ? 'down' : 'up';
        // If going up, start lower (e.g. 20% to 40% height) to allow room to fly upwards
        const topVal = dir === 'up' 
          ? 20 + Math.random() * 20 
          : 5 + Math.random() * 20;

        const star: ShootingStar = {
          top: `${topVal}%`,
          left: `${10 + Math.random() * 60}%`,
          len: 100 + Math.random() * 60,
          dur: 0.6 + Math.random() * 0.5,
          dir,
        };
        setShootingStar(star);

        transitionTimeout = setTimeout(() => {
          setShootingStar(null);
          triggerNext();
        }, star.dur * 1000);

      }, nextDelay);
    };

    triggerNext();
    return () => {
      clearTimeout(activeTimeout);
      clearTimeout(transitionTimeout);
    };
  }, [starFade]);


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
              {STARS.map((st,i) => {
                const hasStreak = i % 12 === 0;
                return (
                  <div key={i} className="absolute" style={{
                    left:st.left, top:st.top,
                    opacity:st.op*starFade, transition:'opacity 2.5s ease-in-out',
                  }}>
                    <div className="rounded-full bg-white" style={{
                      width:st.size, height:st.size,
                      animation:`star-twinkle ${st.dur} ease-in-out ${st.delay} infinite`,
                    }} />
                    {hasStreak && (
                      <div className="absolute" style={{
                        top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none',
                        animation:`star-twinkle ${st.dur} ease-in-out ${st.delay} infinite`,
                      }}>
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '12px', height: '1px', background: 'radial-gradient(circle, rgba(255,255,255,0.9), transparent)' }} />
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '1px', height: '12px', background: 'radial-gradient(circle, rgba(255,255,255,0.9), transparent)' }} />
                      </div>
                    )}
                  </div>
                );
              })}
              {shootingStar && (
                <div style={{
                  position:'absolute', top:shootingStar.top, left:shootingStar.left, width:shootingStar.len, height:2,
                  background:'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.98) 100%)',
                  borderRadius:2, opacity:starFade,
                  animation:`shoot-${shootingStar.dir}-once ${shootingStar.dur}s ease-in forwards`,
                  filter:'drop-shadow(0 0 4px rgba(255,255,255,0.8))',
                }} />
              )}
            </div>
          )}

          {/* Moon (z2) */}
          {finalMoonOpacity > 0.01 && <Moon topPct={finalMoonTop} leftPct={moonLeft} size={moonSize} opacity={finalMoonOpacity} />}
          {/* Sun (z2) */}
          {finalSunOpacity > 0.01 && <Sun topPct={sunTop} leftPct={sunLeft} size={sunSize} opacity={finalSunOpacity} pal={pal} />}

          {/* Clouds (z3, behind mountains) */}
          <CloudLayer pal={pal} speed={speed} />

          {/* Landscape crossfade (z4) */}
          <div style={{ position:'absolute', inset:0, zIndex:4, pointerEvents:'none', opacity:active==='a'?1:0, transition:'opacity 2.5s cubic-bezier(0.4,0,0.2,1)' }}>
            <Scene
              pal={layerA.pal} speed={speed} sunLeftPct={sunLeft} sunGlowOpacity={finalSunOpacity}
              starFade={starFade} moonOpacity={finalMoonOpacity} moonTop={finalMoonTop} moonLeft={moonLeft} moonSize={moonSize}
              sunOpacity={finalSunOpacity} sunTop={sunTop} sunSize={sunSize}
            />
          </div>
          <div style={{ position:'absolute', inset:0, zIndex:4, pointerEvents:'none', opacity:active==='b'?1:0, transition:'opacity 2.5s cubic-bezier(0.4,0,0.2,1)' }}>
            <Scene
              pal={layerB.pal} speed={speed} sunLeftPct={sunLeft} sunGlowOpacity={finalSunOpacity}
              starFade={starFade} moonOpacity={finalMoonOpacity} moonTop={finalMoonTop} moonLeft={moonLeft} moonSize={moonSize}
              sunOpacity={finalSunOpacity} sunTop={sunTop} sunSize={sunSize}
            />
          </div>

          {/* Flying birds at various z-depths (daytime) */}
          {starFade < 0.95 && (
            <>
              {/* Layer 2: In front of sun but behind clouds (z3) — LTR */}
              <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 3, pointerEvents: 'none' }}>
                {[
                  { top: '14%', scale: 0.26, speed: 120, delay: 0 },
                ].map((b, i) => (
                  <img key={`bird-mid-${i}`} src={birdGif} alt="" style={{
                    position: 'absolute', top: b.top,
                    width: `${24 + b.scale * 40}px`, height: 'auto',
                    animation: `flock-fly-ltr ${b.speed}s linear ${b.delay}s infinite`,
                    filter: 'brightness(0) saturate(0%)',
                    opacity: 1,
                    pointerEvents: 'none',
                  }} />
                ))}
              </div>

              {/* Layer 3: In front of clouds (z5) — closer, larger — RTL */}
              <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 5, pointerEvents: 'none' }}>
                {[
                  { top: '12%', scale: 0.32, speed: 96, delay: 3.5 },
                ].map((b, i) => (
                  <img key={`bird-fg-${i}`} src={birdGif} alt="" style={{
                    position: 'absolute', top: b.top,
                    width: `${28 + b.scale * 40}px`, height: 'auto',
                    animation: `flock-fly-rtl ${b.speed}s linear ${b.delay}s infinite`,
                    filter: 'brightness(0) saturate(0%)',
                    opacity: 1,
                    pointerEvents: 'none',
                  }} />
                ))}
              </div>

              {/* Distant tight flock of 10 birds moving together (z2, very far) — RTL */}
              <div style={{
                position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 2, pointerEvents: 'none',
                animation: 'flock-distant-rtl 270s linear 20s infinite',
              }}>
                {[
                  { top: 120, left: 0 }, { top: 128, left: 14 }, { top: 118, left: 28 },
                  { top: 132, left: 8 }, { top: 124, left: 42 }, { top: 136, left: 22 },
                  { top: 116, left: 50 }, { top: 130, left: 36 }, { top: 122, left: 56 },
                  { top: 138, left: 46 },
                ].map((p, i) => (
                  <img key={`distant-bird-${i}`} src={birdGif} alt="" style={{
                    position: 'absolute',
                    top: `${p.top}px`,
                    left: `${p.left}px`,
                    width: '16px', height: 'auto',
                    filter: 'brightness(0) saturate(0%)',
                    opacity: 1,
                    pointerEvents: 'none',
                    animationDelay: `${i * 0.08}s`,
                  }} />
                ))}
              </div>
            </>
          )}

        </>
      )}
    </div>
  );
}

export default SkyBackground;
