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

export function determineSkyPhase(elevation: number): SkyPhase {
  const phases: Record<string, { range: [number, number]; name: string; gradient: string; pattern: string; opacity: number }> = {
    night: {
      range: [-90, -18],
      name: 'Night',
      gradient: 'linear-gradient(180deg, #080A1A 0%, #0E1230 25%, #151A3A 60%, #1A1F3E 100%)',
      pattern: 'girih-tiles',
      patternOpacity: 0.03
    },
    fajr: {
      range: [-18, -12],
      name: 'Fajr',
      gradient: 'linear-gradient(180deg, #0E1230 0%, #1A1F4A 20%, #2D2B6B 40%, #4A3B7E 60%, #6B4A8A 80%, #8B5A9A 100%)',
      pattern: 'eight-point-star',
      patternOpacity: 0.025
    },
    sunrise: {
      range: [-12, 0],
      name: 'Sunrise',
      gradient: 'linear-gradient(180deg, #1A1F4A 0%, #3D2B5E 12%, #6B4A7A 25%, #A05A6A 37%, #C46A4C 50%, #E88A4A 62%, #F5A962 75%, #FAD98A 87%, #FFE8A0 100%)',
      pattern: 'muqarnas',
      patternOpacity: 0.03
    },
    morning: {
      range: [0, 30],
      name: 'Morning',
      gradient: 'linear-gradient(180deg, #F5A962 0%, #F8C47A 20%, #FAD98A 40%, #A8D5E8 60%, #7EC8E8 80%, #5DADE2 100%)',
      pattern: 'girih-tiles',
      patternOpacity: 0.02
    },
    midday: {
      range: [30, 60],
      name: 'Midday',
      gradient: 'linear-gradient(180deg, #87CEEB 0%, #5DADE2 25%, #3498DB 50%, #2E86C1 75%, #1B4F72 100%)',
      pattern: 'kufic-border',
      patternOpacity: 0.015
    },
    afternoon: {
      range: [60, 30],
      name: 'Afternoon',
      gradient: 'linear-gradient(180deg, #2E86C1 0%, #3498DB 20%, #5DADE2 40%, #85C1E9 60%, #A9D5E8 80%, #F5A962 100%)',
      pattern: 'girih-tiles',
      patternOpacity: 0.02
    },
    sunset: {
      range: [30, 0],
      name: 'Sunset',
      gradient: 'linear-gradient(180deg, #5DADE2 0%, #85C1E9 10%, #F5A962 25%, #F39C12 35%, #E67E22 45%, #D35400 55%, #C0392B 65%, #A93226 80%, #8B2C2C 100%)',
      pattern: 'muqarnas',
      patternOpacity: 0.03
    },
    maghrib: {
      range: [0, -12],
      name: 'Maghrib',
      gradient: 'linear-gradient(180deg, #8B2C2C 0%, #A93226 15%, #C0392B 30%, #9B59B6 45%, #6C3A7A 60%, #4A2C5E 75%, #2D1B3E 100%)',
      pattern: 'eight-point-star',
      patternOpacity: 0.025
    },
    isha: {
      range: [-12, -18],
      name: 'Isha',
      gradient: 'linear-gradient(180deg, #2D1B3E 0%, #1A1D3A 30%, #12142E 60%, #0A0C1E 100%)',
      pattern: 'girih-tiles',
      patternOpacity: 0.02
    }
  };

  for (const [id, phase] of Object.entries(phases)) {
    if (phase.range[0] >= phase.range[1]) {
      if (elevation <= phase.range[0] && elevation >= phase.range[1]) {
        return { id, ...phase };
      }
    } else {
      if (elevation >= phase.range[0] && elevation <= phase.range[1]) {
        return { id, ...phase };
      }
    }
  }

  return { id: 'night', ...phases.night };
}