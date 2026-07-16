"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { getFlag } from "../lib/flagLookup";
import type { Match, WorldCupData } from "../lib/worldcupApi";
import { matchStatus, formatMatchDate } from "../lib/worldcupApi";

interface TickerItem {
  id: string;
  match: Match;
  status: "completed" | "live" | "upcoming";
}

const LANGUAGE_OPTIONS = [
  { code: "en", label: "EN" },
  { code: "es", label: "ES" },
  { code: "fr", label: "FR" },
  { code: "ar", label: "AR" },
  { code: "pt", label: "PT" },
] as const;

type LangCode = (typeof LANGUAGE_OPTIONS)[number]["code"];

function formatTickerDate(dateStr: string, timeStr: string | undefined, locale: LangCode): string {
  try {
    const d = new Date(`${dateStr}T12:00:00Z`);
    const datePart = new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(d);
    return timeStr ? `${datePart} · ${timeStr}` : datePart;
  } catch {
    return dateStr;
  }
}

function renderScore(match: Match): string {
  if (!match.score?.ft) return "";
  const [g1, g2] = match.score.ft;
  let suffix = "";
  if (match.score.et) suffix += " (AET)";
  if (match.score.p) suffix += ` (${match.score.p[0]}-${match.score.p[1]} pens)`;
  return `${g1}–${g2}${suffix}`;
}

export default function LiveTicker() {
  const [data, setData] = useState<WorldCupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lang, setLang] = useState<LangCode>("en");
  const [updated, setUpdated] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const updatedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/worldcup");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json() as WorldCupData;
      setData(json);
      setError(false);
      setLoading(false);
      setUpdated(true);
      if (updatedTimerRef.current) clearTimeout(updatedTimerRef.current);
      updatedTimerRef.current = setTimeout(() => setUpdated(false), 2000);
    } catch {
      setError(true);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (updatedTimerRef.current) clearTimeout(updatedTimerRef.current);
    };
  }, [fetchData]);

  const now = new Date();
  const items: TickerItem[] = [];

  if (data?.matches) {
    const completed = data.matches.filter((m) => matchStatus(m, now) === "completed").slice(-6);
    const live = data.matches.filter((m) => matchStatus(m, now) === "live");
    const upcoming = data.matches.filter((m) => matchStatus(m, now) === "upcoming").slice(0, 4);
    const today = data.matches.filter((m) => m.date === now.toISOString().slice(0, 10));

    const seen = new Set<string>();
    for (const m of [...live, ...today, ...completed, ...upcoming]) {
      const key = `${m.team1}-${m.team2}-${m.date}`;
      if (!seen.has(key)) {
        seen.add(key);
        items.push({ id: key, match: m, status: matchStatus(m, now) });
      }
    }
  }

  const doubled = [...items, ...items]; // Seamless loop

  return (
    <div className="relative w-full bg-[#020617]/90 border-b border-[#00ff9d]/15 overflow-hidden">
      {/* Language Selector */}
      <div className="flex items-center justify-between px-4 pt-1 pb-0.5 gap-2">
        <div className="flex items-center gap-1">
          {LANGUAGE_OPTIONS.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              aria-pressed={lang === l.code}
              className={`text-[9px] font-mono px-1.5 py-0.5 rounded transition-all ${
                lang === l.code
                  ? "bg-[#00ff9d]/20 text-[#00ff9d] border border-[#00ff9d]/40"
                  : "text-[#4c5f57] hover:text-[#7f9a8e]"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
        {updated && (
          <span className="text-[9px] font-mono text-[#00ff9d] opacity-70">⟳ UPDATED</span>
        )}
      </div>

      {/* Ticker Track */}
      {loading && (
        <div
          role="status"
          aria-label="Loading live match data"
          className="text-center py-1 text-[10px] font-mono text-[#4c5f57] animate-pulse"
        >
          LOADING LIVE MATCH DATA ●●●
        </div>
      )}

      {error && !loading && (
        <div
          role="alert"
          className="text-center py-1 text-[10px] font-mono text-[#ff3b3b]/70"
        >
          Live ticker temporarily unavailable
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div
          aria-live="polite"
          aria-label="Live match ticker — World Cup 2026 scores and upcoming fixtures"
          className="overflow-hidden"
        >
          <div
            className="flex w-max gap-12 py-1.5 font-mono text-[11px] text-[#7f9a8e]"
            style={{
              animation: "marquee 42s linear infinite",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.animationPlayState = "paused";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.animationPlayState = "running";
            }}
          >
            {doubled.map((item, idx) => (
              <span
                key={`${item.id}-${idx}`}
                className="flex items-center gap-2 whitespace-nowrap"
              >
                {item.status === "live" && (
                  <span className="flex items-center gap-1 text-[#ff3b3b] font-bold">
                    <span className="w-1.5 h-1.5 bg-[#ff3b3b] rounded-full animate-ping inline-block" />
                    LIVE
                  </span>
                )}
                {item.status === "completed" && (
                  <span className="text-[#00ff9d]">✅</span>
                )}
                {item.status === "upcoming" && (
                  <span className="text-[#f5c518]">⏳</span>
                )}
                <span>
                  {getFlag(item.match.team1)} {item.match.team1}
                </span>
                {item.status === "completed" ? (
                  <strong className="text-white font-bold">
                    {renderScore(item.match)}
                  </strong>
                ) : (
                  <span className="opacity-50">vs</span>
                )}
                <span>
                  {item.match.team2} {getFlag(item.match.team2)}
                </span>
                {item.status === "upcoming" && (
                  <span className="opacity-50">
                    · {formatTickerDate(item.match.date, item.match.time, lang)}
                  </span>
                )}
                <span className="opacity-30 text-[9px]">· {item.match.ground}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
