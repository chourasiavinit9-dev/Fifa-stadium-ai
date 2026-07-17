/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Trophy, Calendar, MapPin, Sparkles, Navigation, Target, Activity, Zap,
  ChevronRight, Play, CheckCircle2, Ticket, Award, RefreshCw, Cpu, Volume2, VolumeX,
  Bell, ListFilter, PlayCircle, Share2, Info, ArrowRight, Heart, Shield, Users, Radio,
  Search, Wifi, BarChart2, Leaf, Car, AlertTriangle, Wind, Eye, Lock
} from "lucide-react";
import { TelemetryData, OperationScenario } from "../types";
import FifaGlobeCanvas from "./FifaGlobeCanvas";
import LiveTicker from "./LiveTicker";
import MatchSchedule from "./MatchSchedule";
import ChatAssistant from "./ChatAssistant";
import TransportPanel from "./TransportPanel";
import SustainabilityWidget from "./SustainabilityWidget";

// ── FootballToggle (preserved, visual polish) ─────────────────────────────────
interface FootballToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  subLabel?: string;
}

export function FootballToggle({ checked, onChange, label, subLabel }: FootballToggleProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl transition-all hover:border-[#7CFF2A]/30 hover:bg-[#7CFF2A]/[0.03]">
      <div className="flex flex-col text-left mr-4">
        <span className="text-xs font-mono font-bold text-white/80 uppercase tracking-wider">{label}</span>
        {subLabel && <span className="text-[10px] font-mono text-white/30 mt-0.5">{subLabel}</span>}
      </div>

      <div
        onClick={() => onChange(!checked)}
        className="relative w-[72px] h-[34px] rounded-full cursor-pointer overflow-hidden p-1 transition-all duration-300 select-none"
        style={{
          background: checked
            ? "linear-gradient(135deg, #2a6b00 0%, #7CFF2A 100%)"
            : "linear-gradient(135deg, #0d1520 0%, #1a2535 100%)",
          border: checked ? "1px solid rgba(124,255,42,0.4)" : "1px solid rgba(255,255,255,0.08)",
          boxShadow: checked ? "0 0 16px rgba(124,255,42,0.25)" : "inset 0 2px 4px rgba(0,0,0,0.3)",
        }}
      >
        <motion.div
          animate={{ x: checked ? 38 : 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 24 }}
          className="w-[26px] h-[26px] rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,0.5)] flex items-center justify-center relative z-10"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full rotate-[15deg]">
            <circle cx="50" cy="50" r="48" fill="#FFFFFF" stroke="#000" strokeWidth="4" />
            <polygon points="50,38 60,45 56,57 44,57 40,45" fill="#1a1a1a" />
            <line x1="50" y1="38" x2="50" y2="20" stroke="#1a1a1a" strokeWidth="4" />
            <line x1="60" y1="45" x2="76" y2="40" stroke="#1a1a1a" strokeWidth="4" />
            <line x1="56" y1="57" x2="68" y2="70" stroke="#1a1a1a" strokeWidth="4" />
            <line x1="44" y1="57" x2="32" y2="70" stroke="#1a1a1a" strokeWidth="4" />
            <line x1="40" y1="45" x2="24" y2="40" stroke="#1a1a1a" strokeWidth="4" />
          </svg>
        </motion.div>
      </div>
    </div>
  );
}

// ── Stadium Sector Geometry (preserved) ──────────────────────────────────────
const SECTOR_DEFS = [
  { id: "north", label: "North", a0: 280, a1: 320 },
  { id: "ne",    label: "NE",    a0: 320, a1: 0 },
  { id: "east",  label: "East",  a0: 0,   a1: 80 },
  { id: "se",    label: "SE",    a0: 80,  a1: 130 },
  { id: "south", label: "South", a0: 130, a1: 180 },
  { id: "sw",    label: "SW",    a0: 180, a1: 220 },
  { id: "west",  label: "West",  a0: 220, a1: 260 },
  { id: "nw",    label: "NW",    a0: 260, a1: 280 },
];

const cx = 200, cy = 200, rOuter = 150, rInner = 95;

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const rad = (deg - 90) * Math.PI / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function arcPath(a0: number, a1: number): string {
  let a1Copy = a1;
  if (a1Copy < a0) a1Copy += 360;
  const large = (a1Copy - a0) > 180 ? 1 : 0;
  const [x1, y1] = polar(cx, cy, rOuter, a0);
  const [x2, y2] = polar(cx, cy, rOuter, a1);
  const [x3, y3] = polar(cx, cy, rInner, a1);
  const [x4, y4] = polar(cx, cy, rInner, a0);
  return `M${x1},${y1} A${rOuter},${rOuter} 0 ${large} 1 ${x2},${y2} L${x3},${y3} A${rInner},${rInner} 0 ${large} 0 ${x4},${y4} Z`;
}

