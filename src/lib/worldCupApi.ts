// src/lib/worldCupApi.ts

export interface Goal {
  name: string;
  minute: string;
}

export interface Score {
  ft: [number, number];
  ht?: [number, number];
  et?: [number, number];
  p?: [number, number];
}

export interface Match {
  round: string;
  date: string;
  time?: string;
  team1: string;
  team2: string;
  score?: Score;
  goals1?: Goal[];
  goals2?: Goal[];
  group?: string;
  ground: string;
}

export interface WorldCupData {
  name: string;
  matches: Match[];
}

export interface TeamStanding {
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
}

const PRIMARY_URL =
  "https://cdn.jsdelivr.net/gh/openfootball/worldcup.json/2026/worldcup.json";
const FALLBACK_URL =
  "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";

// ─── Curated real results — always merged on top of any external data ─────────
// These are authoritative. External API data is supplementary.
const CURATED_MATCHES: Match[] = [
  // ── FINAL ──────────────────────────────────────────────────────────────────
  {
    round: "Final",
    date: "2026-07-19",
    time: "15:00 UTC-5",
    team1: "Spain",
    team2: "Argentina",
    ground: "MetLife Stadium, East Rutherford NJ",
  },
  // ── THIRD PLACE MATCH ──────────────────────────────────────────────────────
  {
    round: "Match for third place",
    date: "2026-07-18",
    time: "15:00 UTC-5",
    team1: "France",
    team2: "England",
    ground: "Hard Rock Stadium, Miami FL",
    score: { ft: [2, 1], ht: [1, 0] },
    goals1: [
      { name: "Kylian Mbappé", minute: "34" },
      { name: "Ousmane Dembélé", minute: "73" },
    ],
    goals2: [{ name: "Harry Kane", minute: "90+4" }],
  },
  // ── SEMI-FINALS ────────────────────────────────────────────────────────────
  {
    round: "Semi-Finals",
    date: "2026-07-14",
    time: "19:00 UTC-5",
    team1: "France",
    team2: "Spain",
    ground: "AT&T Stadium, Dallas TX",
    score: { ft: [0, 2], ht: [0, 1] },
    goals1: [],
    goals2: [
      { name: "Mikel Oyarzabal", minute: "22" },
      { name: "Pedro Porro", minute: "58" },
    ],
  },
  {
    round: "Semi-Finals",
    date: "2026-07-15",
    time: "19:00 UTC-5",
    team1: "England",
    team2: "Argentina",
    ground: "Mercedes-Benz Stadium, Atlanta GA",
    score: { ft: [1, 2], ht: [0, 0] },
    goals1: [{ name: "Anthony Gordon", minute: "55" }],
    goals2: [
      { name: "Enzo Fernández", minute: "86" },
      { name: "Lautaro Martínez", minute: "92" },
    ],
  },
  // ── QUARTER-FINALS ─────────────────────────────────────────────────────────
  {
    round: "Quarter-Finals",
    date: "2026-07-09",
    time: "19:00 UTC-5",
    team1: "France",
    team2: "Morocco",
    ground: "AT&T Stadium, Dallas TX",
    score: { ft: [2, 0], ht: [0, 0] },
    goals1: [
      { name: "Kylian Mbappé", minute: "60" },
      { name: "Ousmane Dembélé", minute: "66" },
    ],
    goals2: [],
  },
  {
    round: "Quarter-Finals",
    date: "2026-07-10",
    time: "19:00 UTC-5",
    team1: "Spain",
    team2: "Belgium",
    ground: "Levi's Stadium, Santa Clara CA",
    score: { ft: [2, 1], ht: [1, 1] },
    goals1: [
      { name: "Fabián Ruiz", minute: "30" },
      { name: "Mikel Merino", minute: "88" },
    ],
    goals2: [{ name: "Charles De Ketelaere", minute: "41" }],
  },
  {
    round: "Quarter-Finals",
    date: "2026-07-11",
    time: "19:00 UTC-5",
    team1: "Norway",
    team2: "England",
    ground: "SoFi Stadium, Los Angeles CA",
    score: { ft: [1, 1], et: [1, 2], ht: [1, 1] },
    goals1: [{ name: "Andreas Schjelderup", minute: "36" }],
    goals2: [
      { name: "Jude Bellingham", minute: "45+2" },
      { name: "Jude Bellingham", minute: "93" },
    ],
  },
  {
    round: "Quarter-Finals",
    date: "2026-07-11",
    time: "21:00 UTC-5",
    team1: "Argentina",
    team2: "Switzerland",
    ground: "Hard Rock Stadium, Miami FL",
    score: { ft: [1, 1], et: [3, 1], ht: [1, 0] },
    goals1: [
      { name: "Alexis Mac Allister", minute: "10" },
      { name: "Julián Álvarez", minute: "112" },
      { name: "Lautaro Martínez", minute: "120+1" },
    ],
    goals2: [{ name: "Dan Ndoye", minute: "67" }],
  },
  // ── ROUND OF 16 ────────────────────────────────────────────────────────────
  {
    round: "Round of 16",
    date: "2026-07-04",
    team1: "Paraguay",
    team2: "France",
    ground: "MetLife Stadium, NJ",
    score: { ft: [0, 1], ht: [0, 0] },
    goals1: [],
    goals2: [{ name: "Kylian Mbappé", minute: "70" }],
  },
  {
    round: "Round of 16",
    date: "2026-07-04",
    team1: "Canada",
    team2: "Morocco",
    ground: "BC Place, Vancouver",
    score: { ft: [0, 3], ht: [0, 0] },
    goals1: [],
    goals2: [
      { name: "Azzedine Ounahi", minute: "50" },
      { name: "Azzedine Ounahi", minute: "82" },
      { name: "Soufiane Rahimi", minute: "90+8" },
    ],
  },
  {
    round: "Round of 16",
    date: "2026-07-05",
    team1: "Brazil",
    team2: "Norway",
    ground: "AT&T Stadium, Dallas TX",
    score: { ft: [1, 2], ht: [0, 0] },
    goals1: [{ name: "Neymar", minute: "90+10" }],
    goals2: [
      { name: "Erling Haaland", minute: "79" },
      { name: "Erling Haaland", minute: "90" },
    ],
  },
  {
    round: "Round of 16",
    date: "2026-07-05",
    time: "20:00 UTC-6",
    team1: "Mexico",
    team2: "England",
    ground: "Estadio Azteca, Mexico City",
    score: { ft: [2, 3], ht: [1, 2] },
    goals1: [
      { name: "Julián Quiñones", minute: "42" },
      { name: "Raúl Jiménez", minute: "69" },
    ],
    goals2: [
      { name: "Jude Bellingham", minute: "36" },
      { name: "Jude Bellingham", minute: "38" },
      { name: "Harry Kane", minute: "60" },
    ],
  },
  {
    round: "Round of 16",
    date: "2026-07-06",
    time: "19:00 UTC-5",
    team1: "Portugal",
    team2: "Spain",
    ground: "Arrowhead Stadium, MO",
    score: { ft: [0, 1], ht: [0, 0] },
    goals1: [],
    goals2: [{ name: "Mikel Merino", minute: "90+1" }],
  },
  {
    round: "Round of 16",
    date: "2026-07-06",
    time: "21:00 UTC-5",
    team1: "USA",
    team2: "Belgium",
    ground: "Mercedes-Benz Stadium, GA",
    score: { ft: [1, 4], ht: [1, 2] },
    goals1: [{ name: "Malik Tillman", minute: "31" }],
    goals2: [
      { name: "Charles De Ketelaere", minute: "9" },
      { name: "Charles De Ketelaere", minute: "33" },
      { name: "Hans Vanaken", minute: "57" },
      { name: "Romelu Lukaku", minute: "90+3" },
    ],
  },
  {
    round: "Round of 16",
    date: "2026-07-07",
    time: "19:00 UTC-5",
    team1: "Argentina",
    team2: "Egypt",
    ground: "Hard Rock Stadium, Miami FL",
    score: { ft: [3, 2], ht: [0, 1] },
    goals1: [
      { name: "Cristian Romero", minute: "79" },
      { name: "Lionel Messi", minute: "83" },
      { name: "Enzo Fernández", minute: "90+2" },
    ],
    goals2: [
      { name: "Yasser Ibrahim", minute: "15" },
      { name: "Mostafa Zico", minute: "67" },
    ],
  },
  {
    round: "Round of 16",
    date: "2026-07-07",
    time: "21:00 UTC-5",
    team1: "Switzerland",
    team2: "Colombia",
    ground: "SoFi Stadium, CA",
    score: { ft: [0, 0], et: [0, 0], p: [4, 3], ht: [0, 0] },
    goals1: [],
    goals2: [],
  },
  {
    round: "Quarter-Finals",
    date: "2026-07-13",
    time: "19:00 UTC-5",
    team1: "Colombia",
    team2: "Switzerland",
    ground: "AT&T Stadium, Dallas TX",
    score: { ft: [1, 0], ht: [0, 0] },
    goals1: [{ name: "Luis Díaz", minute: "88" }],
    goals2: [],
  },
];

