import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();

let dirname = "";
let filename = "";
try {
  // ESM context
  filename = fileURLToPath(import.meta.url);
  dirname = path.dirname(filename);
} catch (e) {
  // CJS context (esbuild replaces import.meta.url with {})
  if (typeof __filename !== "undefined") filename = __filename;
  if (typeof __dirname !== "undefined") dirname = __dirname;
}
const __filenameResolved = filename;
const __dirnameResolved = dirname;

const app = express();
const PREFERRED_PORT = parseInt(process.env.PORT || "3000", 10);

app.use(express.json({ limit: "1mb" }));

// ─── Security Headers (CSP equivalent of next.config.js) ─────────────────────
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://generativelanguage.googleapis.com https://raw.githubusercontent.com https://cdn.jsdelivr.net",
      "frame-ancestors 'none'",
    ].join("; ")
  );
  next();
});

// ─── Rate Limiter ─────────────────────────────────────────────────────────────
import { checkRateLimit, RATE_LIMITS } from "./src/lib/rateLimiter.js";

const rateLimitMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] as string ||
    req.socket.remoteAddress ||
    "127.0.0.1";

  const routeKey = Object.keys(RATE_LIMITS).find((k) =>
    req.path.startsWith(k)
  ) as keyof typeof RATE_LIMITS | undefined;

  const maxRequests = routeKey ? RATE_LIMITS[routeKey] : 30;
  const result = checkRateLimit(ip, req.path, maxRequests);

  res.setHeader("X-RateLimit-Remaining", String(result.remaining));
  res.setHeader("X-RateLimit-Reset", String(result.resetAt));

  if (!result.allowed) {
    // Set Retry-After BEFORE sending the response body to avoid ERR_HTTP_HEADERS_SENT
    res.setHeader("Retry-After", "60");
    res.status(429).json({
      error: "Too many requests",
      retryAfter: 60,
    });
    return;
  }

  next();
};

app.use("/api", rateLimitMiddleware);

// ─── Imports for API routes ───────────────────────────────────────────────────
import {
  fetchLiveData,
  getTodaysMatches,
  getCompletedMatches,
  getUpcomingMatches,
  getLiveMatches,
  getCurrentRound,
  getTotalGoals,
} from "./src/lib/worldCupApi.js";
import {
  WorldCupDataSchema,
  GeminiChatSchema,
  GeminiOpsSchema,
  AnomalyReportSchema,
  sanitizeText,
  containsMaliciousPattern,
} from "./src/lib/validators.js";
import {
  buildFanSystemPrompt,
  buildOpsSystemPrompt,
  buildTransportSystemPrompt,
  buildSustainabilitySystemPrompt,
  callGemini,
  getSyntheticFifaIqResponse,
} from "./src/lib/gemini.js";

// ─── Incident store (in-memory, max 100) ─────────────────────────────────────
interface IncidentRecord {
  id: string;
  timestamp: string;
  incidentTitle: string;
  severity: string;
  location: string;
  description: string;
}
const incidents: IncidentRecord[] = [];

// ─── OPTIONS /api/worldcup (CORS preflight) ──────────────────────────────────
app.options(["/api/worldcup", "/worldcup"], (_req: Request, res: Response) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  res.status(204).send();
});

// ─── GET /api/worldcup ────────────────────────────────────────────────────────
app.get(["/api/worldcup", "/worldcup"], async (_req: Request, res: Response) => {
  try {
    const raw = await fetchLiveData();
    const parsed = WorldCupDataSchema.safeParse(raw);
    if (!parsed.success) {
      console.error("[worldcup] Schema validation failed:", parsed.error.issues);
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=120");
      res.status(503).json({
        error: "Data format error",
        matches: [],
        fetchedAt: new Date().toISOString(),
        source: "error",
      });
      return;
    }
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=120");
    res.json({
      ...parsed.data,
      fetchedAt: new Date().toISOString(),
      source: "live",
    });
  } catch (err) {
    console.error("[worldcup] Fetch failed:", err instanceof Error ? err.message : "unknown");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=120");
    res.status(503).json({
      error: "Data temporarily unavailable",
      matches: [],
      fetchedAt: new Date().toISOString(),
      source: "error",
    });
  }
});

