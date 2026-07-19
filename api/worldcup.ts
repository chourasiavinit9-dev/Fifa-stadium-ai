// Standalone Vercel serverless function — no Express/server.ts dependency
import type { IncomingMessage, ServerResponse } from "http";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Cache-Control": "public, max-age=60, stale-while-revalidate=120",
  "Content-Type": "application/json",
};

// Curated authoritative match data — always returned
const CURATED_MATCHES = [
  {
    round: "Final",
    date: "2026-07-19",
    team1: "Argentina",
    team2: "Spain",
    ground: "MetLife Stadium",
    city: "East Rutherford NJ",
    time: "15:00 UTC-4",
  },
  {
    round: "Match for third place",
    date: "2026-07-18",
    team1: "France",
    team2: "England",
    score: { ft: [2, 1], ht: [1, 0] },
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

  res.statusCode = 200;
  res.end(
    JSON.stringify({
      name: "FIFA World Cup 2026",
      matches: CURATED_MATCHES,
      fetchedAt: new Date().toISOString(),
      source: "curated",
    })
  );
}

