import { useMemo } from 'react';
import { useStore } from '../../store';
import { getForecast, getHourlyForecast } from '../../utils/weatherForecast';

function WeatherIcon({ condition, size = 18 }: { condition: string; size?: number }) {
  const c = condition === 'sunny' ? '#FFD600'
    : condition === 'partly-cloudy' ? '#E8C84A'
    : condition === 'cloudy' ? '#9EA3AF'
    : '#5B8DEF';
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <circle cx="20" cy="18" r="7" fill={c} opacity="0.9" />
      {condition === 'sunny' && (
        <g stroke={c} strokeWidth="1.8" opacity="0.55">
          {[0,45,90,135,180,225,270,315].map((a, i) => {
            const rad = (a * Math.PI) / 180;
            return <line key={i} x1={20 + 10*Math.cos(rad)} y1={18 + 10*Math.sin(rad)} x2={20 + 13*Math.cos(rad)} y2={18 + 13*Math.sin(rad)} />;
          })}
        </g>
      )}
      {condition === 'partly-cloudy' && <ellipse cx="27" cy="24" rx="11" ry="5.5" fill="rgba(255,255,255,0.22)" />}
      {condition === 'cloudy' && <ellipse cx="24" cy="26" rx="14" ry="6" fill="rgba(255,255,255,0.28)" />}
      {condition === 'rainy' && (
        <>
          <ellipse cx="24" cy="24" rx="13" ry="5.5" fill="rgba(255,255,255,0.22)" />
          <g stroke="#5B8DEF" strokeWidth="1.5" strokeLinecap="round" opacity="0.7">
            <line x1="22" y1="30" x2="20" y2="36" />
            <line x1="27" y1="30" x2="25" y2="36" />
            <line x1="32" y1="30" x2="30" y2="36" />
          </g>
        </>
      )}
    </svg>
  );
}

export default function WeatherWidget() {
  const settings = useStore((s) => s.settings);
  const aodMode = useStore((s) => s.aodMode);
  const { latitude: lat, longitude: lon } = settings.coordinates;

  const forecast = useMemo(() => getForecast(lat, lon), [lat, lon]);
  const hourly = useMemo(() => getHourlyForecast(lat, lon), [lat, lon]);

  const today = forecast[0];
  const next3 = forecast.slice(0, 3);
  const tempBase = today?.high ?? 20;
  const feelsTemp = Math.round(tempBase - 2 + Math.sin(tempBase * 0.4) * 2);

  // For 3-day range bar
  const weekMin = Math.min(...forecast.map((d) => d.low));
  const weekMax = Math.max(...forecast.map((d) => d.high));
  const weekRange = weekMax - weekMin || 1;

  const card: React.CSSProperties = {
    background: aodMode ? 'rgba(255,255,255,0.04)' : 'rgba(12,15,45,0.55)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: `1px solid ${aodMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.07)'}`,
    borderRadius: 16,
  };

  const textHigh = aodMode ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.90)';
  const textMed  = aodMode ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.55)';
  const textLow  = aodMode ? 'rgba(255,255,255,0.30)' : 'rgba(255,255,255,0.35)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minHeight: 0 }}>

      {/* ── Current conditions ─────────────────────────── */}
      <div style={{ ...card, padding: '10px 14px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <WeatherIcon condition={today?.condition.icon ?? 'sunny'} size={32} />
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <span style={{ fontFamily: 'Roboto Mono, monospace', fontWeight: 300, fontSize: 'clamp(1.6rem, 3vw, 2.8rem)', color: textHigh, lineHeight: 1 }}>
                  {tempBase}
                </span>
                <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 13, color: textMed, marginTop: 3 }}>°C</span>
              </div>
              <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 13, color: textMed, marginTop: 1 }}>
                {today?.condition.en ?? 'Clear'}
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 12, color: textMed }}>
              Feels {feelsTemp}°
            </div>
            <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 12, color: textLow, marginTop: 2 }}>
              H:{today?.high}° · L:{today?.low}°
            </div>
          </div>
        </div>
      </div>

      {/* ── Hourly forecast ────────────────────────────── */}
      <div style={{ ...card, padding: '8px 12px', flexShrink: 0 }}>
        <div style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 500, fontSize: 11, color: textLow, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
          Hourly
        </div>
        <div style={{ display: 'flex', gap: 0, overflowX: 'auto', paddingBottom: 2 }}>
          {hourly.map((h, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 'clamp(38px, 7vw, 56px)', padding: '2px 2px', flexShrink: 0 }}>
              <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'clamp(10px, 1.2vw, 13px)', color: h.isNow ? 'rgba(245,158,11,0.85)' : textLow, marginBottom: 3, fontWeight: h.isNow ? 500 : 400 }}>
                {h.timeLabel}
              </span>
              <WeatherIcon condition={h.condition.icon} size={16} />
              <span style={{ fontFamily: 'Roboto Mono, monospace', fontWeight: 400, fontSize: 'clamp(10px, 1.2vw, 13px)', color: textMed, marginTop: 3 }}>
                {h.temp}°
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3-day forecast ──────────────────────────────── */}
      <div style={{ ...card, padding: '8px 14px', flex: 1, minHeight: 0 }}>
        <div style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 500, fontSize: 11, color: textLow, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
          3-Day Forecast
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {next3.map((day, i) => {
            const barLeft = ((day.low - weekMin) / weekRange) * 60;
            const barWidth = ((day.high - day.low) / weekRange) * 60;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 500, fontSize: 'clamp(12px, 1.3vw, 14px)', color: textHigh, width: 'clamp(38px, 6vw, 52px)', flexShrink: 0 }}>
                  {i === 0 ? 'Today' : day.dayNameEn.slice(0, 3)}
                </span>
                <WeatherIcon condition={day.condition.icon} size={16} />
                <span style={{ fontFamily: 'Roboto Mono, monospace', fontWeight: 400, fontSize: 'clamp(11px, 1.2vw, 13px)', color: textMed, width: 'clamp(24px, 3vw, 32px)', textAlign: 'right', flexShrink: 0 }}>
                  {day.low}°
                </span>
                {/* Temperature range bar */}
                <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{
                    position: 'absolute',
                    left: `${barLeft}%`,
                    width: `${barWidth}%`,
                    height: '100%',
                    borderRadius: 2,
                    background: i === 0
                      ? 'linear-gradient(90deg, #F59E0B, #FFD600)'
                      : 'linear-gradient(90deg, #5DADE2, #85C1E9)',
                  }} />
                </div>
                <span style={{ fontFamily: 'Roboto Mono, monospace', fontWeight: 400, fontSize: 'clamp(11px, 1.2vw, 13px)', color: textMed, width: 'clamp(24px, 3vw, 32px)', flexShrink: 0 }}>
                  {day.high}°
                </span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
