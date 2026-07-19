/**
 * @file api/worldcup.ts
 * Standalone Vercel serverless handler — no Express/server.ts dependency.
 *
 * Serves FIFA World Cup 2026 match data by smart-merging:
 *  - Curated authoritative knockout results (always takes precedence)
 *  - Live group-stage data from the openfootball CDN
 *  - Auto-fill from CDN for unscored knockout fixtures (e.g. the Final)
 */
import type { IncomingMessage, ServerResponse } from "http";

// ── Constants ──────────────────────────────────────────────────────────────────

const TOURNAMENT_NAME = "FIFA World Cup 2026" as const;
const KNOCKOUT_CUTOFF_DATE = "2026-07-04" as const;
const CDN_URL =
  "https://cdn.jsdelivr.net/gh/openfootball/worldcup.json/2026/worldcup.json";
const CDN_TIMEOUT_MS = 5_000;

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Cache-Control": "public, max-age=60, stale-while-revalidate=120",
  "Content-Type": "application/json",
};

// ── Types ──────────────────────────────────────────────────────────────────────

interface Score {
  ft: [number, number];
  ht?: [number, number];
}

interface Goal {
  name: string;
  minute: string;
}

interface CuratedMatch {
  round: string;
  date: string;
  team1: string;
  team2: string;
  ground: string;
  city?: string;
  time?: string;
  score?: Score;
  goals1?: Goal[];
  goals2?: Goal[];
}

/** Loose shape of a match record returned by the openfootball CDN. */
interface CdnMatch {
  round?: string;
  date?: string;
  team1?: string;
  team2?: string;
  score?: Score;
  goals1?: Goal[];
  goals2?: Goal[];
  [key: string]: unknown;
}

interface ApiResponse {
  name: string;
  matches: unknown[];
  fetchedAt: string;
  source: string;
}

// ── Curated authoritative knockout data ───────────────────────────────────────
// These are ALWAYS shown. Curated scores override CDN. Unscored entries (Final)
// auto-fill from CDN once the result is available.
const CURATED_MATCHES: CuratedMatch[] = [
  {
    round: "Final",
    date: "2026-07-19",
    team1: "Argentina",
    team2: "Spain",
    ground: "MetLife Stadium",
    city: "East Rutherford NJ",
    time: "15:00 UTC-4",
    // score intentionally absent — auto-fills from CDN post-match
  },
  {
    round: "Match for third place",
    date: "2026-07-18",
    team1: "France",
    team2: "England",
    score: { ft: [4, 6], ht: [1, 2] },
    goals1: [
      { name: "Kylian Mbappé", minute: "48" },
      { name: "Bradley Barcola", minute: "54" },
      { name: "Kylian Mbappé", minute: "66" },
      { name: "Ousmane Dembélé", minute: "90+6" },
    ],
    goals2: [
      { name: "Declan Rice", minute: "3" },
      { name: "Erling Haaland", minute: "18" },
      { name: "Bukayo Saka", minute: "37" },
      { name: "Bukayo Saka", minute: "45+1" },
      { name: "Bukayo Saka", minute: "77" },
      { name: "Jude Bellingham", minute: "90+8" },
    ],
    ground: "Hard Rock Stadium",
    city: "Miami FL",
    time: "15:00 UTC-5",
  },
  {
    round: "Semi-finals",
    date: "2026-07-15",
    team1: "England",
    team2: "Argentina",
    score: { ft: [1, 2] },
    ground: "Mercedes-Benz Stadium",
    city: "Atlanta GA",
  },
  {
    round: "Semi-finals",
    date: "2026-07-14",
    team1: "Spain",
    team2: "France",
    score: { ft: [2, 0] },
    ground: "AT&T Stadium",
    city: "Dallas TX",
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Returns a normalised, date-independent key for a team pair.
 * Strips non-alpha chars and sorts alphabetically so the key is
 * consistent regardless of home/away order or date format differences.
 */
function teamPairKey(t1: string, t2: string): string {
  return [
    t1.toLowerCase().replace(/[^a-z]/g, ""),
    t2.toLowerCase().replace(/[^a-z]/g, ""),
  ]
    .sort()
    .join("|");
}

/**
 * Merges curated knockout data with raw CDN match records:
 *  1. **Group stage** (< `KNOCKOUT_CUTOFF_DATE`): all CDN records included for full history.
 *  2. **Knockouts with a curated score**: curated always wins — our data is authoritative.
 *  3. **Knockouts without a curated score** (e.g. Final): auto-fill score from CDN
 *     so the winner appears automatically once the CDN updates post-match.
 *
 * Results are sorted newest-first for scoreboard display.
 */
function smartMerge(external: CdnMatch[]): unknown[] {
  const groupStage = external.filter(
    (m) => String(m.date ?? "") < KNOCKOUT_CUTOFF_DATE
  );
  const extKnockouts = external.filter(
    (m) => String(m.date ?? "") >= KNOCKOUT_CUTOFF_DATE
  );

  const knockouts: unknown[] = CURATED_MATCHES.map((curated) => {
    if (curated.score) return curated; // Curated score wins — never override

    // No score yet: find matching CDN entry by team pair (date-agnostic)
    const ourKey = teamPairKey(curated.team1, curated.team2);
    const ext = extKnockouts.find(
      (m) => teamPairKey(m.team1 ?? "", m.team2 ?? "") === ourKey
    );

    if (ext?.score) {
      return {
        ...curated,
        score: ext.score,
        ...(ext.goals1 ? { goals1: ext.goals1 } : {}),
        ...(ext.goals2 ? { goals2: ext.goals2 } : {}),
      };
    }

    return curated; // Match not yet played
  });

  return [...knockouts, ...groupStage].sort((a, b) => {
    const da = String((a as CdnMatch).date ?? "");
    const db = String((b as CdnMatch).date ?? "");
    return db.localeCompare(da);
  });
}

// ── Serverless Handler ─────────────────────────────────────────────────────────

/**
 * GET /api/worldcup
 *
 * Returns a merged JSON payload containing curated knockout results and
 * live group-stage data from the openfootball CDN. Falls back to curated-only
 * data if the CDN is unreachable within `CDN_TIMEOUT_MS`.
 */
export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  let matches: unknown[] = CURATED_MATCHES;

  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), CDN_TIMEOUT_MS);
    const r = await fetch(`${CDN_URL}?v=${Date.now()}`, {
      signal: controller.signal,
      headers: { "Cache-Control": "no-cache" },
    });
    clearTimeout(tid);

    if (r.ok) {
      const d = (await r.json()) as { matches?: CdnMatch[] };
      if (Array.isArray(d.matches) && d.matches.length > 0) {
        matches = smartMerge(d.matches);
      }
    }
  } catch {
    // CDN unreachable — curated-only fallback is served above
  }

  const body: ApiResponse = {
    name: TOURNAMENT_NAME,
    matches,
    fetchedAt: new Date().toISOString(),
    source: "smart-merged",
  };

  res.statusCode = 200;
  res.end(JSON.stringify(body));
}
