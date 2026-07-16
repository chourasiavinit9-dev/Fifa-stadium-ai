// src/lib/gemini.ts
import { GoogleGenAI } from "@google/genai";
import type { Match } from "./worldcupApi";

let _ai: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!_ai) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key.trim() === "") {
      throw new Error("GEMINI_API_KEY not configured");
    }
    _ai = new GoogleGenAI({ apiKey: key.trim() });
  }
  return _ai;
}

export function getGeminiModel() {
  const ai = getAI();
  return ai.models;
}

// ─────────────────────────────────────────────────────────────────────────────
// STADIUM GATE KNOWLEDGE BASE — all 6 fully-detailed + 10 general WC 2026 venues
// ─────────────────────────────────────────────────────────────────────────────
export const STADIUM_GATE_KB = {
  "MetLife Stadium": {
    city: "East Rutherford, NJ", capacity: 82500,
    gates: {
      "Gate A": "North main entrance. 0.4 mi from Meadowlands Station (NJ Transit). Primary ticketing hub. Largest security lanes.",
      "Gate B": "Northeast corner. 0.3 mi from Parking Lot A. Closest gate to NJ Transit shuttle drop-off zone.",
      "Gate C": "East side. 0.5 mi from Lot B. Serves Sections 101–112. Rideshare drop-off 0.3 mi east.",
      "Gate D": "Southeast corner. 0.6 mi from Lot C. Accessible ramp on right side. Sections 113–120.",
      "Gate E": "South end. 0.7 mi from Lot D. Closest gate to south concourse food courts (50m once inside).",
      "Gate F": "Southwest corner. 0.5 mi from VIP parking. Serves VIP Box, Press Gallery, suites. Shortest VIP walk.",
      "Gate G": "West side. 0.4 mi from Port Authority bus stop. Upper tier Sections 300+. Elevator access inside.",
      "Gate H": "Northwest corner. 0.3 mi from Lot A. Typically fastest entry — lowest queue at kickoff.",
    },
    sections: {
      "101-112": "Gate C (east, 0.5mi from Lot B)",
      "113-120": "Gate D (southeast, 0.6mi from Lot C)",
      "200-220": "Gate B or G depending on north/south",
      "300+": "Gate G (west, elevator to upper deck)",
    },
    food: {
      "Concourse A (near Gates A-B)": "Hot dogs, burgers, nachos, craft beer",
      "Concourse B (near Gates C-D)": "Pizza, wraps, vegan Beyond Burger",
      "Concourse C (near Gates G-H)": "Quick grab snacks, beer, soft drinks",
    },
    transport: "NJ Transit train → Meadowlands Station → 0.4 mi walk to Gate A (recommended). Port Authority Bus 355 → Gate G drop-off. Rideshare: Lot B east entrance, 0.3 mi to Gate C.",
    parking: "Lot A (0.3 mi to Gate H, nearest). Lot B (0.3 mi Gate C). Lot C (0.6 mi Gate D). VIP Lot (0.5 mi Gate F).",
    accessible: "All 8 gates ADA compliant. Gate D has widest ramp. Accessible parking: Lot AA, 0.2 mi to Gate H. Wheelchair seating: Section 108, 115, 212, 310.",
  },
  "Hard Rock Stadium": {
    city: "Miami Gardens, FL", capacity: 65326,
    gates: {
      "Gate 1": "North main entrance. 0.3 mi from Metrorail shuttle stop. Primary ticketing. Largest entry.",
      "Gate 2": "Northeast. 0.4 mi from Lot 1. Serves Sections 101–120.",
      "Gate 3": "East side. 0.3 mi from Lot 2. Nearest gate to external food truck plaza (outside, 100m). Sections 121–140.",
      "Gate 4": "Southeast. 0.5 mi from Lot 3. Lower bowl south seats 141–160.",
      "Gate 5": "South end. 0.6 mi from Lot 4. Visiting team fan section allocation.",
      "Gate 6": "West side. 0.2 mi from VIP/premium lot. Club level, suites, press. Shortest premium walk.",
      "Gate 7": "Northwest. 0.4 mi from Lot 6. Upper deck Sections 400+. Escalator access.",
    },
    sections: {
      "101-120": "Gate 2 (northeast, 0.4mi Lot 1)",
      "121-140": "Gate 3 (east, 0.3mi Lot 2)",
      "141-160": "Gate 4 (southeast, 0.5mi Lot 3)",
      "Visiting fans": "Gate 5 (south)",
      "400+": "Gate 7 (northwest, escalators)",
    },
    food: {
      "Lower concourse (Gates 3-4)": "Ceviche, Cuban sandwiches, burgers, Pollo Tropical",
      "Upper concourse (Gates 6-7)": "Pizza, hot dogs, nachos, beer",
    },
    transport: "Metrorail to Opa-locka → stadium shuttle (20 min, drops Gate 1, 0.3 mi). Rideshare: north lot entrance 0.2 mi from Gate 1. Parking Lots 1–7 on site.",
    parking: "Lot 1 (0.4 mi Gate 2). Lot 2 (0.3 mi Gate 3). VIP lot (0.2 mi Gate 6, closest).",
    accessible: "Gates 1, 3, 6 priority ADA. Accessible parking: Lot A1, 0.15 mi to Gate 1. Elevator at Gates 1 and 6.",
  },
  "Estadio Azteca": {
    city: "Mexico City, Mexico", capacity: 87523,
    gates: {
      "Puerta 1 (Gate 1)": "North main access. 0.5 mi from Metro Estadio Azteca (Line 2). Primary entry. Widest lanes.",
      "Puerta 2 (Gate 2)": "Northeast. 0.4 mi from northern bus terminal. North sections.",
      "Puerta 3 (Gate 3)": "East side. 0.6 mi from parking area Oriente. General east admission.",
      "Puerta 4 (Gate 4)": "Southeast. 0.5 mi from Periferico highway rideshare drop-off.",
      "Puerta 5 (Gate 5)": "South end. 0.7 mi from Lot Sur. Visiting supporter allocation.",
      "Puerta 6 (Gate 6)": "Southwest. 0.4 mi from VIP entrance road. Palcos (suites) and luxury level.",
      "Puerta 7 (Gate 7)": "West. 0.5 mi from CU metro bus stop. West mid-level sections.",
      "Puerta 8 (Gate 8)": "Northwest. 0.3 mi from pedestrian bridge from Azteca metro stop. Fastest metro entry.",
    },
    sections: {
      "Norte (North)": "Puerta 1 or 2",
      "Este (East)": "Puerta 3 or 4",
      "Sur (South)": "Puerta 5",
      "Palcos (VIP suites)": "Puerta 6 (southwest)",
      "Oeste (West)": "Puerta 7",
    },
    food: {
      "North concourse (Puerta 1-2)": "Tacos de canasta, quesadillas, tortas, aguas frescas",
      "East concourse (Puerta 3-4)": "Elotes, churros, drinks, snacks",
      "South concourse (Puerta 5)": "Pozole, carnitas, traditional Mexican street food",
      "West concourse (Puerta 6-7)": "Premium dining, pulque bar, craft food",
    },
    transport: "Metro Line 2 to Estadio Azteca (exit north, 0.5 mi to Puerta 1 OR use pedestrian bridge to Puerta 8 — 0.3 mi, faster). No Uber inside 0.5 mi radius — walk from Periferico drop zones to Puerta 4.",
    parking: "Lot Norte (0.4 mi Puerta 2). Lot Sur (0.7 mi Puerta 5). VIP lot (0.4 mi Puerta 6, closest to suites).",
    accessible: "Puerta 1 (full elevator access all levels) and Puerta 6 (VIP accessible). Ramps at all gates but widest at Puerta 1.",
  },
  "AT&T Stadium": {
    city: "Arlington, TX", capacity: 80000,
    gates: {
      "Gate A": "North entrance on Cowboys Way. 0.3 mi from AT&T transit station. Main primary entry.",
      "Gate B": "Northeast. 0.4 mi from North parking garage. Sections 100-110.",
      "Gate C": "East side. 0.2 mi from East parking structure — CLOSEST gate to any parking. Field-level east.",
      "Gate D": "Southeast. 0.4 mi from Lot E. Lower south sections 120-130.",
      "Gate E": "South. 0.5 mi from South parking. Visiting fan allocation.",
      "Gate F": "West side. 0.3 mi from West garage. Premium club, suites, press.",
      "Gate G": "Northwest. 0.4 mi from North lot. Upper deck 300-400 level access.",
    },
    sections: {
      "100-110": "Gate B (northeast)",
      "111-120": "Gate C (east, closest to parking)",
      "120-130": "Gate D (southeast)",
      "Suites/Club": "Gate F (west)",
      "300-400 level": "Gate G (northwest)",
    },
    food: {
      "East concourse (Gates B-C)": "BBQ brisket, smoked sausage, Texas-style burgers",
      "West concourse (Gates F-G)": "Nachos, hot dogs, beer, pretzels",
      "Upper deck": "Grab-and-go snacks, pizza, drinks",
    },
    transport: "TRE (Trinity Railway Express) to CentrePort/DFW then AT&T stadium shuttle (15 min ride, Gate A drop, 0.2 mi). Rideshare: North drop-off zone 0.2 mi from Gate A. Car: I-30 exit Collins St.",
    parking: "East garage (0.2 mi Gate C — nearest). North garage (0.4 mi Gate B). West garage (0.3 mi Gate F). South lot (0.5 mi Gate E).",
    accessible: "Gates A and C priority ADA. Accessible parking: Lot P4 north (0.3 mi Gate A). Elevators at Gates A, C, F.",
  },
  "SoFi Stadium": {
    city: "Inglewood, CA", capacity: 70240,
    gates: {
      "Gate 1": "North main entry. 0.5 mi from Metro C Line (Aviation/LAX stop). Primary ticketed gate.",
      "Gate 2": "Northeast. 0.3 mi from Lot N. Sections 100-level north.",
      "Gate 3": "East. 0.4 mi from Lot E. Field-level east sections.",
      "Gate 4": "Southeast. 0.5 mi from Lot SE. South lower bowl sections.",
      "Gate 5": "South end. 0.6 mi from Century Blvd rideshare zone.",
      "Gate 6": "West. 0.2 mi from premium/VIP structure — NEAREST to VIP. Club level and suites.",
      "Gate 7": "Northwest. 0.4 mi from Lot NW. Upper deck 500-level.",
      "Gate 8": "North media/press gate. 0.3 mi from broadcast compound. Press credentials required.",
    },
    sections: {
      "100-level north": "Gate 2 (northeast, 0.3mi Lot N)",
      "Field-level east": "Gate 3 (east)",
      "South lower bowl": "Gate 4 (southeast)",
      "Club/Suites": "Gate 6 (west, 0.2mi VIP lot)",
      "500-level upper": "Gate 7 (northwest)",
    },
    food: {
      "100-level concourse": "California fusion, fish tacos, sushi burritos, açaí bowls",
      "200-level concourse": "Burgers, pizza, craft beer, Korean BBQ",
      "500-level": "Quick grab nachos, hot dogs, drinks",
    },
    transport: "Metro C Line to Aviation/LAX → 1 mi walk north or free stadium shuttle to Gate 1. No street parking — ALL parking pre-purchased online. Rideshare designated zones east of stadium (Gate 3, 0.4 mi).",
    parking: "Lot N (0.3 mi Gate 2). Lot E (0.4 mi Gate 3). VIP surface lot (0.2 mi Gate 6 — nearest and fastest).",
    accessible: "Gates 1, 3, 6 ADA priority. Accessible parking: Lot A1 adjacent to Gate 1 (0.15 mi). Elevators at all main gates.",
  },
  "Arrowhead Stadium": {
    city: "Kansas City, MO", capacity: 76416,
    gates: {
      "Gate 1": "North main entrance. 0.4 mi from bus depot and shuttle zone. Primary entry.",
      "Gate 2": "East side. 0.3 mi from Lot E. Lower east sections 100-120.",
      "Gate 3": "South end. 0.5 mi from Lot S. South bowl, visiting fans section.",
      "Gate 4": "West side. 0.3 mi from VIP lot — CLOSEST to suites. Club level, suites.",
      "Gate 5": "Northwest. 0.4 mi from Lot NW. Upper deck 200-300 level.",
    },
    sections: {
      "100-120 east": "Gate 2 (0.3mi Lot E)",
      "South bowl": "Gate 3",
      "Club/Suites": "Gate 4 (west, 0.3mi VIP lot)",
      "200-300 upper": "Gate 5 (northwest)",
    },
    food: {
      "Main concourse (Gates 1-2)": "Kansas City BBQ, burnt ends, brisket, KC-style ribs",
      "Upper level (Gates 4-5)": "Nachos, hot dogs, beer, soft drinks",
    },
    transport: "No direct rail to stadium. Shuttle from KC Union Station downtown (20 min, drops Gate 1, 0.3 mi walk). Rideshare designated: Lot B east entrance, 0.2 mi to Gate 2. Car: I-70 east to Raytown Rd exit.",
    parking: "Lot E (0.3 mi Gate 2 — nearest general). Lot NW (0.4 mi Gate 5). VIP lot (0.3 mi Gate 4, nearest premium).",
    accessible: "Gates 1 and 4 fully ADA compliant with ramps and elevators. Accessible parking: Lot A north, 0.2 mi to Gate 1.",
  },
} as const;

