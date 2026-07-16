/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, Clock, ShieldCheck, Thermometer, Cpu, BatteryCharging, 
  Bell, VolumeX, Volume2, Compass, Eye, Trophy
} from "lucide-react";

import Onboarding from "./components/Onboarding";
import DigitalTwin from "./components/DigitalTwin";
import JarvisAssistant from "./components/JarvisAssistant";
import StadiumOperationsPanels from "./components/StadiumOperationsPanels";
import FifaLandingPage from "./components/FifaLandingPage";
import AegisStadiumOS from "./components/AegisStadiumOS";
import CctvAnalyzer from "./components/CctvAnalyzer";
import OrganizerDashboard from "./components/OrganizerDashboard";
import StadiumMap from "./components/StadiumMap";
import LiveScoreBoard from "./components/LiveScoreBoard";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { TelemetryData, Gate, IncidentAlert, TwinLayer, OperationScenario } from "./types";
import type { WorldCupData } from "./lib/worldcupApi";

export default function App() {
  const [booting, setBooting] = useState(true);
  const [activeLayer, setActiveLayer] = useState<TwinLayer>("normal");
  const [selectedGate, setSelectedGate] = useState<string | null>(null);
  const [scenario, setScenario] = useState<OperationScenario>("nominal");
  const [audioMuted, setAudioMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState("");
  const [currentMode, setCurrentMode] = useState<"landing" | "ops">("landing");
  const [transitioning, setTransitioning] = useState(false);
  const [transitionStep, setTransitionStep] = useState(0);
  const [wcData, setWcData] = useState<WorldCupData | null>(null);
  const [sectorDensities, setSectorDensities] = useState<Record<string, number>>({});
  const [dashboardTab, setDashboardTab] = useState<"twin" | "aegis" | "cctv" | "analytics" | "map">("aegis");

  // Fetch World Cup data for dashboard analytics
  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/worldcup");
        if (res.ok) setWcData(await res.json());
      } catch { /* silently ignore */ }
    };
    if (currentMode === "ops") load();
  }, [currentMode]);

  // Live ticking Telemetry Data
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    venue: "MetLife Stadium (FIFA 2026 Venue - NY/NJ)",
    capacity: 82500,
    currentOccupancy: 78120,
    queueTimeAverage: 8,
    aiConfidence: 99.8,
    energySourcedRenewable: 42,
    waterRecycledGallons: 140000,
    wasteDiversionRate: 94.2,
    trafficDelayMinutes: 4,
    metroStatus: "NOMINAL",
    activeIncidentsCount: 0,
    weatherTemp: 21,
    weatherCondition: "Clear Retractable Roof Open",
    activeVolunteers: 450,
  });

  // Dynamic Gate feeds
  const [gates, setGates] = useState<Gate[]>([
    { id: "A", status: "NORMAL", flowRate: "120 p/min", waitTime: "8 mins", accessibilityLevel: "HIGH" },
    { id: "B", status: "NORMAL", flowRate: "185 p/min", waitTime: "11 mins", accessibilityLevel: "HIGH" },
    { id: "C", status: "HEAVY_FLOW", flowRate: "280 p/min", waitTime: "22 mins", accessibilityLevel: "MEDIUM" },
    { id: "D", status: "STANDBY", flowRate: "45 p/min", waitTime: "3 mins", accessibilityLevel: "MAX" },
  ]);

  // Notifications state
  const [alerts, setAlerts] = useState<IncidentAlert[]>([
    {
      id: "init",
      title: "AEGIS CORE ONLINE",
      category: "SECURITY",
      message: "Security firewall verified. Generative AI operational grids online.",
      severity: "INFO",
      timestamp: "10:54",
    }
  ]);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);

  // Dynamic time clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-US", { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Simulating live ticking occupancy & renewable metrics to make it feel "alive"
  useEffect(() => {
    if (booting) return;
    const liveStatsInterval = setInterval(() => {
      setTelemetry((prev) => {
        // Slowly tick visitors up as they scan tickets
        const newOccupancy = prev.currentOccupancy < prev.capacity - 100
          ? prev.currentOccupancy + Math.floor(Math.random() * 8) + 2
          : prev.currentOccupancy;
        
        // Solar panels flux slightly
        const solarFlux = Math.min(100, Math.max(30, prev.energySourcedRenewable + (Math.random() * 1.6 - 0.8)));

        return {
          ...prev,
          currentOccupancy: newOccupancy,
          energySourcedRenewable: Number(solarFlux.toFixed(1)),
        };
      });
    }, 4500);

    return () => clearInterval(liveStatsInterval);
  }, [booting]);

  // Handle Scenario trigger overrides
  useEffect(() => {
    if (scenario === "gate-overflow") {
      // Modify Gate C status
      setGates((prev) => 
        prev.map((g) => g.id === "C" ? { ...g, status: "CRITICAL_CONGESTION", flowRate: "390 p/min", waitTime: "45 mins" } : g)
      );
      setTelemetry((prev) => ({ ...prev, queueTimeAverage: 24, activeIncidentsCount: 1 }));
    } else if (scenario === "emergency-evac") {
      // Trigger disaster indicators
      setGates((prev) => [
        { id: "A", status: "STANDBY", flowRate: "520 p/min", waitTime: "1 min", accessibilityLevel: "HIGH" },
        { id: "B", status: "STANDBY", flowRate: "490 p/min", waitTime: "1 min", accessibilityLevel: "HIGH" },
        { id: "C", status: "CRITICAL_CONGESTION", flowRate: "120 p/min", waitTime: "Locked Outbound Only", accessibilityLevel: "MEDIUM" },
        { id: "D", status: "STANDBY", flowRate: "550 p/min", waitTime: "1 min", accessibilityLevel: "MAX" },
      ]);
      setTelemetry((prev) => ({ ...prev, activeIncidentsCount: 3, queueTimeAverage: 1 }));
    } else if (scenario === "severe-weather") {
      setTelemetry((prev) => ({ 
        ...prev, 
        weatherCondition: "Retractable Roof CLOSED (Severe Storm cell cell cell approach)",
        weatherTemp: 19,
        activeIncidentsCount: 2 
      }));
    } else {
      // Nominal
      setGates([
        { id: "A", status: "NORMAL", flowRate: "120 p/min", waitTime: "8 mins", accessibilityLevel: "HIGH" },
        { id: "B", status: "NORMAL", flowRate: "185 p/min", waitTime: "11 mins", accessibilityLevel: "HIGH" },
        { id: "C", status: "HEAVY_FLOW", flowRate: "280 p/min", waitTime: "22 mins", accessibilityLevel: "MEDIUM" },
        { id: "D", status: "STANDBY", flowRate: "45 p/min", waitTime: "3 mins", accessibilityLevel: "MAX" },
      ]);
      setTelemetry((prev) => ({ ...prev, queueTimeAverage: 8, activeIncidentsCount: 0 }));
    }
  }, [scenario]);

  const pushAlert = (title: string, message: string, severity: "INFO" | "WARNING" | "CRITICAL") => {
    const alert: IncidentAlert = {
      id: Math.random().toString(),
      title,
      category: "SECURITY",
      message,
      severity,
      timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
    };
    setAlerts((prev) => [alert, ...prev]);
    // Optionally alert audio-chime
    if (!audioMuted) {
      try {
        const context = new AudioContext();
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.connect(gain);
        gain.connect(context.destination);
        osc.frequency.setValueAtTime(severity === "CRITICAL" ? 660 : 440, context.currentTime);
        gain.gain.setValueAtTime(0.12, context.currentTime);
        osc.start();
        osc.stop(context.currentTime + 0.15);
      } catch (e) {}
    }
  };

  // Local helper functions passed to children
  const handleOptimizeEnergy = () => {
    pushAlert(
      "HVAC GRID TUNED SUCCESSFUL",
      "Power loads inside hospitality boxes throttled down by 30%. Saving 8,400 kWh.",
      "INFO"
    );
  };

  const handleSimulateEvacOverride = () => {
    setScenario("emergency-evac");
    pushAlert(
      "EVAC PROTOCOL ACTIVE",
      "Dynamic signage network redirected. All security doors unlocked. Audio assists beacons active.",
      "CRITICAL"
    );
  };

  const clearAlerts = () => {
    setAlerts([]);
  };

  return (
    <div id="aegis-root" className="min-h-screen bg-[#081018] text-[#F2FAFF] font-sans antialiased overflow-x-hidden selection:bg-[#6FD3FF]/30 selection:text-white pb-12 relative">
      
      {/* Background Grid Particles mesh & Ambient Scanlines */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(68,127,152,0.12)_0%,rgba(8,16,24,0)_60%)]" />
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] opacity-40" />
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />

      <AnimatePresence mode="wait">
        {booting ? (
          <Onboarding key="booting-sequence" onComplete={() => setBooting(false)} />
        ) : transitioning ? (
          /* ── Cinematic AEGIS Boot Transition ─────────────────────────────── */
          <motion.div
            key="transition-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9999] bg-[#030508] flex flex-col items-center justify-center"
            aria-live="assertive"
            aria-label="Loading AEGIS Mission Control"
          >
            {/* Grid overlay */}
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(124,255,42,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(124,255,42,0.025) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
            {/* Ambient green blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#7CFF2A]/5 blur-3xl pointer-events-none" />

            {/* Logo */}
            <div className="text-center space-y-8 z-10 min-w-[300px]">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="flex items-center justify-center gap-3"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#7CFF2A] flex items-center justify-center shadow-[0_0_40px_rgba(124,255,42,0.4)]">
                  <Cpu className="w-7 h-7 text-black" />
                </div>
                <div className="text-left">
                  <div className="text-3xl font-black font-['Space_Grotesk',sans-serif] text-[#7CFF2A] tracking-tight">AEGIS</div>
                  <div className="text-[10px] font-mono text-[#7CFF2A]/40 tracking-[0.3em] uppercase">Mission Control</div>
                </div>
              </motion.div>

              {/* Boot steps */}
              <div className="space-y-3 text-left">
                {[
                  "Authenticating secure access...",
                  "Loading crowd intelligence matrix...",
                  "Syncing live telemetry feeds...",
                  "Control tower ready.",
                ].map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: transitionStep >= i ? 1 : 0, x: transitionStep >= i ? 0 : -10 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-3 text-[12px] font-mono"
                  >
                    <span style={{ color: transitionStep >= i ? "#7CFF2A" : "#1a2a15" }}>
                      {transitionStep > i ? "✓" : transitionStep === i ? "›" : "○"}
                    </span>
                    <span style={{ color: transitionStep >= i ? "rgba(240,246,255,0.6)" : "#1a2a15" }}>
                      {step}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Progress bar */}
              <div className="w-full h-[2px] bg-white/[0.04] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #7CFF2A, #B4FF6A)" }}
                  initial={{ width: "0%" }}
                  animate={{ width: `${Math.min((transitionStep + 1) * 25, 100)}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>
          </motion.div>
        ) : currentMode === "landing" ? (
          <motion.div
            key="landing-viewport"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.5 }}
          >
            <FifaLandingPage 
              onEnterConsole={() => {
                // Step 1: scroll to top instantly
                window.scrollTo({ top: 0 });
                // Step 2: trigger cinematic transition overlay
                setTransitioning(true);
                setTransitionStep(0);
                const steps = [0, 1, 2, 3];
                steps.forEach((step) => {
                  setTimeout(() => setTransitionStep(step), step * 480);
                });
                // Step 3: switch mode after overlay plays
                setTimeout(() => {
                  setCurrentMode("ops");
                  setTransitioning(false);
                  setTransitionStep(0);
                }, 1900);
              }}
              telemetry={telemetry}
              scenario={scenario}
              setScenario={setScenario}
            />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard-viewport"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-7xl mx-auto px-4 md:px-6 pt-4 space-y-6 relative"
          >
            
            {/* HUD HEADER PANEL */}
            <header id="aegis-header" className="w-full bg-[#0F1722]/80 border border-white/5 rounded-xl px-6 py-4 backdrop-blur-md flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl">
              <div className="flex items-center space-x-3 text-center md:text-left">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-[#447F98] to-[#6FD3FF] flex items-center justify-center border border-[#6FD3FF]/25 shadow-[0_0_15px_rgba(111,211,255,0.3)]">
                  <Cpu className="w-5 h-5 text-[#081018]" />
                </div>
                <div>
                  <h1 className="text-xl font-bold font-mono tracking-wider text-[#F2FAFF] uppercase">
                    AEGIS <span className="text-[#6FD3FF] font-sans font-light">//</span> MISSION CONTROL
                  </h1>
                  <p className="text-[10px] uppercase font-mono tracking-widest text-[#8EA4B5]">
                    FIFA World Cup 2026 AI Venue Operating System
                  </p>
                </div>
              </div>

              {/* Status information, live clock */}
              <div className="flex flex-wrap items-center gap-3">
                
                {/* Switch back to FIFA 3D Landing Page */}
                <button
                  onClick={() => setCurrentMode("landing")}
                  className="px-3 py-1.5 bg-[#6FD3FF]/15 hover:bg-[#6FD3FF]/25 text-[#6FD3FF] hover:text-white rounded-md border border-[#6FD3FF]/35 text-xs font-mono transition flex items-center gap-1.5"
                  title="Return to the FIFA 3D interactive fan landing page"
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>FIFA Fan Portal</span>
                </button>

                {/* Active Scenario indicator badge */}
                <div className="bg-[#081018] border border-white/5 px-3 py-1.5 rounded-md flex items-center space-x-2">
                  <span className={`w-2 h-2 rounded-full ${
                    scenario === "nominal" ? "bg-[#59FF89]" :
                    scenario === "gate-overflow" ? "bg-amber-400 animate-pulse" : "bg-[#FF5D73] animate-ping"
                  }`} />
                  <span className="text-[10px] font-mono text-[#8EA4B5] uppercase">
                    SCENARIO: <strong className="text-[#F2FAFF]">{scenario.replace("-", " ")}</strong>
                  </span>
                </div>

                {/* Clock indicator */}
                <div className="bg-[#081018] border border-white/5 px-3 py-1.5 rounded-md text-xs font-mono text-[#6FD3FF] tracking-widest">
                  TIME: {currentTime} <span className="text-[#8EA4B5] text-[10px] ml-1">UTC</span>
                </div>

                {/* Audio controls */}
                <button
                  onClick={() => setAudioMuted(!audioMuted)}
                  title={audioMuted ? "Enable Command Center audio chimes" : "Mute audio chimes"}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-md border border-white/5 text-[#8EA4B5] hover:text-white transition"
                >
                  {audioMuted ? <VolumeX className="w-4 h-4 text-white/50" /> : <Volume2 className="w-4 h-4 text-[#6FD3FF]" />}
                </button>

                {/* Alert Notification Inbox Icon */}
                <div className="relative">
                  <button
                    id="notification-center-trigger"
                    onClick={() => setShowNotificationCenter(!showNotificationCenter)}
                    className="p-2 bg-[#0F1722] hover:bg-white/5 rounded-md border border-white/5 text-[#8EA4B5] hover:text-[#6FD3FF] transition relative"
                  >
                    <Bell className="w-4 h-4" />
                    {alerts.length > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF5D73] rounded-full" />
                    )}
                  </button>

                  {/* Notification dropdown drawer */}
                  <AnimatePresence>
                    {showNotificationCenter && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-80 bg-[#081018] border border-white/10 rounded-lg p-4 shadow-2xl z-30"
                      >
                        <div className="flex justify-between items-center pb-2 border-b border-white/5 mb-3">
                          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#6FD3FF]">INCIDENT TELEMETRY INBOX</span>
                          <button
                            onClick={clearAlerts}
                            className="text-[10px] font-mono text-[#8EA4B5] hover:text-white hover:underline"
                          >
                            Clear All
                          </button>
                        </div>
                        <div className="max-h-60 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                          {alerts.length === 0 ? (
                            <p className="text-[10px] text-center text-[#8EA4B5] font-mono py-4">No active incident vectors logged.</p>
                          ) : (
                            alerts.map((al) => (
                              <div key={al.id} className="p-2 rounded bg-white/5 border-l-2 border-l-[#6FD3FF] text-xs font-mono">
                                <div className="flex justify-between items-center mb-1">
                                  <span className={`text-[10px] font-bold ${
                                    al.severity === "CRITICAL" ? "text-[#FF5D73]" :
                                    al.severity === "WARNING" ? "text-amber-400" : "text-[#59FF89]"
                                  }`}>{al.title}</span>
                                  <span className="text-[9px] text-[#8EA4B5]">{al.timestamp}</span>
                                </div>
                                <p className="text-[#8EA4B5] text-[10px] leading-tight">{al.message}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </div>
            </header>

            {/* ⚽ LIVE SCOREBOARD — Full width at top of ops dashboard */}
            <ErrorBoundary componentName="Live Score" fallback="Live score temporarily unavailable">
              <LiveScoreBoard />
            </ErrorBoundary>

            {/* LIVE COGNITIVE STADIUM METRIC OVERVIEWS */}
            <section id="aegis-kpis" className="grid grid-cols-2 md:grid-cols-6 gap-3">
              
              {/* Occupancy HUD widget */}
              <div className="bg-[#0F1722]/65 border border-white/5 rounded-xl p-3.5 backdrop-blur-md shadow-md">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-mono text-[#8EA4B5] uppercase">Live Occupancy</span>
                  <Users className="w-3.5 h-3.5 text-[#6FD3FF]" />
                </div>
                <div className="flex items-baseline space-x-1">
                  <span className="text-xl font-mono font-bold tracking-tight">
                    {telemetry.currentOccupancy.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-[#8EA4B5]">/ {telemetry.capacity.toLocaleString()}</span>
                </div>
                <div className="mt-3 w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#447F98] to-[#6FD3FF] transition-all duration-1000" 
                    style={{ width: `${(telemetry.currentOccupancy / telemetry.capacity) * 100}%` }}
                  />
                </div>
              </div>

              {/* Security Alerts index */}
              <div className="bg-[#0F1722]/65 border border-white/5 rounded-xl p-3.5 backdrop-blur-md shadow-md">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-mono text-[#8EA4B5] uppercase">Security Level</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-[#59FF89]" />
                </div>
                <span className="text-lg font-mono font-bold block text-[#59FF89]">NOMINAL</span>
                <span className="text-[9px] font-mono text-[#8EA4B5] uppercase tracking-wide mt-1 block">Level 1 Grid Firewall</span>
              </div>

              {/* Average Queue wait time */}
              <div className="bg-[#0F1722]/65 border border-white/5 rounded-xl p-3.5 backdrop-blur-md shadow-md">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-mono text-[#8EA4B5] uppercase">Avg Queue delay</span>
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <span className={`text-lg font-mono font-bold block ${scenario === "gate-overflow" ? "text-[#FF5D73]" : "text-amber-400"}`}>
                  {telemetry.queueTimeAverage} Mins
                </span>
                <span className="text-[9px] font-mono text-[#8EA4B5] uppercase tracking-wide mt-1 block">Entrance gate terminals</span>
              </div>

              {/* Renewable Solar usage */}
              <div className="bg-[#0F1722]/65 border border-white/5 rounded-xl p-3.5 backdrop-blur-md shadow-md">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-mono text-[#8EA4B5] uppercase">Clean Grid</span>
                  <BatteryCharging className="w-3.5 h-3.5 text-[#59FF89]" />
                </div>
                <span className="text-lg font-mono font-bold block text-[#59FF89]">{telemetry.energySourcedRenewable}%</span>
                <span className="text-[9px] font-mono text-[#8EA4B5] uppercase tracking-wide mt-1 block">Solar-Kinetic capture</span>
              </div>

              {/* Climate parameters */}
              <div className="bg-[#0F1722]/65 border border-white/5 rounded-xl p-3.5 backdrop-blur-md shadow-md">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-mono text-[#8EA4B5] uppercase">HVAC Core Temp</span>
                  <Thermometer className="w-3.5 h-3.5 text-sky-400" />
                </div>
                <span className="text-lg font-mono font-bold block text-sky-400">{telemetry.weatherTemp}°C</span>
                <span className="text-[9px] font-mono text-[#8EA4B5] truncate mt-1 block">{telemetry.weatherCondition}</span>
              </div>

              {/* AI confidence matrix index */}
              <div className="bg-[#0F1722]/65 border border-white/5 rounded-xl p-3.5 backdrop-blur-md shadow-md">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-mono text-[#8EA4B5] uppercase">AI Confidence</span>
                  <Cpu className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <span className="text-lg font-mono font-bold block text-purple-400">{telemetry.aiConfidence}%</span>
                <span className="text-[9px] font-mono text-[#8EA4B5] uppercase tracking-wide mt-1 block">Decision Support Loop</span>
              </div>

            </section>

            {/* MAIN WORKSPACE — tabbed navigation */}
            <div className="flex gap-1 p-1 bg-[#0F1722]/60 rounded-xl border border-white/5 mb-4">
              {([
                { id: "aegis", label: "🗺 Crowd OS" },
                { id: "cctv", label: "📷 CCTV" },
                { id: "analytics", label: "📊 Analytics" },
                { id: "map", label: "🏟 Stadium Map" },
                { id: "twin", label: "🌐 Digital Twin" },
              ] as { id: typeof dashboardTab; label: string }[]).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setDashboardTab(t.id)}
                  className={`flex-1 text-xs py-2 rounded-lg font-medium transition-all min-h-[44px] ${
                    dashboardTab === t.id
                      ? "bg-[#6FD3FF]/15 text-[#6FD3FF] border border-[#6FD3FF]/30"
                      : "text-[#8EA4B5] hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {/* Tab panels */}
            <section id="aegis-workspace" className="w-full">
              {dashboardTab === "aegis" && (
                <div className="space-y-4">
                  <h2 className="text-sm uppercase font-mono tracking-widest text-[#8EA4B5] flex items-center">
                    <Compass className="w-4 h-4 mr-2 text-[#6FD3FF]" />
                    AEGIS Crowd Operations OS
                  </h2>
                  <ErrorBoundary componentName="AEGIS Operations" fallback="Operations panel temporarily unavailable">
                    <AegisStadiumOS
                      onSectorDensitiesChange={setSectorDensities}
                      onIncidentCountChange={(n) => setTelemetry((p) => ({ ...p, activeIncidentsCount: n }))}
                    />
                  </ErrorBoundary>
                </div>
              )}

              {dashboardTab === "cctv" && (
                <div className="space-y-4">
                  <h2 className="text-sm uppercase font-mono tracking-widest text-[#8EA4B5] flex items-center">
                    <Eye className="w-4 h-4 mr-2 text-[#59FF89]" />
                    CCTV Crowd Analyzer
                  </h2>
                  <ErrorBoundary componentName="CCTV Analyzer" fallback="CCTV feed temporarily unavailable">
                    <CctvAnalyzer />
                  </ErrorBoundary>
                </div>
              )}

              {dashboardTab === "analytics" && (
                <div className="space-y-4">
                  <h2 className="text-sm uppercase font-mono tracking-widest text-[#8EA4B5] flex items-center">
                    <Trophy className="w-4 h-4 mr-2 text-amber-400" />
                    Tournament Analytics
                  </h2>
                  <ErrorBoundary componentName="Analytics" fallback="Analytics temporarily unavailable">
                    <OrganizerDashboard data={wcData} />
                  </ErrorBoundary>
                </div>
              )}

              {dashboardTab === "map" && (
                <div className="space-y-4">
                  <h2 className="text-sm uppercase font-mono tracking-widest text-[#8EA4B5] flex items-center">
                    <Compass className="w-4 h-4 mr-2 text-[#6FD3FF]" />
                    Stadium Heatmap
                  </h2>
                  <StadiumMap sectorDensities={sectorDensities} />
                </div>
              )}

              {dashboardTab === "twin" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                  <div className="flex flex-col space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <h2 className="text-sm uppercase font-mono tracking-widest text-[#8EA4B5] flex items-center">
                        <Compass className="w-4 h-4 mr-2 text-[#6FD3FF]" />
                        Stadia Interactive Digital Twin Mesh
                      </h2>
                      <span className="text-[9px] font-mono text-[#8EA4B5]">DRAG TO ROTATE MODEL</span>
                    </div>
                    <DigitalTwin
                      activeLayer={activeLayer}
                      setActiveLayer={setActiveLayer}
                      selectedGate={selectedGate}
                      setSelectedGate={setSelectedGate}
                      gates={gates}
                      onTriggerEvacuation={handleSimulateEvacOverride}
                    />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <h2 className="text-sm uppercase font-mono tracking-widest text-[#8EA4B5] flex items-center">
                        <Cpu className="w-4 h-4 mr-2 text-[#6FD3FF]" />
                        Cognitive Core / Holographic Assistant Workspace
                      </h2>
                      <span className="text-[9px] font-mono text-[#8EA4B5]">POWERED BY GEMINI-3.5-FLASH</span>
                    </div>
                    <JarvisAssistant
                      scenario={scenario}
                      setScenario={setScenario}
                      setActiveLayer={setActiveLayer}
                      triggerNotification={pushAlert}
                    />
                  </div>
                </div>
              )}
            </section>

            {/* SECTIONS 4-10: STADIUM OPERATIONS HUD (Detailed controls tabs) */}
            <section id="aegis-detailed-controls" className="w-full">
              <div className="px-1 mb-2">
                <h2 className="text-sm uppercase font-mono tracking-widest text-[#8EA4B5] flex items-center">
                  <Eye className="w-4 h-4 mr-2 text-[#59FF89]" />
                  Smart Stadium Control Console
                </h2>
              </div>
              <StadiumOperationsPanels
                telemetry={telemetry}
                gates={gates}
                scenario={scenario}
                onOptimizeEnergy={handleOptimizeEnergy}
                onSimulateEvac={handleSimulateEvacOverride}
              />
            </section>

          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTER COORD STAMP */}
      {!booting && (
        <footer className="w-full text-center text-[10px] font-mono text-[#8EA4B5]/40 mt-12 border-t border-white/[0.03] pt-6 flex flex-col items-center justify-center space-y-1">
          <div>AEGIS // STADIUM OS • SECURE CORE CONSOLE • FIFA WORLD CUP 2026 OFFICIAL VENUE CONTROLLER</div>
          <div>CRAFTED BY GOOGLE AI STUDIO CHASSIS FOR TOURNAMENT OPERATIONS INTELLIGENCE</div>
        </footer>
      )}

    </div>
  );
}
