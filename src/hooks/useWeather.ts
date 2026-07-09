import { useState, useEffect } from 'react';

const CONDITIONS = [
  { en: 'Clear', ar: 'صافية', icon: 'sunny' },
  { en: 'Partly Cloudy', ar: 'غائم جزئياً', icon: 'partly-cloudy' },
  { en: 'Cloudy', ar: 'غائم', icon: 'cloudy' },
  { en: 'Light Rain', ar: 'مطر خفيف', icon: 'rainy' },
  { en: 'Scattered Showers', ar: 'زخات متفرقة', icon: 'rainy' },
  { en: 'Hazy', ar: 'ضبابي', icon: 'partly-cloudy' },
  { en: 'Fair', ar: 'صحو', icon: 'sunny' },
];

const WMO_CODES: Record<number, number> = {
  0: 0, 1: 1, 2: 1, 3: 2, 45: 5, 48: 5,
  51: 3, 53: 3, 55: 3, 56: 3, 57: 3,
  61: 3, 63: 3, 65: 3, 66: 3, 67: 3,
  71: 2, 73: 2, 75: 2, 77: 2,
  80: 4, 81: 4, 82: 4, 85: 2, 86: 2,
  95: 3, 96: 3, 99: 3,
};

function wmoToCondition(wmo: number): typeof CONDITIONS[number] {
  return CONDITIONS[WMO_CODES[wmo] ?? 2];
}

export interface ForecastDay {
  dayNameEn: string;
  dayNameAr: string;
  high: number;
  low: number;
  condition: typeof CONDITIONS[number];
  date: Date;
}

export interface HourlyForecast {
  hour: number;
  temp: number;
  condition: typeof CONDITIONS[number];
  timeLabel: string;
  isNow: boolean;
}

export interface CurrentWeather {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  condition: typeof CONDITIONS[number];
}

interface WeatherData {
  current: CurrentWeather;
  daily: ForecastDay[];
  hourly: HourlyForecast[];
}

const cache = new Map<string, { data: WeatherData; expiry: number }>();

export function useWeather(lat: number, lon: number) {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!lat && !lon) { setLoading(false); return; }
    const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    const cached = cache.get(key);
    if (cached && cached.expiry > Date.now()) {
      setData(cached.data);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const params = new URLSearchParams({
      latitude: lat.toFixed(2),
      longitude: lon.toFixed(2),
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',
      daily: 'temperature_2m_max,temperature_2m_min,weather_code',
      hourly: 'temperature_2m,weather_code',
      timezone: 'auto',
      forecast_days: '7',
    });

    fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        const now = new Date();
        const currentHour = now.getHours();

        const current: CurrentWeather = {
          temp: Math.round(json.current.temperature_2m),
          feelsLike: Math.round(json.current.apparent_temperature),
          humidity: json.current.relative_humidity_2m,
          windSpeed: Math.round(json.current.wind_speed_10m),
          condition: wmoToCondition(json.current.weather_code),
        };

        const daily: ForecastDay[] = (json.daily.time as string[]).map((dateStr: string, i: number) => {
          const d = new Date(dateStr + 'T12:00:00');
          const day = d.getDay();
          return {
            dayNameEn: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day],
            dayNameAr: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][day],
            high: Math.round(json.daily.temperature_2m_max[i]),
            low: Math.round(json.daily.temperature_2m_min[i]),
            condition: wmoToCondition(json.daily.weather_code[i]),
            date: d,
          };
        });

        const hourly: HourlyForecast[] = (json.hourly.time as string[]).map((timeStr: string, i: number) => {
          const h = new Date(timeStr);
          const hour = h.getHours();
          const h12 = hour % 12 || 12;
          const isNow = hour === currentHour;
          const timeLabel = isNow ? 'Now' : `${h12}${hour >= 12 ? 'PM' : 'AM'}`;
          return {
            hour,
            temp: Math.round(json.hourly.temperature_2m[i]),
            condition: wmoToCondition(json.hourly.weather_code[i]),
            timeLabel,
            isNow,
          };
        });

        const result: WeatherData = { current, daily, hourly };
        cache.set(key, { data: result, expiry: Date.now() + 15 * 60 * 1000 });
        if (!cancelled) { setData(result); setLoading(false); }
      })
      .catch(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [lat, lon]);

  return { ...data, loading };
}