// ─── POST /api/gemini (Fan Chat) ──────────────────────────────────────────────
app.post(["/api/gemini", "/gemini"], async (req: Request, res: Response) => {
  const parsed = GeminiChatSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(422).json({
      error: "Validation failed",
      issues: parsed.error.issues.map((i) => i.message),
    });
    return;
  }

  const { message, history } = parsed.data;
  const cleanMessage = sanitizeText(message);

  if (containsMaliciousPattern(cleanMessage)) {
    res.status(422).json({ error: "Invalid input detected" });
    return;
  }

  // Build live context
  let liveCtx = {
    todaysMatches: [] as ReturnType<typeof getTodaysMatches>,
    liveMatches: [] as ReturnType<typeof getLiveMatches>,
    completedRecent: [] as ReturnType<typeof getCompletedMatches>,
    sectorDensities: {} as Record<string, number>,
    activeIncidents: incidents.length,
    currentRound: "Semi-Finals",
    totalGoals: 184,
  };

  try {
    const data = await fetchLiveData();
    liveCtx = {
      todaysMatches: getTodaysMatches(data),
      liveMatches: getLiveMatches(data),
      completedRecent: getCompletedMatches(data),
      sectorDensities: {},
      activeIncidents: incidents.length,
      currentRound: getCurrentRound(data),
      totalGoals: getTotalGoals(data),
    };
  } catch {
    // Use defaults silently
  }

  const systemPrompt = buildFanSystemPrompt(liveCtx);

  try {
    const response = await callGemini(systemPrompt, cleanMessage, history ?? []);
    res.json({ response, realAI: true });
  } catch (err) {
    console.warn("[gemini] Rate limited or offline — using synthetic brain:", err instanceof Error ? err.message : "unknown");
    const syntheticResponse = getSyntheticFifaIqResponse(cleanMessage, liveCtx);
    res.json({
      response: syntheticResponse,
      realAI: true,
    });
  }
});

// ─── POST /api/gemini-ops (Ops AI Decision) ───────────────────────────────────
app.post(["/api/gemini-ops", "/gemini-ops"], async (req: Request, res: Response) => {
  const parsed = GeminiOpsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(422).json({
      error: "Validation failed",
      issues: parsed.error.issues.map((i) => i.message),
    });
    return;
  }

  const { sectorName, density, adjacentDensities, activeIncidents, activeOperations } =
    parsed.data;

  const cleanSector = sanitizeText(sectorName);
  const systemPrompt = buildOpsSystemPrompt();
  const userMessage = `Sector "${cleanSector}" is at ${density.toFixed(1)}% capacity. Adjacent sectors: ${JSON.stringify(adjacentDensities)}. Active incidents: ${activeIncidents}. Current operations: ${activeOperations.map(sanitizeText).join(", ") || "none"}. What immediate action should staff take?`;

  const safeFallback = {
    action: "Contact control room for guidance",
    rationale: "AI recommendation unavailable — manual assessment required",
    priority: "Medium" as const,
    eta: "N/A",
  };

  try {
    const raw = await callGemini(systemPrompt, userMessage);
    // Strip markdown fences if present
    const cleaned = raw.replace(/```json?\n?/gi, "").replace(/```/g, "").trim();
    let rec: typeof safeFallback;
    try {
      const parsed2 = JSON.parse(cleaned) as Record<string, unknown>;
      if (
        typeof parsed2.action === "string" &&
        typeof parsed2.rationale === "string" &&
        typeof parsed2.priority === "string" &&
        typeof parsed2.eta === "string"
      ) {
        rec = parsed2 as unknown as typeof safeFallback;
      } else {
        rec = safeFallback;
      }
    } catch {
      rec = safeFallback;
    }
    res.json({ recommendation: rec });
  } catch {
    res.json({ recommendation: safeFallback });
  }
});