function densityColor(d: number): string {
  return d < 40 ? "#7CFF2A" : d < 70 ? "#F5A623" : "#FF3B3B";
}

function densityLabel(d: number): "LOW" | "MED" | "HIGH" {
  return d < 40 ? "LOW" : d < 70 ? "MED" : "HIGH";
}

// ── Feature cards data ────────────────────────────────────────────────────────
type FeatureAction =
  | { kind: "scroll"; target: string }
  | { kind: "console" };

const FEATURES: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: string;
  action: FeatureAction;
  actionLabel: string;
}[] = [
  {
    icon: <Navigation className="w-5 h-5" />, title: "Live Navigation",
    desc: "Sector-by-sector wayfinding with real-time congestion and fastest-entry routing.",
    color: "#7CFF2A", action: { kind: "scroll", target: "#map" }, actionLabel: "Open stadium map",
  },
  {
    icon: <Users className="w-5 h-5" />, title: "Crowd Intelligence",
    desc: "10-sector density monitoring with CCTV overlays and AI-powered anomaly detection.",
    color: "#5DBBFF", action: { kind: "scroll", target: "#map" }, actionLabel: "View crowd density map",
  },
  {
    icon: <Shield className="w-5 h-5" />, title: "Accessibility First",
    desc: "Full keyboard support, live regions, and text-paired status for every indicator.",
    color: "#7CFF2A", action: { kind: "scroll", target: "#map" }, actionLabel: "Explore accessibility features",
  },
  {
    icon: <Car className="w-5 h-5" />, title: "Transport Hub",
    desc: "Shuttles, metro crowding and parking availability, updated in real time.",
    color: "#F5A623", action: { kind: "scroll", target: "#transport" }, actionLabel: "Open transport hub",
  },
  {
    icon: <Leaf className="w-5 h-5" />, title: "Sustainability",
    desc: "Live energy mix, waste diversion and water-savings for the match day.",
    color: "#7CFF2A", action: { kind: "scroll", target: "#sustain" }, actionLabel: "View sustainability metrics",
  },
  {
    icon: <Wifi className="w-5 h-5" />, title: "Multilingual AI",
    desc: "Fan assistant that detects language and responds in kind, across ten languages.",
    color: "#5DBBFF", action: { kind: "scroll", target: "#ops" }, actionLabel: "Open AI fan assistant",
  },
  {
    icon: <BarChart2 className="w-5 h-5" />, title: "Analytics Engine",
    desc: "Tournament-wide statistics, heatmaps, and predictive crowd flow modeling.",
    color: "#F5A623", action: { kind: "console" }, actionLabel: "Open analytics command center",
  },
  {
    icon: <AlertTriangle className="w-5 h-5" />, title: "Emergency Ops",
    desc: "Instant evacuation routing with dynamic signage override and audio beacons.",
    color: "#FF3B3B", action: { kind: "console" }, actionLabel: "Open emergency operations",
  },
  {
    icon: <Eye className="w-5 h-5" />, title: "CCTV AI Vision",
    desc: "Computer vision analysis across 180 cameras with instant anomaly flagging.",
    color: "#7CFF2A", action: { kind: "console" }, actionLabel: "Open CCTV command center",
  },
];

// ── Live stats for hero ───────────────────────────────────────────────────────
const HERO_STATS = [
  { label: "Fans Inside", value: "78,120", unit: "/ 82,500" },
  { label: "AI Confidence", value: "99.8", unit: "%" },
  { label: "Active Gates", value: "12", unit: "/ 14" },
  { label: "Stage", value: "Semi-Finals", unit: "" },
];

interface FifaLandingPageProps {
  onEnterConsole: () => void;
  telemetry: TelemetryData;
  scenario: OperationScenario;
  setScenario: (scenario: OperationScenario) => void;
}

