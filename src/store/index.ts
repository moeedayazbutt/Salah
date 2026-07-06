import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PrayerSettings, Coordinates, PrayerTimes, PrayerInfo, SolarPosition, MoonPosition, SkyPhase, QiblaDirection, HijriDate } from '../types';

interface AppState {
  // Settings
  settings: PrayerSettings;
  updateSettings: (partial: Partial<PrayerSettings>) => void;
  resetSettings: () => void;

  // Computed prayer data
  prayerTimes: PrayerTimes | null;
  setPrayerTimes: (times: PrayerTimes | null) => void;
  prayerInfo: PrayerInfo[];
  setPrayerInfo: (info: PrayerInfo[]) => void;
  currentPrayer: PrayerInfo | null;
  setCurrentPrayer: (prayer: PrayerInfo | null) => void;
  nextPrayer: PrayerInfo | null;
  setNextPrayer: (prayer: PrayerInfo | null) => void;
  timeUntilNext: string;
  setTimeUntilNext: (time: string) => void;

  // Sky & astronomy
  skyPhase: SkyPhase | null;
  setSkyPhase: (phase: SkyPhase | null) => void;
  solarPosition: SolarPosition | null;
  setSolarPosition: (pos: SolarPosition | null) => void;
  moonPosition: MoonPosition | null;
  setMoonPosition: (pos: MoonPosition | null) => void;

  // Qibla
  qiblaDirection: QiblaDirection | null;
  setQiblaDirection: (dir: QiblaDirection | null) => void;

  // Hijri date
  hijriDate: HijriDate | null;
  setHijriDate: (date: HijriDate | null) => void;

  // UI state
  isSettingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  isLocationSearchOpen: boolean;
  setLocationSearchOpen: (open: boolean) => void;
  aodMode: boolean;
  setAodMode: (v: boolean) => void;
  skyDisplayHours: number | null;
  setSkyDisplayHours: (h: number | null) => void;
  skySliderAuto: boolean;
  setSkySliderAuto: (v: boolean) => void;

  // Location
  lastKnownLocation: Coordinates | null;
  setLastKnownLocation: (loc: Coordinates | null) => void;

  // Initialization
  isInitialized: boolean;
  setInitialized: (init: boolean) => void;
}

const DEFAULT_SETTINGS: PrayerSettings = {
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

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Settings
      settings: DEFAULT_SETTINGS,
      updateSettings: (partial) =>
        set((state) => ({
          settings: { ...state.settings, ...partial },
        })),
      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),

      // Prayer data
      prayerTimes: null,
      setPrayerTimes: (prayerTimes) => set({ prayerTimes }),
      prayerInfo: [],
      setPrayerInfo: (prayerInfo) => set({ prayerInfo }),
      currentPrayer: null,
      setCurrentPrayer: (currentPrayer) => set({ currentPrayer }),
      nextPrayer: null,
      setNextPrayer: (nextPrayer) => set({ nextPrayer }),
      timeUntilNext: '--:--:--',
      setTimeUntilNext: (timeUntilNext) => set({ timeUntilNext }),

      // Sky
      skyPhase: null,
      setSkyPhase: (skyPhase) => set({ skyPhase }),
      solarPosition: null,
      setSolarPosition: (solarPosition) => set({ solarPosition }),
      moonPosition: null,
      setMoonPosition: (moonPosition) => set({ moonPosition }),

      // Qibla
      qiblaDirection: null,
      setQiblaDirection: (qiblaDirection) => set({ qiblaDirection }),

      // Hijri
      hijriDate: null,
      setHijriDate: (hijriDate) => set({ hijriDate }),

      // UI
      isSettingsOpen: false,
      setSettingsOpen: (isSettingsOpen) => set({ isSettingsOpen }),
      isLocationSearchOpen: false,
      setLocationSearchOpen: (isLocationSearchOpen) => set({ isLocationSearchOpen }),
      aodMode: false,
      setAodMode: (aodMode) => set({ aodMode }),
      skyDisplayHours: null,
      setSkyDisplayHours: (skyDisplayHours) => set({ skyDisplayHours }),
      skySliderAuto: true,
      setSkySliderAuto: (skySliderAuto) => set({ skySliderAuto }),

      // Location
      lastKnownLocation: null,
      setLastKnownLocation: (lastKnownLocation) => set({ lastKnownLocation }),

      // Init
      isInitialized: false,
      setInitialized: (isInitialized) => set({ isInitialized }),
    }),
    {
      name: 'salah-settings',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        settings: state.settings,
        lastKnownLocation: state.lastKnownLocation,
        aodMode: state.aodMode,
      }),
    }
  )
);

// Selectors for performance
export const useSettings = () => useStore((state) => state.settings);
export const usePrayerTimes = () => useStore((state) => state.prayerTimes);
export const usePrayerInfo = () => useStore((state) => state.prayerInfo);
export const useCurrentPrayer = () => useStore((state) => state.currentPrayer);
export const useNextPrayer = () => useStore((state) => state.nextPrayer);
export const useTimeUntilNext = () => useStore((state) => state.timeUntilNext);
export const useSkyPhase = () => useStore((state) => state.skyPhase);
export const useSolarPosition = () => useStore((state) => state.solarPosition);
export const useMoonPosition = () => useStore((state) => state.moonPosition);
export const useQiblaDirection = () => useStore((state) => state.qiblaDirection);
export const useHijriDate = () => useStore((state) => state.hijriDate);
export const useIsSettingsOpen = () => useStore((state) => state.isSettingsOpen);
export const useIsInitialized = () => useStore((state) => state.isInitialized);