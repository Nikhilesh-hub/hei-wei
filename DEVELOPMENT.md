# Development Log

Step-by-step record of how Hei-wei was built and evolved.

---

## Phase 1: Initial Setup

The project started as a Vite + React + TypeScript app using Google's Gemini AI to estimate body measurements from photos.

**Core Files Created:**
- `index.html` — HTML shell with Tailwind CDN and Poppins font
- `App.tsx` — Main component with 4-step flow (source → capture → loading → result)
- `components/ImageInput.tsx` — File upload and camera capture with drag-and-drop
- `components/ResultDisplay.tsx` — Height/weight display with unit toggle
- `components/Feedback.tsx` — Thumbs up/down user feedback
- `components/Suggestions.tsx` — Health tips based on BMI category
- `components/icons.tsx` — Centralized SVG icon components
- `services/geminiService.ts` — Direct Gemini API call from browser
- `utils/imageUtils.ts` — Image resizing utility
- `types.ts` — TypeScript type definitions

**Original Theme:**
- Dark zinc/black background (`#09090b`)
- Indigo brand color (`#6366f1`)
- Poppins font
- Glassmorphism card effects

---

## Phase 2: Server-Side API Proxy

**Problem:** Running Gemini API calls directly from the browser hit free-tier quota limits (0 requests). AI Studio worked because it used server-side routing with different quotas.

**Solution:** Added an Express.js server (`server.js`) as an API proxy.

**Changes:**
- Created `server.js` — Express server on port 3001 with `/api/analyze` endpoint
- Modified `services/geminiService.ts` — Replaced direct SDK call with `fetch` to `/api/analyze`
- Updated `vite.config.ts` — Added proxy config to forward `/api` requests to Express
- Updated `package.json` — Added `express`, `concurrently`, and new dev scripts

**Architecture:**
```
Browser → Vite (5173) → /api/analyze → Express (3001) → Gemini API
```

**Key Detail:** API key is read server-side from `.env.local`, never exposed to the browser.

---

## Phase 3: Model Switch

**Problem:** `gemini-2.0-flash` had exhausted free-tier quota.

**Solution:** Switched to `gemini-2.5-flash` which had available quota on the user's API key.

**Files Changed:**
- `server.js` — Model name updated to `gemini-2.5-flash`

---

## Phase 4: Loading Animation

**Problem:** Static loading screen showed a hardcoded "72%" with a single step.

**Solution:** Dynamic animated progress system.

**Features Added:**
- 5 analysis steps: Skeletal Mapping → Proportional Scaling → Perspective Correction → Volumetric Estimation → Final Calibration
- Smoothly animating progress bar (random increments, capped at 92%)
- Live percentage counter
- Step-by-step checkmarks for completed phases
- Active step highlighting with detail text

**Files Changed:**
- `App.tsx` — Added `ANALYSIS_STEPS` constant, `useEffect` for animation, new loading JSX

---

## Phase 5: UI Redesign (TechCrunch-Inspired)

Complete visual overhaul to match a bold, editorial aesthetic.

### 5.1 Theme Changes

| Element | Before | After |
|---------|--------|-------|
| Brand color | Indigo `#6366f1` | Green `#00A562` |
| Font | Poppins | **Space Grotesk** |
| Background | Dark zinc | Dark with green radial gradients |
| Cards | Glass blur | Solid dark `#1a1a1a` with clean borders |
| Buttons | Gradient/outlined | Dark bg, green on hover |

### 5.2 Landing Page

- Added **Accuracy** and **Privacy** feature cards
- Added **"How It Works"** explainer section
- Both CTA buttons (Camera / Upload) now have consistent dark styling with green hover transitions
- Removed redundant header text, kept logo-only top bar

### 5.3 Loading Screen

- Full-viewport image display with scanning overlay
- Progress panel overlaid at bottom of image (not side-by-side)

### 5.4 Results Screen

- Larger image display using `object-contain` (no cropping)
- Green labels, green unit toggle, green reset button
- Hover effects on stat cards

### 5.5 Logo & Favicon

- Created minimal `HeiWeiLogo` — green rounded square with stylized "H" made of measurement ruler lines
- Used as favicon (`public/favicon.svg`) and inline SVG component across all pages

### Files Changed

- `index.html` — Font, colors, background
- `App.tsx` — Layout, buttons, loading, logo
- `components/ImageInput.tsx` — Upload area, best practices panel
- `components/ResultDisplay.tsx` — Stat cards, buttons, image sizing
- `components/Feedback.tsx` — Green accent colors
- `components/icons.tsx` — Added `HeiWeiLogo` component
- `public/favicon.svg` — New green measurement logo

---

## Deployment

- **Hosting:** Vercel (connected to GitHub repo)
- **Auto-deploy:** Pushes to `main` trigger production builds
- **Local dev:** `npm run dev` runs Vite + Express concurrently
