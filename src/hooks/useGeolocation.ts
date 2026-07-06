import { useEffect } from 'react';
import { useStore } from '../store';

export function useGeolocation() {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);

  useEffect(() => {
    const hasLocation = settings.coordinates.latitude !== 0 || settings.coordinates.longitude !== 0;
    if (hasLocation) return;

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          updateSettings({
            coordinates: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
          });
        },
        () => {
          // Fallback: set a default location if geolocation denied
          updateSettings({
            coordinates: { latitude: 51.5074, longitude: -0.1278 },
          });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 600000 }
      );
    } else {
      // Fallback default
      updateSettings({
        coordinates: { latitude: 51.5074, longitude: -0.1278 },
      });
    }
  }, []);
}

export function useRequestGeolocation() {
  const updateSettings = useStore((s) => s.updateSettings);

  return () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          updateSettings({
            coordinates: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
          });
        },
        (err) => {
          console.warn('Geolocation error:', err.message);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };
}