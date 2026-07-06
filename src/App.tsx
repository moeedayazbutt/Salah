import { usePrayerTimeEngine } from './hooks/usePrayerTimes';
import { useGeolocation, useRequestGeolocation } from './hooks/useGeolocation';
import { useAdhanNotifications } from './hooks/useNotifications';
import { useStore } from './store';
import SkyBackground from './components/Background/SkyBackground';
import NextPrayerTimer from './components/MainView/NextPrayerTimer';
import RightPanel from './components/MainView/RightPanel';
import SettingsPage from './components/Settings/SettingsPage';

function EmptyState({ onGetLocation }: { onGetLocation: () => void }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center">
      <div
        className="text-center rounded-2xl"
        style={{
          maxWidth: 'min(520px, 80vw)',
          padding: '12px 20px',
          background: 'rgba(15, 18, 48, 0.7)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div dir="rtl" lang="ar" className="font-arabic" style={{
          fontSize: 'clamp(2.5rem, 8vw, 6rem)',
          marginBottom: '4px',
          background: 'linear-gradient(135deg, #FFD600, #F59E0B, #14B8A6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          بِسْمِ اللَّهِ
        </div>
        <h2 style={{
          fontSize: 'clamp(1.5rem, 4vw, 3rem)',
          marginBottom: '2px',
          color: 'rgba(255,255,255,0.8)',
          fontFamily: 'var(--font-arabic)',
        }}>
          Welcome · مرحباً
        </h2>
        <p className="font-ui" style={{
          fontSize: 'clamp(0.7rem, 1.5vw, 1.2rem)',
          marginBottom: '8px',
          color: 'rgba(255,255,255,0.35)',
        }}>
          Set location for prayer times · حدد موقعك للصلاة
        </p>
        <button
          onClick={onGetLocation}
          className="w-full font-ui cursor-pointer border-none transition-all duration-200"
          style={{
            fontSize: 'clamp(0.8rem, 1.5vw, 1.4rem)',
            padding: '6px 0',
            borderRadius: 10,
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(20, 184, 166, 0.15))',
            color: '#FAFAFA',
            border: '1px solid rgba(245, 158, 11, 0.25)',
          }}
        >
          Use My Location · استخدم موقعي
        </button>
        <p className="font-ui" style={{
          fontSize: 'clamp(0.5rem, 0.9vw, 0.8rem)',
          marginTop: '4px',
          color: 'rgba(255,255,255,0.12)',
        }}>
          Or tap ⚙ · أو ⚙ للإعدادات
        </p>
      </div>
    </div>
  );
}

function App() {
  usePrayerTimeEngine();
  useGeolocation();
  useAdhanNotifications();

  const settings = useStore((s) => s.settings);
  const isSettingsOpen = useStore((s) => s.isSettingsOpen);
  const setSettingsOpen = useStore((s) => s.setSettingsOpen);
  const requestLocation = useRequestGeolocation();

  const hasLocation = settings.coordinates.latitude !== 0 || settings.coordinates.longitude !== 0;

  return (
    <div className="w-full h-screen overflow-hidden relative bg-[#080A1A]">
      <SkyBackground />

      {!hasLocation ? (
        <EmptyState onGetLocation={requestLocation} />
      ) : (
        <div className="relative z-10 w-full h-full flex main-content" style={{
          padding: '4px 6px',
          gap: '6px',
        }}>
          <div className="flex-[0_0_60%] flex flex-col min-w-0 left-panel">
            <NextPrayerTimer />
          </div>
          <RightPanel />
        </div>
      )}

      <div className="fixed z-10" style={{ bottom: '4px', right: '6px' }}>
        <button
          onClick={() => setSettingsOpen(!isSettingsOpen)}
          aria-label="Open settings · فتح الإعدادات"
          className="flex items-center justify-center cursor-pointer border-none transition-all duration-200"
          style={{
            width: 'clamp(44px, 4vw, 44px)',
            height: 'clamp(44px, 4vw, 44px)',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.5)',
            fontSize: 'clamp(1rem, 1.5vw, 2rem)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          ⚙
        </button>
      </div>

      <div
        className="fixed z-10 pointer-events-none select-none font-arabic"
        style={{
          bottom: '2px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 'clamp(0.5rem, 0.8vw, 1rem)',
          color: 'rgba(255,255,255,0.04)',
        }}
      >
          الْحَمْدُ لِلَّهِ
        
      </div>

      {isSettingsOpen && <SettingsPage />}
    </div>
  );
}

export default App;