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

// Real events from England vs Argentina Semi-Final — COMPLETED (FT)
const LIVE_MATCH = {
  home: "England",
  homeFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  away: "Argentina",
  awayFlag: "🇦🇷",
  venue: "Mercedes-Benz Stadium, Atlanta",
  kickoff: new Date("2026-07-15T19:00:00Z"), // 15:00 ET = 19:00 UTC
  score: { home: 1, away: 2 },
  winner: "away" as "home" | "away" | null,
  events: [
    { minute: 8,  type: "yellow", team: "away", player: "C. Romero",         detail: "Foul on Bellingham" },
    { minute: 23, type: "var",    team: "home", player: "VAR Review",         detail: "Penalty checked — no award" },
    { minute: 38, type: "yellow", team: "away", player: "L. Martínez",        detail: "Pulling Rashford" },
    { minute: 45, type: "sub",    team: "home", player: "Rashford → Gordon",  detail: "Half-time change" },
    { minute: 55, type: "goal",   team: "home", player: "A. Gordon",          detail: "Morgan Rogers assist — England 1-0!" },
    { minute: 63, type: "sub",    team: "away", player: "Paredes → González", detail: "Argentina push forward" },
    { minute: 74, type: "yellow", team: "home", player: "J. Bellingham",      detail: "Tactical foul" },
    { minute: 86, type: "goal",   team: "away", player: "E. Fernández",       detail: "Stunning long-range strike — 1-1!" },
    { minute: 90, type: "sub",    team: "home", player: "Saka → Trossard",    detail: "England chase the win" },
    { minute: 92, type: "goal",   team: "away", player: "L. Martínez",        detail: "Header from Messi cross — Argentina WIN 1-2!" },
  ] as LiveEvent[],
};

const EVENT_ICONS: Record<LiveEvent["type"], string> = {
  goal:   "⚽",
  yellow: "🟨",
  red:    "🟥",
  sub:    "🔄",
  var:    "📺",
};

const EVENT_COLORS: Record<LiveEvent["type"], string> = {
  goal:   "#c8ff00",
  yellow: "#f5c518",
  red:    "#ff3b3b",
  sub:    "#60aaff",
  var:    "#a0a0ff",
};

export default function LiveScoreBoard() {
  const { kickoff } = LIVE_MATCH;
  const [matchMinute, setMatchMinute] = useState(92);
  const [visibleEvents, setVisibleEvents] = useState<LiveEvent[]>(LIVE_MATCH.events);
  const [status, setStatus] = useState<"pre" | "live" | "ht" | "ft">("ft");
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const computeMinute = () =>
      Math.min(Math.max(Math.floor((new Date().getTime() - kickoff.getTime()) / 60_000), 0), 92);

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

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
  }, [visibleEvents]);

  const progressPct = Math.min((matchMinute / 90) * 100, 100);
  const homeWon = LIVE_MATCH.winner === "home";
  const awayWon = LIVE_MATCH.winner === "away";

  return (
    <div
      className="bg-[#0a0f0a] border border-[#1e3a1e]/60 rounded-xl p-4"
      role="region"
      aria-label="Live match scoreboard — England vs Argentina Semi-Final"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 rounded-full bg-[#ff3b3b]" aria-hidden="true" />
        <span className="text-[10px] text-[#ff3b3b] font-mono font-semibold tracking-[0.2em] uppercase">
          Semi-Final · Full Time · Jul 15
        </span>
        <span className="ml-auto text-[10px] text-[#3a5a3a] font-mono">{LIVE_MATCH.venue}</span>
      </div>

      {/* Scoreline — winner/loser visual weight */}
      <div className="flex items-center justify-between mb-4">
        {/* Home team */}
        <div className="text-center flex-1">
          <div className="text-3xl mb-1" aria-hidden="true">{LIVE_MATCH.homeFlag}</div>
          <div
            className="text-sm font-semibold mt-1"
            style={{ color: homeWon ? "#c8ff00" : "#6b7280" }}
          >
            {LIVE_MATCH.home}
          </div>
          {homeWon && (
            <div className="text-[9px] font-mono text-[#c8ff00] uppercase tracking-widest mt-0.5">
              WINNER
            </div>
          )}
        </div>

        {/* Score box */}
        <div
          className="text-center px-8 py-3 bg-[#0f172a] rounded-xl border"
          style={{ borderColor: "#1e3a1e" }}
          aria-label={`Score: ${LIVE_MATCH.home} ${LIVE_MATCH.score.home} - ${LIVE_MATCH.score.away} ${LIVE_MATCH.away}`}
        >
          <div className="flex items-baseline gap-2 leading-none">
            {/* Home score */}
            <span className={homeWon ? "score-winner" : "score-loser"}>
              {LIVE_MATCH.score.home}
            </span>
            <span className="text-2xl text-[#3a5a3a] font-mono">—</span>
            {/* Away score */}
            <span className={awayWon ? "score-winner" : "score-loser"}>
              {LIVE_MATCH.score.away}
            </span>
          </div>
          <div className="text-[10px] text-[#3a5a3a] mt-1 font-mono">
            {status === "ht" ? "HALF TIME" : status === "ft" ? "FULL TIME" : `${matchMinute}'`}
          </div>
        </div>

        {/* Away team */}
        <div className="text-center flex-1">
          <div className="text-3xl mb-1" aria-hidden="true">{LIVE_MATCH.awayFlag}</div>
          <div
            className="text-sm font-semibold mt-1"
            style={{ color: awayWon ? "#c8ff00" : "#6b7280" }}
          >
            {LIVE_MATCH.away}
          </div>
          {awayWon && (
            <div className="text-[9px] font-mono text-[#c8ff00] uppercase tracking-widest mt-0.5">
              WINNER
            </div>
          )}
        </div>
      </div>

      {/* Match progress bar */}
      <div
        className="h-1 bg-[#1e2a1e] rounded-full mb-4 overflow-hidden"
        role="progressbar"
        aria-valuenow={matchMinute}
        aria-valuemin={0}
        aria-valuemax={90}
        aria-label={`Match at minute ${matchMinute} of 90`}
      >
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${progressPct}%`, background: "linear-gradient(90deg, #c8ff00, #7CFF2A)" }}
        />
      </div>

      {/* Event feed */}
      <div
        ref={feedRef}
        className="flex flex-col gap-1.5 max-h-52 overflow-y-auto"
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
              className="flex items-start gap-2.5 px-2.5 py-1.5 rounded-lg"
              style={{
                background: ev.type === "goal" ? "rgba(200,255,0,0.04)" : "#0f172a",
                borderLeft: `2px solid ${EVENT_COLORS[ev.type]}`,
              }}
            >
              <span className="text-[10px] text-[#4a6a4a] font-mono min-w-[28px] pt-0.5">
                {ev.minute}&apos;
              </span>
              <span className="text-sm" aria-hidden="true">{EVENT_ICONS[ev.type]}</span>
              <div className="flex-1">
                <div
                  className="text-xs font-semibold"
                  style={{ color: ev.type === "goal" ? "#c8ff00" : "#c8dcc8" }}
                >
                  {ev.player}
                </div>
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

      {/* Footer — upcoming final */}
      <div
        className="mt-4 px-3 py-2 rounded-lg text-[11px] text-center font-mono"
        style={{
          background: "rgba(200,255,0,0.06)",
          border: "1px solid rgba(200,255,0,0.2)",
          color: "#c8ff00",
        }}
      >
        🏆 FINAL · Spain 🇪🇸 vs Argentina 🇦🇷 · Jul 19 · 15:00 ET · MetLife Stadium NJ
      </div>
    </div>
  );
}