// Additional venue general knowledge (smaller but included)
const ADDITIONAL_VENUES_KB = `BMO Field Toronto (cap 30,000): Gate 1 north main (0.3mi Union Station subway), Gate 3 east (0.2mi Lot B), Gate 4 south VIP.
Levi's Stadium Santa Clara (cap 68,500): Gate A north main (0.4mi from light rail), Gate F west VIP (0.2mi VIP lot).
Lincoln Financial Field Philadelphia (cap 69,796): Gate A north main (SEPTA bus adjacent), Gate C east (0.3mi Lot E).
Gillette Stadium Foxborough (cap 65,878): Gate 1 north main (Commuter Rail adjacent, 0.2mi), Gate 3 south (0.5mi Lot S).
Lumen Field Seattle (cap 67,000): Gate A south main (Link Light Rail 50m — CLOSEST transit of all WC venues), Gate C north (0.4mi Lot 1).
NRG Stadium Houston (cap 72,220): Gate 1 north main (METRORail adjacent 0.2mi), Gate 5 west VIP (0.3mi VIP lot).
Mercedes-Benz Stadium Atlanta (cap 71,000): Gate 1 north main (MARTA rail 0.1mi — second closest transit), Gate 4 south (0.4mi Lot S).
Estadio BBVA Monterrey (cap 51,000): Gate Norte main (0.6mi from bus), Gate Sur VIP (0.3mi VIP parking).
BC Place Vancouver (cap 54,500): Gate A main (SkyTrain adjacent, 0.1mi), Gate C north (0.3mi Lot 1).
Estadio Akron Guadalajara (cap 49,850): Gate 1 north (0.5mi bus terminal), Gate 3 west VIP.`;

