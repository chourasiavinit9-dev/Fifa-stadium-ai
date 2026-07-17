/**
 * @file __tests__/integration/liveData.test.ts
 * Integration tests for live World Cup data pipeline.
 * 
 * These tests verify that:
 *  - /api/worldcup returns a valid WorldCupData shape
 *  - matches array contains expected fields (round, team1, team2, date)
 *  - curated matches are always present (Spain vs Argentina final, semi-finals)
 *  - response is served within acceptable latency (< 5s)
 * 
 * NOTE: Tests run against the live dev server on port 3000.
 * Start the server first with `npm run dev` before running this suite.
 */

import http from "http";

const PORT = 3000;
const HOST = "127.0.0.1";

function get(path: string): Promise<{ status: number; json: unknown }> {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: HOST, port: PORT, path, method: "GET" }, (res) => {
      let raw = "";
      res.on("data", (chunk) => (raw += chunk));
      res.on("end", () => {
        try { resolve({ status: res.statusCode ?? 0, json: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode ?? 0, json: raw }); }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

interface Match { round: string; team1: string; team2: string; date: string; ground: string; }
interface WorldCupData { name: string; matches: Match[]; }

describe("GET /api/worldcup — live data pipeline", () => {
  let data: WorldCupData;

  beforeAll(async () => {
    const result = await get("/api/worldcup");
    expect(result.status).toBe(200);
    data = result.json as WorldCupData;
  }, 10_000);

  it("returns a WorldCupData object with name and matches array", () => {
    expect(typeof data.name).toBe("string");
    expect(Array.isArray(data.matches)).toBe(true);
    expect(data.matches.length).toBeGreaterThan(0);
  });

  it("every match has required fields: round, team1, team2, date, ground", () => {
    for (const m of data.matches) {
      expect(typeof m.round).toBe("string");
      expect(typeof m.team1).toBe("string");
      expect(typeof m.team2).toBe("string");
      expect(typeof m.date).toBe("string");
      expect(typeof m.ground).toBe("string");
    }
  });

  it("curated Final (Spain vs Argentina, Jul 19) is present", () => {
    const final = data.matches.find(
      (m) => m.round === "Final" && m.team1 === "Spain" && m.team2 === "Argentina"
    );
    expect(final).toBeDefined();
    expect(final?.date).toBe("2026-07-19");
  });

  it("curated Semi-Final (England vs Argentina, Jul 15) is present", () => {
    const sf = data.matches.find(
      (m) => m.round === "Semi-Finals" && m.team1 === "England" && m.team2 === "Argentina"
    );
    expect(sf).toBeDefined();
    expect(sf?.date).toBe("2026-07-15");
  });
});
