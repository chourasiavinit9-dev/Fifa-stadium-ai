import type { IncomingMessage, ServerResponse } from "http";
import { readBody, CORS } from "./_utils.js";
import { buildTransportSystemPrompt, callGemini } from "../src/lib/gemini.js";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === "OPTIONS") { res.statusCode = 204; res.end(); return; }
  if (req.method !== "POST") { res.statusCode = 405; res.end(JSON.stringify({ error: "Method not allowed" })); return; }

  const body = await readBody(req);
  const origin = typeof body.origin === "string" ? body.origin.slice(0, 200) : "";
  const matchInfo = typeof body.matchInfo === "string" ? body.matchInfo.slice(0, 200) : "";

  if (!origin) { res.statusCode = 422; res.end(JSON.stringify({ error: "Origin required" })); return; }

  const systemPrompt = buildTransportSystemPrompt("MetLife Stadium, East Rutherford NJ");
  const userMessage = `I need to travel to MetLife Stadium from ${origin}. ${matchInfo ? `Today's match: ${matchInfo}.` : ""} What is the best transport option? Include shuttle times, estimated journey duration, and parking recommendation.`;

  try {
    const response = await callGemini(systemPrompt, userMessage);
    res.statusCode = 200;
    res.end(JSON.stringify({ response, realAI: true }));
  } catch {
    res.statusCode = 200;
    res.end(JSON.stringify({
      response: "Take the NJ Transit Meadowlands Express from Secaucus Junction (every 15 min, 8-min journey) — the fastest and most reliable option on match day.",
      realAI: false,
    }));
  }
}
