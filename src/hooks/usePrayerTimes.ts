import { useEffect, useCallback, useRef } from 'react';
import { calculatePrayerTimes, getPrayerInfo, formatCountdown, calculateQibla, calculateHijriDate } from '../utils/prayerTimes';
import { calculateSunPosition, determineSkyPhase, getMoonPhase } from '../utils/skyEngine';
import { useStore } from '../store';

export function usePrayerTimeEngine() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const settings = useStore((s) => s.settings);
  const setPrayerTimes = useStore((s) => s.setPrayerTimes);
  const setPrayerInfo = useStore((s) => s.setPrayerInfo);
  const setTimeUntilNext = useStore((s) => s.setTimeUntilNext);
  const setCurrentPrayer = useStore((s) => s.setCurrentPrayer);
  const setNextPrayer = useStore((s) => s.setNextPrayer);
  const setSkyPhase = useStore((s) => s.setSkyPhase);
  const setSolarPosition = useStore((s) => s.setSolarPosition);
  const setMoonPosition = useStore((s) => s.setMoonPosition);
  const setQiblaDirection = useStore((s) => s.setQiblaDirection);
  const setHijriDate = useStore((s) => s.setHijriDate);
  const setIsInitialized = useStore((s) => s.setInitialized);

  const tick = useCallback(() => {
    const now = new Date();
    const { latitude, longitude } = settings.coordinates;
    const hasLocation = latitude !== 0 || longitude !== 0;

    if (hasLocation) {
      const solarPos = calculateSunPosition(now, latitude, longitude);
      setSolarPosition(solarPos);

      const phase = determineSkyPhase(solarPos.elevation, solarPos.azimuth);
      setSkyPhase(phase);

      const moonInfo = getMoonPhase(now);
      setMoonPosition({
        phase: moonInfo.phase,
        phaseName: moonInfo.name,
        illumination: moonInfo.illumination,
        elevation: 0,
        azimuth: 0,
      });

      const times = calculatePrayerTimes(now, {
        coordinates: settings.coordinates,
        method: settings.calculationMethod,
        madhab: settings.madhab,
        highLatitudeRule: settings.highLatitudeRule,
        adjustments: settings.adjustments,
      });

      if (times) {
        setPrayerTimes(times);

        const info = getPrayerInfo(times, now);
        setPrayerInfo(info);

        const current = info.find((p) => p.isCurrent) || null;
        const next = info.find((p) => p.isNext) || null;
        setCurrentPrayer(current);
        setNextPrayer(next);

        if (next) {
          let diff = next.time.getTime() - now.getTime();
          if (diff <= 0) {
            // next.time is today's prayer that has already passed (wrap-around after Isha).
            // Recalculate for tomorrow to get the real countdown.
            const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            const tmr = calculatePrayerTimes(tomorrow, {
              coordinates: settings.coordinates,
              method: settings.calculationMethod,
              madhab: settings.madhab,
              highLatitudeRule: settings.highLatitudeRule,
              adjustments: settings.adjustments,
            });
            if (tmr) {
              const key = next.key as keyof typeof tmr;
              const tomorrowTime = tmr[key];
              if (tomorrowTime instanceof Date) {
                diff = tomorrowTime.getTime() - now.getTime();
              }
            }
          }
          const { text } = formatCountdown(Math.max(0, diff));
          setTimeUntilNext(text);
        }
      }

      const qibla = calculateQibla(latitude, longitude);
      setQiblaDirection(qibla);

      const hijri = calculateHijriDate(now, settings.hijriAdjustment);
      setHijriDate(hijri);
    }

    setIsInitialized(true);
  }, [settings, setPrayerTimes, setPrayerInfo, setTimeUntilNext, setCurrentPrayer, setNextPrayer, setSkyPhase, setSolarPosition, setMoonPosition, setQiblaDirection, setHijriDate, setIsInitialized]);

  useEffect(() => {
    tick();
    intervalRef.current = setInterval(tick, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [tick]);
}

// Selector hooks
export function useSkyPhase() {
  return useStore((s) => s.skyPhase);
}

export function useSolarPosition() {
  return useStore((s) => s.solarPosition);
}

export function useMoonPosition() {
  return useStore((s) => s.moonPosition);
}

export function useCurrentPrayer() {
  return useStore((s) => s.currentPrayer);
}

export function useNextPrayer() {
  return useStore((s) => s.nextPrayer);
}

export function usePrayerTimes() {
  return useStore((s) => s.prayerTimes);
}

export function usePrayerInfoList() {
  return useStore((s) => s.prayerInfo);
}

export function useTimeUntilNext() {
  return useStore((s) => s.timeUntilNext);
}

export function useQiblaDirection() {
  return useStore((s) => s.qiblaDirection);
}

export function useHijriDate() {
  return useStore((s) => s.hijriDate);
}