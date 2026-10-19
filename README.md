# Moonthread — Bedtime stories made just for them

Moonthread is a free, installable, mobile-first bedtime story PWA. A parent picks a child's name, favorite animal, mood and age group. The app writes a short illustrated story with Groq, draws every scene on HTML Canvas, reads it aloud with Web Speech API (with word highlighting), and lets parents save favorites to read offline. Includes sleep timer with fade-out and soft looping background sounds.

**Live stack:** Next.js App Router, TypeScript, Tailwind CSS, next/font (Fredoka + Nunito), Groq API (server-side only), HTML Canvas (no drawing library), Web Speech API, Web Audio (procedural + file fallback), IndexedDB, hand-written service worker + manifest. No database, no auth. Everything personal stays on device.

## Features

- **Story builder:** name, animal (Fox/Bunny/Frog/Owl/Bear/Dino), mood (Calm/Silly/Brave/Sleepy/Adventurous), age (2-4: 3 scenes, 5-7: 5 scenes, 8-10: 6 scenes)
- **Canvas scenes:** moon, stars (twinkling), hills, clouds, pond/flowers/trees, animal sitting — colors from mood palette, DPR-aware, responsive
- **Read aloud:** sentence utterances, word highlight via `boundary` events + estimated fallback, play/pause, prev/next, voice picker, speed (Slow/Normal/Fast), auto-advance
- **Sleep timer:** 10/20/30 min or end-of-story, fades voice + background sound over last 30s, shows Goodnight state
- **Background sounds:** rain, crickets, ocean, wind — procedural Web Audio with file fallback, volume slider, loops, cached for offline
- **Favorites:** IndexedDB (id, title, child, animal, mood, age, scenes, date), library list/open/delete, fully offline playable
- **Offline fallback:** when offline or Groq fails, uses built-in templates with slots for name/animal, variants per mood/age
- **Kid-safe:** strict prompt rules + blocklist + structure validation, retries once then template
- **PWA:** manifest, icons (192/512/maskable/apple), service worker precaches shell/fonts/icons/sounds/offline page, runtime cache, never caches /api, beforeinstallprompt install button + iOS hint
- **Pages:** / (landing), /create, /story/[id], /library, /settings, /offline, /privacy, /terms

## UI

- Dark theme: Midnight Indigo #1E1B4B, card #2D2A6E, footer #16143A, Moon Cream #FFF8E7, Sunny Yellow #FFD93D, Coral #FF7A59, etc.
- Mood palettes mapped to canvas and accents
- Fredoka for headings/buttons, Nunito for body
- Big rounded corners, sticker cards, chunky coral buttons with bottom shadow
- Mobile bottom nav (Create/Library/Settings), desktop centered up to 1100px
- Landing: hero with fox canvas, How it works 3 cards, Moods pills, yellow CTA, footer

## Setup

```bash
npm install
cp .env.example .env.local
# edit .env.local and add GROQ_API_KEY
npm run dev
```

Open http://localhost:3000

## Env vars

- `GROQ_API_KEY` (required) — Groq API key from https://console.groq.com/keys
- `GROQ_MODEL` (optional) — defaults to `openai/gpt-oss-20b` (free tier, fast, 1000 tok/s). Alternatives: `openai/gpt-oss-120b` (higher quality), `qwen/qwen3-8b-27b` (27B). Note: Llama 3.1 8B and 3.3 70B were decommissioned on Groq free tier Aug 16 2026, use gpt-oss models instead.

Your `.env.local` already contains the provided key and model.

## Deploy to Vercel (free tier)

1. Push to GitHub
2. Import project in Vercel
3. Add env var `GROQ_API_KEY` in Vercel dashboard
4. Deploy — no extra config needed. Service worker and manifest work on Vercel.

## Offline

- Service worker precaches app shell, fonts (via next/font self-hosted), icons, sounds, offline page
- API route is never cached; client falls back to templates when `navigator.onLine === false` or fetch fails
- Favorites and settings in IndexedDB work offline

## Privacy

Child's name and stories stay on device in IndexedDB. Only name, animal, mood, ageGroup are sent to Groq server-side to generate story. No logs, no accounts, no database.

## Structure

```
src/
  app/
    page.tsx (landing)
    create/page.tsx
    story/[id]/page.tsx
    library/page.tsx
    settings/page.tsx
    offline/page.tsx
    privacy/page.tsx
    terms/page.tsx
    api/story/route.ts
    globals.css
    layout.tsx
  components/
    Logo, Header, Footer, BottomNav, AnimalTile, MoodPill, StoryCanvas, StoryReader, InstallPrompt
  lib/
    constants, storyTypes, offlineTemplates, safety, db (IndexedDB), canvasDraw, sounds
public/
  manifest.json, sw.js, icons/*, sounds/*
```

## License

MIT — sounds are procedurally generated CC0 placeholders.
