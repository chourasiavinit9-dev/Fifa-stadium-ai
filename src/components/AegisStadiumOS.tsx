"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { sanitizeText, containsMaliciousPattern, AnomalyReportSchema } from "../lib/validators";
import type { z } from "zod";

type AnomalyReport = z.infer<typeof AnomalyReportSchema>;

interface Sector {
  id: string;
  label: string;
  sa: number;
  ea: number;
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

function polarToXY(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutArcPath(cx: number, cy: number, outerR: number, innerR: number, sa: number, ea: number): string {
  const norm = ((ea - sa) + 360) % 360;
  const large = norm > 180 ? 1 : 0;
  const o1 = polarToXY(cx, cy, outerR, sa);
  const o2 = polarToXY(cx, cy, outerR, ea);
  const i1 = polarToXY(cx, cy, innerR, ea);
  const i2 = polarToXY(cx, cy, innerR, sa);
  return `M ${o1.x} ${o1.y} A ${outerR} ${outerR} 0 ${large} 1 ${o2.x} ${o2.y} L ${i1.x} ${i1.y} A ${innerR} ${innerR} 0 ${large} 0 ${i2.x} ${i2.y} Z`;
}

function densityColor(d: number) {
  if (d < 40) return { fill: "#00ff9d", textColor: "#003a22", label: "LOW" };
  if (d < 70) return { fill: "#f5c518", textColor: "#3a2d00", label: "MED" };
  return { fill: "#ff3b3b", textColor: "#3a0000", label: "HIGH" };
}

interface Notification {
  id: string;
  text: string;
  time: string;
  severity: string;
}

interface OpsRec {
  action: string;
  rationale: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  eta: string;
}

interface Props {
  onSectorDensitiesChange?: (d: Record<string, number>) => void;
  onIncidentCountChange?: (n: number) => void;
}

type ActiveTab = "Organizer" | "Security Personnel" | "Medical Team";

export default function AegisStadiumOS({ onSectorDensitiesChange, onIncidentCountChange }: Props) {
  const cx = 160, cy = 160, outerR = 128, innerR = 58;

  const [activeTab, setActiveTab] = useState<ActiveTab>("Organizer");
  const [attendance, setAttendance] = useState(58432);
  const [sectorDensities, setSectorDensities] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    SECTORS.forEach((s) => { init[s.id] = Math.floor(Math.random() * 60) + 20; });
    return init;
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSector, setModalSector] = useState("");
  const [incidentCount, setIncidentCount] = useState(3);
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: "1", text: "Gate C surge detected — re-routing in progress", time: "14:32", severity: "High Priority" },
    { id: "2", text: "Metro Line 4 frequency maximised", time: "14:28", severity: "Low" },
    { id: "3", text: "Medical team standby activated — Section 212", time: "14:19", severity: "Medium" },
  ]);
  const [formData, setFormData] = useState<Partial<AnomalyReport>>({ description: "" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitState, setSubmitState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [opsRec, setOpsRec] = useState<OpsRec | null>(null);
  const [opsRecLoading, setOpsRecLoading] = useState(false);

  const rotAngle = useRef(0);
  const frameCount = useRef(0);
  const animRef = useRef<number>(0);
  const [rotDisplay, setRotDisplay] = useState(0);

  const lastHighSectors = useRef(new Set<string>());
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // RAF for ring rotation
  useEffect(() => {
    const loop = () => {
      rotAngle.current += 0.04;
      frameCount.current++;
      if (frameCount.current % 3 === 0) setRotDisplay(rotAngle.current);
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  // Attendance random walk
  useEffect(() => {
    const iv = setInterval(() => {
      setAttendance((a) => Math.max(55000, Math.min(82500, a + Math.round((Math.random() - 0.5) * 400))));
    }, 5000);
    return () => clearInterval(iv);
  }, []);

  // Sector density random walk + AI trigger
  useEffect(() => {
    const iv = setInterval(() => {
      setSectorDensities((prev) => {
        const next = { ...prev };
        SECTORS.forEach((s) => {
          next[s.id] = Math.max(0, Math.min(100, (prev[s.id] ?? 50) + (Math.random() - 0.5) * 24));
        });

        // Check thresholds for AI trigger
        SECTORS.forEach((sector) => {
          const density = next[sector.id] ?? 0;
          if (density > 80 && !lastHighSectors.current.has(sector.id)) {
            lastHighSectors.current.add(sector.id);
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
            debounceTimer.current = setTimeout(async () => {
              setOpsRecLoading(true);
              const adjacent = Object.fromEntries(
                SECTORS.filter((s) => s.id !== sector.id)
                  .slice(0, 3)
                  .map((s) => [s.label, Math.round(next[s.id] ?? 50)])
              );
              try {
                const res = await fetch("/api/gemini-ops", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    sectorName: sector.label,
                    density: Math.round(density),
                    adjacentDensities: adjacent,
                    activeIncidents: incidentCount,
                    activeOperations: ["Gate B surge management", "Medical standby"],
                  }),
                });
                const data = await res.json() as { recommendation: OpsRec };
                setOpsRec(data.recommendation);
              } catch {
                setOpsRec({
                  action: "Contact control room for guidance",
                  rationale: "AI recommendation unavailable — manual assessment required",
                  priority: "Medium",
                  eta: "N/A",
                });
              }
              setOpsRecLoading(false);
            }, 5000);
          }
          if (density <= 80 && lastHighSectors.current.has(sector.id)) {
            lastHighSectors.current.delete(sector.id);
          }
        });

        onSectorDensitiesChange?.(next);
        return next;
      });
    }, 3000);
    return () => clearInterval(iv);
  }, [incidentCount, onSectorDensitiesChange]);

  // Modal escape key
  useEffect(() => {
    if (!modalOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeModal(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [modalOpen]);

  // Focus trap on modal open
  useEffect(() => {
    if (modalOpen) {
      setTimeout(() => document.getElementById("incident-title")?.focus(), 50);
    }
  }, [modalOpen]);

  const openModal = useCallback((sector: string) => {
    setModalSector(sector);
    setFormData({ description: "", location: sector });
    setFormErrors({});
    setSubmitState("idle");
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setFormErrors({});
    setSubmitState("idle");
  }, []);

  const handleSubmit = async () => {
    const result = AnomalyReportSchema.safeParse(formData);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((i) => { if (i.path[0]) errs[String(i.path[0])] = i.message; });
      setFormErrors(errs);
      return;
    }
    setSubmitState("loading");
    try {
      const res = await fetch("/api/anomaly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });
      if (!res.ok) throw new Error("Submit failed");
      setSubmitState("success");
      setTimeout(() => {
        closeModal();
        const newCount = incidentCount + 1;
        setIncidentCount(newCount);
        onIncidentCountChange?.(newCount);
        setNotifications((p) => [
          {
            id: crypto.randomUUID(),
            text: result.data.incidentTitle,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            severity: result.data.severity,
          },
          ...p.slice(0, 9),
        ]);
      }, 1800);
    } catch {
      setSubmitState("error");
    }
  };

  const priorityColors: Record<string, string> = {
    Critical: "border-[#ff3b3b]/60 bg-[#ff3b3b]/10",
    High: "border-[#f5c518]/60 bg-[#f5c518]/10",
    Medium: "border-blue-500/60 bg-blue-500/10",
    Low: "border-[#00ff9d]/40 bg-[#00ff9d]/10",
  };

  const sortedSectors = Object.entries(sectorDensities).sort(([, a], [, b]) => b - a);

  return (
    <div className="w-full">
      {/* Tab bar */}
      <div role="tablist" aria-label="Stadium operations role tabs" className="flex gap-1 mb-4 p-1 bg-[#0f172a]/60 rounded-xl border border-[#00ff9d]/10">
        {(["Organizer", "Security Personnel", "Medical Team"] as ActiveTab[]).map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 text-xs py-2 px-3 rounded-lg font-medium transition-all ${
              activeTab === tab
                ? "bg-[#00ff9d]/15 text-[#00ff9d] border border-[#00ff9d]/30"
                : "text-[#4c5f57] hover:text-[#7f9a8e]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main 3-col grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: KPIs */}
        <div className="space-y-3">
          <div className="bg-[#0f172a]/60 border border-[#00ff9d]/10 rounded-xl p-4">
            <p className="text-[10px] font-mono text-[#4c5f57] mb-1">LIVE ATTENDANCE</p>
            <p className="text-2xl font-bold text-[#00ff9d] font-mono">{attendance.toLocaleString()}</p>
            <div className="h-1 bg-[#0a1008] rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-[#00ff9d] rounded-full transition-all duration-500" style={{ width: `${(attendance / 82500) * 100}%` }} />
            </div>
            <p className="text-[10px] text-[#4c5f57] mt-1">{((attendance / 82500) * 100).toFixed(1)}% of 82,500</p>
          </div>

          <div className="bg-[#0f172a]/60 border border-[#00ff9d]/10 rounded-xl p-4">
            <p className="text-[10px] font-mono text-[#4c5f57] mb-2">SECTOR LEGEND</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs"><span className="w-3 h-3 rounded-sm bg-[#00ff9d]" /><span className="text-[#7f9a8e]">LOW — below 40%</span></div>
              <div className="flex items-center gap-2 text-xs"><span className="w-3 h-3 rounded-sm bg-[#f5c518]" /><span className="text-[#7f9a8e]">MED — 40–70%</span></div>
              <div className="flex items-center gap-2 text-xs"><span className="w-3 h-3 rounded-sm bg-[#ff3b3b]" /><span className="text-[#7f9a8e]">HIGH — above 70%</span></div>
            </div>
          </div>

          <div className="bg-[#0f172a]/60 border border-[#f5c518]/20 rounded-xl p-4">
            <p className="text-[10px] font-mono text-[#4c5f57] mb-1">INCIDENTS</p>
            <p className="text-2xl font-bold text-[#f5c518] font-mono">{incidentCount}</p>
            <p className="text-[10px] text-[#7f9a8e]">Active reports</p>
          </div>
        </div>

        {/* Center: SVG donut map */}
        <div className="flex flex-col items-center">
          <div className="relative w-full max-w-[340px]">
            {/* Decorative rotating rings */}
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none"
              style={{ transform: `rotate(${rotDisplay}rad)`, transition: "none" }}
            >
              <svg viewBox="0 0 320 320" className="w-full opacity-10">
                <circle cx={160} cy={160} r={148} fill="none" stroke="#00ff9d" strokeWidth={0.5} strokeDasharray="6 4" />
                <circle cx={160} cy={160} r={138} fill="none" stroke="#00ff9d" strokeWidth={0.3} strokeDasharray="3 8" />
              </svg>
            </div>

            <svg viewBox="0 0 320 320" style={{ width: "100%" }} role="img" aria-label="Stadium sector density donut map">
              {/* Core circle */}
              <circle cx={cx} cy={cy} r={innerR - 4} fill="#020617" stroke="#0f2a1a" strokeWidth={1} />
              <text x={cx} y={cy - 8} textAnchor="middle" fontSize={9} fill="#4c5f57" fontFamily="monospace">AEGIS OS</text>
              <text x={cx} y={cy + 6} textAnchor="middle" fontSize={10} fill="#00ff9d" fontFamily="monospace" fontWeight="bold">LIVE</text>
              <text x={cx} y={cy + 20} textAnchor="middle" fontSize={8} fill="#4c5f57" fontFamily="monospace">v4.1</text>

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
                      opacity={0.8}
                      tabIndex={0}
                      role="button"
                      aria-label={`${sector.label}: ${Math.round(density)}% capacity, ${label} density. Press Enter to report anomaly.`}
                      style={{
                        cursor: "pointer",
                        animation: isHigh ? "throb 1.2s ease-in-out infinite" : undefined,
                        outline: "none",
                      }}
                      onClick={() => openModal(sector.label)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openModal(sector.label);
                        }
                      }}
                    />
                    <text
                      x={labelPos.x}
                      y={labelPos.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={7}
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
            </svg>
          </div>
          <p className="text-[10px] font-mono text-[#4c5f57] mt-1">Click any sector to report anomaly</p>
        </div>

        {/* Right: tab-dependent content */}
        <div className="space-y-3">
          {activeTab === "Organizer" && (
            <>
              {/* AI Ops Recommendation */}
              {opsRecLoading && (
                <div className="border border-[#00ff9d]/20 rounded-xl p-4 bg-[#0f172a]/60">
                  <p className="text-[10px] font-mono text-[#4c5f57] mb-2">AI RECOMMENDATION</p>
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="w-2 h-2 bg-[#00ff9d] rounded-full animate-bounce" style={{ animationDelay: `${i * 0.16}s` }} />
                    ))}
                  </div>
                </div>
              )}
              {opsRec && !opsRecLoading && (
                <div className={`border rounded-xl p-4 ${priorityColors[opsRec.priority] ?? priorityColors.Medium}`}>
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-[10px] font-mono text-[#4c5f57]">AI RECOMMENDATION</p>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                      opsRec.priority === "Critical" ? "bg-[#ff3b3b]/20 text-[#ff3b3b]" :
                      opsRec.priority === "High" ? "bg-[#f5c518]/20 text-[#f5c518]" :
                      "bg-blue-500/20 text-blue-400"
                    }`}>{opsRec.priority}</span>
                  </div>
                  <p className="text-sm text-white font-semibold mb-1">{opsRec.action}</p>
                  <p className="text-[11px] text-[#7f9a8e] mb-2">{opsRec.rationale}</p>
                  <p className="text-[10px] text-[#4c5f57]">ETA: {opsRec.eta}</p>
                  <button
                    onClick={() => { setOpsRec(null); setIncidentCount((c) => c + 1); }}
                    className="mt-3 w-full text-xs py-1.5 border border-[#00ff9d]/30 text-[#00ff9d] rounded-lg hover:bg-[#00ff9d]/10 transition-colors"
                  >
                    ✓ Acknowledged
                  </button>
                </div>
              )}

              {/* Notifications */}
              <div className="bg-[#0f172a]/60 border border-[#00ff9d]/10 rounded-xl p-4" aria-live="polite">
                <p className="text-[10px] font-mono text-[#4c5f57] mb-2">NOTIFICATIONS</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className="text-xs border-l-2 border-[#00ff9d]/30 pl-2">
                      <p className="text-[#e6f1ec]">{n.text}</p>
                      <p className="text-[#4c5f57] text-[10px]">{n.time} · {n.severity}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === "Security Personnel" && (
            <>
              <div className="bg-[#0f172a]/60 border border-[#f5c518]/20 rounded-xl p-4">
                <p className="text-[10px] font-mono text-[#4c5f57] mb-2">HIGHEST DENSITY SECTORS</p>
                <div className="space-y-2">
                  {sortedSectors.slice(0, 5).map(([id, density]) => {
                    const sector = SECTORS.find((s) => s.id === id);
                    const { fill, label } = densityColor(density);
                    return (
                      <div key={id} className="flex justify-between items-center text-xs">
                        <span className="text-[#7f9a8e]">{sector?.label ?? id}</span>
                        <span className="font-mono font-bold" style={{ color: fill }}>{Math.round(density)}% {label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="bg-[#0f172a]/60 border border-[#ff3b3b]/20 rounded-xl p-4">
                <p className="text-[10px] font-mono text-[#4c5f57] mb-2">CAMERA ALERTS</p>
                <p className="text-sm text-white">Gate C: <span className="text-[#ff3b3b] font-bold">CRITICAL</span></p>
                <p className="text-sm text-white">Concession B: <span className="text-[#f5c518] font-bold">BUSY</span></p>
                <p className="text-xs text-[#7f9a8e] mt-1">{incidentCount} active incidents</p>
              </div>
            </>
          )}

          {activeTab === "Medical Team" && (
            <>
              <div className="bg-[#0f172a]/60 border border-[#00ff9d]/10 rounded-xl p-4">
                <p className="text-[10px] font-mono text-[#4c5f57] mb-2">INCIDENT SUMMARY</p>
                <p className="text-2xl font-bold text-[#ff3b3b] font-mono">{incidentCount}</p>
                <p className="text-[10px] text-[#7f9a8e]">Total incidents reported</p>
              </div>
              <div className="bg-[#0f172a]/60 border border-[#00ff9d]/10 rounded-xl p-4">
                <p className="text-[10px] font-mono text-[#4c5f57] mb-2">FIRST AID POINTS</p>
                <div className="space-y-1 text-xs text-[#7f9a8e]">
                  <p>🏥 Gate A — West concourse, Level 1</p>
                  <p>🏥 Gate C — North tunnel, Level 2</p>
                  <p>🏥 VIP Box — Dedicated medical suite</p>
                </div>
              </div>
              <div className="bg-[#0f172a]/60 border border-[#f5c518]/20 rounded-xl p-4">
                <p className="text-[10px] font-mono text-[#4c5f57] mb-2">RESPONSE TEAMS</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-[#7f9a8e]">Team Alpha</span><span className="text-[#00ff9d]">ON STANDBY</span></div>
                  <div className="flex justify-between"><span className="text-[#7f9a8e]">Team Bravo</span><span className="text-[#f5c518]">DEPLOYED</span></div>
                  <div className="flex justify-between"><span className="text-[#7f9a8e]">Ambulance 1</span><span className="text-[#00ff9d]">READY</span></div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Anomaly Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={closeModal} />
          <div className="relative z-10 bg-[#0a140a] border border-[#00ff9d]/20 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h2 id="modal-title" className="text-lg font-bold text-white mb-1">Report Anomaly</h2>
            <p className="text-[11px] text-[#4c5f57] mb-4">Sector: {modalSector}</p>

            <div className="space-y-3">
              <div>
                <label htmlFor="incident-title" className="block text-xs text-[#7f9a8e] mb-1">Incident Title *</label>
                <input
                  id="incident-title"
                  type="text"
                  maxLength={200}
                  value={formData.incidentTitle ?? ""}
                  onChange={(e) => setFormData((p) => ({ ...p, incidentTitle: e.target.value }))}
                  className="w-full bg-[#020617] border border-[#00ff9d]/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#00ff9d]/50 min-h-[44px]"
                  placeholder="Brief description of the incident"
                />
                {formErrors.incidentTitle && <p className="text-[#ff3b3b] text-[10px] mt-0.5">{formErrors.incidentTitle}</p>}
              </div>

              <div>
                <label htmlFor="severity-select" className="block text-xs text-[#7f9a8e] mb-1">Severity *</label>
                <select
                  id="severity-select"
                  value={formData.severity ?? ""}
                  onChange={(e) => setFormData((p) => ({ ...p, severity: e.target.value as AnomalyReport["severity"] }))}
                  className="w-full bg-[#020617] border border-[#00ff9d]/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#00ff9d]/50 min-h-[44px]"
                >
                  <option value="">Select severity</option>
                  {["Low", "Medium", "High Priority", "Safety Hazard"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {formErrors.severity && <p className="text-[#ff3b3b] text-[10px] mt-0.5">{formErrors.severity}</p>}
              </div>

              <div>
                <label htmlFor="location-input" className="block text-xs text-[#7f9a8e] mb-1">Location *</label>
                <input
                  id="location-input"
                  type="text"
                  maxLength={100}
                  value={formData.location ?? ""}
                  onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
                  className="w-full bg-[#020617] border border-[#00ff9d]/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#00ff9d]/50 min-h-[44px]"
                  placeholder="e.g. Section 212, Gate C"
                />
                {formErrors.location && <p className="text-[#ff3b3b] text-[10px] mt-0.5">{formErrors.location}</p>}
              </div>

              <div>
                <label htmlFor="description-input" className="block text-xs text-[#7f9a8e] mb-1">Description</label>
                <textarea
                  id="description-input"
                  maxLength={1000}
                  rows={3}
                  value={formData.description ?? ""}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  className="w-full bg-[#020617] border border-[#00ff9d]/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#00ff9d]/50 resize-none"
                  placeholder="Additional details..."
                />
              </div>

              {formData.severity === "Safety Hazard" && (
                <div aria-live="assertive" role="alert" className="bg-[#ff3b3b]/10 border border-[#ff3b3b]/30 rounded-lg p-3 text-xs text-[#ff3b3b]">
                  ⚠ This will auto-escalate to emergency services.
                </div>
              )}

              {submitState === "error" && (
                <p role="alert" className="text-[#ff3b3b] text-xs">Submission failed. Please try again.</p>
              )}

              {submitState === "success" && (
                <p role="status" className="text-[#00ff9d] text-xs">✓ Report submitted successfully</p>
              )}
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={closeModal}
                className="flex-1 py-2.5 border border-[#00ff9d]/20 rounded-xl text-sm text-[#7f9a8e] hover:text-white transition-colors min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitState === "loading" || submitState === "success"}
                className="flex-1 py-2.5 bg-[#00ff9d]/15 border border-[#00ff9d]/40 rounded-xl text-sm text-[#00ff9d] font-semibold hover:bg-[#00ff9d]/25 transition-colors disabled:opacity-50 min-h-[44px]"
              >
                {submitState === "loading" ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
