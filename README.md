# Hei-wei

Estimate height and weight from a single photo using AI.

## Features

- **Camera or Upload** — snap a photo or pick from gallery
- **AI-Powered** — Gemini 2.5 Flash analyzes 32 skeletal landmarks
- **Instant Results** — height, weight, and confidence in seconds
- **Metric / Imperial** — toggle between unit systems
- **Privacy** — photos are never stored

## Quick Start

```bash
git clone https://github.com/Nikhilesh-hub/hei-wei.git
cd hei-wei
npm install
```

Create `.env.local`:

```env
VITE_GEMINI_API_KEY=your_api_key_here
VITE_GEMINI_MODEL=gemini-2.5-flash
```

Run:

```bash
npm run dev
```

This starts both the Vite dev server (`localhost:5173`) and the Express API proxy (`localhost:3001`).

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React + TypeScript |
| Styling | Tailwind CSS (CDN) |
| Font | Space Grotesk |
| AI | Google Gemini 2.5 Flash |
| API Proxy | Express.js (`server.js`) |
| Build | Vite |
| Deploy | Vercel |

## Project Structure

```
hei-wei/
├── App.tsx                  # Main app — routing, loading, layout
├── index.html               # HTML shell, theme config, font
├── index.tsx                # React entry point
├── server.js                # Express API proxy for Gemini
├── components/
│   ├── ImageInput.tsx       # Upload / camera capture
│   ├── ResultDisplay.tsx    # Height, weight, confidence cards
│   ├── Feedback.tsx         # Thumbs up/down feedback
│   ├── Suggestions.tsx      # Health suggestions by BMI category
│   └── icons.tsx            # SVG icon components + logo
├── services/
│   └── geminiService.ts     # API call to /api/analyze
├── utils/
│   └── imageUtils.ts        # Image resizing
└── types.ts                 # TypeScript types
```

## How It Works

1. User takes/uploads a full-body photo
2. Image is base64-encoded and sent to `/api/analyze`
3. Express proxy forwards to Gemini 2.5 Flash with a structured prompt
4. AI returns estimated height (cm), weight (kg), and confidence level
5. Results display with unit conversion and feedback option

## License

MIT

---

*Powered by Google Gemini AI*
