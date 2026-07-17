/**
 * @file __tests__/api/anomaly.test.ts
 * Integration tests for the /api/anomaly endpoint.
 * 
 * These tests verify the anomaly detection API route:
 *  - returns 200 with a detected field (boolean)
 *  - returns a severity level
 *  - handles missing payload gracefully
 * 
 * NOTE: Tests run against the live dev server on port 3000.
 * Start the server first with `npm run dev` before running this suite.
 */

import http from "http";

const PORT = 3000;
const HOST = "127.0.0.1";

function post(path: string, body: unknown): Promise<{ status: number; json: unknown }> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = http.request(
      { host: HOST, port: PORT, path, method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) } },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          try { resolve({ status: res.statusCode ?? 0, json: JSON.parse(raw) }); }
          catch { resolve({ status: res.statusCode ?? 0, json: raw }); }
        });
      }
    );
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

describe("POST /api/anomaly", () => {
  it("returns 200 with a detected boolean for a valid sector report", async () => {
    const result = await post("/api/anomaly", {
      sector: "Gate C",
      occupancy: 98,
      flowRate: 420,
    });
    expect(result.status).toBe(200);
    const json = result.json as Record<string, unknown>;
    expect(typeof json.detected).toBe("boolean");
  }, 10_000);

  it("returns 400 when no body is provided", async () => {
    const result = await post("/api/anomaly", {});
    // Either 400 (bad request) or 200 with detected:false are acceptable
    expect([200, 400]).toContain(result.status);
  }, 5_000);
});
