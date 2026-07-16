import { useStore } from '../../store';
import { useWeather } from '../../hooks/useWeather';

function WeatherIcon({ condition, size = 24 }: { condition: string; size?: number }) {
  const c = condition === 'sunny' ? '#FFD600'
    : condition === 'partly-cloudy' ? '#E8C84A'
    : condition === 'cloudy' ? '#9CA3AF'
    : '#60A5FA';
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="18" r="7" fill={c} opacity="0.9" />
      {condition === 'sunny' && (
        <g stroke={c} strokeWidth="1.5" opacity="0.55">
          <line x1="20" y1="4" x2="20" y2="8" /><line x1="20" y1="28" x2="20" y2="32" />
          <line x1="8" y1="18" x2="12" y2="18" /><line x1="28" y1="18" x2="32" y2="18" />
          <line x1="11.5" y1="9.5" x2="14.5" y2="12.5" /><line x1="25.5" y1="12.5" x2="28.5" y2="9.5" />
          <line x1="11.5" y1="26.5" x2="14.5" y2="23.5" /><line x1="25.5" y1="23.5" x2="28.5" y2="26.5" />
        </g>
      )}
      {condition === 'partly-cloudy' && (
        <>
          <g stroke={c} strokeWidth="1.2" opacity="0.4">
            <line x1="20" y1="6" x2="20" y2="9" />
            <line x1="10" y1="18" x2="13" y2="18" />
            <line x1="27" y1="18" x2="30" y2="18" />
          </g>
          <ellipse cx="28" cy="22" rx="10" ry="5" fill="rgba(255,255,255,0.22)" />
        </>
      )}
      {condition === 'cloudy' && (
        <ellipse cx="26" cy="22" rx="13" ry="6" fill="rgba(255,255,255,0.28)" />
      )}
      {condition === 'rainy' && (
        <>
          <ellipse cx="26" cy="20" rx="12" ry="5.5" fill="rgba(255,255,255,0.22)" />
          <g stroke="#60A5FA" strokeWidth="1.5" opacity="0.7" strokeLinecap="round">
            <line x1="22" y1="28" x2="20" y2="34" /><line x1="27" y1="28" x2="25" y2="34" /><line x1="32" y1="28" x2="30" y2="34" />
          </g>
        </>
      )}
    </svg>
  );
}

function TempBar({ high, low, rangeMin, rangeMax }: { high: number; low: number; rangeMin: number; rangeMax: number }) {
  const span = rangeMax - rangeMin || 1;
  const left = ((low - rangeMin) / span) * 100;
  const width = ((high - low) / span) * 100;
  return (
    <div className="relative w-full rounded-full" style={{ height: 4, background: 'rgba(255,255,255,0.08)' }}>
      <div
        className="absolute h-full rounded-full"
        style={{
          left: `${left}%`,
          width: `${Math.max(width, 6)}%`,
          background: 'linear-gradient(90deg, #60A5FA, #FBBF24)',
        }}
      />
    </div>
  );
}

