import {
  Coordinates, CalculationMethod, PrayerTimes as AdhanPrayerTimes, Madhab, HighLatitudeRule
} from 'adhan';
import type { PrayerTimes, PrayerInfo } from '../types';
import { PRAYER_ORDER, PRAYER_NAMES_AR, PRAYER_NAMES_EN } from '../types';

interface CalculationParams {
  coordinates: { latitude: number; longitude: number };
  method: string;
  madhab: 'shafi' | 'hanafi';
  highLatitudeRule: string;
  adjustments: { fajr: number; dhuhr: number; asr: number; maghrib: number; isha: number };
}

function toAdhanMethod(method: string) {
  const map: Record<string, () => ReturnType<typeof CalculationMethod.MuslimWorldLeague>> = {
    muslimWorldLeague: () => CalculationMethod.MuslimWorldLeague(),
    isna: () => CalculationMethod.NorthAmerica(),
    egyptian: () => CalculationMethod.Egyptian(),
    ummAlQura: () => CalculationMethod.UmmAlQura(),
    karachi: () => CalculationMethod.Karachi(),
    moonsightingCommittee: () => CalculationMethod.MoonsightingCommittee(),
    dubai: () => CalculationMethod.Dubai(),
    kuwait: () => CalculationMethod.Kuwait(),
    qatar: () => CalculationMethod.Qatar(),
    singapore: () => CalculationMethod.Singapore(),
    tehran: () => CalculationMethod.Tehran(),
    turkey: () => CalculationMethod.Turkey(),
  };
  return (map[method] || CalculationMethod.MuslimWorldLeague)();
}

function toAdhanMadhab(madhab: string) {
  return madhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;
}

function toAdhanHighLatRule(rule: string) {
  const map: Record<string, HighLatitudeRule> = {
    middleOfNight: HighLatitudeRule.MiddleOfTheNight,
    seventhOfNight: HighLatitudeRule.SeventhOfTheNight,
    twilightAngle: HighLatitudeRule.TwilightAngle,
    nearestLatitude: HighLatitudeRule.NearestLatitude,
  };
  return map[rule] || HighLatitudeRule.MiddleOfTheNight;
}

export function calculatePrayerTimes(
  date: Date,
  params: CalculationParams
): PrayerTimes | null {
  try {
    const coords = new Coordinates(params.coordinates.latitude, params.coordinates.longitude);
    const adhanMethod = toAdhanMethod(params.method);
    const madhab = toAdhanMadhab(params.madhab);
    const highLat = toAdhanHighLatRule(params.highLatitudeRule);

    const calcParams = adhanMethod;
    calcParams.madhab = madhab;
    calcParams.highLatitudeRule = highLat;

    // Apply adjustments
    const adj = params.adjustments;
    calcParams.adjustments = {
      fajr: adj.fajr,
      dhuhr: adj.dhuhr,
      asr: adj.asr,
      maghrib: adj.maghrib,
      isha: adj.isha,
    };

    const times = new AdhanPrayerTimes(coords, date, calcParams);

    return {
      fajr: times.fajr,
      sunrise: times.sunrise,
      dhuhr: times.dhuhr,
      asr: times.asr,
      maghrib: times.maghrib,
      isha: times.isha,
    };
  } catch (e) {
    console.error('Prayer time calculation failed:', e);
    return null;
  }
}

export function getPrayerInfo(
  times: PrayerTimes,
  now: Date,
  format: '12h' | '24h'
): PrayerInfo[] {
  const prayers: PrayerInfo[] = PRAYER_ORDER.map((key) => ({
    key,
    nameAr: PRAYER_NAMES_AR[key],
    nameEn: PRAYER_NAMES_EN[key],
    time: times[key],
    progress: 0,
    isCurrent: false,
    isNext: false,
  }));

  // Sort by time
  prayers.sort((a, b) => a.time.getTime() - b.time.getTime());

  // Find current and next
  let currentIdx = -1;
  for (let i = 0; i < prayers.length; i++) {
    if (prayers[i].time > now) {
      if (i === 0) {
        currentIdx = prayers.length - 1;
      } else {
        currentIdx = i - 1;
      }
      break;
    }
    if (i === prayers.length - 1) {
      currentIdx = i;
    }
  }

  if (currentIdx >= 0) {
    prayers[currentIdx].isCurrent = true;
    const nextIdx = currentIdx < prayers.length - 1 ? currentIdx + 1 : 0;
    prayers[nextIdx].isNext = true;
  }

  // Calculate progress
  for (let i = 0; i < prayers.length; i++) {
    const current = prayers[i];
    const next = prayers[i < prayers.length - 1 ? i + 1 : 0];
    const prev = prayers[i > 0 ? i - 1 : prayers.length - 1];

    if (current.isCurrent) {
      if (current.time <= now) {
        let endTime: Date;
        if (current.key === 'isha') {
          endTime = new Date(now);
          endTime.setHours(23, 59, 59, 999);
        } else {
          endTime = next.time;
        }
        const total = endTime.getTime() - current.time.getTime();
        const elapsed = now.getTime() - current.time.getTime();
        current.progress = total > 0 ? Math.min(100, Math.max(0, (elapsed / total) * 100)) : 0;
      }
    }
  }

  return prayers;
}

