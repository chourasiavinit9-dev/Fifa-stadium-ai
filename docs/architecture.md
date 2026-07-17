# FIFAiq Stadium Control Tower — Architecture

## Overview

FIFAiq is an AI-powered venue operating system for FIFA World Cup 2026, deployed at MetLife Stadium (East Rutherford, NJ). It provides real-time crowd intelligence, stadium operations monitoring, and an AI-powered fan assistant.

---

## System Architecture

```
Browser (React SPA)
    │
    ▼
Express Server (server.ts)          ← port 3000
    ├── Vite Dev Middleware          ← serves React in development
    ├── /api/worldcup               ← live World Cup match data
    ├── /api/gemini                 ← Gemini AI ops assistant (staff)
    ├── /api/gemini-ops             ← Gemini AI fan assistant
    └── /api/anomaly                ← crowd anomaly detection
```

---

## Directory Structure

```
src/
├── components/        UI components (React)
├── lib/               Core utilities (API clients, helpers)
├── hooks/             Reusable React hooks
├── types/             Shared TypeScript interfaces
├── App.tsx            Root component / routing
├── main.tsx           React entry point
└── index.css          Global styles + design tokens

__tests__/
├── unit/              Pure function unit tests (no server needed)
├── api/               HTTP endpoint integration tests (needs dev server)
└── integration/       Full pipeline integration tests (needs dev server)
```

---

## Data Flow

### World Cup Data
1. Server fetches from `openfootball.github.io` CDN (primary) or GitHub raw (fallback)
2. Curated authoritative results are merged on top (curated always wins conflicts)
3. Result is cached in-memory for 60 seconds
4. Client polls `/api/worldcup` every 60 seconds

### AI Operations Assistant (Staff)
- Endpoint: `POST /api/gemini`
- Model: `gemini-1.5-flash`
- Context: Real-time stadium telemetry injected into system prompt
- Rate-limited: 10 requests/minute per IP
- Fallback: Synthetic rule-based responses if Gemini is unavailable

### AI Fan Assistant
- Endpoint: `POST /api/gemini-ops`
- Model: `gemini-1.5-flash`
- Context: Tournament standings, schedule, venue info
- Multi-language: responds in the same language as the user

---

## Security

- Helmet.js: XSS, clickjacking, MIME-type sniffing protection
- CSP: restricts script/style sources to known domains
- CORS: restricted to `APP_URL` origin
- Rate limiting: per-IP, per-endpoint
- Input sanitisation: all user messages sanitised before sending to Gemini
- `.env` is gitignored; API keys never exposed to client bundle

---

## Testing

```bash
npm test                    # run all unit tests (no server needed)
npm run dev                 # start server on port 3000
# then in another terminal:
npx jest __tests__/api      # run API integration tests
npx jest __tests__/integration  # run full pipeline tests
```

---

## Environment Variables

See `.env.example` for all required variables.
