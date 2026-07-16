/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Cpu, Volume2, Sparkles, Terminal, Maximize2, Minimize2, Languages, ArrowRight, User } from "lucide-react";
import { ChatMessage, OperationScenario, TwinLayer } from "../types";

interface JarvisAssistantProps {
  scenario: OperationScenario;
  setScenario: (scen: OperationScenario) => void;
  setActiveLayer: (lay: TwinLayer) => void;
  triggerNotification: (title: string, msg: string, severity: "INFO" | "WARNING" | "CRITICAL") => void;
}

export default function JarvisAssistant({
  scenario,
  setScenario,
  setActiveLayer,
  triggerNotification,
}: JarvisAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "model",
      content: "[AEGIS CORE INITIALIZED]\nWelcome Commander. All systems operating at nominal capacity. Ready for scenario directives or cognitive telemetry queries.",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [aiState, setAiState] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [languageMode, setLanguageMode] = useState<"en" | "es" | "fr" | "ar" | "zh">("en");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Handle dynamic suggestions
  const handleQuickCommand = async (commandText: string, scenarioOverride?: OperationScenario, layerOverride?: TwinLayer) => {
    setAiState("listening");
    setInputValue("");
    
    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: "user",
      content: commandText,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);
    setAiState("thinking");

    // Implement Scenario changes
    if (scenarioOverride) {
      setScenario(scenarioOverride);
      if (scenarioOverride === "emergency-evac") {
        setActiveLayer("evacuation");
        triggerNotification(
          "EVACUATION PROTOCOL V4 INITIATED",
          "AI core has routed Gate C flow outward towards Gate D. Public PA broadcasts activated.",
          "CRITICAL"
        );
      } else if (scenarioOverride === "gate-overflow") {
        setActiveLayer("crowd");
        triggerNotification(
          "GATE C CONGESTION WARNING",
          "Pedestrian density peak detected at South plaza. Automated rerouting initiated.",
          "WARNING"
        );
      } else if (scenarioOverride === "severe-weather") {
        triggerNotification(
          "LIGHTNING ALERT WARNING",
          "Severe cell approaching. Retractable roof structural closure sequence initialized.",
          "CRITICAL"
        );
      }
    }

    if (layerOverride) {
      setActiveLayer(layerOverride);
    }

    try {
      const response = await fetch("/api/jarvis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: commandText,
          chatHistory: messages,
          scenario: scenarioOverride || scenario,
        }),
      });

      const data = await response.json();
      
      setAiState("speaking");
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          role: "model",
          content: data.response,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (err) {
      console.error("Failed to query AEGIS backend:", err);
      // Fallback
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          role: "model",
          content: "AEGIS core connection failed. Emergency fallback: Stadium IoT loop has self-healed, systems operating under localized local parameters.",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsTyping(false);
      setTimeout(() => setAiState("idle"), 3000);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    const text = inputValue;
    setInputValue("");
    handleQuickCommand(text);
  };

  // Soundwave generator heights
  const [waveHeights, setWaveHeights] = useState([10, 10, 10, 10, 10, 10, 10, 10]);
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (aiState === "thinking") {
      interval = setInterval(() => {
        setWaveHeights(waveHeights.map(() => Math.floor(Math.random() * 25) + 15));
      }, 80);
    } else if (aiState === "speaking" || aiState === "listening") {
      interval = setInterval(() => {
        setWaveHeights(waveHeights.map(() => Math.floor(Math.random() * 45) + 5));
      }, 100);
    } else {
      interval = setInterval(() => {
        setWaveHeights(waveHeights.map(() => Math.sin(Date.now() / 200) * 4 + 8));
      }, 200);
    }
    return () => clearInterval(interval);
  }, [aiState]);

  // Multilingual assistant translations lookup trigger
  const toggleLanguage = () => {
    const langs: Array<"en" | "es" | "fr" | "ar" | "zh"> = ["en", "es", "fr", "ar", "zh"];
    const currentIdx = langs.indexOf(languageMode);
    const nextLang = langs[(currentIdx + 1) % langs.length];
    setLanguageMode(nextLang);
    
    let greet = "";
    if (nextLang === "es") greet = "Interfacing in Spanish (Castellano) activated. Ready.";
    else if (nextLang === "fr") greet = "Interfacing in French (Français) activé. Prêt.";
    else if (nextLang === "ar") greet = "Interfacing in Arabic (العربية) نشط. جاهز للعمل.";
    else if (nextLang === "zh") greet = "Interfacing in Chinese (中文) 终端就绪。";
    else greet = "English translation core loaded.";

    triggerNotification("LANGUAGE MODULE LOADED", greet, "INFO");
  };

  return (
    <div 
      id="jarvis-ai-space" 
      className={`relative bg-[#0F1722]/65 rounded-xl border border-white/5 backdrop-blur-md overflow-hidden flex flex-col transition-all duration-500 ${
        isFullScreen ? "fixed inset-4 z-40 bg-[#081018]/98" : "h-[520px]"
      }`}
    >
      {/* Header bar */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-white/5 bg-[#081018]/45">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <span className={`w-2 h-2 rounded-full block ${
              aiState === "thinking" ? "bg-amber-400 animate-pulse" :
              aiState === "speaking" ? "bg-[#59FF89] animate-ping" : "bg-[#6FD3FF]"
            }`} />
          </div>
          <span className="text-xs uppercase font-mono tracking-widest text-[#F2FAFF] font-semibold flex items-center">
            <Cpu className="w-3.5 h-3.5 mr-1.5 text-[#6FD3FF]" />
            AEGIS Core Jarvis Core
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={toggleLanguage}
            title="Switch Core Language Mode"
            className="p-1.5 hover:bg-white/5 rounded text-[#8EA4B5] hover:text-[#6FD3FF] transition flex items-center text-[10px] font-mono uppercase"
          >
            <Languages className="w-3.5 h-3.5 mr-1 text-[#6FD3FF]" />
            <span>LANG: {languageMode}</span>
          </button>
          
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-1.5 hover:bg-white/5 rounded text-[#8EA4B5] hover:text-[#F2FAFF] transition"
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main workspace layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* LEFT PANEL: The Holographic Orb Jarvis Visualizer */}
        <div className="w-full md:w-2/5 border-b md:border-b-0 md:border-r border-white/5 p-6 flex flex-col items-center justify-center bg-[#081018]/25 relative">
          
          {/* Subtle rotation background light grids */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(111,211,255,0.06)_0%,transparent_60%)]" />
          
          {/* Spinning Outer HUD Orbit */}
          <div className="relative w-44 h-44 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
              className="absolute inset-0 rounded-full border border-dashed border-[#6FD3FF]/20"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
              className="absolute inset-3 rounded-full border border-[#447F98]/20"
            />
            <div className="absolute inset-6 rounded-full border border-[#6FD3FF]/5 animate-ping opacity-25" />

            {/* Glowing Center Holographic Orb core */}
            <motion.div
              animate={{
                scale: aiState === "thinking" ? [1, 1.05, 1] : [1, 1.02, 1],
              }}
              transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
              className="w-28 h-28 rounded-full bg-gradient-to-br from-[#141E2D] to-[#0F1722] border border-[#6FD3FF]/30 flex flex-col items-center justify-center relative shadow-[0_0_35px_rgba(111,211,255,0.2)]"
            >
              {/* Dynamic Soundwaves core inside orb */}
              <div className="flex items-center space-x-1 justify-center h-10 w-24">
                {waveHeights.map((h, i) => (
                  <motion.div
                    key={i}
                    style={{ height: h }}
                    className={`w-1 rounded-full transition-all duration-100 ${
                      aiState === "thinking" ? "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]" :
                      aiState === "speaking" ? "bg-[#59FF89] shadow-[0_0_6px_rgba(89,255,137,0.5)]" :
                      aiState === "listening" ? "bg-cyan-300 shadow-[0_0_6px_rgba(110,211,255,0.5)]" :
                      "bg-[#6FD3FF]/40"
                    }`}
                  />
                ))}
              </div>

              {/* Status Indicator text */}
              <span className="text-[9px] font-mono text-[#8EA4B5] uppercase tracking-wider absolute bottom-4 animate-pulse">
                {aiState === "idle" && "AI READY"}
                {aiState === "listening" && "LISTENING"}
                {aiState === "thinking" && "COGNITIVE..."}
                {aiState === "speaking" && "SPEAKING"}
              </span>
            </motion.div>
          </div>

          {/* Quick Scenario Directives buttons */}
          <div className="w-full mt-6 space-y-2">
            <span className="block text-[10px] font-mono text-[#8EA4B5] uppercase tracking-wider text-center">SYSTEM DRILL DIRECTIVES</span>
            
            <button
              id="directive-overflow-btn"
              onClick={() => handleQuickCommand("Trigger Gate C crowd flow optimization drill", "gate-overflow", "crowd")}
              className={`w-full text-left px-3 py-2 bg-[#0F1722] hover:bg-[#447F98]/10 rounded border border-white/5 hover:border-[#6FD3FF]/30 text-xs font-mono transition flex items-center justify-between ${
                scenario === "gate-overflow" ? "border-[#FFC857]/30 text-amber-300" : "text-white/80"
              }`}
            >
              <span className="truncate">1. Gate C Crowd Congestion</span>
              <ArrowRight className="w-3 h-3 text-[#6FD3FF]" />
            </button>

            <button
              id="directive-evac-btn"
              onClick={() => handleQuickCommand("Initiate full-scale crowd emergency evacuation routing simulation", "emergency-evac", "evacuation")}
              className={`w-full text-left px-3 py-2 bg-[#0F1722] hover:bg-[#447F98]/10 rounded border border-white/5 hover:border-[#FF5D73]/30 text-xs font-mono transition flex items-center justify-between ${
                scenario === "emergency-evac" ? "border-[#FF5D73]/30 text-[#FF5D73]" : "text-white/80"
              }`}
            >
              <span className="truncate">2. Emergency Evac Drill</span>
              <ArrowRight className="w-3 h-3 text-[#FF5D73]" />
            </button>

            <button
              id="directive-energy-btn"
              onClick={() => handleQuickCommand("Optimize venue HVAC heating/cooling and sustainability profile", "nominal", "energy")}
              className="w-full text-left px-3 py-2 bg-[#0F1722] hover:bg-[#447F98]/10 rounded border border-white/5 hover:border-[#59FF89]/30 text-xs font-mono text-white/80 transition flex items-center justify-between"
            >
              <span className="truncate">3. Optimize Energy Draw</span>
              <ArrowRight className="w-3 h-3 text-[#59FF89]" />
            </button>
          </div>

        </div>

        {/* RIGHT PANEL: The Active Terminal Conversational Log */}
        <div className="flex-1 flex flex-col justify-between bg-[#081018]/15">
          
          {/* Scrollable conversation bubble feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[300px] md:max-h-none scrollbar-thin">
            <div className="flex items-center justify-between text-[10px] font-mono text-white/20 border-b border-white/5 pb-2 mb-3">
              <span>SECURITY CHANNEL SECURE: AES-256</span>
              <span>COGNITIVE ENGINE: v3.5-FLASH</span>
            </div>

            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex space-x-3 text-xs leading-relaxed ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {m.role !== "user" && (
                  <div className="w-6 h-6 rounded bg-[#447F98]/20 border border-[#6FD3FF]/20 flex items-center justify-center text-xs text-[#6FD3FF] flex-shrink-0 font-mono">
                    A
                  </div>
                )}
                
                <div className={`p-3 rounded-lg max-w-[85%] whitespace-pre-wrap font-mono ${
                  m.role === "user"
                    ? "bg-[#447F98]/20 text-[#6FD3FF] border border-[#6FD3FF]/15"
                    : "bg-[#0F1722] text-[#F2FAFF] border border-white/5"
                }`}>
                  <div className="flex justify-between items-center text-[9px] text-[#8EA4B5]/60 mb-1 border-b border-white/5 pb-0.5 select-none">
                    <span className="font-semibold uppercase tracking-wider">
                      {m.role === "user" ? "Command Operator" : "AEGIS Operating System"}
                    </span>
                    <span>{m.timestamp}</span>
                  </div>
                  <div>{m.content}</div>
                </div>

                {m.role === "user" && (
                  <div className="w-6 h-6 rounded bg-[#6FD3FF]/10 border border-[#6FD3FF]/30 flex items-center justify-center text-xs text-[#6FD3FF] flex-shrink-0">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex space-x-3 text-xs justify-start">
                <div className="w-6 h-6 rounded bg-[#447F98]/20 border border-[#6FD3FF]/20 flex items-center justify-center text-xs text-[#6FD3FF] flex-shrink-0 animate-pulse font-mono">
                  A
                </div>
                <div className="p-3 rounded-lg bg-[#0F1722] border border-white/5 text-[#8EA4B5] flex items-center space-x-1.5 font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-[#6FD3FF] animate-spin" />
                  <span>AEGIS thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat input form */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-white/5 bg-[#081018]/60 flex items-center space-x-2">
            <input
              id="jarvis-chat-input"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Query Jarvis stadium metrics (e.g., 'Solve crowd lock', 'Check transport grid')..."
              className="flex-1 bg-[#0F1722] border border-white/5 rounded-lg px-3 py-2 text-xs font-mono text-[#F2FAFF] placeholder-[#8EA4B5]/50 focus:outline-none focus:border-[#6FD3FF]/40"
            />
            <button
              id="jarvis-chat-submit"
              type="submit"
              className="p-2 bg-[#447F98] hover:bg-[#6FD3FF] text-[#081018] rounded-lg transition-all shadow-[0_0_10px_rgba(111,211,255,0.2)] flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>

      </div>
    </div>
  );
}
