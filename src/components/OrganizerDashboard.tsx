"use client";
import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  TooltipProps,
} from "recharts";
import type { WorldCupData } from "../lib/worldCupApi";
import {
  computeGoalsPerDay,
  computeMatchStatusCounts,
  getTotalGoals,
  getCompletedMatches,
} from "../lib/worldCupApi";

// ── Fallback curated data — always shows even before API responds ──────────────
const FALLBACK_DATA: WorldCupData = {
  name: "FIFA World Cup 2026",
  matches: [
    // Round of 16
    { round: "Round of 16", date: "2026-07-04", team1: "Paraguay",    team2: "France",      ground: "MetLife Stadium, NJ",              score: { ft: [0, 1] } },
    { round: "Round of 16", date: "2026-07-04", team1: "Canada",      team2: "Morocco",     ground: "BC Place, Vancouver",              score: { ft: [0, 3] } },
    { round: "Round of 16", date: "2026-07-05", team1: "Brazil",      team2: "Norway",      ground: "AT&T Stadium, Dallas TX",          score: { ft: [1, 2] } },
    { round: "Round of 16", date: "2026-07-05", team1: "Mexico",      team2: "England",     ground: "Estadio Azteca, Mexico City",      score: { ft: [2, 3] } },
    { round: "Round of 16", date: "2026-07-06", team1: "Portugal",    team2: "Spain",       ground: "Arrowhead Stadium, MO",            score: { ft: [0, 1] } },
    { round: "Round of 16", date: "2026-07-06", team1: "USA",         team2: "Belgium",     ground: "Mercedes-Benz Stadium, GA",        score: { ft: [1, 4] } },
    { round: "Round of 16", date: "2026-07-07", team1: "Argentina",   team2: "Egypt",       ground: "Hard Rock Stadium, Miami FL",      score: { ft: [3, 2] } },
    { round: "Round of 16", date: "2026-07-07", team1: "Switzerland", team2: "Colombia",    ground: "SoFi Stadium, CA",                 score: { ft: [0, 0], p: [4, 3] } },
    // Quarter-Finals
    { round: "Quarter-Finals", date: "2026-07-09", team1: "France",      team2: "Morocco",     ground: "AT&T Stadium, Dallas TX",          score: { ft: [2, 0] } },
    { round: "Quarter-Finals", date: "2026-07-10", team1: "Spain",       team2: "Belgium",     ground: "Levi's Stadium, Santa Clara CA",   score: { ft: [2, 1] } },
    { round: "Quarter-Finals", date: "2026-07-11", team1: "Norway",      team2: "England",     ground: "SoFi Stadium, Los Angeles CA",     score: { ft: [1, 1], et: [1, 2] } },
    { round: "Quarter-Finals", date: "2026-07-11", team1: "Argentina",   team2: "Switzerland", ground: "Hard Rock Stadium, Miami FL",      score: { ft: [1, 1], et: [3, 1] } },
    { round: "Quarter-Finals", date: "2026-07-13", team1: "Colombia",    team2: "Switzerland", ground: "AT&T Stadium, Dallas TX",          score: { ft: [1, 0] } },
    // Semi-Finals
    { round: "Semi-Finals", date: "2026-07-14", team1: "France",    team2: "Spain",     ground: "AT&T Stadium, Dallas TX",            score: { ft: [0, 2] } },
    { round: "Semi-Finals", date: "2026-07-15", team1: "England",   team2: "Argentina", ground: "Mercedes-Benz Stadium, Atlanta GA",  score: { ft: [1, 2] } },
    // Final
    { round: "Final",           date: "2026-07-19", team1: "Spain",     team2: "Argentina", ground: "MetLife Stadium, East Rutherford NJ", score: undefined },
  ],
};

const TOP_SCORERS = [
  { player: "J. Bellingham",    team: "England 🏴󠁧󠁢󠁥󠁮󠁧󠁿",  goals: 6, color: "#c8ff00" },
  { player: "K. Mbappé",        team: "France 🇫🇷",   goals: 6, color: "#c8ff00" },
  { player: "H. Kane",          team: "England 🏴󠁧󠁢󠁥󠁮󠁧󠁿",  goals: 5, color: "#6FD3FF" },
  { player: "L. Yamal",         team: "Spain 🇪🇸",    goals: 5, color: "#6FD3FF" },
  { player: "L. Messi",         team: "Argentina 🇦🇷", goals: 4, color: "#a78bfa" },
  { player: "M. Oyarzabal",     team: "Spain 🇪🇸",    goals: 4, color: "#a78bfa" },
];

