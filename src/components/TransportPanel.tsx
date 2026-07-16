"use client";
import React, { useState, useEffect, useCallback } from "react";

type TabType = "Shuttles" | "Metro" | "Parking";

interface ShuttleRoute {
  name: string;
  departure: string;
  frequencyMin: number;
  status: "On Time" | "Delayed" | "Full";
}

const INITIAL_ROUTES: ShuttleRoute[] = [
  { name: "NJ Transit Meadowlands Express", departure: "Secaucus Junction", frequencyMin: 15, status: "On Time" },
  { name: "Port Authority Bus", departure: "42nd St NYC", frequencyMin: 20, status: "On Time" },
  { name: "Stadium Loop Shuttle", departure: "Lot A", frequencyMin: 8, status: "On Time" },
  { name: "Newark Airport Express", departure: "Newark Airport", frequencyMin: 30, status: "On Time" },
  { name: "VIP Car Service", departure: "Marriott Meadowlands", frequencyMin: 999, status: "On Time" },
];

interface MetroStation {
  name: string;
  distanceKm: number;
}

const METRO_STATIONS: MetroStation[] = [
  { name: "Meadowlands Sports Complex", distanceKm: 0.3 },
  { name: "Secaucus Junction", distanceKm: 2.1 },
  { name: "Wood-Ridge", distanceKm: 3.8 },
];

interface Lot {
  name: string;
  capacity: number;
}

const LOTS: Lot[] = [
  { name: "Lot A", capacity: 2400 },
  { name: "Lot B", capacity: 3200 },
  { name: "Lot C", capacity: 1800 },
  { name: "Lot D", capacity: 2100 },
];

