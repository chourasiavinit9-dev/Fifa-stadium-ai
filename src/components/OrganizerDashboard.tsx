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
import type { WorldCupData } from "../lib/worldcupApi";
import {
  computeGoalsPerDay,
  computeMatchStatusCounts,
  getTotalGoals,
  getCompletedMatches,
} from "../lib/worldcupApi";

interface Props {
  data: WorldCupData | null;
}

interface CustomTooltipProps extends TooltipProps<number, string> {
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      style={{
        background: "#0a140a",
        border: "1px solid rgba(0,255,157,0.2)",
        borderRadius: 8,
        padding: "8px 12px",
      }}
    >
      <p style={{ color: "#4a6a4a", fontSize: 11, marginBottom: 2 }}>{label}</p>
      <p style={{ color: "#00ff9d", fontFamily: "monospace", fontSize: 13, fontWeight: "bold" }}>
        {payload[0].value} goals
      </p>
    </div>
  );
}

interface LabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  outerRadius: number;
  percent: number;
  value: number;
}

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
  const goalsData = useMemo(() => (data ? computeGoalsPerDay(data) : []), [data]);
  const counts = useMemo(
    () => (data ? computeMatchStatusCounts(data) : { completed: 0, live: 0, upcoming: 0 }),
    [data]
  );
  const totalGoals = useMemo(() => (data ? getTotalGoals(data) : 0), [data]);
  const completedCount = useMemo(() => (data ? getCompletedMatches(data).length : 0), [data]);
  const avgGoals = completedCount > 0 ? (totalGoals / completedCount).toFixed(2) : "—";
  const totalMatches = counts.completed + counts.live + counts.upcoming;

  const pieData = [
    { name: "Completed", value: counts.completed, fill: "#00ff9d" },
    { name: "Upcoming",  value: counts.upcoming,  fill: "#f5c518" },
    { name: "Live",      value: counts.live,       fill: "#ff3b3b" },
  ].filter((d) => d.value > 0);

  if (!data) {
    return (
      <div className="space-y-4">
        <div
          role="status"
          aria-label="Loading analytics..."
          className="h-[280px] bg-[#0f172a]/60 rounded-xl animate-pulse"
        />
        <div className="h-[200px] bg-[#0f172a]/60 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Line Chart */}
      <div>
        <h3 className="text-xs font-mono text-[#4c5f57] mb-3 uppercase tracking-wider">
          Goals Per Match Day
        </h3>
        <div aria-label="Line chart: goals scored per match day across the tournament">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={goalsData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a1e" />
              <XAxis
                dataKey="label"
                tick={{ fill: "#6b8f6b", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "#1e3a1e" }}
              />
              <YAxis
                tick={{ fill: "#6b8f6b", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="goals"
                stroke="#00ff9d"
                strokeWidth={2}
                dot={{ fill: "#00ff9d", r: 4 }}
                activeDot={{ r: 6, stroke: "#004a22" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Donut + Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Donut */}
        <div>
          <h3 className="text-xs font-mono text-[#4c5f57] mb-3 uppercase tracking-wider">
            Match Status
          </h3>
          <div
            aria-label={`Donut chart: ${counts.completed} completed, ${counts.upcoming} upcoming, ${counts.live} live matches`}
            className="relative"
            style={{ width: 160, height: 160 }}
          >
            <PieChart width={160} height={160}>
              <Pie
                data={pieData}
                cx={75}
                cy={75}
                innerRadius={55}
                outerRadius={72}
                dataKey="value"
                labelLine={false}
                label={(props: LabelProps) => renderCustomLabel(props)}
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
            {/* Center total */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                textAlign: "center",
                pointerEvents: "none",
              }}
            >
              <div style={{ fontSize: 20, fontWeight: "bold", color: "#00ff9d", fontFamily: "monospace" }}>
                {totalMatches}
              </div>
              <div style={{ fontSize: 9, color: "#4c5f57", fontFamily: "monospace" }}>MATCHES</div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-3 space-y-1">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: d.fill }} />
                <span className="text-[#7f9a8e]">{d.name}</span>
                <span className="font-mono text-white ml-auto">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats cards */}
        <div className="space-y-3">
          <div className="bg-[#0f172a]/60 border border-[#00ff9d]/10 rounded-xl p-4">
            <p className="text-[10px] font-mono text-[#4c5f57] mb-1">TOTAL GOALS</p>
            <p className="text-2xl font-bold text-[#00ff9d] font-mono">{totalGoals}</p>
          </div>
          <div className="bg-[#0f172a]/60 border border-[#f5c518]/20 rounded-xl p-4">
            <p className="text-[10px] font-mono text-[#4c5f57] mb-1">TOP SCORER</p>
            <p className="text-sm font-bold text-white">H. Kane — <span className="text-[#f5c518]">6 goals</span></p>
          </div>
          <div className="bg-[#0f172a]/60 border border-[#00ff9d]/10 rounded-xl p-4">
            <p className="text-[10px] font-mono text-[#4c5f57] mb-1">AVG GOALS / MATCH</p>
            <p className="text-2xl font-bold text-[#00ff9d] font-mono">{avgGoals}</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="text-[10px] text-[#4c5f57] font-mono">
        Data: openfootball.github.io · CC0 · Updated every 30s
      </p>
    </div>
  );
}