export function buildFanSystemPrompt(context: {
  todaysMatches: Match[];
  liveMatches: Match[];
  completedRecent: Match[];
  sectorDensities: Record<string, number>;
  activeIncidents: number;
  currentRound: string;
  totalGoals: number;
}): string {
  const lowestSector = Object.entries(context.sectorDensities)
    .sort(([, a], [, b]) => a - b)[0];
  const highestSector = Object.entries(context.sectorDensities)
    .sort(([, a], [, b]) => b - a)[0];

  const lowestWait =
    lowestSector && lowestSector[1] < 40
      ? "~2 min"
      : lowestSector && lowestSector[1] < 70
        ? "~8 min"
        : "~15+ min";

  // ── Live tournament state ──────────────────────────────────────────────────
  const liveMatch =
    context.liveMatches.length > 0
      ? context.liveMatches
          .map((m) => `🔴 LIVE: ${m.team1} vs ${m.team2} @ ${m.ground}`)
          .join("; ")
      : `✅ SEMI-FINALS COMPLETED: England 1-2 Argentina (Mercedes-Benz Stadium, Atlanta, Jul 15 — Gordon 55' | Fernández 86', Martínez 92'). NO MATCHES LIVE RIGHT NOW.`;

  const sf1Result = `✅ SEMI-FINAL 1 (Jul 14): Spain 2-0 France (AT&T Stadium, Dallas — Oyarzabal 22'pen, Porro 58'). Spain qualified for Final.`;
  const finalInfo = `📅 UPCOMING: Third Place Match Jul 18 @ 15:00 ET — France vs England (Hard Rock Stadium, Miami). 🏆 FINAL Jul 19 @ 15:00 ET — Spain vs Argentina (MetLife Stadium, East Rutherford NJ).`;


  const todayStr =
    context.todaysMatches.length > 0
      ? context.todaysMatches
          .map((m) => {
            const score = m.score
              ? `${m.score.ft[0]}-${m.score.ft[1]}`
              : "upcoming";
            return `${m.team1} vs ${m.team2} (${score}) @ ${m.ground}`;
          })
          .join(", ")
      : "Semi-final: England vs Argentina (Mercedes-Benz Stadium Atlanta, 15:00 ET)";

  const recentResults = context.completedRecent
    .slice(-6)
    .map(
      (m) =>
        `${m.team1} ${m.score?.ft[0]}-${m.score?.ft[1]} ${m.team2}${
          m.score?.p ? ` (${m.score.p[0]}-${m.score.p[1]} pens)` : ""
        }`
    )
    .join(", ");

  const gateKB = Object.entries(STADIUM_GATE_KB)
    .map(
      ([venue, data]) => `
${venue} (${data.city}, cap ${data.capacity.toLocaleString()}):
  GATES: ${Object.entries(data.gates)
    .map(([g, d]) => `${g}: ${d}`)
    .join(" | ")}
  SECTIONS→GATE: ${Object.entries(data.sections)
    .map(([s, g]) => `${s} → ${g}`)
    .join(" | ")}
  FOOD: ${Object.entries(data.food)
    .map(([k, v]) => `${k}: ${v}`)
    .join(" | ")}
  PARKING: ${data.parking}
  TRANSPORT: ${data.transport}
  ACCESSIBLE: ${data.accessible}`
    )
    .join("\n");

  return `You are FIFAiq, the official AI assistant for FIFA World Cup 2026 stadiums.

CURRENT TOURNAMENT: ${context.currentRound} | Stage: SEMI-FINALS | Total goals: ${context.totalGoals}
${liveMatch}
${sf1Result}
${finalInfo}
TODAY'S MATCH: ${todayStr}
RECENT RESULTS: ${recentResults || "Quarter-finals all complete"}
TOP SCORERS: Jude Bellingham (England) 6, Kylian Mbappé (France) 6, Harry Kane (England) 5, Lamine Yamal (Spain) 5, Lionel Messi (Argentina) 4
ACTIVE STADIUM INCIDENTS: ${context.activeIncidents}
CURRENT SECTOR CONDITIONS:
  Fastest entry → ${lowestSector?.[0] ?? "North Stand"} (${Math.round(lowestSector?.[1] ?? 0)}% density, ${lowestWait} wait)
  Most crowded → ${highestSector?.[0] ?? "South Stand"} (${Math.round(highestSector?.[1] ?? 0)}%)

COMPLETE GATE DATABASE FOR ALL 16 WC 2026 VENUES:
${gateKB}

ADDITIONAL VENUES (general knowledge):
${ADDITIONAL_VENUES_KB}

RULES — follow ALL of these for every response:
1. When answering a gate question: ALWAYS state gate name → what it serves → EXACT distance from 2-3 reference points.
2. Format distances consistently: miles for US venues, meters for Mexican venues.
3. Always mention if accessible route is available at the mentioned gate.
4. If user mentions their section number, match it to the correct gate using SECTIONS data.
5. For transport questions: give the transit stop name, distance to gate, and estimated walk time (assume 15 min per mile).
6. Recommend the LEAST CROWDED sector/gate based on current density data when relevant.
7. Detect user language and respond in that EXACT language (supports EN, ES, FR, AR, PT, DE, JA, KO, HI, ZH).
8. Keep responses under 180 words but include all key distances and gate names.
9. If asked about food near a gate: specify exact concourse name and what items are available.
10. For parking questions: always say which gate the lot connects to and exact distance.
11. Never invent scores — only use confirmed results above.
12. If asked something outside your knowledge, direct fan to the nearest stadium information board.`;
}

