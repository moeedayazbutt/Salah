import { usePrayerTimeEngine } from './hooks/usePrayerTimes';
import { useGeolocation, useRequestGeolocation } from './hooks/useGeolocation';
import { useFullscreen } from './hooks/useFullscreen';
import { useAutoNightMode } from './hooks/useNightMode';
import { useStore } from './store';
import SkyBackground from './components/Background/SkyBackground';
import NextPrayerTimer from './components/MainView/NextPrayerTimer';
import TimeSlider from './components/MainView/TimeSlider';
import SettingsPage from './components/Settings/SettingsPage';

function EmptyState({ onGetLocation }: { onGetLocation: () => void }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center">
      <div className="text-center rounded-2xl" style={{
        maxWidth: 'min(520px, 80vw)', padding: '16px 24px',
        background: 'rgba(15,18,48,0.75)', backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div dir="rtl" lang="ar" className="font-arabic" style={{
          fontSize: 'clamp(2.5rem, 8vw, 6rem)', marginBottom: '8px',
          background: 'linear-gradient(135deg, #FFD600, #F59E0B, #14B8A6)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>بِسْمِ اللَّهِ</div>
        <h2 className="font-ui" style={{ fontSize: 'clamp(1.4rem, 3.5vw, 2.5rem)', marginBottom: '4px', color: 'rgba(255,255,255,0.85)', fontWeight: 300 }}>
          Welcome
        </h2>
        <p className="font-ui" style={{ fontSize: 'clamp(0.75rem, 1.5vw, 1.2rem)', marginBottom: '12px', color: 'rgba(255,255,255,0.4)' }}>
          Set location to calculate prayer times
        </p>
        <button onClick={onGetLocation} className="w-full font-ui cursor-pointer border-none transition-all duration-200" style={{
          fontSize: 'clamp(0.85rem, 1.5vw, 1.4rem)', padding: '8px 0', borderRadius: 12,
          background: 'rgba(245,158,11,0.18)', color: '#FAFAFA', border: '1px solid rgba(245,158,11,0.3)',
        }}>
          Use My Location
        </button>
        <p className="font-ui" style={{ fontSize: 'clamp(0.5rem, 0.9vw, 0.8rem)', marginTop: '6px', color: 'rgba(255,255,255,0.15)' }}>
          Or tap ⚙ for manual settings
        </p>
      </div>
    </div>
  );
}

function App() {
  usePrayerTimeEngine();
  useGeolocation();
  useAutoNightMode();

  const { isFullscreen, enter: enterFullscreen, exit: exitFullscreen } = useFullscreen();
  const settings      = useStore((s) => s.settings);
  const isSettingsOpen = useStore((s) => s.isSettingsOpen);
  const setSettingsOpen = useStore((s) => s.setSettingsOpen);
  const aodMode       = useStore((s) => s.aodMode);
  const setAodMode    = useStore((s) => s.setAodMode);
  const requestLocation = useRequestGeolocation();

  const hasLocation = settings.coordinates.latitude !== 0 || settings.coordinates.longitude !== 0;
  const hideUI = isFullscreen;

  const btnStyle = (active = false): React.CSSProperties => ({
    width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', border: `1px solid ${active ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
    background: active ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
    color: 'rgba(255,255,255,0.7)', transition: 'all 0.2s ease',
  });

  return (
    <div className={`w-full h-screen overflow-hidden relative bg-[#080A1A]${aodMode ? ' aod-mode' : ''}`}>
      <SkyBackground />

      {!hasLocation ? (
        <EmptyState onGetLocation={requestLocation} />
      ) : (
        <div className="relative z-10 w-full h-full flex main-content" style={{
          padding: '6px',
          paddingBottom: hideUI ? '6px' : '58px',
        }}>
          <NextPrayerTimer />
        </div>
      )}

      {/* Slider — hidden when fullscreen */}
      {!hideUI && <TimeSlider />}

      {/* Control buttons — hidden when fullscreen */}
      {!hideUI && (
        <div className="fixed z-20 flex items-center" style={{ top: '12px', left: '50%', transform: 'translateX(-50%)', gap: '6px' }}>
          <button
            onClick={isFullscreen ? exitFullscreen : enterFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            style={btnStyle(isFullscreen)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 8 3 3 8 3" /><line x1="3" y1="3" x2="9" y2="9" />
              <polyline points="21 8 21 3 16 3" /><line x1="21" y1="3" x2="15" y2="9" />
              <polyline points="3 16 3 21 8 21" /><line x1="3" y1="21" x2="9" y2="15" />
              <polyline points="21 16 21 21 16 21" /><line x1="21" y1="21" x2="15" y2="15" />
            </svg>
          </button>

          <button
            onClick={() => setAodMode(!aodMode)}
            aria-label={aodMode ? 'Disable AOD mode' : 'Enable AOD mode'}
            title={aodMode ? 'Exit always-on display' : 'Always-on display'}
            style={btnStyle(aodMode)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a7 7 0 0 0 0 14 7 7 0 0 1 0-14z" fill="currentColor" stroke="none" />
            </svg>
          </button>

          <button
            onClick={() => setSettingsOpen(!isSettingsOpen)}
            aria-label="Settings"
            style={{ ...btnStyle(), fontSize: 'clamp(1rem, 1.5vw, 1.8rem)' }}
          >
            ⚙
          </button>
        </div>
      )}

      {/* Tap to exit fullscreen — invisible overlay */}
      {hideUI && (
        <button
          onClick={exitFullscreen}
          aria-label="Exit fullscreen"
          style={{
            position: 'fixed', inset: 0, zIndex: 5,
            background: 'transparent', border: 'none', cursor: 'none',
          }}
        />
      )}

      {isSettingsOpen && <SettingsPage />}
    </div>
  );
}

export default App;
