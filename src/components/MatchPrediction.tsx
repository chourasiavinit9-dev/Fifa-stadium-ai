// src/components/MatchPrediction.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import type { Match } from "../lib/worldcupApi";

interface Prediction {
  winner: string;
  confidence: number;
  predictedScore: string;
  keyPlayer: string;
  reasoning: string;
  riskFactor: string;
}

interface Props {
  match: Match;
  recentResults: Match[];
}

export default function MatchPrediction({ match, recentResults }: Props) {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(false);
  const fetched = useRef(false);

  useEffect(() => {
    // Only predict upcoming matches, only once per mount
    if (fetched.current || match.score?.ft) return;
    fetched.current = true;
    setLoading(true);

    const fmt = (m: Match) =>
      `${m.team1} ${m.score?.ft[0] ?? "?"}-${m.score?.ft[1] ?? "?"} ${m.team2}`;

    const team1Recent = recentResults
      .filter((m) => m.team1 === match.team1 || m.team2 === match.team1)
      .slice(-3)
      .map(fmt)
      .join(", ");

    const team2Recent = recentResults
      .filter((m) => m.team1 === match.team2 || m.team2 === match.team2)
      .slice(-3)
      .map(fmt)
      .join(", ");

    const prompt = `Predict the outcome of: ${match.team1} vs ${match.team2} at FIFA World Cup 2026.
${match.team1} recent results: ${team1Recent || "no recent data"}
${match.team2} recent results: ${team2Recent || "no recent data"}
Round: ${match.round}. Venue: ${match.ground}.
Top scorers context: Bellingham 6, Mbappé 6, Kane 5, Yamal 5, Messi 4.

Respond with ONLY a valid JSON object, no markdown, no prose:
{
  "winner": "team name or Draw",
  "confidence": 72,
  "predictedScore": "2-1",
  "keyPlayer": "Player name",
  "reasoning": "One sentence explanation under 20 words",
  "riskFactor": "One sentence wildcard under 15 words"
}`;

    fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: prompt, history: [] }),
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<{ response: string }>;
      })
      .then((data) => {
        // Strip any markdown fences Gemini might wrap around JSON
        const text = data.response
          ?.replace(/```(?:json)?/g, "")
          .replace(/```/g, "")
          .trim();
        const parsed = JSON.parse(text) as Prediction;
        setPrediction(parsed);
        setLoading(false);
      })
      .catch(() => {
        // Silently hide — don't surface error UI inside a match card
        setLoading(false);
      });
  }, [match, recentResults]);

  // Don't render anything for completed matches or if AI call fails silently
  if (match.score?.ft || (!loading && !prediction)) return null;

  return (
    <div
      className="mt-3 bg-[#0a1a2a] border border-[#60aaff]/20 rounded-xl px-3 py-2.5"
      aria-label="Gemini AI match prediction"
    >
      <div className="text-[10px] text-[#4a6a8a] tracking-widest uppercase mb-2 font-mono">
        ✦ Gemini AI prediction
      </div>

      {loading ? (
        <div className="text-[11px] text-[#3a5a7a] animate-pulse font-mono">
          Analysing form data...
        </div>
      ) : prediction ? (
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[13px] text-[#c8dcc8] font-semibold">
              {prediction.winner} wins
            </span>
            <span className="text-[12px] text-[#60aaff] font-mono font-semibold">
              {prediction.predictedScore} · {prediction.confidence}% conf.
            </span>
          </div>
          <div className="text-[11px] text-[#4a6a8a]">
            ⭐ {prediction.keyPlayer} · {prediction.reasoning}
          </div>
          <div className="text-[10px] text-[#3a4a6a]">
            ⚡ Wildcard: {prediction.riskFactor}
          </div>
        </div>
      ) : null}
    </div>
  );
}
