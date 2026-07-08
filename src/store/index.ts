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
  skySliderDragging: boolean;
  setSkySliderDragging: (v: boolean) => void;
  moonManualPhase: number | null;
  setMoonManualPhase: (phase: number | null) => void;

  // Location
  lastKnownLocation: Coordinates | null;
  setLastKnownLocation: (loc: Coordinates | null) => void;

  // Initialization
  isInitialized: boolean;
  setInitialized: (init: boolean) => void;

  // Azaan playing state
  isAzaanPlaying: boolean;
  setAzaanPlaying: (v: boolean) => void;
}

const DEFAULT_SETTINGS: PrayerSettings = {
  coordinates: { latitude: 0, longitude: 0 },
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  calculationMethod: 'moonsightingCommittee',
  madhab: 'hanafi',
  highLatitudeRule: 'middleOfNight',
  timeFormat: '12h',
  theme: 'auto',
  hijriAdjustment: 0,
  adjustments: { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
  autoNightMode: { enabled: true, mode: 'sunsetSunrise', start: '22:00', end: '06:00' },
  azaan: {
    enabled: true,
    selectedMuazzin: 'istanbul',
    exitAodOnPlay: true,
  },
  selectedCityName: '',
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
      skySliderDragging: false,
      setSkySliderDragging: (skySliderDragging) => set({ skySliderDragging }),
      moonManualPhase: null,
      setMoonManualPhase: (moonManualPhase) => set({ moonManualPhase }),

      // Location
      lastKnownLocation: null,
      setLastKnownLocation: (lastKnownLocation) => set({ lastKnownLocation }),

      // Init
      isInitialized: false,
      setInitialized: (isInitialized) => set({ isInitialized }),

      // Azaan playing
      isAzaanPlaying: false,
      setAzaanPlaying: (isAzaanPlaying) => set({ isAzaanPlaying }),
    }),
    {
      name: 'salah-settings',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        settings: state.settings,
        lastKnownLocation: state.lastKnownLocation,
        aodMode: state.aodMode,
      }),
      // Deep-merge persisted state so newly-added settings (e.g. autoNightMode)
      // fall back to their defaults for users with older saved settings.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppState>;
        const pSettings = (p.settings ?? {}) as any;
        return {
          ...current,
          ...p,
          settings: {
            ...current.settings,
            ...pSettings,
            adjustments: {
              ...current.settings.adjustments,
              ...(pSettings.adjustments ?? {}),
            },
            autoNightMode: {
              ...current.settings.autoNightMode,
              ...(pSettings.autoNightMode ?? {}),
            },
            azaan: {
              ...current.settings.azaan,
              ...(pSettings.azaan ?? {}),
            },
          },
        };
      },
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
export const useIsAzaanPlaying = () => useStore((state) => state.isAzaanPlaying);
export const useMoonManualPhase = () => useStore((state) => state.moonManualPhase);
export const useSetMoonManualPhase = () => useStore((state) => state.setMoonManualPhase);