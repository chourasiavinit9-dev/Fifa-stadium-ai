"use client";
import React, { useState, useMemo } from "react";

export interface SectorDensities {
  [sectorId: string]: number;
}

interface Sector {
  id: string;
  label: string;
  sa: number; // start angle
  ea: number; // end angle
}

const SECTORS: Sector[] = [
  { id: "north",     label: "North Stand",   sa: 315, ea: 45  },
  { id: "northeast", label: "NE Block",      sa: 45,  ea: 90  },
  { id: "east",      label: "East Stand",    sa: 90,  ea: 135 },
  { id: "southeast", label: "SE Block",      sa: 135, ea: 180 },
  { id: "south",     label: "South Stand",   sa: 180, ea: 225 },
  { id: "southwest", label: "SW Block",      sa: 225, ea: 270 },
  { id: "west",      label: "West Stand",    sa: 270, ea: 315 },
  { id: "northwest", label: "NW Block",      sa: 315, ea: 360 },
  { id: "vip",       label: "VIP Box",       sa: 248, ea: 292 },
  { id: "press",     label: "Press Gallery", sa: 68,  ea: 112 },
];

function polarToXY(
  cx: number,
  cy: number,
  r: number,
  deg: number
): { x: number; y: number } {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutArcPath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  sa: number,
  ea: number
): string {
  const norm = ((ea - sa) + 360) % 360;
  const large = norm > 180 ? 1 : 0;
  const o1 = polarToXY(cx, cy, outerR, sa);
  const o2 = polarToXY(cx, cy, outerR, ea);
  const i1 = polarToXY(cx, cy, innerR, ea);
  const i2 = polarToXY(cx, cy, innerR, sa);
  return [
    `M ${o1.x} ${o1.y}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${o2.x} ${o2.y}`,
    `L ${i1.x} ${i1.y}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${i2.x} ${i2.y}`,
    "Z",
  ].join(" ");
}

function densityColor(d: number): { fill: string; textColor: string; label: string } {
  if (d < 40) return { fill: "#00ff9d", textColor: "#003a22", label: "LOW" };
  if (d < 70) return { fill: "#f5c518", textColor: "#3a2d00", label: "MED" };
  return { fill: "#ff3b3b", textColor: "#3a0000", label: "HIGH" };
}

function waitTime(d: number): string {
  if (d < 40) return "~2 min";
  if (d < 70) return "~8 min";
  return "~15+ min";
}

interface Props {
  sectorDensities: SectorDensities;
}