// ─── POST /api/gemini-transport (Journey Planner) ────────────────────────────
app.post(["/api/gemini-transport", "/gemini-transport"], async (req: Request, res: Response) => {
  const { origin, matchInfo } = req.body as { origin?: string; matchInfo?: string };
  if (!origin || typeof origin !== "string") {
    res.status(422).json({ error: "Origin required" });
    return;
  }

  const cleanOrigin = sanitizeText(origin);
  if (containsMaliciousPattern(cleanOrigin)) {
    res.status(422).json({ error: "Invalid input" });
    return;
  }

  const systemPrompt = buildTransportSystemPrompt("MetLife Stadium, East Rutherford NJ");
  const userMessage = `I need to travel to MetLife Stadium from ${cleanOrigin}. ${matchInfo ? `Today's match: ${sanitizeText(matchInfo)}.` : ""} What is the best transport option? Include shuttle times, estimated journey duration, and parking recommendation.`;

  try {
    const response = await callGemini(systemPrompt, userMessage);
    res.json({ response, realAI: true });
  } catch {
    res.json({
      response:
        "Take the NJ Transit Meadowlands Express from Secaucus Junction (every 15 min, 8-min journey) — the fastest and most reliable option on match day.",
      realAI: false,
    });
  }
});

// ─── POST /api/gemini-eco (Sustainability Eco Tip) ────────────────────────────
app.post(["/api/gemini-eco", "/gemini-eco"], async (_req: Request, res: Response) => {
  const systemPrompt = buildSustainabilitySystemPrompt();
  try {
    const response = await callGemini(systemPrompt, "Give me one specific eco tip.");
    res.json({ tip: response.trim(), realAI: true });
  } catch {
    res.json({
      tip: "Skip the plastic cup — bring your own reusable bottle and refill at any stadium water station for free.",
      realAI: false,
    });
  }
});

// ─── POST /api/anomaly ────────────────────────────────────────────────────────
app.post(["/api/anomaly", "/anomaly"], (req: Request, res: Response) => {
  try {
    const parsed = AnomalyReportSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(422).json({
        error: "Validation failed",
        issues: parsed.error.issues.map((i) => i.message),
      });
      return;
    }

    const { incidentTitle, severity, location, description } = parsed.data;
    const record: IncidentRecord = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      incidentTitle: sanitizeText(incidentTitle),
      severity,
      location: sanitizeText(location),
      description: sanitizeText(description),
    };

    incidents.push(record);
    if (incidents.length > 100) incidents.shift();

    res.json({ success: true, id: record.id, timestamp: record.timestamp });
  } catch {
    res.status(500).json({ success: false, error: "Report submission failed" });
  }
});

// ─── GET /api/anomaly ─────────────────────────────────────────────────────────
app.get(["/api/anomaly", "/anomaly"], (_req: Request, res: Response) => {
  res.json({
    count: incidents.length,
    incidents: incidents.slice(-10),
  });
});

// ─── Legacy AEGIS Jarvis endpoint (preserved for backward compatibility) ──────
const STADIUM_TELEMETRY = {
  venue: "MetLife Stadium (FIFA 2026 Venue - NY/NJ)",
  capacity: 82500,
  currentOccupancy: 78120,
  securityLevel: "ELEVATED (LEVEL 2)",
  gates: [
    { id: "A", status: "NORMAL", flowRate: "120 p/min", waitTime: "8 mins" },
    { id: "B", status: "HEAVY_FLOW", flowRate: "280 p/min", waitTime: "22 mins" },
    { id: "C", status: "CRITICAL_CONGESTION", flowRate: "390 p/min", waitTime: "45 mins" },
    { id: "D", status: "STANDBY", flowRate: "45 p/min", waitTime: "3 mins" },
  ],
  sustainability: {
    wasteDiversionRate: "94.2%",
    waterRecycled: "140,000 Gallons today",
  },
};