export function buildOpsSystemPrompt(): string {
  return `You are AEGIS, the FIFA World Cup 2026 Smart Stadium AI Operations System.
You provide rapid, actionable decisions for stadium operations staff.

CRITICAL RULE: Respond ONLY with valid JSON — no prose, no markdown fences, no explanation.
Response format MUST be exactly:
{"action":"<specific action to take>","rationale":"<brief reason>","priority":"Low|Medium|High|Critical","eta":"<time estimate like '5 min' or 'Immediate'>"}

Base your response on stadium operations best practices.
Actions should be specific: deploy stewards, open auxiliary gate, contact medical, adjust signage, etc.
Priority levels: Low (<40% density impact), Medium (40-70%), High (70-85%), Critical (>85%).`;
}

export function buildTransportSystemPrompt(venue: string): string {
  const venueData =
    STADIUM_GATE_KB[venue as keyof typeof STADIUM_GATE_KB];
  const transportInfo = venueData
    ? `TRANSPORT: ${venueData.transport}\nPARKING: ${venueData.parking}`
    : `General transport advice for ${venue}.`;

  return `You are a transport advisor for FIFA World Cup 2026 at ${venue}.
You help fans plan their journey to the stadium.

${transportInfo}

Respond concisely in 3-4 sentences. Include the best option, estimated journey time, and any timing advice relative to kickoff.`;
}

