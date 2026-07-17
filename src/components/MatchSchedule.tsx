"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { getFlag } from "../lib/flagLookup";
import { matchStatus, formatMatchDate } from "../lib/worldCupApi";
import type { Match, WorldCupData } from "../lib/worldCupApi";
import { useDebounce } from "../hooks/useDebounce";
import MatchPrediction from "./MatchPrediction";

type FilterType = "All" | "Today" | "Live" | "Completed" | "Upcoming" | "QF" | "SF";

interface MatchCardProps {
  m: Match;
  allMatches: Match[];
}

function MatchCard({ m, allMatches }: MatchCardProps) {
  const now = new Date();
  const status = matchStatus(m, now);

  return (
    <div
      className={`border rounded-2xl p-4 bg-[#0f172a]/60 transition-all ${
        status === "live"
          ? "border-[#ff3b3b]/40 shadow-[0_0_20px_rgba(255,59,59,0.1)]"
          : "border-[#00ff9d]/10 hover:border-[#00ff9d]/25"
      }`}
    >
      {/* Top row */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-[10px] font-mono text-[#4c5f57]">
          {m.group ?? m.round}
        </span>
        <span className="text-[10px] font-mono text-[#4c5f57]">{m.ground}</span>
      </div>

      {/* Team row */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-white flex-1 text-right">
          {getFlag(m.team1)} {m.team1}
        </span>

        <div className="px-3 flex-shrink-0 text-center">
          {status === "completed" && m.score?.ft && (
            <div>
              <span className="text-xl font-bold text-[#00ff9d] font-mono">
                {m.score.ft[0]} — {m.score.ft[1]}
              </span>
              {m.score.et && (
                <span className="block text-[10px] text-[#f5c518] font-mono">(AET)</span>
              )}
              {m.score.p && (
                <span className="block text-[10px] text-[#f5c518] font-mono">
                  ({m.score.p[0]}-{m.score.p[1]} pens)
                </span>
              )}
            </div>
          )}
          {status === "live" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#ff3b3b]/15 text-[#ff3b3b] text-xs font-bold rounded-full border border-[#ff3b3b]/30">
              <span className="w-1.5 h-1.5 bg-[#ff3b3b] rounded-full animate-ping" />
              LIVE
            </span>
          )}
          {status === "upcoming" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#f5c518]/10 text-[#f5c518] text-xs font-mono rounded-full border border-[#f5c518]/25">
              ⏳ {m.time ?? "TBD"}
            </span>
          )}
        </div>

        <span className="text-sm font-semibold text-white flex-1 text-left">
          {m.team2} {getFlag(m.team2)}
        </span>
      </div>

      {/* Goalscorers */}
      {status === "completed" && (m.goals1?.length || m.goals2?.length) && (
        <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] text-[#4c5f57] font-mono">
          <div className="text-right space-y-0.5">
            {(m.goals1 ?? []).map((g, i) => (
              <p key={i}>{g.name} {g.minute}&apos;</p>
            ))}
          </div>
          <div className="text-left space-y-0.5">
            {(m.goals2 ?? []).map((g, i) => (
              <p key={i}>{g.name} {g.minute}&apos;</p>
            ))}
          </div>
        </div>
      )}

      {/* Date */}
      <p className="text-[10px] text-[#4c5f57] font-mono mt-2 text-center">
        {formatMatchDate(m.date)}
      </p>

      {/* AI Prediction — upcoming matches only */}
      {status === "upcoming" && (
        <MatchPrediction match={m} recentResults={allMatches} />
      )}
    </div>
  );
}

export default function MatchSchedule() {
  const [data, setData] = useState<WorldCupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [lastRefreshed, setLastRefreshed] = useState<number>(Date.now());
  const [secAgo, setSecAgo] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/worldcup");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json() as WorldCupData;
      setData(json);
      setError(false);
      setLoading(false);
      setLastRefreshed(Date.now());
    } catch {
      if (!data) setError(true);
      setLoading(false);
    }
  }, [data]);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchData]);

  // Seconds-ago counter
  useEffect(() => {
    const iv = setInterval(() => {
      setSecAgo(Math.round((Date.now() - lastRefreshed) / 1000));
    }, 1000);
    return () => clearInterval(iv);
  }, [lastRefreshed]);

  const now = new Date();
  const todayUTC = now.toISOString().slice(0, 10);

  const filteredMatches = useMemo(() => {
    if (!data?.matches) return [];
    let list = data.matches;

    switch (activeFilter) {
      case "Today":
        list = list.filter((m) => m.date === todayUTC);
        break;
      case "Live":
        list = list.filter((m) => matchStatus(m, now) === "live");
        break;
      case "Completed":
        list = list.filter((m) => !!m.score?.ft);
        break;
      case "Upcoming":
        list = list.filter((m) => m.date > todayUTC && !m.score?.ft);
        break;
      case "QF":
        list = list.filter((m) => /quarter|qf/i.test(m.round));
        break;
      case "SF":
        list = list.filter((m) => /semi|sf/i.test(m.round));
        break;
    }

    if (debouncedSearch) {
      const lower = debouncedSearch.toLowerCase();
      list = list.filter(
        (m) =>
          m.team1.toLowerCase().includes(lower) ||
          m.team2.toLowerCase().includes(lower)
      );
    }

    // Sort: completed desc, upcoming asc
    return [...list].sort((a, b) => {
      const as = matchStatus(a, now);
      const bs = matchStatus(b, now);
      if (as === "completed" && bs === "completed") return b.date.localeCompare(a.date);
      if (as === "upcoming" && bs === "upcoming") return a.date.localeCompare(b.date);
      return 0;
    });
  }, [data?.matches, activeFilter, debouncedSearch, todayUTC]);

  const FILTERS: FilterType[] = ["All", "Today", "Live", "Completed", "Upcoming", "QF", "SF"];

  if (loading) {
    return (
      <div role="status" aria-label="Loading match schedule..." className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 bg-[#0f172a]/60 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error && !data) {
    return (
      <div role="alert" className="text-center py-8 space-y-3">
        <p className="text-[#ff3b3b] text-sm">Live data temporarily unavailable</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 border border-[#00ff9d]/30 text-[#00ff9d] text-sm rounded-xl hover:bg-[#00ff9d]/10 transition-colors min-h-[44px]"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Filter tabs */}
      <div role="tablist" aria-label="Match filter tabs" className="flex flex-wrap gap-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={activeFilter === f}
            onClick={() => setActiveFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all min-h-[44px] ${
              activeFilter === f
                ? "bg-[#00ff9d]/15 text-[#00ff9d] border border-[#00ff9d]/30"
                : "text-[#4c5f57] hover:text-[#7f9a8e] border border-transparent"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Search */}
      <div>
        <label htmlFor="match-search" className="sr-only">Search teams</label>
        <input
          id="match-search"
          type="search"
          placeholder="Search teams..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#0f172a]/60 border border-[#00ff9d]/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#4c5f57] outline-none focus:border-[#00ff9d]/40 min-h-[44px]"
        />
      </div>

      {/* Count + last refreshed */}
      <div className="flex justify-between items-center">
        <div role="status" aria-live="polite" className="text-[10px] font-mono text-[#4c5f57]">
          Showing {filteredMatches.length} of {data?.matches?.length ?? 0} matches
        </div>
        <span className="text-[10px] font-mono text-[#4c5f57]">
          Updated {secAgo}s ago
        </span>
      </div>

      {/* Match cards */}
      {filteredMatches.length === 0 ? (
        <p className="text-center text-[#4c5f57] text-sm py-8">
          No matches found for &quot;{searchTerm || activeFilter}&quot;
        </p>
      ) : (
        <div className="space-y-3">
          {filteredMatches.map((m, idx) => (
            <MatchCard
              key={`${m.team1}-${m.team2}-${m.date}-${idx}`}
              m={m}
              allMatches={data?.matches ?? []}
            />
          ))}
        </div>
      )}
    </div>
  );
}