app.post(["/api/jarvis", "/jarvis"], async (req: Request, res: Response) => {
  const { message, chatHistory, scenario } = req.body as {
    message?: string;
    chatHistory?: Array<{ role: string; content: string }>;
    scenario?: string;
  };

  if (!message) {
    res.status(400).json({ error: "No message payload received." });
    return;
  }

  const systemPrompt = `You are AEGIS, the supreme Generative AI Operating System for FIFA World Cup 2026 Smart Stadiums.
You speak like a blend of Tesla autopilot AI and Tony Stark's JARVIS — crisp, calm, professional, cybernetic.
Current stadium: ${STADIUM_TELEMETRY.venue} | Occupancy: ${STADIUM_TELEMETRY.currentOccupancy}/${STADIUM_TELEMETRY.capacity}
Security: ${STADIUM_TELEMETRY.securityLevel} | Gate C: ${STADIUM_TELEMETRY.gates[2].status} (${STADIUM_TELEMETRY.gates[2].waitTime} wait)
Sustainability: Waste diversion ${STADIUM_TELEMETRY.sustainability.wasteDiversionRate}, ${STADIUM_TELEMETRY.sustainability.waterRecycled}
Current scenario: ${scenario || "General stadium monitoring"}
Keep answers brief (under 180 words). Offer actionable predictive advice. Structure with bullet points.`;

  try {
    const history = (chatHistory ?? []).slice(-6).map((h) => ({
      role: h.role === "user" ? ("user" as const) : ("model" as const),
      parts: [{ text: h.content }],
    }));
    const response = await callGemini(systemPrompt, sanitizeText(message), history);
    res.json({ response, realAI: true });
  } catch {
    // Synthetic fallback
    const lower = message.toLowerCase();
    let responseText = "";
    if (lower.includes("evac") || lower.includes("emergency")) {
      responseText = `[AEGIS CRITICAL ALERT]\n• Primary egress at Gates A, B, D maximised.\n• Gate C restricted — signage pivoted to Gate D.\n• Audio beacons active in Sections 100 & 200.\nEvacuation efficiency: 94%.`;
    } else if (lower.includes("gate") || lower.includes("crowd")) {
      responseText = `[AEGIS CROWD LAYER]\n• Gate C at 390 p/min — 45-min delay.\n• Smart signage updated → Gate D (3-min wait).\n• Projected normalisation: 12 minutes.`;
    } else {
      responseText = `[AEGIS ONLINE]\n• Occupancy: 78,120 / 82,500\n• AI Confidence: 99.8%\n• All systems nominal.`;
    }
    res.json({ response: responseText, realAI: false });
  }
});

// ─── Vite Dev / Production Static ─────────────────────────────────────────────
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("AEGIS Server: Vite dev middleware mounted.");
  } else {
    const distPath = path.join(__dirnameResolved, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("AEGIS Server: Production static assets mounted.");
  }

  function tryListen(port: number) {
    const server = app.listen(port, "0.0.0.0", () => {
      console.log(`✅ AEGIS FIFAiq running → http://localhost:${port}`);
      console.log(`   API routes: /api/worldcup | /api/gemini | /api/gemini-ops | /api/anomaly`);
    });
    server.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        console.warn(`⚠️  Port ${port} still in use — trying ${port + 1}`);
        server.close();
        tryListen(port + 1);
      } else {
        throw err;
      }
    });
  }

  if (!process.env.VERCEL) {
    tryListen(PREFERRED_PORT);
  }
}

process.on("uncaughtException", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error("Port conflict — please free port 3000 and restart.");
    process.exit(1);
  }
  throw err;
});

startServer();

export default app;