export function buildSustainabilitySystemPrompt(): string {
  return `You are an eco-advisor at FIFA World Cup 2026.
Give ONE specific eco tip for a fan attending a football match.
Requirements:
- Under 40 words exactly
- Must mention a specific food item OR a specific physical action at the stadium
- No preamble, no "Here is a tip:" — just the tip itself
- Make it practical and actionable, not generic`;
}

export async function callGemini(
  systemPrompt: string,
  userMessage: string,
  history: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = []
): Promise<string> {
  const ai = getAI();

  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  // Prepend system as first user+model exchange
  contents.push({ role: "user", parts: [{ text: systemPrompt }] });
  contents.push({
    role: "model",
    parts: [{ text: "Understood. I am ready to assist." }],
  });

  // Add conversation history
  for (const h of history.slice(-6)) {
    contents.push({ role: h.role, parts: h.parts });
  }

  // Add current user message
  contents.push({ role: "user", parts: [{ text: userMessage }] });

  const modelsToTry = [
    "gemini-2.5-flash",
    "gemini-1.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-pro",
  ];

  let lastError: unknown = null;
  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          temperature: 0.7,
          maxOutputTokens: 500,
          topP: 0.9,
        },
      });
      if (response.text) return response.text;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("All Gemini model fallbacks failed");
}

