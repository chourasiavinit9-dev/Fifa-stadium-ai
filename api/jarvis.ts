import type { IncomingMessage, ServerResponse } from "http";
import { readBody, CORS } from "./_utils.js";
import { callGemini } from "../src/lib/gemini.js";

const TELEMETRY = {
  venue: "MetLife Stadium (FIFA 2026 Venue - NY/NJ)",
  capacity: 82500,
  currentOccupancy: 78120,
  securityLevel: "ELEVATED (LEVEL 2)",
};

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === "OPTIONS") { res.statusCode = 204; res.end(); return; }
  if (req.method !== "POST") { res.statusCode = 405; res.end(JSON.stringify({ error: "Method not allowed" })); return; }

  const body = await readBody(req);
  const message = typeof body.message === "string" ? body.message : "";
  if (!message) { res.statusCode = 400; res.end(JSON.stringify({ error: "No message payload received." })); return; }

  const scenario = typeof body.scenario === "string" ? body.scenario : "General stadium monitoring";
  const chatHistory = Array.isArray(body.chatHistory)
    ? (body.chatHistory as Array<{ role: string; content: string }>).slice(-6).map((h) => ({
        role: h.role === "user" ? ("user" as const) : ("model" as const),
        parts: [{ text: h.content }],
      }))
    : [];

  const systemPrompt = `You are AEGIS, the supreme Generative AI Operating System for FIFA World Cup 2026 Smart Stadiums.
You speak like a blend of Tesla autopilot AI and Tony Stark's JARVIS — crisp, calm, professional, cybernetic.
Current stadium: ${TELEMETRY.venue} | Occupancy: ${TELEMETRY.currentOccupancy}/${TELEMETRY.capacity}
Security: ${TELEMETRY.securityLevel}
Current scenario: ${scenario}
Keep answers brief (under 180 words). Offer actionable predictive advice. Structure with bullet points.`;

  try {
    const response = await callGemini(systemPrompt, message, chatHistory);
    res.statusCode = 200;
    res.end(JSON.stringify({ response, realAI: true }));
  } catch {
    const lower = message.toLowerCase();
    let responseText = "[AEGIS ONLINE]\n• Occupancy: 78,120 / 82,500\n• AI Confidence: 99.8%\n• All systems nominal.";
    if (lower.includes("evac") || lower.includes("emergency")) {
      responseText = "[AEGIS CRITICAL ALERT]\n• Primary egress at Gates A, B, D maximised.\n• Gate C restricted — signage pivoted to Gate D.\n• Audio beacons active in Sections 100 & 200.";
    } else if (lower.includes("gate") || lower.includes("crowd")) {
      responseText = "[AEGIS CROWD LAYER]\n• Gate C at 390 p/min — 45-min delay.\n• Smart signage updated → Gate D (3-min wait).";
    }
    res.statusCode = 200;
    res.end(JSON.stringify({ response: responseText, realAI: false }));
  }
}
