export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface PrayerTimes {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
}

export interface PrayerAdjustments {
  fajr: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
}

export interface CalculationMethod {
  id: string;
  name: string;
  fajrAngle: number;
  ishaAngle: number;
  ishaInterval?: number; // For Umm al-Qura (minutes after maghrib)
  description: string;
}

export type Madhab = 'shafi' | 'hanafi';
export type HighLatitudeRule = 'middleOfNight' | 'seventhOfNight' | 'twilightAngle' | 'nearestLatitude';
export type TimeFormat = '12h' | '24h';
export type ThemeMode = 'auto' | 'light' | 'dark';

export interface PrayerSettings {
  coordinates: Coordinates;
  timezone: string;
  calculationMethod: string;
  madhab: Madhab;
  highLatitudeRule: HighLatitudeRule;
  timeFormat: TimeFormat;
  theme: ThemeMode;
  hijriAdjustment: number;
  adjustments: PrayerAdjustments;
  notifications: {
    enabled: boolean;
    beforeMinutes: number;
    silent: boolean;
    customSound: boolean;
  };
}

export interface PrayerInfo {
  key: keyof PrayerTimes;
  nameAr: string;
  nameEn: string;
  time: Date;
  progress: number; // 0-100
  isCurrent: boolean;
  isNext: boolean;
}

export interface SolarPosition {
  elevation: number; // degrees, -90 to 90
  azimuth: number;   // degrees, 0-360
}

export interface MoonPosition {
  phase: number; // 0-1
  phaseName: string;
  illumination: number; // 0-1
  elevation: number;
  azimuth: number;
}

export interface SkyPhase {
  id: string;
  name: string;
  gradient: string;
  pattern: string;
  patternOpacity: number;
}

export interface QiblaDirection {
  bearing: number; // degrees from north
  distance: number; // km
}

export interface HijriDate {
  day: number;
  month: number;
  year: number;
  monthNameAr: string;
  monthNameEn: string;
  dayNameAr: string;
  dayNameEn: string;
  gregorian: Date;
}

// Default calculation methods
export const CALCULATION_METHODS: CalculationMethod[] = [
  {
    id: 'muslimWorldLeague',
    name: 'Muslim World League (MWL)',
    fajrAngle: 18,
    ishaAngle: 17,
    description: 'Europe, Far East, parts of Americas',
  },
  {
    id: 'isna',
    name: 'Islamic Society of North America (ISNA)',
    fajrAngle: 15,
    ishaAngle: 15,
    description: 'USA, Canada',
  },
  {
    id: 'egyptian',
    name: 'Egyptian General Authority of Survey',
    fajrAngle: 19.5,
    ishaAngle: 17.5,
    description: 'Africa, Syria, Iraq, Lebanon',
  },
  {
    id: 'ummAlQura',
    name: 'Umm al-Qura University, Makkah',
    fajrAngle: 18.5,
    ishaAngle: 0,
    ishaInterval: 90,
    description: 'Saudi Arabia, Gulf states',
  },
  {
    id: 'karachi',
    name: 'University of Islamic Sciences, Karachi',
    fajrAngle: 18,
    ishaAngle: 18,
    description: 'Pakistan, Bangladesh, India, Afghanistan',
  },
  {
    id: 'moonsightingCommittee',
    name: 'Moonsighting Committee',
    fajrAngle: 15,
    ishaAngle: 15,
    description: 'Parts of North America, UK',
  },
  {
    id: 'dubai',
    name: 'Dubai',
    fajrAngle: 18.2,
    ishaAngle: 18.2,
    description: 'UAE',
  },
  {
    id: 'kuwait',
    name: 'Kuwait',
    fajrAngle: 18,
    ishaAngle: 17.5,
    description: 'Kuwait',
  },
  {
    id: 'qatar',
    name: 'Qatar',
    fajrAngle: 18,
    ishaAngle: 17.5,
    description: 'Qatar',
  },
  {
    id: 'singapore',
    name: 'Singapore (MUIS)',
    fajrAngle: 20,
    ishaAngle: 18,
    description: 'Singapore, Malaysia',
  },
  {
    id: 'tehran',
    name: 'Institute of Geophysics, Tehran',
    fajrAngle: 17.7,
    ishaAngle: 14,
    description: 'Iran, some Shia communities',
  },
  {
    id: 'turkey',
    name: 'Turkey (Diyanet)',
    fajrAngle: 18,
    ishaAngle: 17,
    description: 'Turkey',
  },
];

export const MADHAB_OPTIONS = [
  { value: 'shafi', label: 'Shafi / Maliki / Hanbali (Standard)', description: 'Shadow length = object length' },
  { value: 'hanafi', label: 'Hanafi (Later)', description: 'Shadow length = 2x object length (~45-60 min later)' },
];

export const HIGH_LATITUDE_RULES = [
  { value: 'middleOfNight', label: 'Middle of the Night', description: 'Night divided in half' },
  { value: 'seventhOfNight', label: 'Seventh of the Night', description: 'Night divided into 7 parts' },
  { value: 'twilightAngle', label: 'Twilight Angle', description: 'Use twilight angle at nearest latitude' },
  { value: 'nearestLatitude', label: 'Nearest Latitude', description: 'Use times from nearest valid latitude' },
];

export const TIME_FORMATS = [
  { value: '12h', label: '12 Hour (4:30 PM)' },
  { value: '24h', label: '24 Hour (16:30)' },
];

export const THEME_MODES = [
  { value: 'auto', label: 'Auto (Follow Sky)', icon: '☀️🌙' },
  { value: 'light', label: 'Light', icon: '☀️' },
  { value: 'dark', label: 'Dark', icon: '🌙' },
];

export const PRAYER_ORDER: (keyof PrayerTimes)[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

export const PRAYER_NAMES_AR: Record<keyof PrayerTimes, string> = {
  fajr: 'الفجر',
  sunrise: 'الشروق',
  dhuhr: 'الظهر',
  asr: 'العصر',
  maghrib: 'المغرب',
  isha: 'العشاء',
};

export const PRAYER_NAMES_EN: Record<keyof PrayerTimes, string> = {
  fajr: 'Fajr',
  sunrise: 'Sunrise',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};

export const HIJRI_MONTHS_AR = [
  'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني',
  'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان',
  'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
];

export const HIJRI_MONTHS_EN = [
  'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
  'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Sha\'ban',
  'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'
];

export const DAY_NAMES_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
export const DAY_NAMES_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Default settings
export const DEFAULT_SETTINGS: PrayerSettings = {
  coordinates: { latitude: 0, longitude: 0 },
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  calculationMethod: 'muslimWorldLeague',
  madhab: 'shafi',
  highLatitudeRule: 'middleOfNight',
  timeFormat: '12h',
  theme: 'auto',
  hijriAdjustment: 0,
  adjustments: { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
  notifications: { enabled: false, beforeMinutes: 5, silent: false, customSound: false },
};