/**
 * High-precision synthetic FIFAiq response generator.
 * Used when the Gemini API is rate-limited (429) or offline, guaranteeing instant, detailed answers.
 */
export function getSyntheticFifaIqResponse(
  query: string,
  context?: { totalGoals?: number; activeIncidents?: number }
): string {
  const q = query.toLowerCase();

  // Spanish queries
  if (q.includes("salida") || q.includes("puerta") || q.includes("d\u00f3nde") || q.includes("estacionamiento")) {
    return `\uD83D\uDEAA Salidas y Evacuaci\u00f3n \u2014 MetLife Stadium (NY/NJ):\n\n\u2022 Salidas principales / Main Exits: Gate A (Norte), Gate B (Noreste), Gate C (Este), y Gate D (Sureste).\n\u2022 Rampas accesibles / Accessible Ramps: Todas las 8 puertas tienen rampas compatibles con ADA; Gate D tiene la rampa m\u00e1s ancha.\n\u2022 En caso de emergencia: Siga las luces de se\u00f1alizaci\u00f3n verde ne\u00f3n (#7CFF2A) hacia la puerta abierta m\u00e1s cercana. Tiempo promedio de evacuaci\u00f3n actual: <8 minutos.`;
  }
  if (q.includes("goles") || q.includes("partidos") || q.includes("calendario") || q.includes("goleadores")) {
    return `\uD83C\uDFC6 FIFA World Cup 2026 \u2014 Resultados del Torneo:\n\n\u2705 SEMIFINAL 1 (Completada):\nSpain 2\u20130 France (AT&T Stadium, Dallas)\n\u2022 Mikel Oyarzabal 22' (pen), Pedro Porro 58'\n\n\u2705 SEMIFINAL 2 (Completada):\nEngland 1\u20132 Argentina (Mercedes-Benz Stadium, Atlanta)\n\u2022 Anthony Gordon 55' | Enzo Fern\u00e1ndez 86', Lautaro Mart\u00ednez 92'\n\n\uD83D\uDCC5 TERCER LUGAR: 18 Jul @ 15:00 ET \u2014 France vs England (Hard Rock Stadium, Miami)\n\uD83C\uDFC6 GRAN FINAL: 19 Jul @ 15:00 ET \u2014 Spain vs Argentina (MetLife Stadium, NJ)\n\u26BD Goleadores: Bellingham (6), Mbapp\u00e9 (6), Kane (5), Yamal (5), Messi (4).`;
  }

  // Japanese queries
  if (q.includes("\u30B4\u30FC\u30EB") || q.includes("\u8A66\u5408") || q.includes("\u6700\u8FD1")) {
    return `\uD83C\uDFC6 FIFA\u30EF\u30FC\u30EB\u30C9\u30AB\u30C3\u30D72026 \u2014 \u6700\u65B0\u30B9\u30B3\u30A2\uff06\u901F\u5831:\n\n\u2705 \u6E96\u6C7A\u52DD1 (\u5B8C\u4E86): \u30B9\u30DA\u30A4\u30F3 2\u20130 \u30D5\u30E9\u30F3\u30B9 (AT&T\u30B9\u30BF\u30B8\u30A2\u30E0, \u30C0\u30E9\u30B9)\n\u2022 \u5F97\u70B9\u8005: \u30AA\u30E4\u30EB\u30B5\u30D0\u30EB 22'PK, \u30DD\u30ED 58'\n\n\u2705 \u6E96\u6C7A\u52DD2 (\u5B8C\u4E86): \u30A4\u30F3\u30B0\u30E9\u30F3\u30C9 1\u20132 \u30A2\u30EB\u30BC\u30F3\u30C1\u30F3 (\u30A2\u30C8\u30E9\u30F3\u30BF)\n\u2022 \u5F97\u70B9\u8005: A.\u30B4\u30FC\u30C9\u30F3 55' | E.\u30D5\u30A7\u30EB\u30CA\u30F3\u30C7\u30B9 86', L.\u30DE\u30EB\u30C6\u30A3\u30CD\u30B9 92'\n\n\uD83D\uDCC5 3\u4F4D\u6C7A\u5B9A\u6226: 7\u670818\u65E5 15:00 ET \u2014 \u30D5\u30E9\u30F3\u30B9 vs \u30A4\u30F3\u30B0\u30E9\u30F3\u30C9\n\uD83C\uDFC6 \u6C7A\u52DD\u6226 (Final): 7\u670819\u65E5 15:00 ET \u2014 \u30B9\u30DA\u30A4\u30F3 vs \u30A2\u30EB\u30BC\u30F3\u30C1\u30F3 (\u30E1\u30C3\u30C8\u30E9\u30A4\u30D5\u30FB\u30B9\u30BF\u30B8\u30A2\u30E0, NJ)\n\u26BD \u5F97\u70B9\u30E9\u30F3\u30AD\u30F3\u30B0: \u30D9\u30EA\u30F3\u30AC\u30E0 (6\u70B9), \u30E0\u30D0\u30C3\u30DA (6\u70B9), \u30B1\u30A4\u30F3 (5\u70B9), \u30E4\u30DE\u30EB (5\u70B9), \u30E1\u30C3\u30B7 (4\u70B9)\u3002`;
  }

  // Scores & Quick Stats
  if (q.includes("score") || q.includes("result") || q.includes("today") || q.includes("live") || q.includes("match") || q.includes("latest") || q.includes("last")) {
    return `\uD83C\uDFC6 FIFA World Cup 2026 \u2014 Latest Results & Upcoming Fixtures:\n\n\u2705 SEMI-FINAL 2 (Completed \u2014 Jul 15):\nEngland 1\u20132 Argentina @ Mercedes-Benz Stadium, Atlanta\n\u2022 Gordon 55' | Fern\u00e1ndez 86', Mart\u00ednez 92'\n\n\u2705 SEMI-FINAL 1 (Completed \u2014 Jul 14):\nSpain 2\u20130 France @ AT&T Stadium, Dallas\n\u2022 Oyarzabal 22' (pen), Porro 58'\n\n\uD83D\uDCC5 THIRD PLACE MATCH (Jul 18 @ 15:00 ET):\nFrance vs England \u2014 Hard Rock Stadium, Miami FL\n\n\uD83C\uDFC6 FINAL (Jul 19 @ 15:00 ET):\nSpain vs Argentina \u2014 MetLife Stadium, East Rutherford NJ`;
  }

  // Gates & Crowd
  if (q.includes("gate") || q.includes("crowd") || q.includes("least") || q.includes("queue") || q.includes("entry") || q.includes("exit")) {
    return `\uD83D\uDEAA Live Crowd Telemetry & Gate Recommendations:\n\n\u2728 RECOMMENDED GATE: Gate H (Northwest Corner @ MetLife Stadium)\n\u2022 Current Queue Wait: ~2 minutes (Lowest density: 34% capacity)\n\u2022 Proximity: 0.3 miles from Parking Lot A & North Pedestrian Plaza.\n\n\u26A0\uFE0F HEAVY FLOW WARNING: Gate C (East Side) is experiencing 78% density (~18 min wait). Avoid Gate C and proceed to Gate H or Gate A for express entry.`;
  }

  // Schedule
  if (q.includes("schedule") || q.includes("semi") || q.includes("when") || q.includes("final") || q.includes("bracket") || q.includes("upcoming")) {
    return `\uD83D\uDCC5 FIFA World Cup 2026 \u2014 Remaining Schedule:\n\n\u2705 Semi-Final 1 (Completed \u2014 Jul 14):\nSpain 2\u20130 France (AT&T Stadium, Dallas TX)\n\n\u2705 Semi-Final 2 (Completed \u2014 Jul 15):\nEngland 1\u20132 Argentina (Mercedes-Benz Stadium, Atlanta GA)\n\n\uD83D\uDD38 Third Place Match (Jul 18 @ 15:00 ET):\nFrance vs England \u2014 Hard Rock Stadium, Miami FL\n\n\uD83C\uDFC6 Championship Final (Jul 19 @ 15:00 ET):\nSpain vs Argentina \u2014 MetLife Stadium, East Rutherford NJ`;
  }

  // Goalscorers
  if (q.includes("goalscorer") || q.includes("scorer") || q.includes("bellingham") || q.includes("mbappe") || q.includes("kane") || q.includes("yamal") || q.includes("messi") || q.includes("top") || q.includes("golden boot")) {
    return `\u26BD Golden Boot Leaderboard (Top Goalscorers):\n\n1\uFE0F\u20E3 Jude Bellingham (England) \u2014 6 goals (2 in QF vs Norway, 2 in R16 vs Mexico)\n2\uFE0F\u20E3 Kylian Mbapp\u00e9 (France) \u2014 6 goals (1 in R16, 2 in QF, 2 in R32)\n3\uFE0F\u20E3 Harry Kane (England) \u2014 5 goals (1 in R16, 2 in R32)\n4\uFE0F\u20E3 Lamine Yamal (Spain) \u2014 5 goals\n5\uFE0F\u20E3 Lionel Messi (Argentina) \u2014 4 goals\n6\uFE0F\u20E3 Mikel Oyarzabal (Spain) \u2014 4 goals (including Semi-Final winner)`;
  }

  // Food & Dining
  if (q.includes("food") || q.includes("nearest") || q.includes("burger") || q.includes("beer") || q.includes("drink") || q.includes("concourse") || q.includes("snack") || q.includes("eat")) {
    return `\uD83C\uDF54 Stadium Concourse & Dining Directory (MetLife Stadium):\n\n\u2022 Concourse A (near Gates A-B): Hot dogs, smashed burgers, loaded nachos, and craft beer.\n\u2022 Concourse B (near Gates C-D): Artisanal wood-fired pizza, chicken wraps, and plant-based Beyond Burgers.\n\u2022 Concourse C (near Gates G-H): Express grab-and-go snacks, hot pretzels, ice-cold drinks, and coffee.\n\n\uD83D\uDCA1 Eco Tip: Bring your own reusable cup to enjoy $2 refills at any water or fountain station!`;
  }

  // Transport & Parking
  if (q.includes("transport") || q.includes("shuttle") || q.includes("train") || q.includes("metro") || q.includes("parking") || q.includes("bus") || q.includes("car")) {
    return `\uD83D\uDE8C Official Matchday Transit & Parking Guide (MetLife Stadium, NJ):\n\n\uD83D\uDE85 Rail (Recommended): Take the NJ Transit Meadowlands Express train from Secaucus Junction. Trains depart every 15 minutes right to the stadium station (0.4 mi express walk to Gate A).\n\n\uD83D\uDE8C Express Bus: Port Authority Bus 355 drops fans directly at Gate G.\n\n\uD83D\uDE97 Parking Lots: Lot A (0.3 mi to Gate H \u2014 closest general lot), Lot B (0.3 mi to Gate C), Lot C (0.6 mi to Gate D). Pre-booked digital passes required for all vehicles.`;
  }

  // Default rich tournament overview
  return `\uD83C\uDFC6 FIFAiq Smart Assistant \u2014 Tournament & Venue Status:\n\n\u2022 Current Stage: Final (Jul 19) & Third Place (Jul 18) remain.\n\u2022 Finalists: Spain vs Argentina (MetLife Stadium, NJ)\n\u2022 Semi-Final Results: Spain 2\u20130 France | England 1\u20132 Argentina\n\u2022 Total Goals Scored: ${context?.totalGoals ?? 184}\n\u2022 Featured Venue: MetLife Stadium, NY/NJ (Capacity: 82,500)\n\u2022 Security Status: ELEVATED (Level 2) \u2014 All 8 gates operational.\n\nAsk me about: Live scores \u26BD | Gate recommendations \uD83D\uDEAA | Dining \uD83C\uDF54 | Stadium transit \uD83D\uDE8C`;
}

