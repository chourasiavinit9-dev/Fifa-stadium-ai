import {
  matchStatus,
  parseKickoffUTC,
  computeGoalsPerDay,
  computeMatchStatusCounts,
  getTotalGoals,
  formatMatchDate,
  getTodaysMatches,
  getCompletedMatches,
} from "../../src/lib/worldcupApi";
import type { Match, WorldCupData } from "../../src/lib/worldcupApi";

const completedMatch: Match = {
  round: "Quarter-Finals",
  date: "2026-07-12",
  team1: "Morocco",
  team2: "Canada",
  ground: "MetLife Stadium",
  score: { ft: [3, 0], ht: [2, 0] },
};

const upcomingMatch: Match = {
  round: "Semi-Finals",
  date: "2099-07-15",
  time: "17:00 UTC-5",
  team1: "Norway",
  team2: "England",
  ground: "Hard Rock Stadium",
};

const sampleData: WorldCupData = {
  name: "World Cup 2026",
  matches: [completedMatch, upcomingMatch],
};

describe("matchStatus", () => {
  it("returns completed for a match with score.ft", () => {
    expect(matchStatus(completedMatch)).toBe("completed");
  });

  it("returns upcoming for a far future match with no score", () => {
    expect(matchStatus(upcomingMatch)).toBe("upcoming");
  });

  it("returns upcoming for a past date match with no score", () => {
    const past: Match = { ...upcomingMatch, date: "2020-01-01" };
    expect(matchStatus(past)).toBe("upcoming");
  });
});

describe("parseKickoffUTC", () => {
  it("parses '17:00 UTC-5' correctly to UTC+5", () => {
    const d = parseKickoffUTC("2026-07-15", "17:00 UTC-5");
    expect(d.getUTCHours()).toBe(22); // 17 - (-5) = 22
  });

  it("parses '13:00 UTC-6' correctly", () => {
    const d = parseKickoffUTC("2026-07-15", "13:00 UTC-6");
    expect(d.getUTCHours()).toBe(19); // 13 - (-6) = 19
  });

  it("returns noon UTC when timeStr is undefined", () => {
    const d = parseKickoffUTC("2026-07-15");
    expect(d.getUTCHours()).toBe(12);
  });
});

describe("computeGoalsPerDay", () => {
  it("sums ft goals by date", () => {
    const result = computeGoalsPerDay(sampleData);
    expect(result).toHaveLength(1);
    expect(result[0].goals).toBe(3);
    expect(result[0].date).toBe("2026-07-12");
  });

  it("excludes matches without score", () => {
    const result = computeGoalsPerDay(sampleData);
    const dates = result.map((r) => r.date);
    expect(dates).not.toContain("2099-07-15");
  });
});

describe("computeMatchStatusCounts", () => {
  it("counts completed and upcoming correctly", () => {
    const counts = computeMatchStatusCounts(sampleData);
    expect(counts.completed).toBe(1);
    expect(counts.upcoming).toBe(1);
    expect(counts.live).toBe(0);
  });
});

describe("getTotalGoals", () => {
  it("sums all ft goals", () => {
    expect(getTotalGoals(sampleData)).toBe(3);
  });

  it("returns 0 when no completed matches", () => {
    expect(getTotalGoals({ name: "WC", matches: [upcomingMatch] })).toBe(0);
  });
});

describe("formatMatchDate", () => {
  it("formats a date string correctly", () => {
    const result = formatMatchDate("2026-07-12");
    expect(result).toMatch(/Jul/);
    expect(result).toMatch(/2026/);
  });
});

describe("getTodaysMatches", () => {
  it("returns matches for today", () => {
    const today = new Date().toISOString().slice(0, 10);
    const todayMatch: Match = { ...completedMatch, date: today };
    const data: WorldCupData = { name: "WC", matches: [todayMatch, upcomingMatch] };
    const result = getTodaysMatches(data);
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe(today);
  });
});

describe("getCompletedMatches", () => {
  it("returns only matches with score.ft", () => {
    const result = getCompletedMatches(sampleData);
    expect(result).toHaveLength(1);
    expect(result[0].score?.ft).toEqual([3, 0]);
  });
});
