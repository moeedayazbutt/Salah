const CONDITIONS = [
  { en: 'Clear', ar: 'صافية', icon: 'sunny' },
  { en: 'Partly Cloudy', ar: 'غائم جزئياً', icon: 'partly-cloudy' },
  { en: 'Cloudy', ar: 'غائم', icon: 'cloudy' },
  { en: 'Light Rain', ar: 'مطر خفيف', icon: 'rainy' },
  { en: 'Scattered Showers', ar: 'زخات متفرقة', icon: 'rainy' },
  { en: 'Hazy', ar: 'ضبابي', icon: 'partly-cloudy' },
  { en: 'Fair', ar: 'صحو', icon: 'sunny' },
];

export interface ForecastDay {
  dayNameEn: string;
  dayNameAr: string;
  high: number;
  low: number;
  condition: typeof CONDITIONS[number];
  date: Date;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export function getForecast(lat: number, lon: number): ForecastDay[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  const baseSeed = Math.round(lat * 100 + lon * 100 + dayOfYear * 7);
  const rng = seededRandom(baseSeed < 0 ? -baseSeed + 100000 : baseSeed);

  const baseHigh = 15 + rng() * 20 + (Math.abs(lat) < 30 ? 10 : Math.abs(lat) > 50 ? -10 : 0);
  const baseLow = baseHigh - (5 + rng() * 8);

  const result: ForecastDay[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const day = d.getDay();
    const variation = (rng() - 0.5) * 8;
    const high = Math.round(baseHigh + variation);
    const low = Math.round(baseLow + variation * 0.6);
    const conditionIndex = Math.floor(rng() * CONDITIONS.length);
    result.push({
      dayNameEn: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day],
      dayNameAr: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][day],
      high: Math.max(high, low + 2),
      low: Math.min(low, high - 2),
      condition: CONDITIONS[conditionIndex],
      date: d,
    });
  }
  return result;
}

export interface HourlyForecast {
  hour: number;
  temp: number;
  condition: typeof CONDITIONS[number];
  timeLabel: string;
  isNow: boolean;
}

export function getHourlyForecast(lat: number, lon: number, fromHour?: number): HourlyForecast[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  const baseSeed = Math.round(lat * 100 + lon * 100 + dayOfYear * 7);
  const rng = seededRandom(baseSeed < 0 ? -baseSeed + 100000 : baseSeed);

  const baseHigh = 15 + rng() * 20 + (Math.abs(lat) < 30 ? 10 : Math.abs(lat) > 50 ? -10 : 0);
  const baseLow = baseHigh - (5 + rng() * 8);
  const avg = (baseHigh + baseLow) / 2;
  const amplitude = (baseHigh - baseLow) / 2;

  const currentHour = fromHour ?? now.getHours();
  const result: HourlyForecast[] = [];

  for (let i = 0; i < 12; i++) {
    const hour = (currentHour + i) % 24;
    const temp = Math.round(avg + amplitude * Math.cos((2 * Math.PI * (hour - 14)) / 24));
    const condIdx = Math.floor(rng() * CONDITIONS.length);
    const isNow = i === 0 && fromHour === undefined;
    const h12 = hour % 12 || 12;
    const timeLabel = isNow ? 'Now' : `${h12}${hour >= 12 ? 'PM' : 'AM'}`;
    result.push({ hour, temp, condition: CONDITIONS[condIdx], timeLabel, isNow });
  }
  return result;
}