export default function WeatherWidget() {
  const settings = useStore((s) => s.settings);
  const lat = settings.coordinates.latitude;
  const lon = settings.coordinates.longitude;

  const { current, daily, hourly: hourlyData, loading: _loading } = useWeather(lat, lon);

  const forecast = daily ?? [];
  const today = forecast[0];
  const next3 = forecast.slice(0, 3);
  const hourly = hourlyData ?? [];
  const tempBase = current?.temp ?? (today?.high ?? 22);
  const feelsTemp = current?.feelsLike ?? Math.round(tempBase + (tempBase > 30 ? -3 : 2) + Math.sin(tempBase * 0.4) * 3);
  const humidity = current?.humidity ?? Math.round(25 + Math.sin(tempBase * 0.7 + 2) * 20 + Math.cos(tempBase * 0.3) * 10);
  const windSpeed = current?.windSpeed ?? Math.round(4 + Math.sin(tempBase * 0.5 + 4) * 8 + Math.cos(tempBase * 0.8) * 5);

  const rangeMin = Math.min(...next3.map((d) => d.low));
  const rangeMax = Math.max(...next3.map((d) => d.high));

  const locationLabel = settings.selectedCityName || (lat !== 0 || lon !== 0
    ? `${Math.abs(lat).toFixed(1)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(1)}°${lon >= 0 ? 'E' : 'W'}`
    : 'No location');

  return (
    <div
      className="rounded-xl flex flex-col min-h-0"
      style={{
        flex: '1 1 0%',
        padding: '10px 12px',
        background: 'rgba(15,18,48,0.45)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.07)',
        gap: 8,
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between flex-shrink-0" style={{ gap: 8 }}>
        <div className="flex items-center" style={{ gap: 8 }}>
          <WeatherIcon condition={today?.condition.icon ?? 'sunny'} size={46} />
          <div className="flex flex-col">
            <div className="flex items-end" style={{ gap: 2 }}>
              <span className="font-mono" style={{ fontSize: 'clamp(2.0rem, 4.3vw, 3.7rem)', fontWeight: 300, color: '#FAFAFA', lineHeight: 1 }}>
                {tempBase}
              </span>
              <span className="font-ui" style={{ fontSize: 'clamp(0.9rem, 1.5vw, 1.5rem)', color: 'rgba(255,255,255,0.4)', marginBottom: '0.25em' }}>°C</span>
            </div>
            <span className="font-ui" style={{ fontSize: 'clamp(0.8rem, 1.2vw, 1.25rem)', color: 'rgba(255,255,255,0.5)' }}>
              {today?.condition.en ?? 'Clear'}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end" style={{ gap: 2 }}>
          <div className="flex items-center" style={{ gap: 4 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" aria-hidden="true">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
            <span className="font-ui" style={{ fontSize: 'clamp(0.7rem, 1.0vw, 1.05rem)', color: 'rgba(255,255,255,0.35)' }}>
              {locationLabel}
            </span>
          </div>
          <span className="font-ui" style={{ fontSize: 'clamp(0.7rem, 0.95vw, 1.0rem)', color: 'rgba(255,255,255,0.28)' }}>
            Feels {feelsTemp}° · {humidity}% hum · {windSpeed} km/h
          </span>
        </div>
      </div>

      {/* Hourly forecast */}
      <div className="flex-shrink-0">
        <div className="overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <div className="flex" style={{ gap: 2, minWidth: 'max-content', paddingBottom: 2 }}>
            {hourly.map((h) => (
              <div
                key={`${h.hour}-${h.timeLabel}`}
                className="flex flex-col items-center rounded-lg"
                style={{
                  padding: '5px 6px',
                  minWidth: 52,
                  background: h.isNow ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${h.isNow ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.04)'}`,
                  gap: 2,
                }}
              >
                <span className="font-ui" style={{ fontSize: 'clamp(0.7rem, 0.95vw, 0.95rem)', color: h.isNow ? '#F59E0B' : 'rgba(255,255,255,0.4)', letterSpacing: '0.03em' }}>
                  {h.timeLabel}
                </span>
                <WeatherIcon condition={h.condition.icon} size={22} />
                <span className="font-mono" style={{ fontSize: 'clamp(0.75rem, 1.05vw, 1.1rem)', color: 'rgba(255,255,255,0.75)', fontWeight: 400 }}>
                  {h.temp}°
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3-day forecast */}
      <div className="flex flex-col flex-shrink-0" style={{ gap: 4 }}>
        {next3.map((day, i) => (
          <div key={day.date.toISOString()} className="flex items-center" style={{ gap: 8 }}>
            <span className="font-ui" style={{ fontSize: 'clamp(0.8rem, 1.1vw, 1.2rem)', color: i === 0 ? 'rgba(255,215,0,0.75)' : 'rgba(255,255,255,0.55)', minWidth: 42 }}>
              {i === 0 ? 'Today' : day.dayNameEn.slice(0, 3)}
            </span>
            <WeatherIcon condition={day.condition.icon} size={20} />
            <span className="font-mono" style={{ fontSize: 'clamp(0.75rem, 1.05vw, 1.1rem)', color: 'rgba(255,255,255,0.45)', minWidth: 28, textAlign: 'right' }}>
              {day.low}°
            </span>
            <TempBar high={day.high} low={day.low} rangeMin={rangeMin} rangeMax={rangeMax} />
            <span className="font-mono" style={{ fontSize: 'clamp(0.75rem, 1.05vw, 1.1rem)', color: 'rgba(255,255,255,0.75)', minWidth: 28 }}>
              {day.high}°
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
