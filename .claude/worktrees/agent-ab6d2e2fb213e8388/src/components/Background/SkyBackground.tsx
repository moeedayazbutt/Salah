import { useStore } from '../../store';
import { calculateSunPosition, determineSkyPhase } from '../../utils/skyEngine';

export default function SkyBackground() {
  const realPhase = useStore((s) => s.skyPhase);
  const aodMode = useStore((s) => s.aodMode);
  const skyDisplayHours = useStore((s) => s.skyDisplayHours);
  const skySliderAuto = useStore((s) => s.skySliderAuto);
  const settings = useStore((s) => s.settings);

  let gradient: string;

  if (aodMode) {
    gradient = '#000000';
  } else if (!skySliderAuto && skyDisplayHours !== null) {
    const fakeDate = new Date();
    fakeDate.setHours(Math.floor(skyDisplayHours), Math.round((skyDisplayHours % 1) * 60), 0, 0);
    const lat = settings.coordinates.latitude || 51.5;
    const lon = settings.coordinates.longitude || 0;
    const solarPos = calculateSunPosition(fakeDate, lat, lon);
    gradient = determineSkyPhase(solarPos.elevation, solarPos.azimuth).gradient;
  } else {
    gradient = realPhase?.gradient ?? 'linear-gradient(180deg, #060810 0%, #0A0D1E 40%, #0E1230 100%)';
  }

  return (
    <div
      className="absolute inset-0 z-0 overflow-hidden sky-bg"
      style={{ background: gradient, transition: 'background 3s ease-in-out' }}
    />
  );
}
