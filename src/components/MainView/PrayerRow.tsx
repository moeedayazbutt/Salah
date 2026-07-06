import { memo } from 'react';
import type { PrayerInfo } from '../../types';

interface PrayerRowProps {
  prayer: PrayerInfo;
  timeStr: string;
}

const PrayerRow = memo(({ prayer, timeStr }: PrayerRowProps) => (
  <div
    className={`prayer-row ${prayer.isCurrent ? 'active' : ''}`}
    style={{
      display: 'flex',
      flexDirection: 'column',
      padding: '4px 8px',
      background: prayer.isCurrent
        ? 'rgba(255, 215, 0, 0.06)'
        : 'rgba(255, 255, 255, 0.02)',
      border: prayer.isCurrent
        ? '1px solid rgba(245, 158, 11, 0.35)'
        : '1px solid rgba(255, 255, 255, 0.04)',
      borderRadius: 8,
      transition: 'all 300ms ease',
      flexShrink: 0,
      boxShadow: prayer.isCurrent
        ? '0 0 24px rgba(245, 158, 11, 0.08), inset 0 0 24px rgba(245, 158, 11, 0.015)'
        : 'none',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {prayer.isCurrent && (
          <div
            className="animate-pulse-soft"
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: '#F59E0B',
              boxShadow: '0 0 6px rgba(245, 158, 11, 0.6)',
              flexShrink: 0,
            }}
          />
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span
            dir="rtl" lang="ar"
            className="font-arabic"
            style={{
              fontSize: 'clamp(0.8rem, 1.5vw, 1.6rem)',
              color: prayer.isCurrent ? '#FAFAFA' : 'rgba(255,255,255,0.8)',
              marginLeft: prayer.isCurrent ? 0 : 9,
            }}
          >
            {prayer.nameAr}
          </span>
          <span className="font-ui" style={{
            fontSize: 'clamp(0.55rem, 0.9vw, 1rem)',
            color: 'rgba(255,255,255,0.4)',
          }}>
            {prayer.nameEn}
          </span>
        </div>
      </div>
      <span className="font-mono font-medium" style={{
        fontSize: 'clamp(0.7rem, 1.2vw, 1.3rem)',
        color: prayer.isCurrent ? '#FFD600' : 'rgba(255,255,255,0.8)',
      }}>
        {timeStr}
      </span>
    </div>
    <div className="w-full rounded-full overflow-hidden" style={{
      height: 2,
      marginTop: '2px',
      background: 'rgba(255,255,255,0.05)',
    }}>
      <div className="h-full rounded-full transition-all duration-300 ease-out" style={{
        width: `${prayer.progress}%`,
        background: prayer.isCurrent
          ? 'linear-gradient(90deg, #F59E0B, #14B8A6)'
          : 'rgba(255,255,255,0.08)',
        boxShadow: prayer.isCurrent ? '0 0 6px rgba(245, 158, 11, 0.3)' : 'none',
      }} />
    </div>
  </div>
));

export default PrayerRow;