export default function FifaLandingPage({ onEnterConsole, telemetry, scenario, setScenario }: FifaLandingPageProps) {
  // ── Sector state (preserved) ───────────────────────────────────────────────
  const [sectorStates, setSectorStates] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    SECTOR_DEFS.forEach((s) => { init[s.id] = 20 + Math.random() * 60; });
    return init;
  });

  // ── Simulation state (preserved) ──────────────────────────────────────────
  const [lots, setLots] = useState({ A: 78, B: 91, C: 45 });
  const [renew, setRenew] = useState(68.0);
  const [waste, setWaste] = useState(73);
  const [carbon, setCarbon] = useState(4.2);
  const [shuttleMin, setShuttleMin] = useState(4);

  // ── Toggle states (preserved) ─────────────────────────────────────────────
  const [ballSensorsActive, setBallSensorsActive] = useState(true);
  const [tacticalGlowActive, setTacticalGlowActive] = useState(true);
  const [liveStreamOn, setLiveStreamOn] = useState(true);

  // ── Drag state (preserved) ────────────────────────────────────────────────
  const [dragRotation, setDragRotation] = useState({ x: -14, y: 38 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // ── Scroll reveal ─────────────────────────────────────────────────────────
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("revealed"); }),
      { threshold: 0.1, rootMargin: "0px 0px -60px 0px" }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // ── Sector + simulation interval (preserved) ──────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setSectorStates((prev) => {
        const next = { ...prev };
        SECTOR_DEFS.forEach((s) => {
          const delta = Math.random() * 30 - 15;
          next[s.id] = Math.max(5, Math.min(97, next[s.id] + delta));
        });
        return next;
      });
      setLots((prev) => ({
        A: Math.max(5, Math.min(99, prev.A + (Math.random() * 8 - 4))),
        B: Math.max(5, Math.min(99, prev.B + (Math.random() * 8 - 4))),
        C: Math.max(5, Math.min(99, prev.C + (Math.random() * 8 - 4))),
      }));
      setRenew((prev) => Math.max(40, Math.min(95, prev + (Math.random() - 0.5))));
      setWaste((prev) => Math.max(30, Math.min(98, prev + (Math.random() * 2 - 1))));
      setCarbon((prev) => prev + 0.02);
      setShuttleMin(1 + Math.floor(Math.random() * 8));
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // ── Sector derivations (preserved) ────────────────────────────────────────
  const entries: [string, number][] = Object.entries(sectorStates);
  const minSector: [string, number] = entries.reduce<[string, number]>((a, b) => (a[1] < b[1] ? a : b), entries[0] || ["north", 30]);
  const maxSector: [string, number] = entries.reduce<[string, number]>((a, b) => (a[1] > b[1] ? a : b), entries[0] || ["ne", 85]);
  const labelOf = (id: string) => SECTOR_DEFS.find((s) => s.id === id)?.label || id;
  const minDensity: number = minSector[1];
  const maxDensity: number = maxSector[1];
  const minLabel = densityLabel(minDensity);
  const maxLabel = densityLabel(maxDensity);

  // ── Drag handlers (preserved) ─────────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStart.current.x;
    const deltaY = e.clientY - dragStart.current.y;
    setDragRotation((prev) => ({
      x: Math.max(-50, Math.min(50, prev.x - deltaY * 0.35)),
      y: prev.y + deltaX * 0.35,
    }));
    dragStart.current = { x: e.clientX, y: e.clientY };
  };
  const handleMouseUpOrLeave = () => setIsDragging(false);

  // ── Selected sector for map tooltip ───────────────────────────────────────
  const [hoveredSector, setHoveredSector] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#030508] text-[#F0F6FF] font-['Inter',sans-serif] antialiased overflow-x-hidden relative selection:bg-[#7CFF2A] selection:text-[#021000]">
      {/* Skip to content */}
      <a
        className="absolute -top-16 left-3 bg-[#7CFF2A] text-[#021000] px-4 py-2.5 rounded-md font-semibold z-[999] transition-all focus:top-3"
        href="#main"
      >
        Skip to main content
      </a>

      {/* Ambient blobs */}
      <div className="blobs" aria-hidden="true">
        <div className="blob blob-a" />
        <div className="blob blob-b" />
        <div className="blob blob-c" />
      </div>
      <div className="grain" aria-hidden="true" />
      <div className="grid-overlay" aria-hidden="true" />

      {/* ── NAVBAR ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50">
        <div className="mx-4 mt-3 rounded-2xl bg-black/50 backdrop-blur-2xl border border-white/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between py-3 px-5">
            {/* Logo */}
            <a href="#hero" className="flex items-center gap-2.5 group" aria-label="FIFAiq home">
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-[#7CFF2A] flex items-center justify-center shadow-[0_0_16px_rgba(124,255,42,0.5)]">
                  <Cpu className="w-4 h-4 text-black" />
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#7CFF2A] border-2 border-black live-dot" />
              </div>
              <span className="font-['Space_Grotesk',sans-serif] font-bold text-base tracking-tight text-white">
                FIFA<span className="text-[#7CFF2A]">iq</span>
              </span>
            </a>

            {/* Center nav */}
            <nav className="hidden lg:flex items-center gap-1 text-[13px] font-medium" aria-label="Primary">
              {[
                { href: "#hero", label: "Dashboard" },
                { href: "#hero", label: "Live Matches" },
                { href: "#map", label: "Stadium Map" },
                { href: "#map", label: "Crowd AI" },
                { href: "#transport", label: "Transport" },
                { href: "#ops", label: "Analytics" },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="px-3 py-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] transition-all duration-200"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <button className="hidden md:flex w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.06] items-center justify-center text-white/50 hover:text-white transition-all" aria-label="Search">
                <Search className="w-3.5 h-3.5" />
              </button>
              <button className="hidden md:flex w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.06] items-center justify-center text-white/50 hover:text-white transition-all relative" aria-label="Notifications">
                <Bell className="w-3.5 h-3.5" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#7CFF2A]" />
              </button>
              <div className="hidden md:flex w-8 h-8 rounded-full bg-gradient-to-br from-[#7CFF2A] to-[#3d8014] items-center justify-center text-black font-bold text-xs border-2 border-black">
                AI
              </div>
              <button
                onClick={onEnterConsole}
                className="btn-magnetic flex items-center gap-2 bg-[#7CFF2A] hover:bg-[#8fff3a] text-black font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-[0_0_20px_rgba(124,255,42,0.3)] hover:shadow-[0_0_30px_rgba(124,255,42,0.5)] hover:scale-105"
              >
                <span>Command Center</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Live Ticker below navbar */}
        <LiveTicker />
      </header>

      <main id="main">
        {/* ── HERO SECTION ──────────────────────────────────────────────────── */}
        <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
          {/* 3D Canvas */}
          <FifaGlobeCanvas />

          {/* Deep gradient overlays for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#030508] via-[#030508]/20 to-transparent z-[1]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#030508]/60 via-transparent to-[#030508]/30 z-[1]" />

          {/* Hero content */}
          <div className="relative z-10 max-w-5xl mx-auto px-6 text-center py-32">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2.5 bg-[#7CFF2A]/10 border border-[#7CFF2A]/25 rounded-full px-4 py-1.5 mb-8"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#7CFF2A] live-dot" />
              <span className="font-mono text-[11px] text-[#7CFF2A] tracking-[0.2em] uppercase font-bold">
                LIVE · FIFA World Cup 2026 · Semi-Finals
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.35 }}
              className="font-['Space_Grotesk',sans-serif] font-black leading-[0.9] tracking-tight mb-6"
              style={{ fontSize: "clamp(64px, 12vw, 130px)" }}
            >
              <span className="text-gradient-green block">SMART STADIUM</span>
              <span className="text-gradient-white block">INTELLIGENCE</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-white/50 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10"
            >
              AI-powered operations for FIFA World Cup 2026. Real-time crowd intelligence, transport optimization, accessibility, sustainability, and multilingual assistance.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.65 }}
              className="flex flex-wrap items-center justify-center gap-4 mb-16"
            >
              <button
                onClick={onEnterConsole}
                className="btn-magnetic group relative min-h-[52px] px-8 rounded-2xl font-bold text-sm bg-[#7CFF2A] text-black hover:scale-105 transition-all duration-300 shadow-[0_8px_32px_rgba(124,255,42,0.35)] hover:shadow-[0_16px_48px_rgba(124,255,42,0.5)] flex items-center gap-2.5 overflow-hidden"
              >
                <Cpu className="w-4 h-4" />
                <span>Launch Command Center</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <a
                href="#match-tech"
                className="btn-magnetic group min-h-[52px] px-8 rounded-2xl font-bold text-sm border border-white/15 text-white hover:border-[#7CFF2A]/50 hover:bg-[#7CFF2A]/[0.06] transition-all duration-300 flex items-center gap-2.5"
              >
                <Play className="w-4 h-4 text-[#7CFF2A]" />
                <span>Watch Demo</span>
              </a>
            </motion.div>

            {/* Live Stats Row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto"
            >
              {HERO_STATS.map((stat, i) => (
                <div key={i} className="glass-card p-4 text-center">
                  <div className="font-['Space_Grotesk',sans-serif] font-bold text-white text-lg leading-none">
                    {stat.value}
                    {stat.unit && <span className="text-white/30 text-sm font-normal"> {stat.unit}</span>}
                  </div>
                  <div className="font-mono text-[10px] text-white/30 uppercase tracking-widest mt-1">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 pointer-events-none">
            <span className="font-mono text-[10px] text-white/20 uppercase tracking-[0.25em]">Scroll</span>
            <span className="w-[1px] h-10 bg-gradient-to-b from-[#7CFF2A] to-transparent [animation:scrollline_1.8s_ease-in-out_infinite]" />
          </div>
        </section>

        {/* ── FEATURES SECTION ──────────────────────────────────────────────── */}
        <section id="features" className="relative z-[2] max-w-7xl mx-auto px-6 py-28">
          <div className="max-w-2xl mb-16 reveal">
            <div className="font-mono text-[11px] tracking-[0.28em] uppercase text-[#7CFF2A]/60 mb-4 flex items-center gap-3">
              <span className="w-6 h-[1px] bg-[#7CFF2A]/40" />
              Platform Capabilities
            </div>
            <h2 className="font-['Space_Grotesk',sans-serif] font-bold text-4xl md:text-5xl tracking-tight text-white mb-4">
              One control tower,<br />
              <span className="text-gradient-green">eight operating areas</span>
            </h2>
            <p className="text-white/40 text-base leading-relaxed">
              Every panel is built around a single problem stadium staff and fans face on match day — from wayfinding to real-time AI decision support.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => {
              const handleAction = () => {
                if (f.action.kind === "scroll") {
                  document.querySelector(f.action.target)?.scrollIntoView({ behavior: "smooth", block: "start" });
                } else {
                  onEnterConsole();
                }
              };
              return (
                <motion.button
                  key={i}
                  type="button"
                  aria-label={f.actionLabel}
                  onClick={handleAction}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleAction(); } }}
                  initial={{ opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.6, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  className="glass-card glass-card-hover p-6 group cursor-pointer text-left w-full focus:outline-none rounded-2xl transition-all"
                  style={{ ["--focus-color" as string]: f.color } as React.CSSProperties}
                  onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 2px ${f.color}80`; }}
                  onBlur={(e) => { e.currentTarget.style.boxShadow = ""; }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110"
                    style={{
                      background: `${f.color}14`,
                      border: `1px solid ${f.color}30`,
                      color: f.color,
                      boxShadow: `0 0 20px ${f.color}10`,
                    }}
                  >
                    {f.icon}
                  </div>
                  <h3 className="font-['Space_Grotesk',sans-serif] text-base font-semibold text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-white/35 leading-relaxed">{f.desc}</p>
                  <div
                    className="mt-5 flex items-center gap-1.5 text-[11px] font-mono opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-300"
                    style={{ color: f.color }}
                    aria-hidden="true"
                  >
                    <span>Explore</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* ── STADIUM MAP SECTION ────────────────────────────────────────────── */}
        <section id="map" className="relative z-[2] max-w-7xl mx-auto px-6 py-28 border-t border-white/[0.04]">
          <div className="max-w-2xl mb-16 reveal">
            <div className="font-mono text-[11px] tracking-[0.28em] uppercase text-[#7CFF2A]/60 mb-4 flex items-center gap-3">
              <span className="w-6 h-[1px] bg-[#7CFF2A]/40" />
              Crowd & Navigation
            </div>
            <h2 className="font-['Space_Grotesk',sans-serif] font-bold text-4xl md:text-5xl tracking-tight text-white mb-4">
              Stadium sector map
            </h2>
            <p className="text-white/40 text-base leading-relaxed">
              Live density per sector, colour and text paired, keyboard-navigable, with routing recommendations the moment a zone tips past 70%.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* SVG Map */}
            <div className="lg:col-span-7 relative aspect-square max-w-[480px] mx-auto w-full reveal">
              <div className="absolute inset-0 rounded-3xl bg-[#7CFF2A]/[0.02] border border-[#7CFF2A]/10 backdrop-blur-xl" />
              <svg className="w-full h-full overflow-visible relative z-10" viewBox="0 0 400 400" role="img" aria-label="Interactive stadium sector density map">
                <circle className="fill-none stroke-[#7CFF2A]/15 [stroke-dasharray:2_6] animate-spin-ring" id="ring1" cx="200" cy="200" r="188" />
                <circle className="fill-none stroke-[#5DBBFF]/12 [stroke-dasharray:2_6] animate-spin-ring-rev" id="ring2" cx="200" cy="200" r="172" />
                <ellipse cx="200" cy="200" rx="150" ry="130" fill="#050d05" stroke="#0d2a0d" strokeWidth="1" />
                <ellipse cx="200" cy="200" rx="65" ry="45" fill="#071507" stroke="#143014" strokeWidth="1.5" />
                <circle cx="200" cy="200" r="15" fill="none" stroke="#143014" />
                <line x1="200" y1="155" x2="200" y2="245" stroke="#143014" />

                <g id="sectors">
                  {SECTOR_DEFS.map((s) => {
                    const d = sectorStates[s.id] || 50;
                    const midAngle = ((s.a1 < s.a0 ? s.a1 + 360 : s.a1) + s.a0) / 2;
                    const [lx, ly] = polar(cx, cy, (rOuter + rInner) / 2, midAngle);
                    const color = densityColor(d);
                    const isHovered = hoveredSector === s.id;

                    return (
                      <g
                        key={s.id}
                        className="cursor-pointer outline-none"
                        tabIndex={0}
                        role="button"
                        aria-label={`${s.label} stand: ${Math.round(d)}% capacity. Click for details.`}
                        onClick={() => alert(`${s.label} Stand\nLive Density: ${Math.round(d)}% (${densityLabel(d)})\nRecommended Gate: Gate ${s.id === "north" || s.id === "ne" ? "A" : s.id === "south" || s.id === "sw" ? "C" : "B"}`)}
                        onMouseEnter={() => setHoveredSector(s.id)}
                        onMouseLeave={() => setHoveredSector(null)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            alert(`${s.label} Stand density: ${Math.round(d)}% (${densityLabel(d)})`);
                          }
                        }}
                      >
                        <path
                          d={arcPath(s.a0, s.a1)}
                          fill={color}
                          opacity={isHovered ? 1 : 0.75}
                          stroke="#030508"
                          strokeWidth="2"
                          style={{
                            filter: isHovered ? `drop-shadow(0 0 8px ${color})` : undefined,
                            transition: "opacity 0.2s, filter 0.2s",
                          }}
                        />
                        <text x={lx} y={ly + 1} textAnchor="middle" className="font-mono text-[7px] font-bold pointer-events-none" fill="#030508" fontSize="8">
                          {s.label}
                        </text>
                      </g>
                    );
                  })}
                </g>
              </svg>
            </div>

            {/* Side panels */}
            <div className="lg:col-span-5 flex flex-col gap-4 reveal delay-2">
              {/* Fastest entry */}
              <div className="glass-card glass-card-hover p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-mono text-[10px] text-white/25 uppercase tracking-widest mb-1">Fastest Entry</div>
                    <h4 className="font-['Space_Grotesk',sans-serif] text-base font-semibold text-white">{labelOf(minSector[0])} Stand</h4>
                  </div>
                  <span className={`font-mono text-xs px-2.5 py-1 rounded-full font-bold ${minLabel === "LOW" ? "bg-[#7CFF2A]/15 text-[#7CFF2A]" : minLabel === "MED" ? "bg-[#F5A623]/15 text-[#F5A623]" : "bg-[#FF3B3B]/15 text-[#FF3B3B]"}`}>
                    {minLabel}
                  </span>
                </div>
                <div className="w-full bg-white/[0.04] rounded-full h-1.5 mb-2">
                  <div className="h-full bg-[#7CFF2A] rounded-full transition-all duration-700" style={{ width: `${minDensity}%` }} />
                </div>
                <p className="text-sm text-white/30">{Math.round(minDensity)}% capacity · ~2 min wait</p>
              </div>

              {/* Avoid now */}
              <div className="glass-card glass-card-hover p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-mono text-[10px] text-white/25 uppercase tracking-widest mb-1">Avoid Now</div>
                    <h4 className="font-['Space_Grotesk',sans-serif] text-base font-semibold text-white">{labelOf(maxSector[0])} Stand</h4>
                  </div>
                  <span className={`font-mono text-xs px-2.5 py-1 rounded-full font-bold ${maxLabel === "LOW" ? "bg-[#7CFF2A]/15 text-[#7CFF2A]" : maxLabel === "MED" ? "bg-[#F5A623]/15 text-[#F5A623]" : "bg-[#FF3B3B]/15 text-[#FF3B3B]"}`}>
                    {maxLabel}
                  </span>
                </div>
                <div className="w-full bg-white/[0.04] rounded-full h-1.5 mb-2">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${maxDensity}%`, background: densityColor(maxDensity) }} />
                </div>
                <p className="text-sm text-white/30">{Math.round(maxDensity)}% capacity · consider alternate route</p>
              </div>

              {/* AI Recommendation */}
              <div className="glass-card-green p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-[#7CFF2A]/15 border border-[#7CFF2A]/20 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-[#7CFF2A]" />
                  </div>
                  <span className="font-mono text-[10px] text-[#7CFF2A]/70 uppercase tracking-widest font-bold">AI Recommendation</span>
                  <span className="ml-auto font-mono text-[10px] px-2 py-0.5 rounded-full bg-[#F5A623]/15 text-[#F5A623] font-bold">AUTO</span>
                </div>
                <p className="text-sm text-white/50 leading-relaxed">
                  {maxDensity > 80
                    ? `Deploy stewards to ${labelOf(maxSector[0])} Stand — ${Math.round(maxDensity)}% capacity, overflow route recommended.`
                    : `Monitoring all sectors — highest is ${labelOf(maxSector[0])} at ${Math.round(maxDensity)}%, within normal range.`
                  }
                </p>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 font-mono text-[10px] text-white/30">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#7CFF2A]" /> Low (&lt;40%)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#F5A623]" /> Medium (40–70%)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#FF3B3B]" /> High (&gt;70%)</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── OPERATIONS & LIVE PANELS SECTION ─────────────────────────────── */}
        <section id="ops" className="relative z-[2] max-w-7xl mx-auto px-6 py-28 border-t border-white/[0.04]">
          <div className="max-w-2xl mb-16 reveal">
            <div className="font-mono text-[11px] tracking-[0.28em] uppercase text-[#7CFF2A]/60 mb-4 flex items-center gap-3">
              <span className="w-6 h-[1px] bg-[#7CFF2A]/40" />
              Live Systems
            </div>
            <h2 className="font-['Space_Grotesk',sans-serif] font-bold text-4xl md:text-5xl tracking-tight text-white mb-4">
              Transport, sustainability<br />
              <span className="text-gradient-green">&amp; operations</span>
            </h2>
            <p className="text-white/40 text-base leading-relaxed">
              Simulated live telemetry — the same shape of data the real dashboard streams from shuttle, parking and energy feeds on match day.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <motion.div
              id="transport"
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0, ease: [0.22, 1, 0.36, 1] }}
              className="h-full"
            >
              <TransportPanel />
            </motion.div>

            <motion.div
              id="sustain"
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="h-full"
            >
              <SustainabilityWidget />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="h-full max-h-[480px]"
            >
              <ChatAssistant />
            </motion.div>
          </div>
        </section>

        {/* ── MATCH TECH SECTION ────────────────────────────────────────────── */}
        <section id="match-tech" className="relative z-[2] max-w-7xl mx-auto px-6 py-28 border-t border-white/[0.04]">
          <div className="max-w-2xl mb-16 reveal">
            <div className="font-mono text-[11px] tracking-[0.28em] uppercase text-[#7CFF2A]/60 mb-4 flex items-center gap-3">
              <span className="w-6 h-[1px] bg-[#7CFF2A]/40" />
              Official Match Technology
            </div>
            <h2 className="font-['Space_Grotesk',sans-serif] font-bold text-4xl md:text-5xl tracking-tight text-white mb-4">
              Connected Ball &amp;<br />
              <span className="text-gradient-green">Tactical Calibration Hub</span>
            </h2>
            <p className="text-white/40 text-base leading-relaxed">
              Experience the physical overrides and 500Hz Kinexon coordinate tracking array powering our AI referee and tactical analysis engines.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            {/* Toggle Panel */}
            <div className="lg:col-span-4 flex flex-col justify-between space-y-4 reveal">
              <div className="glass-card p-5 mb-2">
                <span className="font-mono text-[10px] text-[#7CFF2A]/60 uppercase block mb-1 tracking-widest">Stadium Calibration Controls</span>
                <h3 className="text-base font-bold text-white">Tactile Physical Overrides</h3>
                <p className="text-xs text-white/30 mt-2 leading-relaxed">
                  Toggle stadium modules. Rolling the football slider loads the live sensor mesh and renders high-contrast green turf matrices.
                </p>
              </div>

              <div className="space-y-3">
                <FootballToggle checked={ballSensorsActive} onChange={setBallSensorsActive} label="Ball Telemetry Core" subLabel="Enables 500Hz Kinexon coordinate tracking" />
                <FootballToggle checked={tacticalGlowActive} onChange={setTacticalGlowActive} label="Neon Grid Illuminator" subLabel="Renders neon border guides & markings" />
                <FootballToggle checked={liveStreamOn} onChange={setLiveStreamOn} label="Live Crowd Analytics" subLabel="Tracks spectator kinematics & wait times" />
              </div>

              <div className="glass-card-green p-4 font-mono">
                <div className="flex justify-between items-center text-[#F5A623] font-bold mb-2 text-xs">
                  <span>SENSOR OVERLAY VALUE:</span>
                  <span className="animate-pulse text-[#7CFF2A]">● STREAMING</span>
                </div>
                <p className="text-white/35 text-[11px] leading-relaxed">
                  IMU Pitch Accelerations: <strong className="text-white">12.44 G</strong><br />
                  Rotational Spin Vector: <strong className="text-white">182 RPM</strong><br />
                  Triangulation Error: <strong className="text-[#7CFF2A]">1.2 cm (Max Precision)</strong>
                </p>
              </div>
            </div>

            {/* Pitch Model */}
            <div
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              className="lg:col-span-8 glass-card cursor-grab active:cursor-grabbing p-6 md:p-10 relative overflow-hidden reveal delay-2"
            >
              {/* Ambient scan sweep */}
              <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#7CFF2A]/30 to-transparent animate-scan" />
              </div>

              <div className="w-full h-96 relative flex items-center justify-center [perspective:1000px] overflow-hidden">
                <motion.div
                  animate={{
                    rotateX: tacticalGlowActive ? 35 : 0,
                    rotateY: isDragging ? dragRotation.y * 0.05 : 0,
                    scale: 0.95
                  }}
                  transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  className="w-[85%] h-full relative [transform-style:preserve-3d]"
                >
                  <div className={`absolute inset-0 rounded-2xl transition-all duration-500 ${
                    tacticalGlowActive
                      ? "border border-[#7CFF2A]/40 shadow-[0_0_60px_rgba(124,255,42,0.15),inset_0_0_40px_rgba(124,255,42,0.05)]"
                      : "border border-white/[0.06]"
                  }`} style={{
                    background: tacticalGlowActive
                      ? "linear-gradient(180deg, rgba(124,255,42,0.06) 0%, rgba(10,20,10,0.95) 100%)"
                      : "rgba(10,14,20,0.8)"
                  }}>
                    <div className="absolute inset-4 border border-dashed opacity-30" style={{ borderColor: tacticalGlowActive ? "#7CFF2A" : "rgba(255,255,255,0.06)" }} />
                    <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-28 h-28 rounded-full border-2 opacity-40 flex items-center justify-center" style={{ borderColor: tacticalGlowActive ? "#7CFF2A" : "rgba(255,255,255,0.06)" }}>
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tacticalGlowActive ? "#7CFF2A" : "rgba(255,255,255,0.06)" }} />
                    </div>
                    <div className="absolute top-4 left-1/4 right-1/4 h-16 border-b-2 border-x-2 opacity-40" style={{ borderColor: tacticalGlowActive ? "#7CFF2A" : "rgba(255,255,255,0.06)" }} />
                    <div className="absolute bottom-4 left-1/4 right-1/4 h-16 border-t-2 border-x-2 opacity-40" style={{ borderColor: tacticalGlowActive ? "#7CFF2A" : "rgba(255,255,255,0.06)" }} />

                    {/* Ball */}
                    <div className="absolute top-12 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
                      {tacticalGlowActive && (
                        <div className="absolute bottom-4 w-1.5 h-36 bg-gradient-to-t from-[#7CFF2A] via-[#5DBBFF] to-transparent blur-sm animate-pulse opacity-70" />
                      )}
                      <div className="relative">
                        <span className="absolute inset-0 rounded-full bg-[#7CFF2A] blur-sm animate-ping scale-150 opacity-60" />
                        <div className="w-6 h-6 rounded-full bg-white shadow-xl border border-black flex items-center justify-center">
                          <svg viewBox="0 0 100 100" className="w-4 h-4 animate-spin [animation-duration:8s]">
                            <circle cx="50" cy="50" r="48" fill="#FFFFFF" stroke="#000" strokeWidth="4" />
                            <polygon points="50,38 60,45 56,57 44,57 40,45" fill="#000" />
                          </svg>
                        </div>
                      </div>
                      {ballSensorsActive && (
                        <div className="absolute top-7 whitespace-nowrap glass-card text-[#7CFF2A] text-[8px] font-mono px-2 py-0.5 rounded uppercase tracking-widest">
                          Y: 104.2m | X: 34.5m | VEL: 84 km/h
                        </div>
                      )}
                    </div>

                    {/* Players */}
                    <div className="absolute left-[28%] top-[40%] text-center z-10">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FF3B3B] block mx-auto border border-white animate-pulse" />
                      <span className="text-[8px] font-mono text-white mt-1 block font-bold">ARG #10</span>
                    </div>
                    <div className="absolute right-[24%] top-[55%] text-center z-10">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 block mx-auto border border-white animate-pulse" />
                      <span className="text-[8px] font-mono text-white mt-1 block font-bold">ENG #7</span>
                    </div>

                    {/* Grid */}
                    <div className="absolute inset-0 opacity-[0.12] bg-[linear-gradient(rgba(124,255,42,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(124,255,42,0.06)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
                  </div>
                </motion.div>
              </div>

              <div className="mt-6 text-center space-y-1">
                <div className="text-xs font-mono font-bold tracking-[0.3em] text-white/60 uppercase">The Future of the Game</div>
                <p className="text-[10px] font-mono text-white/25 uppercase tracking-widest">
                  AEGIS Synchronized Stadium Telemetry · Drag to rotate pitch
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── MATCH SCHEDULE ────────────────────────────────────────────────── */}
        <section className="relative z-[2] max-w-7xl mx-auto px-6 py-8">
          <MatchSchedule />
        </section>
      </main>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="relative z-[2] border-t border-white/[0.04] py-12 px-6 bg-[#030508]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#7CFF2A] flex items-center justify-center shadow-[0_0_12px_rgba(124,255,42,0.4)]">
                <Cpu className="w-4 h-4 text-black" />
              </div>
              <div>
                <div className="font-['Space_Grotesk',sans-serif] font-bold text-white text-sm">FIFA<span className="text-[#7CFF2A]">iq</span></div>
                <div className="font-mono text-[10px] text-white/25 uppercase tracking-widest">Smart Stadium AI Platform</div>
              </div>
            </div>

            <div className="flex items-center gap-6 font-mono text-[11px] text-white/25">
              <a href="#hero" className="hover:text-[#7CFF2A] transition-colors">Dashboard</a>
              <a href="#map" className="hover:text-[#7CFF2A] transition-colors">Stadium Map</a>
              <a href="#ops" className="hover:text-[#7CFF2A] transition-colors">Operations</a>
              <a href="#match-tech" className="hover:text-[#7CFF2A] transition-colors">Match Tech</a>
            </div>

            <button
              onClick={onEnterConsole}
              className="btn-magnetic bg-[#7CFF2A] text-black font-bold text-xs px-5 py-2.5 rounded-xl transition-all hover:scale-105 shadow-[0_0_20px_rgba(124,255,42,0.25)] flex items-center gap-2"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Enter Command Center</span>
            </button>
          </div>

          <div className="border-t border-white/[0.04] pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="font-mono text-[10px] text-white/15">
              Official FIFA World Cup 2026 Venue Operating System & AI Intelligence Core
            </p>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7CFF2A] live-dot" />
              <span className="font-mono text-[10px] text-[#7CFF2A]/50">All systems operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
