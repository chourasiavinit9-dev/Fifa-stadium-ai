"use client";
import React, { useState, useEffect } from "react";

interface Camera {
  name: string;
  capacity: number;
}

const CAMERAS: Camera[] = [
  { name: "North Gate",    capacity: 2000 },
  { name: "Concession B", capacity: 400  },
  { name: "Section 212",  capacity: 800  },
  { name: "Barcode Gates",capacity: 600  },
];

const BOUNDING_BOX_ANIMATIONS = [
  {
    keyframes: `@keyframes bb0 { 0%,100%{transform:translate(20px,15px)} 50%{transform:translate(50px,38px)} }`,
    duration: "2s",
    delay: "0s",
    label: "Person",
  },
  {
    keyframes: `@keyframes bb1 { 0%,100%{transform:translate(62px,8px)} 50%{transform:translate(28px,42px)} }`,
    duration: "2.8s",
    delay: "0.5s",
    label: "Group 3",
  },
  {
    keyframes: `@keyframes bb2 { 0%,100%{transform:translate(8px,52px)} 50%{transform:translate(58px,18px)} }`,
    duration: "3.5s",
    delay: "1.2s",
    label: "Group 5",
  },
];

function densityBarColor(d: number): string {
  if (d > 75) return "#ff3b3b";
  if (d > 50) return "#f5c518";
  return "#00ff9d";
}

export default function CctvAnalyzer() {
  const [densities, setDensities] = useState<number[]>(() =>
    CAMERAS.map(() => Math.floor(Math.random() * 55) + 20)
  );

  useEffect(() => {
    const iv = setInterval(() => {
      setDensities((prev) =>
        prev.map((d) => Math.max(0, Math.min(100, d + (Math.random() - 0.5) * 16)))
      );
    }, 2000);
    return () => clearInterval(iv);
  }, []);

  const highestIdx = densities.indexOf(Math.max(...densities));
  const hasHighAlert = densities.some((d) => d > 85);

  return (
    <div className="w-full">
      {/* Alert banner */}
      {hasHighAlert && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-3 bg-[#ff3b3b]/10 border border-[#ff3b3b]/40 rounded-xl px-4 py-2 text-xs text-[#ff3b3b] font-semibold"
        >
          ⚠ High density: {CAMERAS[highestIdx].name} at {Math.round(densities[highestIdx])}% — security dispatched
        </div>
      )}

      {/* 2×2 Camera Grid */}
      <style>{`
        @keyframes scan { 0%{top:0%} 100%{top:100%} }
        @keyframes bb0 { 0%,100%{transform:translate(20px,15px)} 50%{transform:translate(50px,38px)} }
        @keyframes bb1 { 0%,100%{transform:translate(62px,8px)} 50%{transform:translate(28px,42px)} }
        @keyframes bb2 { 0%,100%{transform:translate(8px,52px)} 50%{transform:translate(58px,18px)} }
      `}</style>

      <div className="grid grid-cols-2 gap-2">
        {CAMERAS.map((cam, idx) => {
          const density = densities[idx];
          const peopleCount = Math.round((density / 100) * cam.capacity);
          const color = densityBarColor(density);

          return (
            <div key={cam.name} className="space-y-1">
              {/* Camera viewport */}
              <div
                role="img"
                aria-label={`${cam.name}: ${peopleCount} people detected at ${Math.round(density)}% density`}
                style={{
                  position: "relative",
                  paddingBottom: "56.25%",
                  background: "#050808",
                  borderRadius: 8,
                  overflow: "hidden",
                  border: "1px solid #0f2a1a",
                }}
              >
                {/* Noise/grain overlay */}
                <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,157,0.02) 2px, rgba(0,255,157,0.02) 4px)", pointerEvents: "none" }} />

                {/* LIVE badge */}
                <div style={{ position: "absolute", top: 6, right: 8, display: "flex", alignItems: "center", gap: 4, zIndex: 10 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ff3b3b", display: "inline-block", animation: "ping 1s infinite" }} />
                  <span style={{ fontSize: 9, fontFamily: "monospace", color: "#ff3b3b", fontWeight: "bold" }}>LIVE</span>
                </div>

                {/* Camera name */}
                <div style={{ position: "absolute", top: 6, left: 8, fontSize: 9, fontFamily: "monospace", color: "#00ff9d", zIndex: 10, background: "rgba(0,0,0,0.5)", padding: "1px 4px", borderRadius: 3 }}>
                  {cam.name}
                </div>

                {/* Scan line */}
                <div style={{
                  position: "absolute", left: 0, right: 0, height: 2,
                  background: "rgba(0,255,157,0.13)",
                  animation: "scan 3s linear infinite",
                  zIndex: 8,
                }} />

                {/* Bounding boxes */}
                {BOUNDING_BOX_ANIMATIONS.map((bb, bi) => (
                  <div key={bi} style={{ position: "absolute", top: 0, left: 0, zIndex: 9 }}>
                    <div style={{
                      position: "absolute",
                      width: 36, height: 50,
                      border: "1.5px solid #00ff9d",
                      animation: `bb${bi} ${bb.duration} ease-in-out infinite`,
                      animationDelay: bb.delay,
                    }}>
                      <span style={{ position: "absolute", top: -12, left: 0, fontSize: 7, fontFamily: "monospace", color: "#00ff9d", whiteSpace: "nowrap" }}>
                        {bb.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Density bar below camera */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-[#0a1008] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${density}%`, background: color }}
                  />
                </div>
                <span className="text-[9px] font-mono" style={{ color }}>{Math.round(density)}%</span>
                <span className="text-[9px] text-[#4c5f57] font-mono">{peopleCount}p</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary row */}
      <div
        role="status"
        aria-live="polite"
        className="mt-3 bg-[#0f172a]/60 border border-[#00ff9d]/10 rounded-xl px-4 py-2 text-[10px] font-mono text-[#7f9a8e] flex flex-wrap gap-4"
      >
        <span>Total tracked: <strong className="text-white">{densities.reduce((sum, d, i) => sum + Math.round((d / 100) * CAMERAS[i].capacity), 0).toLocaleString()}</strong></span>
        <span>Peak zone: <strong className="text-white">{CAMERAS[highestIdx].name}</strong></span>
        <span>Active alerts: <strong className="text-[#ff3b3b]">{densities.filter((d) => d > 75).length}</strong></span>
      </div>
    </div>
  );
}
