# Salah — صلاة

**A beautiful Islamic prayer times web app with a live dynamic sky.**

🌐 **[moeedayazbutt.github.io/Salah](https://moeedayazbutt.github.io/Salah/)**

---

The sky changes in real time based on your location and the sun's position — deep indigo at Fajr, golden at sunrise, brilliant blue through the afternoon, burning amber at Maghrib, and a star-lit night for Isha. A crescent moon tracks the lunar phase; palm silhouettes and drifting birds appear when the light is right.

## Features

- **Live sky background** — solar elevation drives smooth gradient transitions across all eight sky phases (night, Fajr, sunrise, morning, midday, afternoon, Maghrib, Isha)
- **Next prayer countdown** — large hero display with Arabic name in Reem Kufi calligraphy and a live progress bar
- **Full daily prayer schedule** — Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha with 12h/24h toggle
- **Hijri date** — accurate Islamic calendar with Arabic month names and moon phase (Waxing Crescent → Full Moon → Waning Gibbous etc.)
- **7-day weather forecast** — temperature, humidity, wind, and condition icons
- **Qibla direction** — calculated from your coordinates
- **Settings page** — location (GPS or manual), 12 calculation methods, Hanafi/Shafi madhab, high-latitude rules, per-prayer minute adjustments, timezone, Hijri offset
- **PWA** — installable on mobile and desktop, works offline after first load
- **Responsive** — optimised for both landscape desktop and portrait mobile

## Stack

| | |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS 4 |
| Prayer engine | [adhan](https://github.com/batoulapps/adhan-js) |
| State | Zustand (persisted) |
| Fonts | Reem Kufi · Amiri · JetBrains Mono |
| Hosting | GitHub Pages (auto-deploy via Actions) |

## Development

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # type-check + Vite build → dist/
```

## Deployment

Pushes to `main` automatically build and deploy via GitHub Actions to GitHub Pages.

---

*بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ*
