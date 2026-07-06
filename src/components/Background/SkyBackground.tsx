import { useSkyPhase } from '../../hooks/usePrayerTimes';

function SkyBackground() {
  const phase = useSkyPhase();
  const gradient = phase?.gradient ?? 'linear-gradient(180deg, #080A1A 0%, #0E1230 25%, #151A3A 60%, #1A1F3E 100%)';
  return <div className="absolute inset-0 z-0 overflow-hidden" style={{ background: gradient }} />;
}

export default SkyBackground;