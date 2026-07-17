# AEGIS × FIFAiq — AI Smart Stadium Operating System

An AI-powered command center that unifies crowd intelligence, live navigation, sustainability tracking, and a multilingual fan assistant into a single real-time operating system for large-scale stadium events — built for FIFA World Cup 2026.

---

## 1. Chosen Vertical

**Smart Infrastructure & Public Safety — AI for Large-Scale Event Operations**

We targeted the intersection of **crowd safety, real-time operations, and fan experience** at mega-events. Stadiums hosting 80,000+ attendees face a recurring set of problems that existing systems handle in silos — CCTV monitoring, transport logistics, crowd density, sustainability reporting, and fan support are usually separate tools run by separate teams. Our vertical is **unifying these into one AI-driven control layer**, serving two distinct user groups from a single codebase:

- **Fans** — a public-facing experience for navigation, transport, and multilingual support.
- **Operators** — a control tower for live monitoring, anomaly detection, and rapid incident response.

We chose this vertical because it combines **measurable operational impact** (faster evacuation routing, reduced bottlenecks, lower incident response time) with a **genuinely useful AI layer** (the assistant and anomaly detection aren't cosmetic — they answer real queries and flag real patterns), rather than being a UI wrapper around static data.

---

## 2. Approach and Logic

### Design principle: two modes, one system
Rather than building separate apps, we built a single React application with two rendering modes driven by app state:

- `currentMode === "landing"` → **Fan Mode**: public dashboard, live scores, chat assistant, transport/sustainability widgets.
- `currentMode === "ops"` → **Control Tower Mode**: operator dashboard with analytics, CCTV AI vision, emergency ops, and the Jarvis-style ops assistant.

This kept the codebase DRY — both modes share the same data hub, the same design system, and the same AI backend, just with different surfaced panels and permission levels.

### Logic layering
We split the system into three logical layers so each could be built, tested, and reasoned about independently:

1. **Data Layer** (`worldcupApi.ts`) — a single source of truth for match data, deduplicated and normalized (order-insensitive team-pair matching) so the same match reported by different feeds never renders twice.
2. **Intelligence Layer** (`gemini.ts`, `server.ts`) — a multi-model AI fallback chain plus a deterministic "synthetic brain" fallback, so the assistant *never* goes silent even if the primary model is rate-limited.
3. **Presentation Layer** (component tree) — a card-and-panel grid where every feature (Crowd Intelligence, Transport Hub, CCTV AI Vision, etc.) is a self-contained, independently clickable module, so operators can jump straight to the panel they need instead of scrolling a monolithic dashboard.

### Why this logic
Real stadium operations software has to survive two failure modes: **data conflicts** (duplicate/contradictory feeds) and **AI service outages** (rate limits, downtime) — both are common in live event environments. We designed the deduplication engine and the multi-model fallback specifically to make the system resilient to both, rather than assuming a perfect network/API environment.

---

## 3. How the Solution Works

### Fan-facing flow
1. User lands on the hero page and sees live match state, capacity, and AI confidence metrics pulled from the data hub.
2. They can query the **FIFAiq Assistant** in natural language (10+ languages auto-detected) for things like nearest gate, food options, or transport — answered either by a live Gemini call or, if unavailable, an instant local knowledge-base response so there's no perceptible downtime.
3. Cards for Transport, Sustainability, and Navigation surface real-time-style widgets (shuttle times, waste diversion %, sector wayfinding).

### Operator-facing flow
1. Operator clicks **Enter Control Tower**, switching the app into Ops mode.
2. The **Crowd Intelligence** panel shows 10-sector density monitoring with CCTV overlays and AI anomaly flags.
3. Related panels — **CCTV AI Vision**, **Analytics Engine**, **Emergency Ops** — are each one click away from the same grid, each opening its own focused view rather than a single overloaded screen.
4. **Emergency Ops** can trigger dynamic evacuation routing and signage overrides directly from detected anomalies, closing the loop between detection and response.

### Backend & AI resilience
- `/api/worldcup`, `/api/gemini`, `/api/gemini-ops`, `/api/jarvis`, and `/api/anomaly` are served from a single Express backend.
- Gemini calls cascade through multiple models (`gemini-2.5-flash → gemini-1.5-flash → gemini-2.0-flash → gemini-1.5-pro`) before falling back to a deterministic local response engine — guaranteeing the assistant always answers.
- Rate limiting and CSP headers protect the API layer from abuse.

### Accessibility
Every interactive element — including all 9 feature cards — is a real, keyboard-operable control with visible focus states and descriptive labels, so operators and fans using assistive technology can navigate the same functionality as mouse/touch users.

---

## 4. Assumptions Made

- **Live data availability**: Where a live official feed wasn't accessible during development, we used authoritative historical/reference data (e.g. `openfootball/worldcup.json`) as a stand-in, structured so it can be swapped for a real live feed without changing the consuming components.
- **CCTV/anomaly detection**: Camera feeds and anomaly flags are simulated for demo purposes; the architecture (panel, alert pipeline, response actions) is built to plug into a real computer-vision backend without UI changes.
- **Single-venue context**: The demo assumes one active stadium/session at a time. Multi-venue support (concurrent matches across 16 stadiums) is architecturally possible via the existing stadium knowledge base but isn't exposed in the current UI.
- **User roles**: We assume two roles only — general fan and stadium operator — with no granular permission tiers (e.g. security vs. medical vs. transport staff) within Ops mode yet.
- **Network conditions**: The AI fallback chain assumes intermittent, not total, connectivity loss. Full offline operation is out of scope for this build.
- **Language coverage**: Multilingual support covers the 10 languages implemented in the knowledge base; broader language coverage would require extending the synthetic response engine's dictionaries.

---

## Tech Stack

`Vite + React 19 + TypeScript` · `Tailwind CSS v4` · `Three.js / React Three Fiber` · `Framer Motion` · `Express + Node.js` · `Gemini API` · `Recharts` · `Jest`