function computeNextDeparture(frequencyMin: number): string {
  if (frequencyMin === 999) return "On demand";
  const now = new Date();
  const minuteOfDay = now.getHours() * 60 + now.getMinutes();
  const nextSlot = Math.ceil(minuteOfDay / frequencyMin) * frequencyMin;
  const h = Math.floor(nextSlot / 60) % 24;
  const m = nextSlot % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function computeCrowdLevel(now: Date): "QUIET" | "BUSY" | "VERY BUSY" {
  const h = now.getHours();
  // Simulated kickoff at 17:00 local
  const kickoff = 17;
  const pre = h >= kickoff - 1 && h < kickoff;
  const post = h >= kickoff && h < kickoff + 2;
  if (pre || post) return "VERY BUSY";
  if (h >= 15 && h < kickoff + 3) return "BUSY";
  return "QUIET";
}

const statusColors: Record<string, string> = {
  "On Time": "text-[#00ff9d] bg-[#00ff9d]/10 border-[#00ff9d]/30",
  Delayed: "text-[#f5c518] bg-[#f5c518]/10 border-[#f5c518]/30",
  Full: "text-[#ff3b3b] bg-[#ff3b3b]/10 border-[#ff3b3b]/30",
};

const crowdColors: Record<string, string> = {
  "VERY BUSY": "text-[#ff3b3b]",
  BUSY: "text-[#f5c518]",
  QUIET: "text-[#00ff9d]",
};

export default function TransportPanel() {
  const [activeTab, setActiveTab] = useState<TabType>("Shuttles");
  const [routes, setRoutes] = useState<ShuttleRoute[]>(INITIAL_ROUTES);
  const [parkingFill, setParkingFill] = useState<number[]>([78, 92, 45, 63]);
  const [journeyOrigin, setJourneyOrigin] = useState("");
  const [journeyResult, setJourneyResult] = useState<string | null>(null);
  const [journeyLoading, setJourneyLoading] = useState(false);

  const now = new Date();
  const crowdLevel = computeCrowdLevel(now);
  const isPostMatch = now.getHours() >= 19;

  // Shuttle status updates every 60s
  useEffect(() => {
    const iv = setInterval(() => {
      setRoutes((prev) =>
        prev.map((r) => {
          const rand = Math.random();
          let status: ShuttleRoute["status"] = "On Time";
          if (rand < 0.08) status = "Full";
          else if (rand < 0.23) status = "Delayed";
          return { ...r, status };
        })
      );
    }, 60_000);
    return () => clearInterval(iv);
  }, []);

  // Parking fill random walk every 30s
  useEffect(() => {
    const iv = setInterval(() => {
      setParkingFill((prev) =>
        prev.map((f) => Math.max(0, Math.min(100, f + (Math.random() - 0.5) * 6)))
      );
    }, 30_000);
    return () => clearInterval(iv);
  }, []);

  const recommendedLotIdx = parkingFill
    .map((f, i) => ({ f, i }))
    .filter(({ f }) => f < 95)
    .sort((a, b) => a.f - b.f)[0]?.i ?? -1;

  const planJourney = useCallback(async () => {
    if (!journeyOrigin.trim()) return;
    setJourneyLoading(true);
    setJourneyResult(null);
    try {
      const res = await fetch("/api/gemini-transport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: journeyOrigin,
          matchInfo: "Semi-Final at 17:00 ET",
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { response: string };
      setJourneyResult(data.response);
    } catch {
      setJourneyResult(
        "Take the NJ Transit Meadowlands Express from Secaucus Junction (every 15 min, 8-min journey) — fastest and most reliable on match day."
      );
    }
    setJourneyLoading(false);
  }, [journeyOrigin]);

  const TABS: TabType[] = ["Shuttles", "Metro", "Parking"];

  return (
    <div className="w-full space-y-4">
      {/* Tab bar */}
      <div role="tablist" aria-label="Transport tabs" className="flex gap-1 p-1 bg-[#0f172a]/60 rounded-xl border border-[#00ff9d]/10">
        {TABS.map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 text-xs py-2 rounded-lg font-medium transition-all min-h-[44px] ${
              activeTab === tab
                ? "bg-[#00ff9d]/15 text-[#00ff9d] border border-[#00ff9d]/30"
                : "text-[#4c5f57] hover:text-[#7f9a8e]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Shuttles Tab */}
      {activeTab === "Shuttles" && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="text-[#4c5f57] font-mono text-[10px]">
                <th className="text-left pb-2 pr-3">Route</th>
                <th className="text-left pb-2 pr-3">From</th>
                <th className="text-left pb-2 pr-3">Next</th>
                <th className="text-left pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="space-y-2">
              {routes.map((r) => (
                <tr key={r.name} className="border-t border-[#00ff9d]/5">
                  <td className="py-2.5 pr-3 text-[#e6f1ec] font-medium">{r.name}</td>
                  <td className="py-2.5 pr-3 text-[#7f9a8e]">{r.departure}</td>
                  <td className="py-2.5 pr-3 text-[#e6f1ec] font-mono">{computeNextDeparture(r.frequencyMin)}</td>
                  <td className="py-2.5">
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${statusColors[r.status]}`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Metro Tab */}
      {activeTab === "Metro" && (
        <div className="space-y-3">
          {isPostMatch && (
            <div aria-live="polite" className="bg-[#f5c518]/10 border border-[#f5c518]/30 rounded-xl px-4 py-2 text-xs text-[#f5c518]">
              Post-match exodus expected — plan 30min delay or use Gate C overflow exit
            </div>
          )}
          {METRO_STATIONS.map((s) => (
            <div key={s.name} className="bg-[#0f172a]/60 border border-[#00ff9d]/10 rounded-xl p-3 flex justify-between items-center">
              <div>
                <p className="text-sm text-white font-medium">{s.name}</p>
                <p className="text-[10px] text-[#4c5f57]">{s.distanceKm} km from stadium</p>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                crowdLevel === "VERY BUSY"
                  ? "bg-[#ff3b3b]/10 text-[#ff3b3b] border-[#ff3b3b]/30"
                  : crowdLevel === "BUSY"
                  ? "bg-[#f5c518]/10 text-[#f5c518] border-[#f5c518]/30"
                  : "bg-[#00ff9d]/10 text-[#00ff9d] border-[#00ff9d]/30"
              }`}>
                {crowdLevel}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Parking Tab */}
      {activeTab === "Parking" && (
        <div className="space-y-3">
          {LOTS.map((lot, idx) => {
            const fill = parkingFill[idx] ?? 50;
            const open = Math.round(lot.capacity * (1 - fill / 100));
            const isFull = fill > 95;
            const isRecommended = idx === recommendedLotIdx;

            return (
              <div
                key={lot.name}
                className={`bg-[#0f172a]/60 border rounded-xl p-4 transition-all ${
                  isRecommended ? "border-[#00ff9d]/40 shadow-[0_0_12px_rgba(0,255,157,0.1)]" : "border-[#00ff9d]/10"
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{lot.name}</span>
                    {isRecommended && (
                      <span className="text-[9px] font-mono text-[#00ff9d] bg-[#00ff9d]/10 border border-[#00ff9d]/30 px-1.5 py-0.5 rounded-full">RECOMMENDED</span>
                    )}
                  </div>
                  {isFull ? (
                    <span className="text-[10px] font-mono text-[#ff3b3b] font-bold">No spaces available</span>
                  ) : (
                    <span className="text-[10px] text-[#7f9a8e] font-mono">{open} open</span>
                  )}
                </div>
                <progress
                  value={Math.round(fill)}
                  max={100}
                  aria-label={`${lot.name}: ${Math.round(fill)}% full`}
                  className="w-full h-2 rounded-full overflow-hidden appearance-none mb-3"
                  style={{ accentColor: fill > 90 ? "#ff3b3b" : fill > 70 ? "#f5c518" : "#00ff9d" }}
                />
                <div className="flex justify-between items-center">
                  <p className="text-[10px] text-[#4c5f57]">{Math.round(fill)}% full</p>
                  <button
                    onClick={() => alert("Opens stadium parking portal — Lot: " + lot.name)}
                    disabled={isFull}
                    className="px-2.5 py-1 bg-[#00ff9d]/15 border border-[#00ff9d]/40 text-[#00ff9d] text-[10px] font-semibold rounded-lg hover:bg-[#00ff9d]/25 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    Book via stadium app
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Journey Planner — always visible */}
      <div className="bg-[#0f172a]/60 border border-[#00ff9d]/10 rounded-xl p-4 space-y-3">
        <h4 className="text-xs font-mono text-[#4c5f57] uppercase tracking-wider">AI Journey Planner</h4>
        <div className="flex gap-2">
          <div className="flex-1">
            <label htmlFor="journey-origin" className="sr-only">Where are you coming from?</label>
            <input
              id="journey-origin"
              type="text"
              placeholder="Where are you coming from?"
              value={journeyOrigin}
              onChange={(e) => setJourneyOrigin(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && planJourney()}
              className="w-full bg-[#020617] border border-[#00ff9d]/20 rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#4c5f57] outline-none focus:border-[#00ff9d]/40 min-h-[44px]"
            />
          </div>
          <button
            onClick={planJourney}
            disabled={!journeyOrigin.trim() || journeyLoading}
            className="px-4 py-2.5 bg-[#00ff9d]/15 border border-[#00ff9d]/40 text-[#00ff9d] rounded-xl text-sm font-semibold hover:bg-[#00ff9d]/25 transition-colors disabled:opacity-40 min-h-[44px]"
          >
            Plan
          </button>
        </div>

        {/* Journey response */}
        <div aria-live="polite">
          {journeyLoading && (
            <div className="flex gap-1 py-2">
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-2 h-2 bg-[#00ff9d] rounded-full animate-bounce" style={{ animationDelay: `${i * 0.16}s` }} />
              ))}
            </div>
          )}
          {journeyResult && !journeyLoading && (
            <div className="bg-[#020617] border border-[#00ff9d]/15 rounded-xl p-3 text-xs text-[#e6f1ec] leading-relaxed">
              🚌 {journeyResult}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
