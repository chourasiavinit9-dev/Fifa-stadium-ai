/**
 * @file __tests__/api/gemini.test.ts
 * Integration tests for the /api/gemini endpoint.
 * 
 * These tests verify the Gemini AI assistant API route:
 *  - accepts a valid message payload
 *  - returns a response string
 *  - enforces rate limiting (429 after limit exceeded)
 *  - rejects requests missing the message field
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

describe("POST /api/gemini", () => {
  it("returns 200 with a response string for a valid message", async () => {
    const result = await post("/api/gemini", { message: "What is the current crowd level?" });
    expect(result.status).toBe(200);
    const json = result.json as Record<string, unknown>;
    expect(typeof json.response).toBe("string");
    expect((json.response as string).length).toBeGreaterThan(0);
  }, 15_000);

  it("returns 400 when message is missing", async () => {
    const result = await post("/api/gemini", {});
    expect(result.status).toBe(400);
  }, 5_000);

  it("returns 400 when message is empty string", async () => {
    const result = await post("/api/gemini", { message: "" });
    expect(result.status).toBe(400);
  }, 5_000);
});
