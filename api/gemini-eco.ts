import type { IncomingMessage, ServerResponse } from "http";
import { CORS } from "./_utils.js";
import { buildSustainabilitySystemPrompt, callGemini } from "../src/lib/gemini.js";

export default async function handler(_req: IncomingMessage, res: ServerResponse) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));

  const systemPrompt = buildSustainabilitySystemPrompt();
  try {
    const response = await callGemini(systemPrompt, "Give me one specific eco tip.");
    res.statusCode = 200;
    res.end(JSON.stringify({ tip: response.trim(), realAI: true }));
  } catch {
    res.statusCode = 200;
    res.end(JSON.stringify({
      tip: "Skip the plastic cup — bring your own reusable bottle and refill at any stadium water station for free.",
      realAI: false,
    }));
  }
}