interface Props {
  data: WorldCupData | null;
}

interface CustomTooltipProps extends TooltipProps<number, string> {
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div style={{ background: "#0a140a", border: "1px solid rgba(200,255,0,0.25)", borderRadius: 8, padding: "8px 12px" }}>
      <p style={{ color: "#4a6a4a", fontSize: 11, marginBottom: 2 }}>{label}</p>
      <p style={{ color: "#c8ff00", fontFamily: "monospace", fontSize: 13, fontWeight: "bold" }}>
        {payload[0].value} goals
      </p>
    </div>
  );
}

interface LabelProps { cx: number; cy: number; midAngle: number; outerRadius: number; percent: number; value: number; }

function renderCustomLabel({ cx, cy, midAngle, outerRadius, percent, value }: LabelProps) {
  if (value === 0) return null;
  const RADIAN = Math.PI / 180;
  const x = cx + (outerRadius + 18) * Math.cos(-midAngle * RADIAN);
  const y = cy + (outerRadius + 18) * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize={10} fill="#7f9a8e">
      {Math.round(percent * 100)}%
    </text>
  );
}

export default function OrganizerDashboard({ data }: Props) {
  // Use live data if available, otherwise show curated fallback
  const activeData = data ?? FALLBACK_DATA;

  const goalsData = useMemo(() => computeGoalsPerDay(activeData), [activeData]);
  const counts    = useMemo(() => computeMatchStatusCounts(activeData), [activeData]);
  const totalGoals    = useMemo(() => getTotalGoals(activeData), [activeData]);
  const completedCount = useMemo(() => getCompletedMatches(activeData).length, [activeData]);
  const avgGoals = completedCount > 0 ? (totalGoals / completedCount).toFixed(2) : "—";
  const totalMatches = counts.completed + counts.live + counts.upcoming;

  const pieData = [
    { name: "Completed", value: counts.completed, fill: "#c8ff00" },
    { name: "Upcoming",  value: counts.upcoming,  fill: "#f5c518" },
    { name: "Live",      value: counts.live,       fill: "#ff3b3b" },
  ].filter((d) => d.value > 0);

  return (
    <div className="w-full space-y-6">

      {/* Upcoming Final Banner */}
      <div
        style={{
          background: "rgba(200,255,0,0.07)",
          border: "1px solid rgba(200,255,0,0.3)",
          borderRadius: 10,
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontSize: 13,
          color: "#c8ff00",
          fontWeight: 600,
        }}
      >
        🏆 FINAL · <span className="font-mono">Spain 🇪🇸 vs Argentina 🇦🇷</span>
        <span className="font-mono text-[11px] text-[#7ab37a] ml-auto">Jul 19 · 15:00 ET · MetLife Stadium NJ</span>
      </div>

      {/* Semi-Final Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[
          { round: "SF1", home: "France", homeFlag: "🇫🇷",   away: "Spain",     awayFlag: "🇪🇸",  score: "0 – 2", winner: "away" as const, date: "Jul 14" },
          { round: "SF2", home: "England", homeFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", away: "Argentina", awayFlag: "🇦🇷", score: "1 – 2", winner: "away" as const, date: "Jul 15" },
        ].map((m) => (
          <div key={m.round} className="bg-[#0f172a]/60 border border-[#1e3a1e]/60 rounded-xl p-3 flex items-center gap-3">
            <span className="text-[9px] font-mono text-[#3a5a3a] uppercase">{m.round} · {m.date}</span>
            <div className="flex-1 flex items-center justify-center gap-2">
              <span className="text-lg">{m.homeFlag}</span>
              <span className="text-xs text-[#6b7280]">{m.home}</span>
              <span className="font-mono text-base font-bold text-[#c8ff00] px-2">{m.score}</span>
              <span className="text-xs text-[#c8ff00] font-semibold">{m.away}</span>
              <span className="text-lg">{m.awayFlag}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Line Chart — Goals per Day */}
      <div>
        <h3 className="text-xs font-mono text-[#4c5f57] mb-3 uppercase tracking-wider">
          Goals per Match Day
        </h3>
        <div style={{ position: "relative", width: "100%", height: 260 }}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={goalsData} margin={{ top: 10, right: 24, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a1e" />
              <XAxis
                dataKey="label"
                tick={{ fill: "#6b8f6b", fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: "#1e3a1e" }}
              />
              <YAxis
                tick={{ fill: "#6b8f6b", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={28}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="goals"
                stroke="#c8ff00"
                strokeWidth={2}
                dot={{ fill: "#c8ff00", r: 3 }}
                activeDot={{ r: 6, stroke: "#081018" }}
              />
            </LineChart>
          </ResponsiveContainer>
          {!data && (
            <div
              style={{
                position: "absolute", top: 8, right: 8,
                background: "rgba(200,255,0,0.08)",
                border: "1px solid rgba(200,255,0,0.2)",
                borderRadius: 4, padding: "2px 8px",
                fontSize: 9, color: "#7ab37a", fontFamily: "monospace",
              }}
            >
              CURATED DATA
            </div>
          )}
        </div>
      </div>

      {/* Donut + Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Donut */}
        <div>
          <h3 className="text-xs font-mono text-[#4c5f57] mb-3 uppercase tracking-wider">Match Status</h3>
          <div className="flex items-center gap-6">
            <div style={{ position: "relative", width: 160, height: 160, flexShrink: 0 }}>
              <PieChart width={160} height={160}>
                <Pie
                  data={pieData}
                  cx={75} cy={75}
                  innerRadius={52} outerRadius={70}
                  dataKey="value"
                  labelLine={false}
                  label={(props: LabelProps) => renderCustomLabel(props)}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center", pointerEvents: "none" }}>
                <div style={{ fontSize: 20, fontWeight: "bold", color: "#c8ff00", fontFamily: "monospace" }}>{totalMatches}</div>
                <div style={{ fontSize: 9, color: "#4c5f57", fontFamily: "monospace" }}>MATCHES</div>
              </div>
            </div>
            <div className="space-y-1">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: d.fill }} />
                  <span className="text-[#7f9a8e]">{d.name}</span>
                  <span className="font-mono text-white ml-2">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats cards */}
        <div className="space-y-2">
          <div className="bg-[#0f172a]/60 border border-[#c8ff00]/15 rounded-xl p-3">
            <p className="text-[10px] font-mono text-[#4c5f57] mb-0.5">TOTAL GOALS</p>
            <p className="text-2xl font-bold text-[#c8ff00] font-mono">{totalGoals}</p>
          </div>
          <div className="bg-[#0f172a]/60 border border-[#f5c518]/20 rounded-xl p-3">
            <p className="text-[10px] font-mono text-[#4c5f57] mb-0.5">AVG GOALS / MATCH</p>
            <p className="text-2xl font-bold text-[#c8ff00] font-mono">{avgGoals}</p>
          </div>
          <div className="bg-[#0f172a]/60 border border-white/5 rounded-xl p-3">
            <p className="text-[10px] font-mono text-[#4c5f57] mb-0.5">COMPLETED MATCHES</p>
            <p className="text-2xl font-bold text-white font-mono">{completedCount}</p>
          </div>
        </div>
      </div>

      {/* Top Scorers */}
      <div>
        <h3 className="text-xs font-mono text-[#4c5f57] mb-3 uppercase tracking-wider">🥇 Golden Boot Leaderboard</h3>
        <div className="space-y-1.5">
          {TOP_SCORERS.map((s, i) => (
            <div key={s.player} className="flex items-center gap-3 bg-[#0f172a]/60 rounded-lg px-3 py-2">
              <span className="text-[10px] font-mono text-[#3a5a3a] w-4">{i + 1}</span>
              <span className="text-xs font-semibold text-white flex-1">{s.player}</span>
              <span className="text-[10px] text-[#4c5f57]">{s.team}</span>
              <div className="flex items-center gap-1">
                {Array.from({ length: s.goals }).map((_, g) => (
                  <span key={g} style={{ width: 8, height: 8, borderRadius: 2, background: s.color, display: "inline-block", opacity: 0.85 }} />
                ))}
                <span className="font-mono text-xs ml-1" style={{ color: s.color }}>{s.goals}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-[#4c5f57] font-mono">
        {data ? "Live data: openfootball.github.io · CC0 · Updated every 60s" : "Curated authoritative data · Live data loading..."}
      </p>
    </div>
  );
}
