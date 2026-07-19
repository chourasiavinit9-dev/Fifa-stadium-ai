import type { IncomingMessage, ServerResponse } from "http";
import { readBody, CORS } from "./_utils.js";
import {
  buildFanSystemPrompt,
  callGemini,
  getSyntheticFifaIqResponse,
} from "../src/lib/gemini.js";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === "OPTIONS") { res.statusCode = 204; res.end(); return; }
  if (req.method !== "POST") { res.statusCode = 405; res.end(JSON.stringify({ error: "Method not allowed" })); return; }

  const body = await readBody(req);
  const message = typeof body.message === "string" ? body.message.slice(0, 500) : "";
  if (!message) { res.statusCode = 422; res.end(JSON.stringify({ error: "Message required" })); return; }

  const history = Array.isArray(body.history)
    ? (body.history as Array<{ role: "user" | "model"; parts: Array<{ text: string }> }>).slice(-6)
    : [];

  const systemPrompt = buildFanSystemPrompt({
    todaysMatches: [],
    liveMatches: [],
    completedRecent: [],
    sectorDensities: {},
    activeIncidents: 0,
    currentRound: "Final",
    totalGoals: 184,
  });

  try {
    const response = await callGemini(systemPrompt, message, history);
    res.statusCode = 200;
    res.end(JSON.stringify({ response, realAI: true }));
  } catch {
    const response = getSyntheticFifaIqResponse(message, { totalGoals: 184 });
    res.statusCode = 200;
    res.end(JSON.stringify({ response, realAI: false }));
  }
}