export function formatTime(date: Date, format: '12h' | '24h', timezone: string): string {
  try {
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: format === '12h',
      timeZone: timezone,
    };
    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch {
    const h = date.getHours();
    const m = String(date.getMinutes()).padStart(2, '0');
    if (format === '12h') {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${m} ${ampm}`;
    }
    return `${String(h).padStart(2, '0')}:${m}`;
  }
}

export function formatCountdown(ms: number): { text: string; parts: { h: string; m: string; s: string } } {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  const parts = {
    h: String(h).padStart(2, '0'),
    m: String(m).padStart(2, '0'),
    s: String(s).padStart(2, '0'),
  };

  return {
    text: `${parts.h}:${parts.m}:${parts.s}`,
    parts,
  };
}

export function calculateQibla(lat: number, lng: number): { bearing: number; distance: number } {
  const kaabaLat = 21.4225;
  const kaabaLng = 39.8262;
  const R = 6371; // Earth radius in km

  const dLng = (kaabaLng - lng) * Math.PI / 180;
  const lat1 = lat * Math.PI / 180;
  const lat2 = kaabaLat * Math.PI / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  let bearing = Math.atan2(y, x) * 180 / Math.PI;
  bearing = (bearing + 360) % 360;

  const dLat = (kaabaLat - lat) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return { bearing: Math.round(bearing), distance: Math.round(distance) };
}

export function calculateHijriDate(date: Date, adjustment: number = 0): {
  day: number;
  month: number;
  year: number;
  monthNameAr: string;
  monthNameEn: string;
  dayNameAr: string;
  dayNameEn: string;
  gregorian: Date;
} | null {
  try {
    // Simple Hijri calculation (approximately)
    const dayNamesAr = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const dayNamesEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNamesAr = [
      'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني',
      'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان',
      'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
    ];
    const monthNamesEn = [
      'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
      'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Sha\'ban',
      'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'
    ];

    // Approximate conversion: Hijri year ≈ Gregorian year - 622 + (Gregorian year - 622) / 32
    const gy = date.getFullYear();
    const gm = date.getMonth() + 1;
    const gd = date.getDate() + adjustment;

    const jd = Math.floor((1461 * (gy + 4800 + Math.floor((gm - 14) / 12))) / 4) +
      Math.floor((367 * (gm - 2 - 12 * Math.floor((gm - 14) / 12))) / 12) -
      Math.floor((3 * Math.floor((gy + 4900 + Math.floor((gm - 14) / 12)) / 100)) / 4) + gd - 32075;

    const l = jd - 1948440 + 10632;
    const n = Math.floor((l - 1) / 10631);
    const l2 = l - 10631 * n + 354;
    const j = (Math.floor((10985 - l2) / 5316)) * (Math.floor((50 * l2) / 17719)) + (Math.floor(l2 / 5670)) * (Math.floor((43 * l2) / 15238));
    const l3 = l2 - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) - (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29;
    const month = Math.floor((24 * l3) / 709);
    const day = l3 - Math.floor((709 * month) / 24);
    const year = 30 * n + j - 30;

    const dow = date.getDay();

    return {
      day: Math.round(day),
      month: Math.round(month) + 1,
      year: Math.round(year),
      monthNameAr: monthNamesAr[Math.round(month)],
      monthNameEn: monthNamesEn[Math.round(month)],
      dayNameAr: dayNamesAr[dow],
      dayNameEn: dayNamesEn[dow],
      gregorian: date,
    };
  } catch {
    return null;
  }
}