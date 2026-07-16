/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RotateCw, ZoomIn, ZoomOut, Eye, Layers, ShieldAlert, Zap, Users, Shield, Accessibility, Compass } from "lucide-react";
import { TwinLayer, Gate } from "../types";

interface DigitalTwinProps {
  activeLayer: TwinLayer;
  setActiveLayer: (layer: TwinLayer) => void;
  selectedGate: string | null;
  setSelectedGate: (gate: string | null) => void;
  gates: Gate[];
  onTriggerEvacuation?: () => void;
}

export default function DigitalTwin({
  activeLayer,
  setActiveLayer,
  selectedGate,
  setSelectedGate,
  gates,
  onTriggerEvacuation,
}: DigitalTwinProps) {
  const [rotation, setRotation] = useState(25); // In degrees
  const [zoom, setZoom] = useState(1.0); // scale factor
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // Rotate stadium left/right
  const rotateLeft = () => setRotation((prev) => (prev - 15) % 360);
  const rotateRight = () => setRotation((prev) => (prev + 15) % 360);

  // Zoom controls
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.15, 1.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.15, 0.7));

  // Reset parameters
  const resetView = () => {
    setRotation(25);
    setZoom(1.0);
    setSelectedSection(null);
  };

  // Seating section configurations
  const SECTIONS = [
    { id: "S1", name: "Grandstand North", occupancy: "92%", temp: "21.5°C", queue: "5 min", status: "NOMINAL", x: 100, y: 70 },
    { id: "S2", name: "Premium Suites East", occupancy: "78%", temp: "22.0°C", queue: "2 min", status: "NOMINAL", x: 230, y: 110 },
    { id: "S3", name: "Grandstand South", occupancy: "95%", temp: "21.8°C", queue: "24 min", status: "CONGESTED", x: 180, y: 190 },
    { id: "S4", name: "West Stand Bleachers", occupancy: "86%", temp: "20.9°C", queue: "12 min", status: "MODERATE", x: 50, y: 140 },
  ];

  return (
    <div id="digital-twin-workspace" className="relative w-full h-[520px] bg-[#0F1722]/65 rounded-xl border border-white/5 backdrop-blur-md overflow-hidden flex flex-col">
      {/* Top HUD Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2">
        <div className="flex bg-[#081018]/90 border border-white/5 rounded-lg p-0.5 shadow-lg">
          <button
            id="layer-normal-btn"
            onClick={() => setActiveLayer("normal")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeLayer === "normal"
                ? "bg-[#447F98] text-[#F2FAFF] shadow-[0_0_10px_rgba(111,211,255,0.25)]"
                : "text-[#8EA4B5] hover:text-[#F2FAFF]"
            }`}
          >
            Tactical HUD
          </button>
          <button
            id="layer-crowd-btn"
            onClick={() => setActiveLayer("crowd")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeLayer === "crowd"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                : "text-[#8EA4B5] hover:text-[#F2FAFF]"
            }`}
          >
            Crowd Heatmap
          </button>
          <button
            id="layer-evacuation-btn"
            onClick={() => setActiveLayer("evacuation")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeLayer === "evacuation"
                ? "bg-[#FF5D73]/20 text-[#FF5D73] border border-[#FF5D73]/30 animate-pulse"
                : "text-[#8EA4B5] hover:text-[#F2FAFF]"
            }`}
          >
            Emergency Egress
          </button>
          <button
            id="layer-transport-btn"
            onClick={() => setActiveLayer("transport")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeLayer === "transport"
                ? "bg-[#6FD3FF]/20 text-[#6FD3FF] border border-[#6FD3FF]/30"
                : "text-[#8EA4B5] hover:text-[#F2FAFF]"
            }`}
          >
            Transit
          </button>
          <button
            id="layer-accessibility-btn"
            onClick={() => setActiveLayer("accessibility")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeLayer === "accessibility"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                : "text-[#8EA4B5] hover:text-[#F2FAFF]"
            }`}
          >
            Access AI
          </button>
          <button
            id="layer-energy-btn"
            onClick={() => setActiveLayer("energy")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeLayer === "energy"
                ? "bg-[#59FF89]/20 text-[#59FF89] border border-[#59FF89]/30"
                : "text-[#8EA4B5] hover:text-[#F2FAFF]"
            }`}
          >
            Eco Grid
          </button>
        </div>
      </div>

      {/* Interactive Legend Badge */}
      <div className="absolute top-4 right-4 z-10 flex flex-col items-end space-y-1 text-[10px] font-mono text-[#8EA4B5]">
        <div className="flex items-center space-x-2 bg-[#081018]/80 px-2 py-1 rounded border border-white/5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#59FF89] animate-pulse" />
          <span className="text-white/80">IOT GRID STABLE</span>
        </div>
        <div className="flex items-center space-x-2 bg-[#081018]/80 px-2 py-1 rounded border border-white/5 mt-1">
          <Eye className="w-3 h-3 text-[#6FD3FF]" />
          <span className="text-[#6FD3FF] uppercase">{activeLayer} LAYER ENABLED</span>
        </div>
      </div>

      {/* Floating 3D/Isometric Render Environment */}
      <div className="flex-1 w-full flex items-center justify-center relative cursor-grab active:cursor-grabbing overflow-hidden">
        
        {/* Ambient Grid Mesh background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        {/* Outer space grid coordinate system */}
        <div className="absolute bottom-6 left-6 text-[10px] font-mono text-white/20 select-none space-y-0.5">
          <div>LAT: 40.8135° N</div>
          <div>LON: 74.0745° W</div>
          <div>ALT: 21m COORD</div>
        </div>

        {/* Centerpiece Isometric Stadium */}
        <motion.div
          id="stadium-hologram-stage"
          style={{
            transform: `perspective(1000px) rotateX(60deg) rotateZ(${rotation}deg) scale(${zoom})`,
          }}
          animate={{ rotateZ: rotation }}
          transition={{ type: "spring", stiffness: 60, damping: 20 }}
          className="relative w-96 h-96 transition-all duration-300"
        >
          {/* Animated Particles orbiting stadium */}
          <div className="absolute inset-[-40px] rounded-full border border-[#6FD3FF]/5 animate-spin pointer-events-none duration-10000" />
          <div className="absolute inset-[-20px] rounded-full border border-dashed border-[#6FD3FF]/10 animate-spin pointer-events-none duration-20000" />

          {/* Stadium Base Concrete footprint */}
          <svg viewBox="0 0 300 300" className="w-full h-full drop-shadow-[0_25px_40px_rgba(0,0,0,0.6)]">
            <defs>
              <radialGradient id="fieldGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#447F98" stopOpacity="0.4" />
                <stop offset="60%" stopColor="#081018" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#081018" stopOpacity="0.9" />
              </radialGradient>
              <linearGradient id="gateAGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6FD3FF" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#447F98" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Glowing Floor Plate */}
            <ellipse cx="150" cy="150" rx="140" ry="120" fill="url(#fieldGlow)" stroke="rgba(111,211,255,0.08)" strokeWidth="1" />
            <ellipse cx="150" cy="150" rx="110" ry="90" fill="none" stroke="rgba(111,211,255,0.15)" strokeWidth="1" strokeDasharray="5,5" />

            {/* Dynamic Transit Routes (Transport Layer Only) */}
            {activeLayer === "transport" && (
              <g className="animate-pulse">
                {/* Metro Line */}
                <path d="M 10 150 Q 80 80, 150 150 T 290 150" fill="none" stroke="#6FD3FF" strokeWidth="2.5" strokeDasharray="6,4" />
                {/* Parking flow lines */}
                <path d="M 50 260 Q 150 220, 150 150" fill="none" stroke="#59FF89" strokeWidth="1.5" strokeDasharray="4,4" />
                <circle cx="150" cy="150" r="4" fill="#59FF89" />
              </g>
            )}

            {/* Dynamic Evacuation Paths (Emergency Layer Only) */}
            {activeLayer === "evacuation" && (
              <g>
                {/* Rapid escape vectors flowing outward from core to perimeter gates */}
                <path d="M 150 150 L 50 140" fill="none" stroke="#FF5D73" strokeWidth="2" strokeDasharray="5,3" className="animate-[dash_1.5s_linear_infinite]" />
                <path d="M 150 150 L 230 110" fill="none" stroke="#FF5D73" strokeWidth="2" strokeDasharray="5,3" className="animate-[dash_1.5s_linear_infinite]" />
                <path d="M 150 150 L 180 230" fill="none" stroke="#FF5D73" strokeWidth="2" strokeDasharray="5,3" className="animate-[dash_1.5s_linear_infinite]" />
                <path d="M 150 150 L 100 70" fill="none" stroke="#FF5D73" strokeWidth="2" strokeDasharray="5,3" className="animate-[dash_1.5s_linear_infinite]" />
              </g>
            )}

            {/* Eco Grid (Energy Layer) */}
            {activeLayer === "energy" && (
              <g>
                <circle cx="150" cy="150" r="110" fill="none" stroke="#59FF89" strokeWidth="1" strokeOpacity="0.4" />
                {/* Energy hub nodes */}
                <line x1="150" y1="40" x2="150" y2="260" stroke="#59FF89" strokeWidth="0.5" strokeOpacity="0.3" />
                <line x1="40" y1="150" x2="260" y2="150" stroke="#59FF89" strokeWidth="0.5" strokeOpacity="0.3" />
                {/* Rotating solar panels visual */}
                <circle cx="150" cy="40" r="6" fill="#081018" stroke="#59FF89" strokeWidth="1.5" />
                <circle cx="150" cy="260" r="6" fill="#081018" stroke="#59FF89" strokeWidth="1.5" />
              </g>
            )}

            {/* Accessibility AI layer */}
            {activeLayer === "accessibility" && (
              <g>
                {/* Audio assist beacons & wheelchair ramps */}
                <circle cx="90" cy="110" r="12" fill="none" stroke="purple" strokeWidth="1" strokeDasharray="2,2" className="animate-ping" />
                <circle cx="210" cy="170" r="12" fill="none" stroke="purple" strokeWidth="1" strokeDasharray="2,2" className="animate-ping" />
                <path d="M 90 110 L 120 130" fill="none" stroke="#6FD3FF" strokeWidth="1.5" />
                <path d="M 210 170 L 180 150" fill="none" stroke="#6FD3FF" strokeWidth="1.5" />
              </g>
            )}

            {/* Outer Stadium Ring Wall structure (Interactive) */}
            <g id="stadium-stands">
              {SECTIONS.map((sec) => {
                const isSelected = selectedSection === sec.id;
                
                // Color depending on active layers
                let standFill = "rgba(20, 30, 45, 0.4)";
                let standStroke = "rgba(111, 211, 255, 0.2)";
                
                if (isSelected) {
                  standFill = "rgba(111, 211, 255, 0.25)";
                  standStroke = "#6FD3FF";
                } else if (activeLayer === "crowd") {
                  if (sec.status === "CONGESTED") {
                    standFill = "rgba(239, 68, 68, 0.35)"; // Red
                    standStroke = "#ef4444";
                  } else if (sec.status === "MODERATE") {
                    standFill = "rgba(245, 158, 11, 0.25)"; // Orange
                    standStroke = "#f59e0b";
                  } else {
                    standFill = "rgba(16, 185, 129, 0.15)"; // Green
                    standStroke = "#10b981";
                  }
                } else if (activeLayer === "evacuation") {
                  standFill = sec.status === "CONGESTED" ? "rgba(239, 68, 68, 0.3)" : "rgba(20, 30, 45, 0.2)";
                  standStroke = "#FF5D73";
                } else if (activeLayer === "energy") {
                  standFill = "rgba(89, 255, 137, 0.08)";
                  standStroke = "#59FF89";
                } else if (activeLayer === "accessibility") {
                  standFill = "rgba(168, 85, 247, 0.08)";
                  standStroke = "#a855f7";
                }

                return (
                  <g
                    key={sec.id}
                    className="cursor-pointer group"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSection(isSelected ? null : sec.id);
                    }}
                  >
                    <ellipse
                      cx={sec.x}
                      cy={sec.y}
                      rx="42"
                      ry="28"
                      fill={standFill}
                      stroke={standStroke}
                      strokeWidth={isSelected ? "2" : "1"}
                      className="transition-all duration-300 hover:fill-white/10"
                    />
                    <text
                      x={sec.x}
                      y={sec.y + 4}
                      fill={isSelected ? "#6FD3FF" : "#8EA4B5"}
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                      className="font-bold select-none group-hover:fill-[#F2FAFF]"
                    >
                      {sec.id}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* Outer Halo Shell (Pulsing holographic roof boundary) */}
            <ellipse
              cx="150"
              cy="150"
              rx="125"
              ry="105"
              fill="none"
              stroke={activeLayer === "evacuation" ? "#FF5D73" : "#447F98"}
              strokeWidth="1.5"
              strokeOpacity="0.4"
            />
            
            {/* The Green Pitch Football Field at center */}
            <g id="pitch" className="pointer-events-none">
              <ellipse cx="150" cy="150" rx="60" ry="42" fill="#081018" stroke="rgba(111,211,255,0.4)" strokeWidth="1.2" />
              {/* Field Markings */}
              <line x1="150" y1="108" x2="150" y2="192" stroke="rgba(111,211,255,0.4)" strokeWidth="1" />
              <ellipse cx="150" cy="150" rx="18" ry="12" fill="none" stroke="rgba(111,211,255,0.4)" strokeWidth="1" />
              <circle cx="150" cy="150" r="1.5" fill="#6FD3FF" />
            </g>

            {/* Stadium Perimeter Gates (A, B, C, D) */}
            <g id="perimeter-gates">
              {gates.map((g, idx) => {
                // Coordinate offsets around the perimeter ellipse (approx)
                const coords = [
                  { id: "A", cx: 150, cy: 35, label: "GATE A" }, // North
                  { id: "B", cx: 282, cy: 150, label: "GATE B" }, // East
                  { id: "C", cx: 150, cy: 265, label: "GATE C" }, // South
                  { id: "D", cx: 18, cy: 150, label: "GATE D" }, // West
                ];
                
                const currentCoord = coords.find(c => c.id === g.id) || coords[idx];
                const isSelected = selectedGate === g.id;
                
                let markerColor = "#59FF89"; // NORMAL
                if (g.status === "HEAVY_FLOW") markerColor = "#FFC857";
                if (g.status === "CRITICAL_CONGESTION") markerColor = "#FF5D73";
                if (g.status === "STANDBY") markerColor = "#6FD3FF";

                return (
                  <g
                    key={g.id}
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedGate(isSelected ? null : g.id);
                    }}
                  >
                    {/* Ring highlight */}
                    <circle
                      cx={currentCoord.cx}
                      cy={currentCoord.cy}
                      r={isSelected ? "11" : "8"}
                      fill="rgba(8,16,24,0.95)"
                      stroke={isSelected ? "#6FD3FF" : markerColor}
                      strokeWidth={isSelected ? "2" : "1.2"}
                      className="transition-all duration-200 hover:scale-110"
                    />
                    {/* Small inner pulse */}
                    <circle
                      cx={currentCoord.cx}
                      cy={currentCoord.cy}
                      r="3.5"
                      fill={markerColor}
                      className={g.status === "CRITICAL_CONGESTION" ? "animate-ping" : ""}
                    />
                    {/* Text labels */}
                    <text
                      x={currentCoord.cx}
                      y={currentCoord.cy - 12}
                      fill={isSelected ? "#6FD3FF" : "#8EA4B5"}
                      fontSize="8"
                      fontFamily="monospace"
                      textAnchor="middle"
                      className="font-bold tracking-tight select-none"
                    >
                      {g.id}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </motion.div>
      </div>

      {/* Dynamic Inspector Panel (Overlay Details) */}
      <AnimatePresence>
        {(selectedSection || selectedGate) && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="absolute bottom-4 left-4 right-4 z-20 bg-[#081018]/95 border border-white/10 rounded-xl p-4 shadow-2xl flex items-center justify-between"
          >
            {selectedSection && !selectedGate && (
              (() => {
                const sec = SECTIONS.find((s) => s.id === selectedSection);
                return (
                  <div className="flex-1 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-[#447F98]/20 to-[#6FD3FF]/20 border border-[#6FD3FF]/20 flex items-center justify-center">
                        <Layers className="w-5 h-5 text-[#6FD3FF]" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold font-mono text-[#F2FAFF]">SECTION {sec?.id} • {sec?.name}</h4>
                        <p className="text-[11px] text-[#8EA4B5] uppercase">Interactive Hologram Seating Coordinate</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <span className="block text-[10px] font-mono text-[#8EA4B5] uppercase">Occupancy</span>
                        <span className="text-sm font-mono font-bold text-[#F2FAFF]">{sec?.occupancy}</span>
                      </div>
                      <div className="text-center">
                        <span className="block text-[10px] font-mono text-[#8EA4B5] uppercase">Grid Temp</span>
                        <span className="text-sm font-mono font-bold text-[#6FD3FF]">{sec?.temp}</span>
                      </div>
                      <div className="text-center">
                        <span className="block text-[10px] font-mono text-[#8EA4B5] uppercase">Queue Latency</span>
                        <span className="text-sm font-mono font-bold text-amber-300">{sec?.queue}</span>
                      </div>
                      <div className="text-center">
                        <span className="block text-[10px] font-mono text-[#8EA4B5] uppercase">Status</span>
                        <span className={`text-xs font-mono font-bold ${
                          sec?.status === "NOMINAL" ? "text-[#59FF89]" :
                          sec?.status === "MODERATE" ? "text-amber-300" : "text-[#FF5D73]"
                        }`}>{sec?.status}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedSection(null)}
                      className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded text-xs font-mono text-[#8EA4B5] hover:text-white"
                    >
                      Dismiss
                    </button>
                  </div>
                );
              })()
            )}

            {selectedGate && (
              (() => {
                const gt = gates.find((g) => g.id === selectedGate);
                return (
                  <div className="flex-1 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-[#6FD3FF]/20 to-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <Compass className="w-5 h-5 text-[#59FF89]" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold font-mono text-[#F2FAFF]">GATE {gt?.id} OPERATIONAL OVERVIEW</h4>
                        <p className="text-[11px] text-[#8EA4B5] uppercase">Access Terminal IoT Feed</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <span className="block text-[10px] font-mono text-[#8EA4B5] uppercase">Flow Rate</span>
                        <span className="text-sm font-mono font-bold text-[#F2FAFF]">{gt?.flowRate}</span>
                      </div>
                      <div className="text-center">
                        <span className="block text-[10px] font-mono text-[#8EA4B5] uppercase">Wait Time</span>
                        <span className="text-sm font-mono font-bold text-amber-400">{gt?.waitTime}</span>
                      </div>
                      <div className="text-center">
                        <span className="block text-[10px] font-mono text-[#8EA4B5] uppercase">Accessibility Access</span>
                        <span className="text-sm font-mono font-bold text-purple-400">{gt?.accessibilityLevel}</span>
                      </div>
                      <div className="text-center">
                        <span className="block text-[10px] font-mono text-[#8EA4B5] uppercase">Telemetry Status</span>
                        <span className={`text-xs font-mono font-bold ${
                          gt?.status === "NORMAL" ? "text-[#59FF89]" :
                          gt?.status === "STANDBY" ? "text-[#6FD3FF]" :
                          gt?.status === "HEAVY_FLOW" ? "text-amber-300" : "text-[#FF5D73]"
                        }`}>{gt?.status}</span>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      {gt?.status === "CRITICAL_CONGESTION" && onTriggerEvacuation && (
                        <button
                          onClick={onTriggerEvacuation}
                          className="px-3 py-1.5 bg-[#FF5D73] hover:bg-[#FF5D73]/80 rounded text-xs font-semibold text-white transition-all shadow-md animate-pulse"
                        >
                          Resolve Crowd
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedGate(null)}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded text-xs font-mono text-[#8EA4B5] hover:text-white"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                );
              })()
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Floating Control Panel Bar */}
      <div className="absolute bottom-4 right-4 z-10 flex space-x-1.5 bg-[#081018]/90 p-1.5 rounded-lg border border-white/5 shadow-xl">
        <button
          onClick={rotateLeft}
          title="Rotate Left"
          className="p-2 bg-white/5 hover:bg-white/10 rounded text-[#8EA4B5] hover:text-[#F2FAFF] transition"
        >
          <RotateCw className="w-4 h-4 transform -scale-x-100" />
        </button>
        <button
          onClick={rotateRight}
          title="Rotate Right"
          className="p-2 bg-white/5 hover:bg-white/10 rounded text-[#8EA4B5] hover:text-[#F2FAFF] transition"
        >
          <RotateCw className="w-4 h-4" />
        </button>
        <div className="w-[1px] bg-white/10 my-1" />
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-2 bg-white/5 hover:bg-white/10 rounded text-[#8EA4B5] hover:text-[#F2FAFF] transition"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-2 bg-white/5 hover:bg-white/10 rounded text-[#8EA4B5] hover:text-[#F2FAFF] transition"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-[1px] bg-white/10 my-1" />
        <button
          onClick={resetView}
          title="Reset Stadium Camera"
          className="px-2.5 py-1 text-[10px] font-mono bg-white/5 hover:bg-[#447F98]/20 hover:text-[#6FD3FF] rounded text-[#8EA4B5] transition flex items-center"
        >
          RESET
        </button>
      </div>
    </div>
  );
}
