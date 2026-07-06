import { useEffect, useRef } from 'react';
import { useStore } from '../store';

const ADHAN_URL = 'https://cdn.jsdelivr.net/npm/adhan-audio@1.0.0/adhan.mp3';
const NOTIFICATION_CHECK_INTERVAL = 30000; // 30 seconds

export function useAdhanNotifications() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastNotifiedRef = useRef<string>('');
  const settings = useStore((s) => s.settings);
  const nextPrayer = useStore((s) => s.nextPrayer);

  useEffect(() => {
    if (!settings.notifications.enabled || !nextPrayer) return;

    const checkAndNotify = () => {
      const now = new Date();
      const diff = nextPrayer.time.getTime() - now.getTime();
      const minutesUntil = diff / 60000;

      const prayerKey = `${nextPrayer.key}-${nextPrayer.time.getTime()}`;
      if (lastNotifiedRef.current === prayerKey) return;

      // Notify at the exact prayer time
      if (minutesUntil <= 0 && minutesUntil > -1) {
        lastNotifiedRef.current = prayerKey;

        // Play adhan sound
        if (!audioRef.current) {
          audioRef.current = new Audio(ADHAN_URL);
          audioRef.current.loop = false;
        }

        audioRef.current.play().catch(() => {
          // Browser may block autoplay - that's ok
        });

        // Browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Salah Time', {
            body: `It's time for ${nextPrayer.nameEn} (${nextPrayer.nameAr})`,
            icon: '/favicon.svg',
            silent: settings.notifications.silent,
          });
        }
      }

      // Notify before
      if (
        settings.notifications.beforeMinutes > 0 &&
        minutesUntil <= settings.notifications.beforeMinutes &&
        minutesUntil > settings.notifications.beforeMinutes - 1
      ) {
        lastNotifiedRef.current = `before-${prayerKey}`;

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Upcoming Prayer', {
            body: `${nextPrayer.nameEn} (${nextPrayer.nameAr}) in ${settings.notifications.beforeMinutes} minutes`,
            icon: '/favicon.svg',
            silent: settings.notifications.silent,
          });
        }
      }
    };

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const interval = setInterval(checkAndNotify, NOTIFICATION_CHECK_INTERVAL);
    checkAndNotify();

    return () => clearInterval(interval);
  }, [nextPrayer, settings.notifications.enabled, settings.notifications.beforeMinutes, settings.notifications.silent]);
}