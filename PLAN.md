# Salah Web App - Implementation Plan

## Phase 1: Project Scaffold ✅ COMPLETED
- Vite + React + TypeScript + Tailwind CSS
- Dependencies: adhan, zustand, lucide-react, react-router-dom, vite-plugin-pwa, workbox-window
- Tailwind config with Islamic color palette, fonts, animations
- TypeScript config with path aliases

## Phase 2: Type Definitions & Zustand Store 🔄 IN PROGRESS
- TypeScript interfaces for prayer times, settings, coordinates
- Zustand store with persistence for settings
- Default calculation methods and madhab options

## Phase 3: Sky Engine (Solar Calc + Gradient Mapping)
- Solar position calculation (elevation, azimuth)
- Moon phase calculation
- Sky phase determination from solar elevation
- Gradient mapping per phase
- CSS custom property updates

## Phase 4: Main View Components (Left Panel)
- Next Prayer Timer Card (hero, ink-flow animation)
- Hijri Date Card (Arabic + Gregorian + moon phase)
- Qibla Compass (SVG compass rose, animated needle)

## Phase 5: Right Panel - Daily Prayer List
- Prayer rows with Arabic name, time, progress bar, percentage
- Active prayer highlighting with gold border + glow
- Staggered entrance animations

## Phase 6: Settings Page (/settings)
- Location picker (search + manual + GPS + map)
- Calculation method dropdown (12 methods)
- Madhab radio (Shafi vs Hanafi)
- High latitude rule dropdown
- Time format toggle (12h/24h)
- Hijri adjustment input
- Theme radio (Auto/Light/Dark)
- Prayer adjustments (± minutes)
- Notification settings

## Phase 7: Islamic Patterns & Animations
- SVG patterns: 8-point star, girih tiles, muqarnas, kufic border
- Sky container with pattern overlays (mix-blend-mode)
- Phase-adaptive pattern opacity
- Micro-interactions (button press, hover, focus)

## Phase 8: Polish & PWA
- Font loading (Amiri Quran, Amiri, JetBrains Mono)
- Accessibility audit (contrast, keyboard, screen readers)
- PWA manifest + service worker
- Reduced motion support
- Build & deploy