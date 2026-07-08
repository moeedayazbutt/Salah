export interface SkyPhase {
  id: string;
  name: string;
  gradient: string;
  pattern: string;
  patternOpacity: number;
}

export interface SolarPosition {
  elevation: number;
  azimuth: number;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function calculateSunPosition(
  date: Date,
  lat: number,
  lng: number
): SolarPosition {
  const day = dayOfYear(date);
  const time = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
  const solarDec = 23.44 * Math.sin(toRad((360 / 365) * (day - 81)));
  const hourAngle = 15 * (time - 12) + lng;
  
  const elevation = toDeg(
    Math.asin(
      Math.sin(toRad(lat)) * Math.sin(toRad(solarDec)) +
      Math.cos(toRad(lat)) * Math.cos(toRad(solarDec)) * Math.cos(toRad(hourAngle))
    )
  );
  
  const azimuth = toDeg(
    Math.atan2(
      Math.sin(toRad(hourAngle)),
      Math.cos(toRad(hourAngle)) * Math.sin(toRad(lat)) - 
      Math.tan(toRad(solarDec)) * Math.cos(toRad(lat))
    )
  ) + 180;

  return { elevation, azimuth: azimuth % 360 };
}

function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function getMoonPhase(date: Date): { phase: number; name: string; illumination: number } {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  let jd = 0;
  let y = year;
  let m = month;
  
  if (m <= 2) {
    y--;
    m += 12;
  }
  
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524.5;
  
  const daysSinceNew = jd - 2451549.5;
  const newMoons = daysSinceNew / 29.53058867;
  const phase = newMoons - Math.floor(newMoons);
  
  const illumination = (1 - Math.cos(phase * 2 * Math.PI)) / 2;
  
  let name: string;
  if (phase < 0.025 || phase > 0.975) name = 'New Moon';
  else if (phase < 0.25) name = 'Waxing Crescent';
  else if (phase < 0.275) name = 'First Quarter';
  else if (phase < 0.5) name = 'Waxing Gibbous';
  else if (phase < 0.525) name = 'Full Moon';
  else if (phase < 0.75) name = 'Waning Gibbous';
  else if (phase < 0.775) name = 'Last Quarter';
  else name = 'Waning Crescent';
  
  return { phase, name, illumination };
}

export function determineSkyPhase(elevation: number, azimuth = 90): SkyPhase {
  // azimuth > 180 → sun is west of south → afternoon/evening half of day
  const isPM = azimuth > 180;

  const phases: Record<string, { name: string; gradient: string; pattern: string; patternOpacity: number }> = {
    night:     { name: 'Night',     gradient: 'linear-gradient(180deg, #060810 0%, #090C1A 30%, #0C1025 70%, #0E1230 100%)', pattern: 'girih-tiles',     patternOpacity: 0.03  },
    fajr:      { name: 'Fajr',      gradient: 'linear-gradient(180deg, #0A0D1E 0%, #1A1F4A 25%, #2D2B6B 50%, #4A3B7E 75%, #6B4A8A 100%)', pattern: 'eight-point-star', patternOpacity: 0.025 },
    sunrise:   { name: 'Sunrise',   gradient: 'linear-gradient(180deg, #1A1F4A 0%, #4A3060 15%, #8A4A60 30%, #C46A4C 50%, #E88A4A 70%, #F5B06A 85%, #FFE090 100%)', pattern: 'muqarnas',       patternOpacity: 0.03  },
    morning:   { name: 'Morning',   gradient: 'linear-gradient(180deg, #E8C070 0%, #F0D080 15%, #B8DCF0 40%, #80C8EE 65%, #50B0E8 85%, #3498DB 100%)', pattern: 'girih-tiles',     patternOpacity: 0.02  },
    midday:    { name: 'Midday',    gradient: 'linear-gradient(180deg, #60C0F0 0%, #3498DB 20%, #2080C0 45%, #1868A8 70%, #104878 100%)', pattern: 'kufic-border',    patternOpacity: 0.015 },
    afternoon: { name: 'Afternoon', gradient: 'linear-gradient(180deg, #2080C0 0%, #3498DB 20%, #60C0EE 45%, #A0D4EE 65%, #D0B870 85%, #E8A858 100%)', pattern: 'girih-tiles',     patternOpacity: 0.02  },
    sunset:    { name: 'Sunset',    gradient: 'linear-gradient(180deg, #D09050 0%, #E07030 20%, #C03020 40%, #901840 55%, #601060 70%, #380848 85%, #1C0428 100%)', pattern: 'muqarnas',       patternOpacity: 0.035 },
    maghrib:   { name: 'Maghrib',   gradient: 'linear-gradient(180deg, #2A0838 0%, #401060 20%, #501880 35%, #402870 50%, #301860 65%, #200840 80%, #100820 100%)', pattern: 'eight-point-star', patternOpacity: 0.025 },
    isha:      { name: 'Isha',      gradient: 'linear-gradient(180deg, #160826 0%, #100820 30%, #0C0C1C 60%, #080A18 100%)', pattern: 'girih-tiles',     patternOpacity: 0.02  },
  };

  let id: string;
  if      (elevation <= -18) id = 'night';
  else if (elevation <= -12) id = 'fajr';
  else if (elevation <= 0)   id = isPM ? 'maghrib'   : 'sunrise';
  else if (elevation <= 30)  id = isPM ? 'sunset'    : 'morning';
  else if (elevation <= 60)  id = isPM ? 'afternoon' : 'midday';
  else                       id = 'midday';

  return { id, ...phases[id] };
}

export function calculateSunPositionFromPrayers(
  date: Date,
  times: { sunrise: Date; maghrib: Date }
): SolarPosition {
  const t = date.getTime();
  const sunriseMs = times.sunrise.getTime();
  const maghribMs = times.maghrib.getTime();

  if (t >= sunriseMs && t <= maghribMs) {
    const p = (t - sunriseMs) / (maghribMs - sunriseMs);
    const elevation = 90 * Math.sin(p * Math.PI);
    const azimuth = 90 + p * 180;
    return { elevation, azimuth };
  } else {
    // Night
    let p = 0;
    if (t < sunriseMs) {
      const prevMaghribMs = maghribMs - 24 * 3600 * 1000;
      p = (t - prevMaghribMs) / (sunriseMs - prevMaghribMs);
    } else {
      const nextSunriseMs = sunriseMs + 24 * 3600 * 1000;
      p = (t - maghribMs) / (nextSunriseMs - maghribMs);
    }
    const elevation = -90 * Math.sin(p * Math.PI);
    const azimuth = (270 + p * 180) % 360;
    return { elevation, azimuth };
  }
}