import { memo } from 'react';
import type { PrayerInfo } from '../../types';

interface PrayerRowProps {
  prayer: PrayerInfo;
  timeStr: string;
  aodMode?: boolean;
}

const PrayerRow = memo(({ prayer, timeStr, aodMode = false }: PrayerRowProps) => {
  const activeBg = aodMode ? 'rgba(255,255,255,0.06)' : 'rgba(255,215,0,0.06)';
  const activeBorder = aodMode ? 'rgba(255,255,255,0.20)' : 'rgba(245,158,11,0.30)';
  const inactiveBg = 'rgba(255,255,255,0.02)';
  const inactiveBorder = 'rgba(255,255,255,0.04)';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '5px 10px',
        background: prayer.isCurrent ? activeBg : inactiveBg,
        border: `1px solid ${prayer.isCurrent ? activeBorder : inactiveBorder}`,
        borderRadius: 10,
        transition: 'all 250ms ease',
        flexShrink: 0,
        boxShadow: prayer.isCurrent && !aodMode ? '0 0 20px rgba(245,158,11,0.07)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          {prayer.isCurrent && (
            <div
              className="animate-pulse-soft"
              style={{ width: 6, height: 6, borderRadius: '50%', background: aodMode ? '#fff' : '#F59E0B', flexShrink: 0,
                boxShadow: aodMode ? 'none' : '0 0 5px rgba(245,158,11,0.6)' }}
            />
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <span
              dir="rtl" lang="ar"
              className="font-arabic"
              style={{
                fontSize: 'clamp(1rem, 1.6vw, 1.8rem)',
                color: prayer.isCurrent ? '#FAFAFA' : 'rgba(255,255,255,0.82)',
                marginLeft: prayer.isCurrent ? 0 : 12,
                flexShrink: 0,
              }}
            >
              {prayer.nameAr}
            </span>
            <span style={{
              fontFamily: 'Roboto, sans-serif',
              fontWeight: 400,
              fontSize: 'clamp(11px, 1vw, 13px)',
              color: 'rgba(255,255,255,0.42)',
              whiteSpace: 'nowrap',
            }}>
              {prayer.nameEn}
            </span>
          </div>
        </div>
        <span style={{
          fontFamily: 'Roboto Mono, monospace',
          fontWeight: 400,
          fontSize: 'clamp(12px, 1.3vw, 15px)',
          color: prayer.isCurrent ? (aodMode ? '#fff' : '#FFD600') : 'rgba(255,255,255,0.82)',
          flexShrink: 0,
        }}>
          {timeStr}
        </span>
      </div>
      <div style={{ height: 2, marginTop: 4, borderRadius: 1, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{
          width: `${prayer.progress}%`,
          height: '100%',
          borderRadius: 1,
          background: prayer.isCurrent
            ? (aodMode ? 'rgba(255,255,255,0.45)' : 'linear-gradient(90deg, #F59E0B, #14B8A6)')
            : 'rgba(255,255,255,0.10)',
          transition: 'width 300ms ease-out',
          boxShadow: prayer.isCurrent && !aodMode ? '0 0 5px rgba(245,158,11,0.28)' : 'none',
        }} />
      </div>
    </div>
  );
});

PrayerRow.displayName = 'PrayerRow';
export default PrayerRow;
