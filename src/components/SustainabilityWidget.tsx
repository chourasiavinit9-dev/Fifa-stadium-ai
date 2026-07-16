"use client";
import React, { useState, useEffect, useRef } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface MaterialBar {
  label: string;
  icon: string;
  value: number;
}

const RECYCLING_STATIONS = [
  { name: "Gate A Recycling Hub", materials: ["♻️ Glass", "🥤 Plastic", "🍎 Food"], distanceM: 45 },
  { name: "South Concourse", materials: ["♻️ Glass", "🥤 Plastic"], distanceM: 110 },
  { name: "Section 112 Eco Point", materials: ["🥤 Plastic", "🍎 Food", "📦 General"], distanceM: 180 },
];

function RecyclingBar({ label, icon, value }: MaterialBar) {
  const color = value > 80 ? "#00ff9d" : value > 50 ? "#f5c518" : "#ff3b3b";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-mono">
        <span className="text-[#7f9a8e]">{icon} {label}</span>
        <span style={{ color }}>{Math.round(value)}%</span>
      </div>
      <div className="h-1.5 bg-[#0a1008] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
    </div>
  );
}

export default function SustainabilityWidget() {
  const [renewable, setRenewable] = useState(68.0);
  const [carbonOffset, setCarbonOffset] = useState(4.2);
  const [waterSaved, setWaterSaved] = useState(14200);
  const [materials, setMaterials] = useState<MaterialBar[]>([
    { label: "Glass", icon: "♻️", value: 72 },
    { label: "Plastic", icon: "🥤", value: 88 },
    { label: "Food", icon: "🍎", value: 61 },
    { label: "General", icon: "📦", value: 43 },
  ]);
  const [ecoTip, setEcoTip] = useState<string | null>(null);
  const [tipLoading, setTipLoading] = useState(true);
  const hasFetched = useRef(false);

  // Eco tip — fetch ONCE on mount
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    (async () => {
      try {
        const res = await fetch("/api/gemini-eco", { method: "POST" });
        if (!res.ok) throw new Error("Failed");
        const data = await res.json() as { tip: string };
        setEcoTip(data.tip);
      } catch {
        setEcoTip("Skip the plastic cup — bring a reusable bottle and refill at any stadium water station for free.");
      }
      setTipLoading(false);
    })();
  }, []);

  // Live metrics update every 8s
  useEffect(() => {
    const iv = setInterval(() => {
      setRenewable((r) => Math.max(60, Math.min(80, r + (Math.random() - 0.5) * 1)));
      setCarbonOffset((c) => +(c + 0.002).toFixed(3));
      setWaterSaved((w) => w + 7);
      setMaterials((prev) =>
        prev.map((m) => ({
          ...m,
          value: Math.max(0, Math.min(100, m.value + (Math.random() - 0.5) * 4)),
        }))
      );
    }, 8000);
    return () => clearInterval(iv);
  }, []);

  const pieData = [
    { name: "Renewable", value: renewable, fill: "#00ff9d" },
    { name: "Grid", value: 100 - renewable, fill: "#1e3a1e" },
  ];

  return (
    <div className="w-full space-y-4">
      {/* Eco tip banner */}
      <div className="bg-[#001a0d] border border-[#00ff9d]/20 rounded-xl px-4 py-3 flex items-start gap-3">
        <span className="text-xl flex-shrink-0">🌱</span>
        <div className="flex-1">
          {tipLoading ? (
            <p className="text-xs text-[#4c5f57] animate-pulse">Generating eco tip...</p>
          ) : (
            <p className="text-xs text-[#7f9a8e] leading-relaxed" aria-live="polite">{ecoTip}</p>
          )}
        </div>
      </div>

      {/* 4 metric cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Renewable energy donut */}
        <div className="bg-[#0f172a]/60 border border-[#00ff9d]/10 rounded-xl p-3 col-span-2 md:col-span-1">
          <p className="text-[10px] font-mono text-[#4c5f57] mb-2">RENEWABLE ENERGY</p>
          <div className="flex items-center gap-4">
            <div style={{ width: 100, height: 100 }}>
              <PieChart width={100} height={100}>
                <Pie
                  data={pieData}
                  cx={45}
                  cy={45}
                  innerRadius={32}
                  outerRadius={44}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                  strokeWidth={0}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#00ff9d] font-mono">{renewable.toFixed(1)}%</p>
              <p className="text-[10px] text-[#7f9a8e]">of total grid</p>
            </div>
          </div>
        </div>

        {/* Carbon offset */}
        <div className="bg-[#0f172a]/60 border border-[#00ff9d]/10 rounded-xl p-3">
          <p className="text-[10px] font-mono text-[#4c5f57] mb-1">CARBON OFFSET</p>
          <p className="text-2xl font-bold text-[#00ff9d] font-mono">{carbonOffset.toFixed(1)}</p>
          <p className="text-[10px] text-[#7f9a8e]">tonnes CO₂</p>
        </div>

        {/* Water saved */}
        <div className="bg-[#0f172a]/60 border border-[#00ff9d]/10 rounded-xl p-3">
          <p className="text-[10px] font-mono text-[#4c5f57] mb-1">WATER SAVED</p>
          <p className="text-2xl font-bold text-[#00ff9d] font-mono">{waterSaved.toLocaleString()}</p>
          <p className="text-[10px] text-[#7f9a8e]">litres today</p>
        </div>

        {/* Waste diversion bars */}
        <div className="bg-[#0f172a]/60 border border-[#00ff9d]/10 rounded-xl p-3 col-span-2">
          <p className="text-[10px] font-mono text-[#4c5f57] mb-3">WASTE DIVERSION</p>
          <div className="space-y-2">
            {materials.map((m) => (
              <RecyclingBar key={m.label} {...m} />
            ))}
          </div>
        </div>
      </div>

      {/* Recycling locator */}
      <div>
        <p className="text-[10px] font-mono text-[#4c5f57] mb-2 uppercase tracking-wider">Nearest Recycling Stations</p>
        <div className="space-y-2">
          {RECYCLING_STATIONS.map((s) => (
            <div key={s.name} className="bg-[#0f172a]/60 border border-[#00ff9d]/10 rounded-xl p-3">
              <div className="flex justify-between items-start mb-1">
                <p className="text-xs font-semibold text-white">{s.name}</p>
                <span className="text-[10px] font-mono text-[#4c5f57]">{s.distanceM}m</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {s.materials.map((mat) => (
                  <span key={mat} className="text-[10px] px-2 py-0.5 bg-[#00ff9d]/5 border border-[#00ff9d]/15 rounded-full text-[#7f9a8e]">
                    {mat}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
