/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Cpu, Wifi, Shield, Navigation, Globe, Check, AlertCircle } from "lucide-react";

interface OnboardingProps {
  onComplete: () => void;
  key?: string;
}

interface InitStep {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  status: "pending" | "loading" | "success" | "error";
  log: string;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [showWelcome, setShowWelcome] = useState(false);
  
  const [steps, setSteps] = useState<InitStep[]>([
    { id: "iot", label: "Connecting to Stadium IoT Sensor Network", icon: Wifi, status: "pending", log: "Port 3000 mapping... reading 14,200 mesh transponders... OK" },
    { id: "twin", label: "Synthesizing Holographic Digital Twin", icon: Navigation, status: "pending", log: "Mapping MetLife structural vectors... rendering isometric vertex cloud... OK" },
    { id: "crowd", label: "Syncing Crowd Intelligence Models", icon: Globe, status: "pending", log: "Activating real-time optical flow trackers... processing pedestrian density... OK" },
    { id: "security", label: "Securing Firewall & Emergency Grid", icon: Shield, status: "pending", log: "Booting emergency egress matrix... initializing fire/medical priority channels... OK" },
    { id: "ai", label: "Activating AEGIS Generative AI Core", icon: Cpu, status: "pending", log: "Querying Gemini-3.5-Flash cognitive hub... system instructions loaded... NOMINAL" },
  ]);

  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "AEGIS Smart Stadium OS v4.11.0 Boot Sequence Initiated...",
    "System local clock synced: 2026-07-11T10:54:19-07:00",
  ]);

  useEffect(() => {
    // Progress bar incrementor
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        // Accelerate or decelerate to make it feel organic
        const step = Math.floor(Math.random() * 4) + 2;
        return Math.min(prev + step, 100);
      });
    }, 120);

    return () => clearInterval(progressInterval);
  }, []);

  useEffect(() => {
    if (progress === 100) {
      setTimeout(() => {
        setShowWelcome(true);
      }, 400);

      setTimeout(() => {
        onComplete();
      }, 2500);
      return;
    }

    // Step index updater
    const targetStep = Math.min(Math.floor((progress / 100) * steps.length), steps.length - 1);
    if (targetStep !== stepIndex) {
      // Complete previous step
      setSteps((prev) => {
        const next = [...prev];
        next[stepIndex].status = "success";
        return next;
      });
      
      // Add previous log to terminal
      const completedStep = steps[stepIndex];
      setTerminalLogs((prevLogs) => [
        ...prevLogs,
        `✓ ${completedStep.label} ... [OK]`,
        `  LOG: ${completedStep.log}`
      ]);

      setStepIndex(targetStep);
      
      // Mark current step as loading
      setSteps((prev) => {
        const next = [...prev];
        next[targetStep].status = "loading";
        return next;
      });
    }
  }, [progress, stepIndex]);

  // Micro logs simulator
  useEffect(() => {
    if (progress < 100) {
      const logInterval = setInterval(() => {
        const randomLogs = [
          "Allocating memory blocks at 0x7FFA81C02...",
          "Calibrating crowd prediction models via neural flow...",
          "Securing localized GPS-beacon clusters...",
          "Evaluating photovoltaic storage capacities...",
          "Checking backup diesel hydro-generators...",
          "Connecting multilingual sign-assistance nodes...",
        ];
        const log = randomLogs[Math.floor(Math.random() * randomLogs.length)];
        setTerminalLogs((prev) => [...prev.slice(-10), `[SYS_LOG] ${log}`]);
      }, 650);
      return () => clearInterval(logInterval);
    }
  }, [progress]);

  return (
    <div id="aegis-bootloader" className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#081018] font-sans text-[#F2FAFF] select-none overflow-hidden">
      {/* Background Holographic Scanlines & Aurora effects */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(68,127,152,0.12)_0%,rgba(8,16,24,0)_70%)]" />
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />

      <AnimatePresence mode="wait">
        {!showWelcome ? (
          <motion.div
            key="loading-console"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-3xl px-6 flex flex-col items-center"
          >
            {/* Spinning AI Logo */}
            <div className="relative mb-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                className="w-24 h-24 rounded-full border border-dashed border-[#6FD3FF]/40 flex items-center justify-center"
              >
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                  className="w-20 h-20 rounded-full border border-[#447F98] flex items-center justify-center"
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#0F1722] to-[#141E2D] flex items-center justify-center shadow-[0_0_20px_rgba(111,211,255,0.25)] border border-[#6FD3FF]/20">
                    <Cpu className="w-8 h-8 text-[#6FD3FF]" />
                  </div>
                </motion.div>
              </motion.div>
              {/* Pulsing Outer Glow ring */}
              <div className="absolute inset-[-10px] rounded-full border border-[#6FD3FF]/10 animate-ping opacity-30" />
            </div>

            {/* Main Branding */}
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold font-mono tracking-widest text-[#F2FAFF] mb-2">
                AEGIS <span className="text-[#6FD3FF] font-sans font-extralight">//</span> STADIUM OS
              </h1>
              <p className="text-[#8EA4B5] text-xs uppercase tracking-[0.25em]">
                Futuristic AI Venue Control Matrix • FIFA 2026
              </p>
            </div>

            {/* Initialization Checklist HUD */}
            <div className="w-full bg-[#0F1722]/85 rounded-xl border border-white/5 p-6 backdrop-blur-md mb-6">
              <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
                <span className="text-xs uppercase font-mono text-[#8EA4B5] tracking-wider">SYSTEM INITIALIZATION DIAGNOSTIC</span>
                <span className="text-sm font-mono text-[#6FD3FF] font-bold">{progress}%</span>
              </div>

              <div className="space-y-3">
                {steps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-1.5 rounded-md ${
                          step.status === "success" ? "bg-[#59FF89]/10 text-[#59FF89]" :
                          step.status === "loading" ? "bg-[#6FD3FF]/10 text-[#6FD3FF] animate-pulse" :
                          "bg-white/5 text-[#8EA4B5]"
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className={`text-xs ${
                          step.status === "success" ? "text-[#F2FAFF]" :
                          step.status === "loading" ? "text-[#6FD3FF] font-medium" :
                          "text-[#8EA4B5]"
                        }`}>
                          {step.label}
                        </span>
                      </div>

                      <div>
                        {step.status === "success" && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center space-x-1 text-[#59FF89] text-xs font-mono font-bold">
                            <Check className="w-3.5 h-3.5" />
                            <span>ONLINE</span>
                          </motion.div>
                        )}
                        {step.status === "loading" && (
                          <div className="flex items-center space-x-1 text-[#6FD3FF] text-xs font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#6FD3FF] animate-ping mr-1" />
                            <span>SYNCING...</span>
                          </div>
                        )}
                        {step.status === "pending" && (
                          <span className="text-white/25 text-xs font-mono">STDBY</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Progress Slider Bar */}
              <div className="mt-6 w-full h-1.5 bg-[#081018] rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  className="h-full bg-gradient-to-r from-[#447F98] via-[#6FD3FF] to-[#59FF89]"
                  style={{ width: `${progress}%` }}
                  transition={{ ease: "easeInOut" }}
                />
              </div>
            </div>

            {/* Terminal Logs Sub-Panel */}
            <div className="w-full h-32 bg-[#081018] rounded-lg border border-white/5 p-4 font-mono text-[10px] text-emerald-400/80 overflow-y-auto space-y-1 scrollbar-none flex flex-col justify-end">
              {terminalLogs.map((log, index) => (
                <div key={index} className="truncate select-text">
                  <span className="text-[#8EA4B5] select-none mr-2">[{new Date().toLocaleTimeString()}]</span>
                  {log}
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="welcome-toast"
            initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 1.05, filter: "blur(15px)" }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className="text-center px-6"
          >
            <motion.div 
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-4 inline-flex p-4 rounded-full bg-gradient-to-tr from-[#59FF89]/20 to-[#6FD3FF]/20 border border-[#59FF89]/30 shadow-[0_0_30px_rgba(89,255,137,0.15)]"
            >
              <Check className="w-12 h-12 text-[#59FF89]" />
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-4xl font-bold tracking-tight mb-2"
            >
              ACCESS GRANTED
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-[#8EA4B5] uppercase text-xs tracking-widest font-mono mb-8"
            >
              AEGIS // Stadium Core Online & Secure
            </motion.p>
            
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: 240 }}
              transition={{ delay: 0.8, duration: 1 }}
              className="h-[1px] bg-gradient-to-r from-transparent via-[#6FD3FF] to-transparent mx-auto"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
