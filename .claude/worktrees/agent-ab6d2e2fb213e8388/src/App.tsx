import { usePrayerTimeEngine } from './hooks/usePrayerTimes';
import { useGeolocation, useRequestGeolocation } from './hooks/useGeolocation';
import { useAdhanNotifications } from './hooks/useNotifications';
import { useFullscreen } from './hooks/useFullscreen';
import { useStore } from './store';
import SkyBackground from './components/Background/SkyBackground';
import NextPrayerTimer from './components/MainView/NextPrayerTimer';
import RightPanel from './components/MainView/RightPanel';
import SettingsPage from './components/Settings/SettingsPage';
import TimeSlider from './components/MainView/TimeSlider';

function EmptyState({ onGetLocation }: { onGetLocation: () => void }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center">
      <div style={{
        textAlign: 'center', borderRadius: 20,
        maxWidth: 'min(500px, 82vw)', padding: '16px 24px',
        background: 'rgba(10,12,30,0.75)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div dir="rtl" lang="ar" className="font-arabic-display" style={{
          fontSize: 'clamp(2.2rem, 7vw, 5rem)', marginBottom: 4,
          background: 'linear-gradient(135deg, #FFD600, #F59E0B, #14B8A6)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          بِسْمِ اللَّهِ
        </div>
        <h2 style={{ fontSize: 'clamp(1.3rem, 3.5vw, 2.5rem)', marginBottom: 4, color: 'rgba(255,255,255,0.80)', fontFamily: 'Roboto, sans-serif', fontWeight: 300 }}>
          Welcome
        </h2>
        <p style={{ fontSize: 'clamp(0.75rem, 1.4vw, 1.1rem)', marginBottom: 10, color: 'rgba(255,255,255,0.38)', fontFamily: 'Roboto, sans-serif' }}>
          Set your location to see prayer times
        </p>
        <button
          onClick={onGetLocation}
          style={{
            width: '100%', fontFamily: 'Roboto, sans-serif', fontWeight: 500,
            fontSize: 'clamp(0.85rem, 1.4vw, 1.3rem)', padding: '8px 0',
            borderRadius: 12, cursor: 'pointer', border: '1px solid rgba(245,158,11,0.28)',
            background: 'rgba(245,158,11,0.14)', color: '#FAFAFA',
          }}
        >
          Use My Location
        </button>
        <p style={{ fontSize: 'clamp(0.55rem, 0.9vw, 0.8rem)', marginTop: 5, color: 'rgba(255,255,255,0.14)', fontFamily: 'Roboto, sans-serif' }}>
          Or tap ⚙ to set location manually
        </p>
      </div>
    </div>
  );
}

// Simple icon components (inline SVG)
function IconFullscreenEnter() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 8 3 3 8 3"/><line x1="3" y1="3" x2="9" y2="9"/>
      <polyline points="21 8 21 3 16 3"/><line x1="21" y1="3" x2="15" y2="9"/>
      <polyline points="3 16 3 21 8 21"/><line x1="3" y1="21" x2="9" y2="15"/>
      <polyline points="21 16 21 21 16 21"/><line x1="21" y1="21" x2="15" y2="15"/>
    </svg>
  );
}
function IconFullscreenExit() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="8 3 3 3 3 8"/><line x1="3" y1="3" x2="9" y2="9"/>
      <polyline points="16 3 21 3 21 8"/><line x1="21" y1="3" x2="15" y2="9"/>
      <polyline points="8 21 3 21 3 16"/><line x1="3" y1="21" x2="9" y2="15"/>
      <polyline points="16 21 21 21 21 16"/><line x1="21" y1="21" x2="15" y2="15"/>
    </svg>
  );
}
function IconMoon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}
function IconSun() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
}

function ControlButton({ onClick, active, children, title }: {
  onClick: () => void; active?: boolean; children: React.ReactNode; title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      style={{
        width: 40, height: 40, borderRadius: '50%', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active ? 'rgba(245,158,11,0.18)' : 'rgba(255,255,255,0.07)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        border: `1px solid ${active ? 'rgba(245,158,11,0.30)' : 'rgba(255,255,255,0.10)'}`,
        color: active ? 'rgba(245,158,11,0.92)' : 'rgba(255,255,255,0.55)',
        transition: 'all 0.15s ease',
      } as React.CSSProperties}
    >
      {children}
    </button>
  );
}

export default function App() {
  usePrayerTimeEngine();
  useGeolocation();
  useAdhanNotifications();

  const { isFullscreen, enter: enterFullscreen, exit: exitFullscreen } = useFullscreen();
  const aodMode = useStore((s) => s.aodMode);
  const setAodMode = useStore((s) => s.setAodMode);
  const settings = useStore((s) => s.settings);
  const isSettingsOpen = useStore((s) => s.isSettingsOpen);
  const setSettingsOpen = useStore((s) => s.setSettingsOpen);
  const requestLocation = useRequestGeolocation();

  const hasLocation = settings.coordinates.latitude !== 0 || settings.coordinates.longitude !== 0;

  return (
    <div
      className={`w-full h-screen overflow-hidden relative flex flex-col${aodMode ? ' aod-mode' : ''}`}
      style={{ background: aodMode ? '#000' : '#080A1A' }}
    >
      <SkyBackground />

      {!hasLocation ? (
        <EmptyState onGetLocation={requestLocation} />
      ) : (
        <div
          className="relative z-10 flex flex-1 min-h-0 main-content"
          style={{ padding: '6px 6px 0 6px', gap: 6 }}
        >
          <div className="flex-[0_0_56%] min-w-0 flex flex-col left-panel" style={{ minWidth: 0 }}>
            <NextPrayerTimer />
          </div>
          <RightPanel />
        </div>
      )}

      {/* Time slider */}
      <div className="relative z-10">
        <TimeSlider />
      </div>

      {/* Control buttons – above slider, bottom-right */}
      <div
        className="fixed z-20 flex items-center"
        style={{ bottom: 60, right: 12, gap: 6 }}
      >
        <ControlButton
          onClick={() => setAodMode(!aodMode)}
          active={aodMode}
          title={aodMode ? 'Exit AOD mode' : 'AOD mode'}
        >
          {aodMode ? <IconSun /> : <IconMoon />}
        </ControlButton>

        <ControlButton
          onClick={isFullscreen ? exitFullscreen : enterFullscreen}
          active={isFullscreen}
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <IconFullscreenExit /> : <IconFullscreenEnter />}
        </ControlButton>

        <ControlButton
          onClick={() => setSettingsOpen(!isSettingsOpen)}
          title="Settings"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </ControlButton>
      </div>

      {isSettingsOpen && <SettingsPage />}
    </div>
  );
}
