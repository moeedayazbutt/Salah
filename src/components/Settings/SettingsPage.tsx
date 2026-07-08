import { useStore } from '../../store';
import { CALCULATION_METHODS, MADHAB_OPTIONS, HIGH_LATITUDE_RULES, TIME_FORMATS } from '../../types';
import type { Madhab, HighLatitudeRule, TimeFormat } from '../../types';
import { MUAZZIN_OPTIONS, playAzaan, stopAzaan } from '../../utils/azaanEngine';
import { useRequestGeolocation } from '../../hooks/useGeolocation';
import { useEffect, useRef, useState, useCallback } from 'react';

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: { city?: string; town?: string; village?: string; country?: string; state?: string };
}

function useCitySearch(initialQuery: string) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const search = useCallback((q: string) => {
    setQuery(q);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!q.trim() || q.length < 2) { setResults([]); setOpen(false); return; }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=12&addressdetails=1&accept-language=en`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data: NominatimResult[] = await res.json();
        setResults(data);
        setOpen(data.length > 0);
      } catch { setResults([]); }
      setLoading(false);
    }, 350);
  }, []);

  const clear = useCallback(() => { setQuery(''); setResults([]); setOpen(false); }, []);
  return { query, search, results, loading, open, setOpen, clear };
}

export default function SettingsPage() {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const setSettingsOpen = useStore((s) => s.setSettingsOpen);
  const requestLocation = useRequestGeolocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const citySearch = useCitySearch(settings.selectedCityName || '');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectCity = useCallback((result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    const name = result.address?.city ?? result.address?.town ?? result.address?.village ?? result.display_name.split(',')[0];
    const country = result.address?.country ? `, ${result.address.country}` : '';
    const cityName = `${name}${country}`;
    updateSettings({
      coordinates: { latitude: lat, longitude: lon },
      selectedCityName: cityName,
    });
    citySearch.clear();
  }, [updateSettings, citySearch]);

  const anm = settings.autoNightMode ?? { enabled: false, mode: 'fixed' as const, start: '22:00', end: '06:00' };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSettingsOpen(false);
        return;
      }
      if (e.key === 'Tab') {
        const focusable = container.querySelectorAll<HTMLElement>(
          'button, input, [href], select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    container.querySelector<HTMLElement>('button')?.focus();
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setSettingsOpen]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 settings-dialog-backdrop"
      style={{
        background: 'rgba(8, 10, 26, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div
        className="w-full max-w-[700px] max-h-[85vh] overflow-y-auto rounded-2xl p-8 settings-scroll relative font-ui settings-dialog-panel"
        style={{
          background: 'rgba(21, 26, 58, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 16px 64px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex flex-col">
            <h2 className="text-3xl" style={{
              background: 'linear-gradient(135deg, #FFD600, #F59E0B)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontWeight: 600,
            }}>
              Settings
            </h2>
            <span className="text-xs tracking-[2px] uppercase mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Configure app parameters
            </span>
          </div>
          <button
            onClick={() => setSettingsOpen(false)}
            aria-label="Close settings"
            className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer border-none transition-all duration-200"
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.5)',
              fontSize: '1.2rem',
            }}
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-6">
          {/* Location */}
          <Section title="📍 Location">
            <div className="flex gap-3 relative">
              <div className="flex-1 relative" ref={dropdownRef}>
                <input
                  type="text"
                  placeholder="Search city or country…"
                  value={citySearch.query}
                  onChange={(e) => citySearch.search(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm transition-all duration-200"
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#FAFAFA',
                    outline: 'none',
                    paddingRight: citySearch.loading ? 36 : undefined,
                  }}
                  onFocus={(e) => { e.target.style.borderColor = 'rgba(245,158,11,0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.1)'; }}
                  onBlur={(e) => { setTimeout(() => citySearch.setOpen(false), 160); e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                  autoComplete="off"
                />
                {citySearch.loading && (
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>⏳</span>
                )}
                {citySearch.open && citySearch.results.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                    background: 'rgba(18,22,54,0.98)', border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 12, marginTop: 4, maxHeight: 280, overflowY: 'auto',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                  }}>
                    {citySearch.results.map((r) => {
                      const city = r.address?.city ?? r.address?.town ?? r.address?.village ?? '';
                      const country = r.address?.country ?? '';
                      const label = city ? `${city}${country ? `, ${country}` : ''}` : r.display_name.split(',').slice(0, 2).join(',');
                      const sub = r.display_name.split(',').slice(1, 3).join(',').trim();
                      return (
                        <button
                          key={r.place_id}
                          onMouseDown={() => selectCity(r)}
                          className="w-full text-left px-4 py-2.5 cursor-pointer border-none transition-all duration-150"
                          style={{ background: 'transparent', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(245,158,11,0.08)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <span style={{ display: 'block', fontSize: 13, color: '#FAFAFA', fontWeight: 500 }}>{label}</span>
                          {sub && <span style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>{sub}</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <button
                onClick={requestLocation}
                className="px-4 py-2.5 rounded-xl text-sm cursor-pointer border-none transition-all duration-200 animate-pulse"
                style={{
                  background: 'rgba(20, 184, 166, 0.15)',
                  color: '#14B8A6',
                  border: '1px solid rgba(20, 184, 166, 0.2)',
                  whiteSpace: 'nowrap',
                }}
              >
                📍 GPS
              </button>
            </div>
            <div className="flex gap-3 mt-3">
              <Input label="Latitude" value={settings.coordinates.latitude} onChange={(v) => updateSettings({ coordinates: { ...settings.coordinates, latitude: v } })} />
              <Input label="Longitude" value={settings.coordinates.longitude} onChange={(v) => updateSettings({ coordinates: { ...settings.coordinates, longitude: v } })} />
            </div>
            <div className="mt-3">
              <Label text="Timezone" />
              <input
                type="text"
                value={settings.timezone}
                onChange={(e) => updateSettings({ timezone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl text-sm transition-all duration-200 mt-1"
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#FAFAFA',
                  outline: 'none',
                }}
              />
            </div>
          </Section>

          {/* Calculation Method */}
          <Section title="🕌 Calculation Method">
            <div className="flex gap-2 flex-col max-h-[200px] overflow-y-auto">
              {CALCULATION_METHODS.map((method) => (
                <button
                  key={method.id}
                  onClick={() => updateSettings({ calculationMethod: method.id })}
                  className="w-full text-left px-4 py-3 rounded-xl cursor-pointer border transition-all duration-200 option-btn"
                  style={{
                    background: settings.calculationMethod === method.id
                      ? 'rgba(245, 158, 11, 0.08)'
                      : 'rgba(0,0,0,0.2)',
                    borderColor: settings.calculationMethod === method.id
                      ? 'rgba(245, 158, 11, 0.4)'
                      : 'rgba(255,255,255,0.06)',
                    boxShadow: settings.calculationMethod === method.id
                      ? '0 0 20px rgba(245, 158, 11, 0.08)'
                      : 'none',
                  }}
                >
                  <span className="text-sm block" style={{ color: settings.calculationMethod === method.id ? '#FAFAFA' : 'rgba(255,255,255,0.7)' }}>
                    {method.name}
                  </span>
                  <span className="text-xs block mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    Fajr: {method.fajrAngle}° · Isha: {method.ishaInterval ? `${method.ishaInterval}min after Maghrib` : `${method.ishaAngle}°`}
                    {' · '}{method.description}
                  </span>
                </button>
              ))}
            </div>
          </Section>

          {/* Madhab */}
          <Section title="⚖️ Madhab (Asr)">
            <div className="flex flex-col gap-2">
              {MADHAB_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateSettings({ madhab: opt.value as Madhab })}
                  className="w-full text-left px-4 py-3 rounded-xl cursor-pointer border transition-all duration-200 option-btn"
                  style={{
                    background: settings.madhab === opt.value
                      ? 'rgba(245, 158, 11, 0.08)'
                      : 'rgba(0,0,0,0.2)',
                    borderColor: settings.madhab === opt.value
                      ? 'rgba(245, 158, 11, 0.4)'
                      : 'rgba(255,255,255,0.06)',
                    boxShadow: settings.madhab === opt.value
                      ? '0 0 20px rgba(245, 158, 11, 0.08)'
                      : 'none',
                  }}
                >
                  <span className="text-sm block" style={{ color: settings.madhab === opt.value ? '#FAFAFA' : 'rgba(255,255,255,0.7)' }}>
                    {opt.label}
                  </span>
                  <span className="text-xs block mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {opt.description}
                  </span>
                </button>
              ))}
            </div>
          </Section>

          {/* High Latitude Rule */}
          <Section title="🌍 High Latitude Rule">
            <div className="flex flex-col gap-1.5">
              {HIGH_LATITUDE_RULES.map((rule) => (
                <button
                  key={rule.value}
                  onClick={() => updateSettings({ highLatitudeRule: rule.value as HighLatitudeRule })}
                  className="w-full text-left px-4 py-2.5 rounded-xl cursor-pointer border transition-all duration-200 option-btn"
                  style={{
                    background: settings.highLatitudeRule === rule.value
                      ? 'rgba(245, 158, 11, 0.08)'
                      : 'rgba(0,0,0,0.2)',
                    borderColor: settings.highLatitudeRule === rule.value
                      ? 'rgba(245, 158, 11, 0.4)'
                      : 'rgba(255,255,255,0.06)',
                  }}
                >
                  <span className="text-sm" style={{ color: settings.highLatitudeRule === rule.value ? '#FAFAFA' : 'rgba(255,255,255,0.7)' }}>
                    {rule.label}
                  </span>
                  <span className="text-xs block mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {rule.description}
                  </span>
                </button>
              ))}
            </div>
          </Section>

          {/* Preferences */}
          <Section title="🕐 Preferences">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label text="Time Format" />
                <div className="flex gap-1 mt-1.5 p-[3px] rounded-[10px]" style={{ background: 'rgba(0,0,0,0.3)' }}>
                  {TIME_FORMATS.map((fmt) => (
                    <button
                      key={fmt.value}
                      onClick={() => updateSettings({ timeFormat: fmt.value as TimeFormat })}
                      className="flex-1 px-3 py-1.5 rounded-lg text-xs cursor-pointer border-none transition-all duration-200"
                      style={{
                        background: settings.timeFormat === fmt.value ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                        color: settings.timeFormat === fmt.value ? '#F59E0B' : 'rgba(255,255,255,0.4)',
                      }}
                    >
                      {fmt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label text="Hijri Adjustment" />
                <input
                  type="number"
                  value={settings.hijriAdjustment}
                  onChange={(e) => updateSettings({ hijriAdjustment: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 mt-1.5 rounded-lg text-sm transition-all duration-200"
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#FAFAFA',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          </Section>

          {/* Prayer Adjustments */}
          <Section title="🕌 Prayer Adjustments (± min)">
            <div className="grid grid-cols-5 gap-2">
              {(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const).map((prayer) => (
                <div key={prayer}>
                  <span className="text-xs block mb-1 capitalize" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {prayer}
                  </span>
                  <input
                    type="number"
                    value={settings.adjustments[prayer]}
                    onChange={(e) => updateSettings({
                      adjustments: { ...settings.adjustments, [prayer]: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full px-2 py-1.5 rounded-lg text-sm text-center transition-all duration-200"
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#FAFAFA',
                      outline: 'none',
                    }}
                  />
                </div>
              ))}
            </div>
          </Section>

          {/* Azaan Settings */}
          <AzaanSection />

          {/* Auto Night Mode */}
          <Section title="🌙 Auto Night Mode">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  Auto-dim display
                </span>
                <span className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Switches to the dark always-on display automatically
                </span>
              </div>
              <button
                role="switch"
                aria-checked={anm.enabled}
                onClick={() => updateSettings({ autoNightMode: { ...anm, enabled: !anm.enabled } })}
                className="w-11 h-6 rounded-full relative cursor-pointer border-none transition-all duration-200 flex-shrink-0"
                style={{ background: anm.enabled ? 'rgba(245, 158, 11, 0.5)' : 'rgba(255,255,255,0.1)' }}
              >
                <div className="w-5 h-5 rounded-full absolute top-0.5 transition-all duration-200"
                  style={{ background: '#FAFAFA', left: anm.enabled ? 22 : 2 }} />
              </button>
            </div>

            {anm.enabled && (
              <>
                <div className="mt-4">
                  <Label text="Schedule" />
                  <div className="flex gap-1 mt-1.5 p-[3px] rounded-[10px]" style={{ background: 'rgba(0,0,0,0.3)' }}>
                    {([
                      { value: 'fixed', label: 'Fixed times' },
                      { value: 'sunsetSunrise', label: 'Sunset → Sunrise' },
                    ] as const).map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => updateSettings({ autoNightMode: { ...anm, mode: opt.value } })}
                        className="flex-1 px-3 py-1.5 rounded-lg text-xs cursor-pointer border-none transition-all duration-200"
                        style={{
                          background: anm.mode === opt.value ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                          color: anm.mode === opt.value ? '#F59E0B' : 'rgba(255,255,255,0.4)',
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {anm.mode === 'fixed' ? (
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <Label text="Start" />
                      <input
                        type="time"
                        value={anm.start}
                        onChange={(e) => updateSettings({ autoNightMode: { ...anm, start: e.target.value } })}
                        className="w-full px-3 py-2 mt-1.5 rounded-xl text-sm transition-all duration-200"
                        style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#FAFAFA', outline: 'none', colorScheme: 'dark' }}
                      />
                    </div>
                    <div>
                      <Label text="End" />
                      <input
                        type="time"
                        value={anm.end}
                        onChange={(e) => updateSettings({ autoNightMode: { ...anm, end: e.target.value } })}
                        className="w-full px-3 py-2 mt-1.5 rounded-xl text-sm transition-all duration-200"
                        style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#FAFAFA', outline: 'none', colorScheme: 'dark' }}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-xs mt-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Night mode follows your location: it turns on at sunset and off at sunrise.
                  </p>
                )}

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-[rgba(255,255,255,0.06)]">
                  <div className="flex flex-col">
                    <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      Exit dark mode on Azaan play
                    </span>
                    <span className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      Temporarily restore color mode during the Adhan call
                    </span>
                  </div>
                  <button
                    role="switch"
                    aria-checked={settings.azaan.exitAodOnPlay}
                    onClick={() => updateSettings({
                      azaan: { ...settings.azaan, exitAodOnPlay: !settings.azaan.exitAodOnPlay }
                    })}
                    className="w-11 h-6 rounded-full relative cursor-pointer border-none transition-all duration-200 flex-shrink-0"
                    style={{ background: settings.azaan.exitAodOnPlay ? 'rgba(245, 158, 11, 0.5)' : 'rgba(255,255,255,0.1)' }}
                  >
                    <div className="w-5 h-5 rounded-full absolute top-0.5 transition-all duration-200"
                      style={{ background: '#FAFAFA', left: settings.azaan.exitAodOnPlay ? 22 : 2 }} />
                  </button>
                </div>
              </>
            )}
          </Section>

          {/* Save & Reset buttons */}
          <div className="flex gap-4 pt-2">
            <button
              onClick={() => setSettingsOpen(false)}
              className="flex-1 py-3 rounded-xl text-sm cursor-pointer border-none transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(20, 184, 166, 0.15))',
                color: '#FAFAFA',
                border: '1px solid rgba(245, 158, 11, 0.2)',
              }}
            >
              Save Settings
            </button>
            <button
              onClick={() => useStore.getState().resetSettings()}
              className="px-6 py-3 rounded-xl text-sm cursor-pointer border-none transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.5)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              Reset Defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AzaanSection() {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const isAzaanPlaying = useStore((s) => s.isAzaanPlaying);
  const setAzaanPlaying = useStore((s) => s.setAzaanPlaying);

  const toggleTest = () => {
    const enginePlay = playAzaan;
    const engineStop = stopAzaan;
    if (isAzaanPlaying) {
      engineStop();
      setAzaanPlaying(false);
    } else {
      enginePlay(
        settings.azaan.selectedMuazzin,
        false, // standard adhan for test
        () => setAzaanPlaying(true),
        () => setAzaanPlaying(false)
      );
    }
  };

  return (
    <Section title="📢 Azaan Settings">
      <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex flex-col">
          <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Enable Azaan call
          </span>
          <span className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Play the beautiful audio call to prayer at prayer times
          </span>
        </div>
        <button
          role="switch"
          aria-checked={settings.azaan.enabled}
          onClick={() => updateSettings({
            azaan: { ...settings.azaan, enabled: !settings.azaan.enabled }
          })}
          className="w-11 h-6 rounded-full relative cursor-pointer border-none transition-all duration-200"
          style={{ background: settings.azaan.enabled ? 'rgba(245, 158, 11, 0.5)' : 'rgba(255,255,255,0.1)' }}
        >
          <div className="w-5 h-5 rounded-full absolute top-0.5 transition-all duration-200"
            style={{ background: '#FAFAFA', left: settings.azaan.enabled ? 22 : 2 }} />
        </button>
      </div>

      <div className="flex flex-col gap-3 mt-4">
        <div>
          <Label text="Select Muazzin" />
          <select
            value={settings.azaan.selectedMuazzin}
            onChange={(e) => updateSettings({
              azaan: { ...settings.azaan, selectedMuazzin: e.target.value }
            })}
            className="w-full px-3 py-2 mt-1.5 rounded-xl text-sm transition-all duration-200"
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#FAFAFA',
              outline: 'none',
            }}
          >
            {MUAZZIN_OPTIONS.map((m: any) => (
              <option key={m.value} value={m.value} style={{ background: '#151A3A' }}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={toggleTest}
          className="w-full py-2.5 rounded-xl text-sm font-medium cursor-pointer border-none transition-all duration-200"
          style={{
            background: isAzaanPlaying ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.15)',
            color: isAzaanPlaying ? '#EF4444' : '#F59E0B',
            border: `1px solid ${isAzaanPlaying ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.2)'}`,
          }}
        >
          {isAzaanPlaying ? '⏹️ Stop Testing Adhan' : '▶️ Test Adhan Sound'}
        </button>
      </div>
    </Section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'rgba(0, 0, 0, 0.15)',
        border: '1px solid rgba(255, 255, 255, 0.04)',
      }}
    >
      <h3 className="text-xs tracking-[2px] uppercase mb-4" style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function Label({ text }: { text: string }) {
  return (
    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
      {text}
    </span>
  );
}

function Input({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex-1">
      <Label text={label} />
      <input
        type="number"
        step="0.0001"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full px-3 py-2 mt-1 rounded-xl text-sm transition-all duration-200"
        style={{
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#FAFAFA',
          outline: 'none',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'rgba(245, 158, 11, 0.4)';
          e.target.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.1)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'rgba(255,255,255,0.1)';
          e.target.style.boxShadow = 'none';
        }}
      />
    </div>
  );
}