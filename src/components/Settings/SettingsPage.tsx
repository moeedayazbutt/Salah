import { useStore } from '../../store';
import { CALCULATION_METHODS, MADHAB_OPTIONS, HIGH_LATITUDE_RULES, TIME_FORMATS, THEME_MODES } from '../../types';
import type { ThemeMode, Madhab, HighLatitudeRule, TimeFormat } from '../../types';
import { useRequestGeolocation } from '../../hooks/useGeolocation';
import { useEffect, useRef, useState, useCallback } from 'react';

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: { city?: string; town?: string; village?: string; country?: string; state?: string };
}

function useCitySearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  const citySearch = useCitySearch();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectCity = useCallback((result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    updateSettings({ coordinates: { latitude: lat, longitude: lon } });
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
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{
        background: 'rgba(8, 10, 26, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div
        className="w-full max-w-[700px] max-h-[85vh] overflow-y-auto rounded-2xl p-8 settings-scroll relative"
        style={{
          background: 'rgba(21, 26, 58, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 16px 64px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex flex-col">
            <h2 dir="rtl" lang="ar" className="font-arabic text-3xl" style={{
              background: 'linear-gradient(135deg, #FFD600, #F59E0B)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              الإعدادات
            </h2>
            <span className="font-ui text-xs tracking-[2px] uppercase mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Settings · الإعدادات
            </span>
          </div>
          <button
            onClick={() => setSettingsOpen(false)}
            aria-label="Close settings · إغلاق الإعدادات"
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
          <Section title="📍 Location · الموقع">
            <div className="flex gap-3 relative">
              <div className="flex-1 relative" ref={dropdownRef}>
                <input
                  type="text"
                  placeholder="Search city or country…"
                  value={citySearch.query}
                  onChange={(e) => citySearch.search(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-ui transition-all duration-200"
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
                          className="w-full text-left px-4 py-2.5 font-ui cursor-pointer border-none transition-all duration-150"
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
                className="px-4 py-2.5 rounded-xl text-sm font-ui cursor-pointer border-none transition-all duration-200"
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
              <Input label="Latitude · خط العرض" value={settings.coordinates.latitude} onChange={(v) => updateSettings({ coordinates: { ...settings.coordinates, latitude: v } })} />
              <Input label="Longitude · خط الطول" value={settings.coordinates.longitude} onChange={(v) => updateSettings({ coordinates: { ...settings.coordinates, longitude: v } })} />
            </div>
            <div className="mt-3">
              <Label text="Timezone · المنطقة الزمنية" />
              <input
                type="text"
                value={settings.timezone}
                onChange={(e) => updateSettings({ timezone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl text-sm font-ui transition-all duration-200"
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
          <Section title="🕌 Calculation Method · طريقة الحساب">
            <div className="flex flex-col gap-2 max-h-[240px] overflow-y-auto">
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
                  <span className="font-ui text-sm block" style={{ color: settings.calculationMethod === method.id ? '#FAFAFA' : 'rgba(255,255,255,0.7)' }}>
                    {method.name}
                  </span>
                  <span className="font-ui text-xs block mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    Fajr: {method.fajrAngle}° · Isha: {method.ishaInterval ? `${method.ishaInterval}min after Maghrib` : `${method.ishaAngle}°`}
                    {' · '}{method.description}
                  </span>
                </button>
              ))}
            </div>
          </Section>

          {/* Madhab */}
          <Section title="⚖️ Madhab (Asr) · المذهب">
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
                  <span className="font-ui text-sm block" style={{ color: settings.madhab === opt.value ? '#FAFAFA' : 'rgba(255,255,255,0.7)' }}>
                    {opt.label}
                  </span>
                  <span className="font-ui text-xs block mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {opt.description}
                  </span>
                </button>
              ))}
            </div>
          </Section>

          {/* High Latitude Rule */}
          <Section title="🌍 High Latitude Rule · خطوط العرض العالية">
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
                  <span className="font-ui text-sm" style={{ color: settings.highLatitudeRule === rule.value ? '#FAFAFA' : 'rgba(255,255,255,0.7)' }}>
                    {rule.label}
                  </span>
                  <span className="font-ui text-xs block mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {rule.description}
                  </span>
                </button>
              ))}
            </div>
          </Section>

          {/* Time Format + Theme + Hijri */}
          <Section title="🕐 Preferences · التفضيلات">
            <div className="grid grid-cols-3 gap-4">
              <div>
                  <Label text="Time Format · تنسيق الوقت" />
                <div className="flex gap-1 mt-1.5 p-[3px] rounded-[10px]" style={{ background: 'rgba(0,0,0,0.3)' }}>
                  {TIME_FORMATS.map((fmt) => (
                    <button
                      key={fmt.value}
                      onClick={() => updateSettings({ timeFormat: fmt.value as TimeFormat })}
                      className="flex-1 px-3 py-1.5 rounded-lg text-xs font-ui cursor-pointer border-none transition-all duration-200"
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
                <Label text="Theme · السمة" />
                <div className="flex gap-1 mt-1.5 p-[3px] rounded-[10px]" style={{ background: 'rgba(0,0,0,0.3)' }}>
                  {THEME_MODES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => updateSettings({ theme: t.value as ThemeMode })}
                      className="flex-1 px-2 py-1.5 rounded-lg text-xs font-ui cursor-pointer border-none transition-all duration-200"
                      style={{
                        background: settings.theme === t.value ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                        color: settings.theme === t.value ? '#F59E0B' : 'rgba(255,255,255,0.4)',
                      }}
                    >
                      {t.icon} {t.value}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label text="Hijri Adj. · تعديل هجري" />
                <input
                  type="number"
                  value={settings.hijriAdjustment}
                  onChange={(e) => updateSettings({ hijriAdjustment: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 mt-1.5 rounded-lg text-sm font-mono transition-all duration-200"
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
          <Section title="🕌 Prayer Adjustments (± min) · تعديل الأوقات">
            <div className="grid grid-cols-5 gap-2">
              {(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const).map((prayer) => (
                <div key={prayer}>
                  <span className="font-ui text-xs block mb-1 capitalize" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {prayer}
                  </span>
                  <input
                    type="number"
                    value={settings.adjustments[prayer]}
                    onChange={(e) => updateSettings({
                      adjustments: { ...settings.adjustments, [prayer]: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full px-2 py-1.5 rounded-lg text-sm font-mono text-center transition-all duration-200"
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

          {/* Notifications */}
          <Section title="🔔 Notifications · الإشعارات">
            <div className="flex items-center justify-between">
              <span className="font-ui text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Adhan notifications · إشعارات الأذان
              </span>
              <button
                role="switch"
                aria-checked={settings.notifications.enabled}
                onClick={() => updateSettings({
                  notifications: { ...settings.notifications, enabled: !settings.notifications.enabled }
                })}
                className="w-11 h-6 rounded-full relative cursor-pointer border-none transition-all duration-200"
                style={{
                  background: settings.notifications.enabled
                    ? 'rgba(245, 158, 11, 0.5)'
                    : 'rgba(255,255,255,0.1)',
                }}
              >
                <div
                  className="w-5 h-5 rounded-full absolute top-0.5 transition-all duration-200"
                  style={{
                    background: '#FAFAFA',
                    left: settings.notifications.enabled ? 22 : 2,
                  }}
                />
              </button>
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="font-ui text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Notify before · إشعار قبل
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={settings.notifications.beforeMinutes}
                  onChange={(e) => updateSettings({
                    notifications: { ...settings.notifications, beforeMinutes: parseInt(e.target.value) || 5 }
                  })}
                  className="w-16 px-2 py-1.5 rounded-lg text-sm font-mono text-center transition-all duration-200"
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#FAFAFA',
                    outline: 'none',
                  }}
                />
                <span className="font-ui text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>minutes</span>
              </div>
            </div>
          </Section>

          {/* Auto Night Mode */}
          <Section title="🌙 Auto Night Mode · الوضع الليلي التلقائي">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-ui text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  Auto-dim display · تعتيم تلقائي
                </span>
                <span className="font-ui text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
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
                  <Label text="Schedule · الجدول" />
                  <div className="flex gap-1 mt-1.5 p-[3px] rounded-[10px]" style={{ background: 'rgba(0,0,0,0.3)' }}>
                    {([
                      { value: 'fixed', label: 'Fixed times' },
                      { value: 'sunsetSunrise', label: 'Sunset → Sunrise' },
                    ] as const).map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => updateSettings({ autoNightMode: { ...anm, mode: opt.value } })}
                        className="flex-1 px-3 py-1.5 rounded-lg text-xs font-ui cursor-pointer border-none transition-all duration-200"
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
                      <Label text="Start · البداية" />
                      <input
                        type="time"
                        value={anm.start}
                        onChange={(e) => updateSettings({ autoNightMode: { ...anm, start: e.target.value } })}
                        className="w-full px-3 py-2 mt-1.5 rounded-xl text-sm font-mono transition-all duration-200"
                        style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#FAFAFA', outline: 'none', colorScheme: 'dark' }}
                      />
                    </div>
                    <div>
                      <Label text="End · النهاية" />
                      <input
                        type="time"
                        value={anm.end}
                        onChange={(e) => updateSettings({ autoNightMode: { ...anm, end: e.target.value } })}
                        className="w-full px-3 py-2 mt-1.5 rounded-xl text-sm font-mono transition-all duration-200"
                        style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#FAFAFA', outline: 'none', colorScheme: 'dark' }}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="font-ui text-xs mt-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Night mode follows your location: it turns on at sunset and off at sunrise.
                  </p>
                )}
              </>
            )}
          </Section>

          {/* Save & Reset buttons */}
          <div className="flex gap-4 pt-2">
            <button
              onClick={() => setSettingsOpen(false)}
              className="flex-1 py-3 rounded-xl text-sm font-ui cursor-pointer border-none transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(20, 184, 166, 0.15))',
                color: '#FAFAFA',
                border: '1px solid rgba(245, 158, 11, 0.2)',
              }}
            >
              Save Settings · حفظ
            </button>
            <button
              onClick={() => useStore.getState().resetSettings()}
              className="px-6 py-3 rounded-xl text-sm font-ui cursor-pointer border-none transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.5)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              Reset · إعادة تعيين
            </button>
          </div>
        </div>
      </div>
    </div>
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
      <h3 className="font-ui text-xs tracking-[2px] uppercase mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function Label({ text }: { text: string }) {
  return (
    <span className="font-ui text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
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
        className="w-full px-3 py-2 mt-1 rounded-xl text-sm font-mono transition-all duration-200"
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