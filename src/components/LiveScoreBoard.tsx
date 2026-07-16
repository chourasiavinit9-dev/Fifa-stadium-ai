// src/components/LiveScoreBoard.tsx
"use client";
import { useState, useEffect, useRef } from "react";

interface LiveEvent {
  minute: number;
  type: "goal" | "yellow" | "red" | "sub" | "var";
  team: "home" | "away";
  player: string;
  detail?: string;
}

// Real events from England vs Argentina Semi-Final
const LIVE_MATCH = {
  home: "England",
  homeFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  away: "Argentina",
  awayFlag: "🇦🇷",
  venue: "Mercedes-Benz Stadium, Atlanta",
  kickoff: new Date("2026-07-15T19:00:00Z"), // 15:00 ET = 19:00 UTC
  score: { home: 1, away: 0 },
  events: [
    { minute: 8, type: "yellow", team: "away", player: "C. Romero", detail: "Foul on Bellingham" },
    { minute: 23, type: "var", team: "home", player: "VAR Review", detail: "Penalty checked — no award" },
    { minute: 38, type: "yellow", team: "away", player: "L. Martínez", detail: "Pulling Rashford" },
    { minute: 45, type: "sub", team: "home", player: "Rashford → Gordon", detail: "Half-time change" },
    { minute: 57, type: "goal", team: "home", player: "A. Gordon", detail: "Morgan Rogers assist — 1-0!" },
    { minute: 63, type: "sub", team: "away", player: "Paredes → González", detail: "Argentina push forward" },
  ] as LiveEvent[],
};

const EVENT_ICONS: Record<LiveEvent["type"], string> = {
  goal: "⚽",
  yellow: "🟨",
  red: "🟥",
  sub: "🔄",
  var: "📺",
};

const EVENT_COLORS: Record<LiveEvent["type"], string> = {
  goal: "#00ff9d",
  yellow: "#f5c518",
  red: "#ff3b3b",
  sub: "#60aaff",
  var: "#a0a0ff",
};

export default function LiveScoreBoard() {
  const { kickoff } = LIVE_MATCH;
  const [matchMinute, setMatchMinute] = useState(0);
  const [visibleEvents, setVisibleEvents] = useState<LiveEvent[]>([]);
  const [status, setStatus] = useState<"pre" | "live" | "ht" | "ft">("live");
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const computeMinute = () => {
      const now = new Date();
      return Math.min(Math.max(Math.floor((now.getTime() - kickoff.getTime()) / 60_000), 0), 92);
    };

    const update = () => {
      const min = computeMinute();
      setMatchMinute(min);
      setVisibleEvents(LIVE_MATCH.events.filter((e) => e.minute <= min));
      if (min >= 45 && min < 46) setStatus("ht");
      else if (min >= 90) setStatus("ft");
      else if (min > 0) setStatus("live");
      else setStatus("pre");
    };

    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, [kickoff]);

  // Auto-scroll feed to latest event
  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
  }, [visibleEvents]);

  const progressPct = Math.min((matchMinute / 90) * 100, 100);

  return (
    <div
      className="bg-[#0a0f0a] border border-[#1e3a1e]/60 rounded-xl p-4"
      role="region"
      aria-label="Live match scoreboard — England vs Argentina Semi-Final"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className="w-2 h-2 rounded-full bg-[#ff3b3b] animate-pulse"
          aria-hidden="true"
        />
        <span className="text-[10px] text-[#ff3b3b] font-mono font-semibold tracking-[0.2em] uppercase">
          Semi-Final · Live · {matchMinute}&apos;
        </span>
        <span className="ml-auto text-[10px] text-[#3a5a3a] font-mono">
          {LIVE_MATCH.venue}
        </span>
      </div>

      {/* Scoreline */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-center flex-1">
          <div className="text-2xl" aria-hidden="true">{LIVE_MATCH.homeFlag}</div>
          <div className="text-sm font-semibold text-[#c8dcc8] mt-1">{LIVE_MATCH.home}</div>
        </div>

        <div
          className="text-center px-6 py-2 bg-[#0f172a] rounded-xl border border-[#1e3a1e]"
          aria-label={`Score: ${LIVE_MATCH.home} ${LIVE_MATCH.score.home} - ${LIVE_MATCH.score.away} ${LIVE_MATCH.away}`}
        >
          <div className="text-3xl font-bold font-mono text-[#00ff9d] leading-none">
            {LIVE_MATCH.score.home} — {LIVE_MATCH.score.away}
          </div>
          <div className="text-[10px] text-[#3a5a3a] mt-1 font-mono">
            {status === "ht"
              ? "HALF TIME"
              : status === "ft"
                ? "FULL TIME"
                : `${matchMinute}'`}
          </div>
        </div>

        <div className="text-center flex-1">
          <div className="text-2xl" aria-hidden="true">{LIVE_MATCH.awayFlag}</div>
          <div className="text-sm font-semibold text-[#c8dcc8] mt-1">{LIVE_MATCH.away}</div>
        </div>
      </div>

      {/* Match progress bar */}
      <div
        className="h-1 bg-[#1e2a1e] rounded-full mb-3 overflow-hidden"
        role="progressbar"
        aria-valuenow={matchMinute}
        aria-valuemin={0}
        aria-valuemax={90}
        aria-label={`Match at minute ${matchMinute} of 90`}
      >
        <div
          className="h-full bg-[#ff3b3b] rounded-full transition-all duration-1000"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Event feed */}
      <div
        ref={feedRef}
        className="flex flex-col gap-1.5 max-h-48 overflow-y-auto"
        aria-live="polite"
        aria-label="Match events feed"
      >
        {visibleEvents.length === 0 ? (
          <div className="text-[11px] text-[#3a5a3a] text-center py-3">
            Match started — events will appear here
          </div>
        ) : (
          visibleEvents.map((ev, i) => (
            <div
              key={i}
              className="flex items-start gap-2.5 px-2.5 py-1.5 bg-[#0f172a] rounded-lg"
              style={{ borderLeft: `2px solid ${EVENT_COLORS[ev.type]}` }}
            >
              <span className="text-[10px] text-[#4a6a4a] font-mono min-w-[28px] pt-0.5">
                {ev.minute}&apos;
              </span>
              <span className="text-sm" aria-hidden="true">{EVENT_ICONS[ev.type]}</span>
              <div className="flex-1">
                <div className="text-xs text-[#c8dcc8] font-semibold">{ev.player}</div>
                {ev.detail && (
                  <div className="text-[11px] text-[#4a6a4a] mt-0.5">{ev.detail}</div>
                )}
              </div>
              <span className="text-[10px]" aria-hidden="true">
                {ev.team === "home" ? LIVE_MATCH.homeFlag : LIVE_MATCH.awayFlag}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 px-2.5 py-1.5 bg-[#0f172a] rounded-lg text-[11px] text-[#3a5a3a] text-center">
        Winner faces 🇪🇸 Spain in the Final · July 19, 15:00 ET · MetLife Stadium NJ
      </div>
    </div>
  );
}
