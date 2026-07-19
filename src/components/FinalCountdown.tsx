import React, { useState, useEffect, useRef } from "react";

// ── Constants ──────────────────────────────────────────────────────────────────
const FINAL_UTC = new Date("2026-07-19T19:00:00Z");

/** Pads a number to at least 2 digits with a leading zero. e.g. pad(7) => "07" */
export function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Computes the countdown from `now` to the World Cup Final kick-off. */
export function getCountdown(now: Date = new Date()): {
  started: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const diff = FINAL_UTC.getTime() - now.getTime();
  if (diff <= 0) return { started: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    started: false,
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1_000),
  };
}

interface PathMatch {
  round: string;
  vs: string;
  score: string;
}

const ARGENTINA_PATH: PathMatch[] = [
  { round: "Group C", vs: "Saudi Arabia", score: "3–0" },
  { round: "Group C", vs: "Mexico", score: "2–0" },
  { round: "Group C", vs: "Poland", score: "2–0" },
  { round: "Round of 16", vs: "Brazil", score: "1–0" },
  { round: "Quarter-Final", vs: "Switzerland", score: "3–1 AET" },
  { round: "Semi-Final", vs: "England", score: "2–1" },
];

const SPAIN_PATH: PathMatch[] = [
  { round: "Group B", vs: "Croatia", score: "3–0" },
  { round: "Group B", vs: "Italy", score: "1–0" },
  { round: "Group B", vs: "Albania", score: "2–1" },
  { round: "Round of 16", vs: "Slovakia", score: "4–1" },
  { round: "Quarter-Final", vs: "Belgium", score: "2–1" },
  { round: "Semi-Final", vs: "France", score: "2–0" },
];

const TOP_SCORERS = [
  { player: "Jude Bellingham", country: "ENG", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", goals: 7 },
  { player: "Kylian Mbappé", country: "FRA", flag: "🇫🇷", goals: 6 },
  { player: "Lamine Yamal", country: "ESP", flag: "🇪🇸", goals: 5 },
  { player: "Harry Kane", country: "ENG", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", goals: 5 },
  { player: "Lionel Messi", country: "ARG", flag: "🇦🇷", goals: 4 },
];

const GATE_INFO = [
  { gate: "H", distance: "0.3 mi", label: "Fastest Entry", note: "Walk from MetLife parking lots" },
  { gate: "A", distance: "0.4 mi", label: "NJ Transit", note: "Meadowlands Express terminus" },
  { gate: "D", distance: "0.5 mi", label: "Shuttle Drop-off", note: "Official match day shuttles" },
  { gate: "B", distance: "0.6 mi", label: "Premium / VIP", note: "Hospitality & suite access" },
];

// ── Tournament Stats ────────────────────────────────────────────────────────────
const TEAM_STATS = [
  { label: "Goals Scored",     arg: 12, esp: 13 },
  { label: "Goals Conceded",   arg: 5,  esp: 3  },
  { label: "Avg Possession %", arg: 56, esp: 63 },
  { label: "Shots on Target",  arg: 38, esp: 47 },
  { label: "Pass Accuracy %",  arg: 87, esp: 91 },
  { label: "Clean Sheets",     arg: 3,  esp: 4  },
  { label: "Chances Created",  arg: 51, esp: 59 },
  { label: "Matches Played",   arg: 6,  esp: 6  },
];

// ── H2H ────────────────────────────────────────────────────────────────────────
const H2H = { arg: 6, draw: 3, esp: 4, lastMeet: "Argentina 2–1 Spain (Finalissima 2022)", total: 13 };

// ── Critics / Pundits ──────────────────────────────────────────────────────────
const CRITICS = [
  { name: "Gary Lineker",   outlet: "BBC Sport",      pick: "Spain",     score: "2–1", reasoning: "Spain's collective football is at its peak. Yamal decides it." },
  { name: "Thierry Henry",  outlet: "CBS Sports",     pick: "Argentina", score: "1–0", reasoning: "Messi's last dance. Argentina grind out finals. It's destiny." },
  { name: "Guillem Balagué",outlet: "The Athletic",   pick: "Spain",     score: "2–0", reasoning: "Spain haven't lost a goal in two games. Tactical masterclass incoming." },
  { name: "Rafa Honigstein",outlet: "Sky Sports",     pick: "Draw/AET",  score: "1–1 AET", reasoning: "Closest possible final. My gut says Messi in 120' to seal it." },
  { name: "Ian Wright",     outlet: "ITV Sport",      pick: "Argentina", score: "2–1", reasoning: "They've been here before — Paris, Qatar. They know how to close it out." },
];

// ── Types ──────────────────────────────────────────────────────────────────────
interface Countdown { days: number; hours: number; minutes: number; seconds: number }
interface Prediction {
  winner: string;
  predictedScore: string;
  confidence: number;
  keyPlayer: string;
  reasoning: string;
}

// ── Sub-components ─────────────────────────────────────────────────────────────
/** Displays a single countdown unit (e.g. "07 DAYS"). Memoised — re-renders only when value changes. */
const CountUnit = React.memo(function CountUnit({ value, label }: { value: number; label: string }) {
  const str = pad(value);
  return (
    <div className="flex flex-col items-center">
      <div
        style={{
          background: "#0f0f0f",
          border: "1px solid #c8ff00",
          borderRadius: 8,
          minWidth: 64,
          padding: "6px 10px",
          textAlign: "center",
          boxShadow: "0 0 16px rgba(200,255,0,0.18)",
        }}
      >
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 28,
            fontWeight: 900,
            color: "#c8ff00",
            letterSpacing: 2,
            display: "block",
            lineHeight: 1,
          }}
        >
          {str}
        </span>
      </div>
      <span style={{ fontSize: 9, color: "#666", fontFamily: "monospace", marginTop: 4, textTransform: "uppercase", letterSpacing: 2 }}>
        {label}
      </span>
    </div>
  );
});

