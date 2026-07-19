import type { IncomingMessage, ServerResponse } from "http";
import { readBody, CORS } from "./_utils.js";
import { buildOpsSystemPrompt, callGemini } from "../src/lib/gemini.js";

const FALLBACK = {
  action: "Contact control room for guidance",
  rationale: "AI recommendation unavailable — manual assessment required",
  priority: "Medium",
  eta: "N/A",
};

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === "OPTIONS") { res.statusCode = 204; res.end(); return; }
  if (req.method !== "POST") { res.statusCode = 405; res.end(JSON.stringify({ error: "Method not allowed" })); return; }

  const body = await readBody(req);
  const sectorName = typeof body.sectorName === "string" ? body.sectorName : "Unknown";
  const density = typeof body.density === "number" ? body.density : 0;
  const adjacentDensities = body.adjacentDensities ?? {};
  const activeIncidents = typeof body.activeIncidents === "number" ? body.activeIncidents : 0;
  const activeOperations = Array.isArray(body.activeOperations) ? body.activeOperations as string[] : [];

  const systemPrompt = buildOpsSystemPrompt();
  const userMessage = `Sector "${sectorName}" is at ${density.toFixed(1)}% capacity. Adjacent sectors: ${JSON.stringify(adjacentDensities)}. Active incidents: ${activeIncidents}. Current operations: ${activeOperations.join(", ") || "none"}. What immediate action should staff take?`;

  try {
    const raw = await callGemini(systemPrompt, userMessage);
    const cleaned = raw.replace(/```json?\n?/gi, "").replace(/```/g, "").trim();
    let rec = FALLBACK;
    try {
      const p = JSON.parse(cleaned) as Record<string, unknown>;
      if (typeof p.action === "string" && typeof p.rationale === "string" && typeof p.priority === "string" && typeof p.eta === "string") {
        rec = p as typeof FALLBACK;
      }
    } catch { /* use fallback */ }
    res.statusCode = 200;
    res.end(JSON.stringify({ recommendation: rec }));
  } catch {
    res.statusCode = 200;
    res.end(JSON.stringify({ recommendation: FALLBACK }));
  }
}