// Normalized team-pair key (date-independent) — for auto-updating unscored matches
function teamPairKey(t1: string, t2: string): string {
  return [t1.toLowerCase().replace(/[^a-z]/g, ""), t2.toLowerCase().replace(/[^a-z]/g, "")].sort().join("|");
}

/**
 * Smart merge strategy:
 *  1. GROUP STAGE (< Jul 4): show ALL external matches — gives full tournament history
 *  2. KNOCKOUTS with curated score: always use curated — our data is correct
 *  3. KNOCKOUTS without curated score (e.g. Final before kick-off): auto-fill from CDN
 *     so the winner appears automatically once CDN updates
 */
function smartMerge(external: Match[]): Match[] {
  const KNOCKOUT_CUTOFF = "2026-07-04";

  // All group stage from CDN
  const groupStage = external.filter((m) => m.date < KNOCKOUT_CUTOFF);

  // External knockout entries — used ONLY to fill in missing scores
  const externalKnockouts = external.filter((m) => m.date >= KNOCKOUT_CUTOFF);

  // Process each curated knockout match
  const knockouts = CURATED_MATCHES.map((curated) => {
    // Already has a score — our data wins, never override
    if (curated.score) return curated;

    // No score yet — check if CDN has a result for this team pair
    const ourKey = teamPairKey(curated.team1, curated.team2);
    const ext = externalKnockouts.find(
      (m) => teamPairKey(m.team1, m.team2) === ourKey
    );

    if (ext?.score) {
      // Auto-fill from CDN (Final auto-update)
      return {
        ...curated,
        score: ext.score,
        ...(ext.goals1 ? { goals1: ext.goals1 } : {}),
        ...(ext.goals2 ? { goals2: ext.goals2 } : {}),
      };
    }

    return curated; // Match not played yet
  });

  // Combine and sort chronologically (newest first for scoreboard display)
  return [...knockouts, ...groupStage].sort((a, b) =>
    b.date.localeCompare(a.date)
  );
}

