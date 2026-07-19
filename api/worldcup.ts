// Standalone Vercel serverless function — no Express/server.ts dependency
import type { IncomingMessage, ServerResponse } from "http";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Cache-Control": "public, max-age=60, stale-while-revalidate=120",
  "Content-Type": "application/json",
};

// ── Curated authoritative knockout data ────────────────────────────────────────
// These are ALWAYS shown. Scores here override CDN. Unscored entries (Final)
// will auto-fill from CDN once the match result is available.
const CURATED_MATCHES = [
  {
    round: "Final",
    date: "2026-07-19",
    team1: "Argentina",
    team2: "Spain",
    ground: "MetLife Stadium",
    city: "East Rutherford NJ",
    time: "15:00 UTC-4",
    // No score yet — will auto-fill from CDN after match
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

// ── Helper: team-pair key (date-independent) ───────────────────────────────────
function teamPairKey(t1: string, t2: string): string {
  return [
    t1.toLowerCase().replace(/[^a-z]/g, ""),
    t2.toLowerCase().replace(/[^a-z]/g, ""),
  ]
    .sort()
    .join("|");
}

// ── Smart merge ────────────────────────────────────────────────────────────────
// 1. Group stage (< Jul 4): all from CDN → full history
// 2. Knockouts with curated score: always curated (correct data)
// 3. Knockouts WITHOUT curated score (Final): auto-fill from CDN
function smartMerge(
  external: Array<Record<string, unknown>>
): unknown[] {
  const CUTOFF = "2026-07-04";

  const groupStage = external.filter((m) => String(m.date ?? "") < CUTOFF);
  const extKnockouts = external.filter((m) => String(m.date ?? "") >= CUTOFF);

  const knockouts = CURATED_MATCHES.map((curated) => {
    // Already scored — curated wins, never override
    if (curated.score) return curated;

    // No score yet — look for CDN result by team pair
    const ourKey = teamPairKey(curated.team1, curated.team2);
    const ext = extKnockouts.find(
      (m) => teamPairKey(String(m.team1 ?? ""), String(m.team2 ?? "")) === ourKey
    );

    if (ext?.score) {
      return {
        ...curated,
        score: ext.score,
        ...(ext.goals1 ? { goals1: ext.goals1 } : {}),
        ...(ext.goals2 ? { goals2: ext.goals2 } : {}),
      };
    }

    return curated; // Not played yet
  });

  // Sort newest first
  return [...knockouts, ...groupStage].sort((a, b) => {
    const da = String((a as Record<string, unknown>).date ?? "");
    const db = String((b as Record<string, unknown>).date ?? "");
    return db.localeCompare(da);
  });
}

// ── Handler ────────────────────────────────────────────────────────────────────
export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
) {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  let matches: unknown[] = CURATED_MATCHES;

  // Try live CDN (5s timeout)
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 5000);
    const r = await fetch(
      `https://cdn.jsdelivr.net/gh/openfootball/worldcup.json/2026/worldcup.json?v=${Date.now()}`,
      { signal: controller.signal, headers: { "Cache-Control": "no-cache" } }
    );
    clearTimeout(tid);

    if (r.ok) {
      const d = (await r.json()) as { matches?: Array<Record<string, unknown>> };
      if (Array.isArray(d.matches) && d.matches.length > 0) {
        matches = smartMerge(d.matches);
      }
    }
  } catch {
    // CDN failed — curated only is fine
  }

  res.statusCode = 200;
  res.end(
    JSON.stringify({
      name: "FIFA World Cup 2026",
      matches,
      fetchedAt: new Date().toISOString(),
      source: "smart-merged",
    })
  );
}