export default function StadiumMap({ sectorDensities }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  const cx = 200, cy = 200, outerR = 185, innerR = 115;

  const sortedEntries = useMemo(
    () =>
      Object.entries(sectorDensities).sort(([, a], [, b]) => a - b),
    [sectorDensities]
  );

  const lowestEntry = sortedEntries[0];
  const highestEntry = sortedEntries[sortedEntries.length - 1];
  const vipDensity = sectorDensities["vip"] ?? 50;
  const midEntry = sortedEntries[Math.floor(sortedEntries.length / 2)];

  const hoveredSector = SECTORS.find((s) => s.id === hovered);
  const hoveredDensity = hovered ? (sectorDensities[hovered] ?? 50) : 0;
  const lowestSectorLabel =
    SECTORS.find((s) => s.id === lowestEntry?.[0])?.label ?? "North Stand";

  return (
    <div className="w-full">
      {/* SVG Map */}
      <div className="relative">
        <svg
          viewBox="0 0 400 400"
          style={{ width: "100%", maxWidth: 420 }}
          role="img"
          aria-label="Top-down SVG stadium map with 10 clickable crowd density sectors"
        >
          <desc>Top-down SVG stadium map with 10 clickable crowd density sectors</desc>

          {/* Outer boundary */}
          <ellipse cx={200} cy={200} rx={190} ry={170} fill="none" stroke="#1e3a1e" strokeWidth={1} />
          {/* Upper tier ring */}
          <ellipse cx={200} cy={200} rx={150} ry={130} fill="#0a1008" stroke="#0e2a0e" strokeWidth={1} />
          {/* Lower tier */}
          <ellipse cx={200} cy={200} rx={110} ry={90} fill="#0a140a" stroke="#0a200a" strokeWidth={1} />
          {/* Pitch */}
          <ellipse cx={200} cy={200} rx={65} ry={45} fill="#0a1f0a" stroke="#1a3a1a" strokeWidth={1.5} />
          {/* Center circle */}
          <circle cx={200} cy={200} r={15} fill="none" stroke="#1a3a1a" strokeWidth={0.8} />
          {/* Halfway line */}
          <line x1={135} y1={200} x2={265} y2={200} stroke="#1a3a1a" strokeWidth={0.5} />
          {/* Penalty boxes */}
          <rect x={135} y={178} width={26} height={44} fill="none" stroke="#1a3a1a" strokeWidth={0.5} />
          <rect x={239} y={178} width={26} height={44} fill="none" stroke="#1a3a1a" strokeWidth={0.5} />

          {/* Sector arcs */}
          {SECTORS.map((sector) => {
            const density = sectorDensities[sector.id] ?? 50;
            const { fill, textColor, label } = densityColor(density);
            const mid = ((sector.sa + sector.ea) / 2 + 360) % 360;
            const labelPos = polarToXY(cx, cy, (outerR + innerR) / 2, mid);
            const path = donutArcPath(cx, cy, outerR, innerR, sector.sa, sector.ea);
            const isHigh = density >= 70;

            return (
              <g key={sector.id}>
                <path
                  d={path}
                  fill={fill}
                  opacity={hovered === sector.id ? 0.95 : 0.75}
                  tabIndex={0}
                  role="button"
                  aria-label={`${sector.label}: ${Math.round(density)}% capacity, ${label} density. Press Enter to view details.`}
                  style={{
                    cursor: "pointer",
                    transition: "opacity 0.2s",
                    animation: isHigh ? "throb 1.2s ease-in-out infinite" : undefined,
                  }}
                  onMouseEnter={() => setHovered(sector.id)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(sector.id)}
                  onBlur={() => setHovered(null)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setHovered(sector.id);
                    }
                  }}
                />
                {/* Density label text */}
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={8}
                  fontFamily="monospace"
                  fill={textColor}
                  fontWeight="bold"
                  pointerEvents="none"
                  aria-hidden="true"
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* Center label */}
          <text x={200} y={196} textAnchor="middle" fontSize={9} fill="#4c5f57" fontFamily="monospace">
            CAPACITY
          </text>
          <text x={200} y={208} textAnchor="middle" fontSize={11} fill="#00ff9d" fontFamily="monospace" fontWeight="bold">
            82,500
          </text>
        </svg>

        {/* Hover Tooltip */}
        {hovered && hoveredSector && (
          <div
            className="mt-1 mx-auto max-w-xs bg-[#0f172a]/95 border border-[#00ff9d]/30 rounded-xl p-3 text-xs backdrop-blur-sm"
            role="tooltip"
            aria-live="polite"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-white">{hoveredSector.label}</span>
              <span
                className={`font-mono text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  hoveredDensity >= 70
                    ? "bg-[#ff3b3b]/15 text-[#ff3b3b]"
                    : hoveredDensity >= 40
                    ? "bg-[#f5c518]/15 text-[#f5c518]"
                    : "bg-[#00ff9d]/15 text-[#00ff9d]"
                }`}
              >
                {densityColor(hoveredDensity).label}
              </span>
            </div>
            <p className="text-[#7f9a8e]">
              Capacity: <strong className="text-white">{Math.round(hoveredDensity)}%</strong> ·
              Wait: <strong className="text-white">{waitTime(hoveredDensity)}</strong>
            </p>
            {hoveredDensity > 70 && (
              <p className="text-[#f5c518] mt-1">
                → Consider {lowestSectorLabel} instead
              </p>
            )}
          </div>
        )}
      </div>

      {/* Contextual Cards (2×2 grid) */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        {/* Fastest Entry */}
        <div className="border border-[#00ff9d]/20 rounded-xl p-3 bg-[#0f172a]/50">
          <p className="text-[10px] font-mono text-[#4c5f57] mb-1">FASTEST ENTRY</p>
          <p className="text-xs text-[#00ff9d] font-semibold">
            {SECTORS.find((s) => s.id === lowestEntry?.[0])?.label ?? "—"}
          </p>
          <p className="text-[10px] text-[#7f9a8e]">
            {Math.round(lowestEntry?.[1] ?? 0)}% · {waitTime(lowestEntry?.[1] ?? 0)}
          </p>
        </div>

        {/* Avoid Now */}
        <div className="border border-[#ff3b3b]/20 rounded-xl p-3 bg-[#0f172a]/50">
          <p className="text-[10px] font-mono text-[#4c5f57] mb-1">AVOID NOW</p>
          <p className="text-xs text-[#ff3b3b] font-semibold">
            {SECTORS.find((s) => s.id === highestEntry?.[0])?.label ?? "—"}
          </p>
          <p className="text-[10px] text-[#7f9a8e]">
            {Math.round(highestEntry?.[1] ?? 0)}% · {waitTime(highestEntry?.[1] ?? 0)}
          </p>
        </div>

        {/* VIP Access */}
        <div className="border border-[#f5c518]/20 rounded-xl p-3 bg-[#0f172a]/50">
          <p className="text-[10px] font-mono text-[#4c5f57] mb-1">VIP BOX</p>
          <p className="text-xs text-[#f5c518] font-semibold">
            {Math.round(vipDensity)}% capacity
          </p>
          <p className="text-[10px] text-[#7f9a8e]">
            {vipDensity < 60 ? "Access seamless" : "Expect brief delay"}
          </p>
        </div>

        {/* Food Court */}
        <div className="border border-[#00ff9d]/15 rounded-xl p-3 bg-[#0f172a]/50">
          <p className="text-[10px] font-mono text-[#4c5f57] mb-1">FOOD COURT</p>
          <p className="text-xs text-white font-semibold">
            {SECTORS.find((s) => s.id === midEntry?.[0])?.label ?? "West Stand"}
          </p>
          <p className="text-[10px] text-[#7f9a8e]">
            {Math.round(midEntry?.[1] ?? 50)}% · {waitTime(midEntry?.[1] ?? 50)}
          </p>
        </div>
      </div>
    </div>
  );
}