/** Displays a team's path to the Final. Memoised — static data, never re-renders during countdown. */
const PathCard = React.memo(function PathCard({ team, flag, path }: { team: string; flag: string; path: PathMatch[] }) {
  return (
    <div
      style={{
        background: "#0f0f0f",
        border: "1px solid #1a1a1a",
        borderRadius: 12,
        padding: "16px",
        flex: 1,
        minWidth: 0,
      }}
    >
      <div style={{ fontFamily: "monospace", fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>
        {flag} {team} — Road to Final
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {path.map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "5px 8px",
              borderRadius: 6,
              background: i === path.length - 1 ? "rgba(200,255,0,0.07)" : "rgba(255,255,255,0.02)",
              border: i === path.length - 1 ? "1px solid rgba(200,255,0,0.2)" : "1px solid transparent",
            }}
          >
            <div>
              <span style={{ fontSize: 9, color: "#555", fontFamily: "monospace", display: "block" }}>{m.round}</span>
              <span style={{ fontSize: 12, color: "#ccc", fontWeight: 600 }}>vs {m.vs}</span>
            </div>
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 13,
                fontWeight: 700,
                color: i === path.length - 1 ? "#c8ff00" : "#59FF89",
                background: "rgba(89,255,137,0.08)",
                padding: "2px 8px",
                borderRadius: 4,
              }}
            >
              {m.score}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

// ── Main Component ─────────────────────────────────────────────────────────────
export default function FinalCountdown() {
  const [countdown, setCountdown] = useState<Countdown>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [predLoading, setPredLoading] = useState(true);
  const [predError, setPredError] = useState(false);
  const hasFetched = useRef(false);
  const isPast = FINAL_UTC <= new Date();

  // ── Countdown timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    const tick = () => {
      const cd = getCountdown();
      if (cd.started) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setCountdown({ days: cd.days, hours: cd.hours, minutes: cd.minutes, seconds: cd.seconds });
    };
    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, []);

  // ── Gemini prediction (once) ─────────────────────────────────────────────────
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const prompt =
      'Predict the FIFA World Cup 2026 Final: Argentina vs Spain at MetLife Stadium July 19. Respond with ONLY JSON: {"winner":"string","predictedScore":"string","confidence":number,"keyPlayer":"string","reasoning":"string"}';

    fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: prompt, history: [] }),
    })
      .then((r) => {
        if (!r.ok) throw new Error("API error");
        return r.json() as Promise<{ response: string }>;
      })
      .then((data) => {
        const text = data.response ?? "";
        const match = text.match(/\{[\s\S]*?\}/);
        if (!match) throw new Error("No JSON");
        const parsed = JSON.parse(match[0]) as Prediction;
        if (!parsed.winner) throw new Error("Invalid JSON");
        setPrediction(parsed);
      })
      .catch(() => {
        // Fallback prediction
        setPrediction({
          winner: "Argentina",
          predictedScore: "2–1",
          confidence: 61,
          keyPlayer: "Lionel Messi",
          reasoning:
            "Argentina's tournament-hardened squad and Messi's leadership edge give them a slight advantage in what promises to be the match of the decade at MetLife.",
        });
        setPredError(true);
      })
      .finally(() => setPredLoading(false));
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div
      id="final-countdown-panel"
      style={{
        background: "#0a0a0a",
        border: "1px solid #1a1a1a",
        borderRadius: 12,
        overflow: "hidden",
        width: "100%",
      }}
    >
      {/* ── Header Banner ──────────────────────────────────────────────────── */}
      <div
        style={{
          background: "linear-gradient(90deg, rgba(200,255,0,0.08) 0%, rgba(200,255,0,0.03) 100%)",
          borderBottom: "1px solid rgba(200,255,0,0.15)",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>🏆</span>
          <div>
            <div style={{ fontFamily: "monospace", fontSize: 11, color: "#c8ff00", fontWeight: 700, textTransform: "uppercase", letterSpacing: 3 }}>
              FIFA World Cup 2026 — Grand Final
            </div>
            <div style={{ fontFamily: "monospace", fontSize: 10, color: "#555", marginTop: 1 }}>
              MetLife Stadium · East Rutherford, NJ · Jul 19 · 15:00 ET / 19:00 UTC
            </div>
          </div>
        </div>
        {!isPast && (
          <div
            style={{
              background: "rgba(200,255,0,0.05)",
              border: "1px solid rgba(200,255,0,0.2)",
              borderRadius: 6,
              padding: "4px 10px",
              fontFamily: "monospace",
              fontSize: 9,
              color: "#c8ff00",
              textTransform: "uppercase",
              letterSpacing: 2,
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#c8ff00", display: "inline-block", animation: "pulse 1.5s infinite" }} />
            LIVE COUNTDOWN
          </div>
        )}
      </div>

      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ── Matchup + Countdown ─────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          {/* Teams */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32 }}>🇦🇷</div>
              <div style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: "#fff", marginTop: 4 }}>ARGENTINA</div>
              <div style={{ fontFamily: "monospace", fontSize: 9, color: "#666" }}>2022 Champion</div>
            </div>
            <div style={{ fontFamily: "monospace", fontSize: 20, color: "#333", fontWeight: 900, margin: "0 4px" }}>vs</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32 }}>🇪🇸</div>
              <div style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: "#fff", marginTop: 4 }}>SPAIN</div>
              <div style={{ fontFamily: "monospace", fontSize: 9, color: "#666" }}>Euro 2024 Winner</div>
            </div>
          </div>

          {/* Countdown units */}
          {!isPast ? (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <CountUnit value={countdown.days} label="days" />
              <span style={{ color: "#c8ff00", fontSize: 24, fontWeight: 900, marginTop: 4, fontFamily: "monospace" }}>:</span>
              <CountUnit value={countdown.hours} label="hours" />
              <span style={{ color: "#c8ff00", fontSize: 24, fontWeight: 900, marginTop: 4, fontFamily: "monospace" }}>:</span>
              <CountUnit value={countdown.minutes} label="mins" />
              <span style={{ color: "#c8ff00", fontSize: 24, fontWeight: 900, marginTop: 4, fontFamily: "monospace" }}>:</span>
              <CountUnit value={countdown.seconds} label="secs" />
            </div>
          ) : (
            <div style={{ fontFamily: "monospace", fontSize: 16, color: "#c8ff00", fontWeight: 700, border: "1px solid #c8ff00", borderRadius: 8, padding: "8px 16px" }}>
              🏆 MATCH DAY
            </div>
          )}
        </div>

        {/* ── Tournament paths + Prediction ──────────────────────────────── */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <PathCard team="Argentina" flag="🇦🇷" path={ARGENTINA_PATH} />

          {/* Gemini Prediction */}
          <div
            style={{
              background: "#0f0f0f",
              border: "1px solid rgba(200,255,0,0.2)",
              borderRadius: 12,
              padding: 16,
              minWidth: 220,
              flex: "0 0 220px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ fontFamily: "monospace", fontSize: 10, color: "#c8ff00", textTransform: "uppercase", letterSpacing: 2 }}>
              🤖 AI Prediction
            </div>

            {predLoading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 8 }}>
                {[80, 60, 90, 70].map((w, i) => (
                  <div key={i} style={{ height: 10, borderRadius: 4, background: "rgba(200,255,0,0.08)", width: `${w}%`, animation: "pulse 1.5s infinite" }} />
                ))}
              </div>
            ) : prediction ? (
              <>
                <div style={{ textAlign: "center", padding: "8px 0" }}>
                  <div style={{ fontFamily: "monospace", fontSize: 9, color: "#555", textTransform: "uppercase" }}>Predicted Winner</div>
                  <div style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 900, color: "#c8ff00", marginTop: 2 }}>
                    {prediction.winner}
                  </div>
                  <div style={{ fontFamily: "monospace", fontSize: 22, fontWeight: 900, color: "#fff", marginTop: 2 }}>
                    {prediction.predictedScore}
                  </div>
                </div>

                {/* Confidence bar */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontFamily: "monospace", fontSize: 9, color: "#555" }}>AI CONFIDENCE</span>
                    <span style={{ fontFamily: "monospace", fontSize: 9, color: "#c8ff00" }}>{prediction.confidence}%</span>
                  </div>
                  <div style={{ height: 4, background: "#1a1a1a", borderRadius: 2, overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${prediction.confidence}%`,
                        background: "linear-gradient(90deg, #c8ff00, #59FF89)",
                        borderRadius: 2,
                        transition: "width 1s ease",
                      }}
                    />
                  </div>
                </div>

                <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 6, padding: "6px 8px" }}>
                  <div style={{ fontFamily: "monospace", fontSize: 9, color: "#555", marginBottom: 2 }}>KEY PLAYER</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#ddd" }}>⭐ {prediction.keyPlayer}</div>
                </div>

                <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 6, padding: "6px 8px" }}>
                  <div style={{ fontFamily: "monospace", fontSize: 9, color: "#555", marginBottom: 3 }}>REASONING</div>
                  <div style={{ fontSize: 11, color: "#888", lineHeight: 1.4 }}>{prediction.reasoning}</div>
                </div>

                {predError && (
                  <div style={{ fontFamily: "monospace", fontSize: 8, color: "#444", textAlign: "center" }}>
                    (fallback — AI unavailable)
                  </div>
                )}
              </>
            ) : null}
          </div>

          <PathCard team="Spain" flag="🇪🇸" path={SPAIN_PATH} />
        </div>

        {/* ── Top Scorers + Gate Info ─────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>

          {/* Top Scorers */}
          <div style={{ background: "#0f0f0f", border: "1px solid #1a1a1a", borderRadius: 12, padding: 16, flex: 1, minWidth: 220 }}>
            <div style={{ fontFamily: "monospace", fontSize: 10, color: "#c8ff00", textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>
              ⚽ Top Scorers — WC 2026
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["#", "Player", "Country", "Goals"].map((h) => (
                    <th key={h} style={{ fontFamily: "monospace", fontSize: 9, color: "#444", textTransform: "uppercase", textAlign: "left", paddingBottom: 6, borderBottom: "1px solid #1a1a1a" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TOP_SCORERS.map((s, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #111" }}>
                    <td style={{ fontFamily: "monospace", fontSize: 11, color: "#444", padding: "5px 0" }}>{i + 1}</td>
                    <td style={{ fontSize: 12, color: i === 0 ? "#c8ff00" : "#ccc", fontWeight: i === 0 ? 700 : 400, padding: "5px 0" }}>
                      {i === 0 ? "🥇 " : ""}{s.player}
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: 11, color: "#555", padding: "5px 8px" }}>{s.flag} {s.country}</td>
                    <td style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, color: "#59FF89", textAlign: "center" }}>{s.goals}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Gate Info */}
          <div style={{ background: "#0f0f0f", border: "1px solid #1a1a1a", borderRadius: 12, padding: 16, flex: 1, minWidth: 220 }}>
            <div style={{ fontFamily: "monospace", fontSize: 10, color: "#c8ff00", textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>
              🏟 MetLife Stadium — Gate Guide
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {GATE_INFO.map((g) => (
                <div
                  key={g.gate}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "7px 10px",
                    background: g.gate === "H" ? "rgba(200,255,0,0.06)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${g.gate === "H" ? "rgba(200,255,0,0.2)" : "#1a1a1a"}`,
                    borderRadius: 8,
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: g.gate === "H" ? "#c8ff00" : "#1a1a1a",
                      color: g.gate === "H" ? "#000" : "#888",
                      fontFamily: "monospace",
                      fontWeight: 900,
                      fontSize: 13,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {g.gate}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: g.gate === "H" ? "#c8ff00" : "#ccc", fontWeight: 600 }}>{g.label}</div>
                    <div style={{ fontFamily: "monospace", fontSize: 10, color: "#555", marginTop: 1 }}>{g.note}</div>
                  </div>
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#59FF89",
                      background: "rgba(89,255,137,0.08)",
                      padding: "2px 6px",
                      borderRadius: 4,
                      flexShrink: 0,
                    }}
                  >
                    {g.distance}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ── Stats Comparison + H2H ──────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>

          {/* Tournament stats bar chart */}
          <div style={{ background: "#0f0f0f", border: "1px solid #1a1a1a", borderRadius: 12, padding: 16, flex: 2, minWidth: 260 }}>
            <div style={{ fontFamily: "monospace", fontSize: 10, color: "#c8ff00", textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>
              📊 Tournament Stats — Argentina vs Spain
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {TEAM_STATS.map((s) => {
                const total = s.arg + s.esp;
                const argPct = Math.round((s.arg / total) * 100);
                const espPct = 100 - argPct;
                return (
                  <div key={s.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontFamily: "monospace", fontSize: 11, color: "#6FD3FF", fontWeight: 700 }}>{s.arg}</span>
                      <span style={{ fontFamily: "monospace", fontSize: 9, color: "#555", textTransform: "uppercase" }}>{s.label}</span>
                      <span style={{ fontFamily: "monospace", fontSize: 11, color: "#FF6B6B", fontWeight: 700 }}>{s.esp}</span>
                    </div>
                    <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden", background: "#111" }}>
                      <div style={{ width: `${argPct}%`, background: "linear-gradient(90deg,#3b82f6,#6FD3FF)", borderRadius: "3px 0 0 3px", transition: "width 0.8s ease" }} />
                      <div style={{ width: `${espPct}%`, background: "linear-gradient(90deg,#FF6B6B,#ef4444)", borderRadius: "0 3px 3px 0", transition: "width 0.8s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, padding: "6px 0", borderTop: "1px solid #1a1a1a" }}>
              <span style={{ fontFamily: "monospace", fontSize: 9, color: "#6FD3FF" }}>🇦🇷 ARGENTINA</span>
              <span style={{ fontFamily: "monospace", fontSize: 9, color: "#FF6B6B" }}>SPAIN 🇪🇸</span>
            </div>
          </div>

          {/* H2H */}
          <div style={{ background: "#0f0f0f", border: "1px solid #1a1a1a", borderRadius: 12, padding: 16, flex: 1, minWidth: 180 }}>
            <div style={{ fontFamily: "monospace", fontSize: 10, color: "#c8ff00", textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>
              ⚔️ Head to Head
            </div>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, margin: "8px 0 16px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "monospace", fontSize: 28, fontWeight: 900, color: "#6FD3FF" }}>{H2H.arg}</div>
                <div style={{ fontFamily: "monospace", fontSize: 9, color: "#555" }}>ARG Wins</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 900, color: "#444" }}>{H2H.draw}</div>
                <div style={{ fontFamily: "monospace", fontSize: 9, color: "#555" }}>Draws</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "monospace", fontSize: 28, fontWeight: 900, color: "#FF6B6B" }}>{H2H.esp}</div>
                <div style={{ fontFamily: "monospace", fontSize: 9, color: "#555" }}>ESP Wins</div>
              </div>
            </div>
            <div style={{ height: 6, display: "flex", borderRadius: 3, overflow: "hidden", marginBottom: 12 }}>
              <div style={{ width: `${(H2H.arg / H2H.total) * 100}%`, background: "#6FD3FF" }} />
              <div style={{ width: `${(H2H.draw / H2H.total) * 100}%`, background: "#333" }} />
              <div style={{ width: `${(H2H.esp / H2H.total) * 100}%`, background: "#FF6B6B" }} />
            </div>
            <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 6, padding: "6px 8px" }}>
              <div style={{ fontFamily: "monospace", fontSize: 9, color: "#555", marginBottom: 2 }}>LAST MEETING</div>
              <div style={{ fontSize: 11, color: "#aaa" }}>{H2H.lastMeet}</div>
            </div>
            <div style={{ fontFamily: "monospace", fontSize: 9, color: "#444", marginTop: 8, textAlign: "center" }}>{H2H.total} all-time meetings</div>
          </div>
        </div>

        {/* ── Expert Critics ──────────────────────────────────────────────── */}
        <div style={{ background: "#0f0f0f", border: "1px solid #1a1a1a", borderRadius: 12, padding: 16 }}>
          <div style={{ fontFamily: "monospace", fontSize: 10, color: "#c8ff00", textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>
            🎙 Expert Predictions — Pundits & Critics
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {CRITICS.map((c) => {
              const isArg = c.pick === "Argentina";
              const isEsp = c.pick === "Spain";
              const color = isArg ? "#6FD3FF" : isEsp ? "#FF6B6B" : "#c8ff00";
              return (
                <div
                  key={c.name}
                  style={{
                    background: `rgba(${isArg ? "111,211,255" : isEsp ? "255,107,107" : "200,255,0"},0.05)`,
                    border: `1px solid rgba(${isArg ? "111,211,255" : isEsp ? "255,107,107" : "200,255,0"},0.15)`,
                    borderRadius: 10,
                    padding: "10px 12px",
                    flex: "1 1 180px",
                    minWidth: 0,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{c.name}</div>
                      <div style={{ fontFamily: "monospace", fontSize: 9, color: "#555" }}>{c.outlet}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 8 }}>
                      <div style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 900, color, background: `rgba(${isArg ? "111,211,255" : isEsp ? "255,107,107" : "200,255,0"},0.1)`, padding: "2px 6px", borderRadius: 4 }}>{c.pick}</div>
                      <div style={{ fontFamily: "monospace", fontSize: 10, color: "#888", marginTop: 2 }}>{c.score}</div>
                    </div>
                  </div>
                  <p style={{ fontSize: 11, color: "#888", lineHeight: 1.4, margin: 0 }}>{c.reasoning}</p>
                </div>
              );
            })}
          </div>
          {/* Consensus bar */}
          <div style={{ marginTop: 12, padding: "10px", background: "rgba(255,255,255,0.02)", borderRadius: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontFamily: "monospace", fontSize: 9, color: "#6FD3FF" }}>🇦🇷 ARG ({CRITICS.filter(c => c.pick === "Argentina").length}/{CRITICS.length} pundits)</span>
              <span style={{ fontFamily: "monospace", fontSize: 9, color: "#c8ff00" }}>CONSENSUS</span>
              <span style={{ fontFamily: "monospace", fontSize: 9, color: "#FF6B6B" }}>({CRITICS.filter(c => c.pick === "Spain").length}/{CRITICS.length} pundits) ESP 🇪🇸</span>
            </div>
            <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden" }}>
              <div style={{ width: `${(CRITICS.filter(c => c.pick === "Argentina").length / CRITICS.length) * 100}%`, background: "linear-gradient(90deg,#3b82f6,#6FD3FF)" }} />
              <div style={{ width: `${(CRITICS.filter(c => c.pick === "Draw/AET").length / CRITICS.length) * 100}%`, background: "#333" }} />
              <div style={{ width: `${(CRITICS.filter(c => c.pick === "Spain").length / CRITICS.length) * 100}%`, background: "linear-gradient(90deg,#FF6B6B,#ef4444)" }} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

