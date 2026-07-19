/**
 * @file __tests__/unit/smartMerge.test.ts
 * Unit tests for the exported smartMerge() function in worldCupApi.ts.
 *
 * smartMerge is the core data-authority layer:
 *  - Curated knockout data is ALWAYS authoritative when it has a score.
 *  - CDN data auto-fills scores for unscored knockout fixtures (e.g. the Final).
 *  - Group-stage matches (before the cutoff date) come exclusively from the CDN.
 */

import { smartMerge } from "../../src/lib/worldCupApi";
import type { Match } from "../../src/lib/worldCupApi";

// ── Test fixtures ────────────────────────────────────────────────────────────

/** A group-stage CDN match that is clearly before the knockout cutoff (2026-07-04). */
const cdnGroupMatch: Match = {
  round: "Group C",
  date: "2026-06-20",
  team1: "Morocco",
  team2: "Portugal",
  ground: "AT&T Stadium, Dallas TX",
  score: { ft: [2, 1] },
};

/**
 * CDN entry for the Final (Spain vs Argentina) WITH a score.
 * The curated entry for this match has NO score, so CDN should auto-fill it.
 */
const cdnFinalWithScore: Match = {
  round: "Final",
  date: "2026-07-19",
  team1: "Argentina",      // same pair as curated, different home/away order
  team2: "Spain",
  ground: "MetLife Stadium",
  score: { ft: [2, 1] },
};

/**
 * CDN entry for France vs England (third-place match) with a WRONG score.
 * Curated has the correct [4, 6] result — curated must win.
 */
const cdnThirdPlaceWrongScore: Match = {
  round: "Match for third place",
  date: "2026-07-18",
  team1: "France",
  team2: "England",
  ground: "Hard Rock Stadium",
  score: { ft: [0, 0] }, // incorrect — curated has [4, 6]
};

/**
 * A knockout match that happens on exactly the cutoff date (2026-07-04).
 * These should be treated as knockouts (not group stage) and only appear if curated.
 */
const cdnCutoffDateMatch: Match = {
  round: "Round of 16",
  date: "2026-07-04",
  team1: "Algeria",
  team2: "Uruguay",
  ground: "SoFi Stadium, Los Angeles CA",
  score: { ft: [1, 0] },
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("smartMerge()", () => {
  // ── Rule 1: Group stage from CDN ──────────────────────────────────────────

  it("includes group-stage CDN matches (date < 2026-07-04) in the result", () => {
    const result = smartMerge([cdnGroupMatch]);
    const found = result.find(
      (m) => (m as Match).team1 === "Morocco" || (m as Match).team2 === "Morocco"
    );
    expect(found).toBeDefined();
  });

  it("preserves the CDN score for group-stage matches", () => {
    const result = smartMerge([cdnGroupMatch]);
    const found = result.find(
      (m) => (m as Match).team1 === "Morocco"
    ) as Match;
    expect(found?.score?.ft).toEqual([2, 1]);
  });

  // ── Rule 2: Curated knockout score always wins ─────────────────────────────

  it("uses curated score for third-place match, ignoring CDN's wrong score", () => {
    const result = smartMerge([cdnThirdPlaceWrongScore]);
    const thirdPlace = result.find(
      (m) =>
        ((m as Match).team1 === "France" && (m as Match).team2 === "England") ||
        ((m as Match).team1 === "England" && (m as Match).team2 === "France")
    ) as Match;
    // Curated curated score is [4, 6] — CDN's [0, 0] must NOT win
    expect(thirdPlace?.score?.ft).toEqual([4, 6]);
  });

  it("does not insert duplicate entries for a curated match", () => {
    const result = smartMerge([cdnThirdPlaceWrongScore]);
    const thirdPlaceEntries = result.filter(
      (m) =>
        ((m as Match).team1 === "France" && (m as Match).team2 === "England") ||
        ((m as Match).team1 === "England" && (m as Match).team2 === "France")
    );
    expect(thirdPlaceEntries).toHaveLength(1);
  });

  // ── Rule 3: Unscored knockout auto-fills from CDN ─────────────────────────

  it("auto-fills the Final score from CDN when the curated entry has no score", () => {
    const result = smartMerge([cdnFinalWithScore]);
    const finalMatch = result.find(
      (m) =>
        ((m as Match).team1 === "Spain" && (m as Match).team2 === "Argentina") ||
        ((m as Match).team1 === "Argentina" && (m as Match).team2 === "Spain")
    ) as Match;
    // CDN score [2, 1] should now appear in the merged result
    expect(finalMatch?.score?.ft).toEqual([2, 1]);
  });

  it("returns the Final with no score when CDN also has no result", () => {
    const finalNoScore: Match = { ...cdnFinalWithScore, score: undefined };
    const result = smartMerge([finalNoScore]);
    const finalMatch = result.find(
      (m) =>
        ((m as Match).team1 === "Spain" && (m as Match).team2 === "Argentina") ||
        ((m as Match).team1 === "Argentina" && (m as Match).team2 === "Spain")
    ) as Match;
    expect(finalMatch?.score).toBeUndefined();
  });

  // ── Rule 4: Cutoff date boundary ──────────────────────────────────────────

  it("treats a match on exactly KNOCKOUT_CUTOFF_DATE (2026-07-04) as a knockout, not group stage", () => {
    const result = smartMerge([cdnCutoffDateMatch]);
    // Algeria vs Uruguay is NOT in CURATED_MATCHES, so it should NOT appear
    // (only CDN group-stage matches and curated knockouts are returned)
    const algurMatch = result.find(
      (m) =>
        (m as Match).team1 === "Algeria" || (m as Match).team2 === "Algeria"
    );
    expect(algurMatch).toBeUndefined();
  });

  // ── General contract ─────────────────────────────────────────────────────

  it("always returns curated knockout matches even when CDN provides no data", () => {
    const result = smartMerge([]);
    // CURATED_MATCHES has at least 4 entries (Final, 3rd place, 2 semis)
    expect(result.length).toBeGreaterThanOrEqual(4);
  });

  it("sorts results newest-first by date", () => {
    const result = smartMerge([cdnGroupMatch]);
    const dates = result.map((m) => (m as Match).date);
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i - 1] >= dates[i]).toBe(true);
    }
  });
});