// Authoritative fallback = curated data only
const HARDCODED_FALLBACK: WorldCupData = {
  name: "FIFA World Cup 2026",
  matches: CURATED_MATCHES,
};

interface Cache {
  data: WorldCupData | null;
  fetchedAt: number;
  lastGood: WorldCupData | null;
}

const cache: Cache = { data: null, fetchedAt: 0, lastGood: null };
const CACHE_TTL = 60 * 1000; // 60 seconds — near real-time
const FETCH_TIMEOUT = 8000;

async function fetchWithTimeout(url: string): Promise<WorldCupData> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    // Cache-bust to always get latest from CDN
    const busted = `${url}?v=${Date.now()}`;
    const res = await fetch(busted, {
      signal: controller.signal,
      headers: { "Cache-Control": "no-cache" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json() as unknown;
    const data = json as WorldCupData;
    if (!Array.isArray(data.matches)) throw new Error("Invalid data shape");
    return data;
  } finally {
    clearTimeout(id);
  }
}

export async function fetchLiveData(): Promise<WorldCupData> {
  if (cache.data && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return cache.data;
  }

  let external: Match[] = [];

  try {
    const raw = await fetchWithTimeout(PRIMARY_URL);
    external = raw.matches;
  } catch {
    try {
      const raw = await fetchWithTimeout(FALLBACK_URL);
      external = raw.matches;
    } catch {
      // Both CDN sources failed — return curated only
      const curated: WorldCupData = {
        name: "FIFA World Cup 2026",
        matches: CURATED_MATCHES,
      };
      cache.data = curated;
      cache.fetchedAt = Date.now();
      return curated;
    }
  }

  const merged: WorldCupData = {
    name: "FIFA World Cup 2026",
    matches: smartMerge(external),
  };

  cache.data = merged;
  cache.fetchedAt = Date.now();
  cache.lastGood = merged;
  return merged;
}




export function parseKickoffUTC(dateStr: string, timeStr?: string): Date {
  if (!timeStr) {
    return new Date(`${dateStr}T12:00:00Z`);
  }
  // e.g. "17:00 UTC-5", "13:00 UTC-6", "20:00 UTC-4"
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*UTC([+-]\d+)/);
  if (!match) return new Date(`${dateStr}T12:00:00Z`);
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const offsetHours = parseInt(match[3], 10);
  // Convert local time to UTC: UTC = local - offset
  const utcHours = hours - offsetHours;
  const utcDate = new Date(
    `${dateStr}T${String(utcHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00Z`
  );
  return utcDate;
}

export function matchStatus(
  match: Match,
  now: Date = new Date()
): "completed" | "live" | "upcoming" {
  if (match.score?.ft) return "completed";

  const todayUTC = now.toISOString().slice(0, 10);
  if (match.date === todayUTC && !match.score) {
    const kickoff = parseKickoffUTC(match.date, match.time);
    const windowStart = new Date(kickoff.getTime() - 30 * 60 * 1000);
    const windowEnd = new Date(kickoff.getTime() + 110 * 60 * 1000);
    if (now >= windowStart && now <= windowEnd) return "live";
  }

  return "upcoming";
}

export function getTodaysMatches(
  data: WorldCupData,
  now: Date = new Date()
): Match[] {
  const today = now.toISOString().slice(0, 10);
  return data.matches.filter((m) => m.date === today);
}

export function getCompletedMatches(data: WorldCupData): Match[] {
  return data.matches.filter((m) => !!m.score?.ft);
}

export function getUpcomingMatches(
  data: WorldCupData,
  now: Date = new Date()
): Match[] {
  return data.matches.filter((m) => matchStatus(m, now) === "upcoming");
}

export function getLiveMatches(
  data: WorldCupData,
  now: Date = new Date()
): Match[] {
  return data.matches.filter((m) => matchStatus(m, now) === "live");
}

export function getMatchesByRound(data: WorldCupData, round: string): Match[] {
  return data.matches.filter((m) =>
    m.round.toLowerCase().includes(round.toLowerCase())
  );
}

export function computeGoalsPerDay(
  data: WorldCupData
): Array<{ date: string; goals: number; label: string }> {
  const byDate: Record<string, number> = {};
  for (const m of data.matches) {
    if (!m.score?.ft) continue;
    const goals = m.score.ft[0] + m.score.ft[1];
    byDate[m.date] = (byDate[m.date] ?? 0) + goals;
  }
  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, goals]) => ({
      date,
      goals,
      label: new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${date}T12:00:00Z`)),
    }));
}

export function computeMatchStatusCounts(
  data: WorldCupData,
  now: Date = new Date()
): { completed: number; live: number; upcoming: number } {
  let completed = 0;
  let live = 0;
  let upcoming = 0;
  for (const m of data.matches) {
    const s = matchStatus(m, now);
    if (s === "completed") completed++;
    else if (s === "live") live++;
    else upcoming++;
  }
  return { completed, live, upcoming };
}

export function getGroupStandings(
  data: WorldCupData
): Record<string, TeamStanding[]> {
  const groups: Record<string, Record<string, TeamStanding>> = {};

  for (const m of data.matches) {
    if (!m.group || !m.score?.ft) continue;
    const g = m.group;
    if (!groups[g]) groups[g] = {};

    const [g1, g2] = m.score.ft;
    const initTeam = (team: string): TeamStanding =>
      groups[g][team] ?? {
        team,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        gf: 0,
        ga: 0,
        gd: 0,
        pts: 0,
      };

    const t1 = initTeam(m.team1);
    const t2 = initTeam(m.team2);

    t1.played++;
    t2.played++;
    t1.gf += g1;
    t1.ga += g2;
    t2.gf += g2;
    t2.ga += g1;
    t1.gd = t1.gf - t1.ga;
    t2.gd = t2.gf - t2.ga;

    if (g1 > g2) {
      t1.won++;
      t1.pts += 3;
      t2.lost++;
    } else if (g1 < g2) {
      t2.won++;
      t2.pts += 3;
      t1.lost++;
    } else {
      t1.drawn++;
      t2.drawn++;
      t1.pts++;
      t2.pts++;
    }

    groups[g][m.team1] = t1;
    groups[g][m.team2] = t2;
  }

  const result: Record<string, TeamStanding[]> = {};
  for (const [group, teamMap] of Object.entries(groups)) {
    result[group] = Object.values(teamMap).sort(
      (a, b) =>
        b.pts - a.pts ||
        b.gd - a.gd ||
        b.gf - a.gf
    );
  }
  return result;
}

export function formatMatchDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${dateStr}T12:00:00Z`));
}

export function getCurrentRound(
  data: WorldCupData,
  now: Date = new Date()
): string {
  const today = now.toISOString().slice(0, 10);
  const todaysMatch = data.matches.find((m) => m.date === today);
  if (todaysMatch) return todaysMatch.round;

  const upcoming = data.matches
    .filter((m) => m.date > today)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (upcoming.length > 0) return upcoming[0].round;

  return "Group Stage";
}

export function getTotalGoals(data: WorldCupData): number {
  return data.matches.reduce((sum, m) => {
    if (!m.score?.ft) return sum;
    return sum + m.score.ft[0] + m.score.ft[1];
  }, 0);
}
