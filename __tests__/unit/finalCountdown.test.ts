/**
 * @file __tests__/unit/finalCountdown.test.ts
 * Unit tests for the pure utility functions exported by FinalCountdown.tsx.
 *
 * These tests verify the countdown logic in isolation without mounting any
 * React component — no DOM, no timers, no side effects.
 */

import { getCountdown, pad } from "../../src/components/FinalCountdown";

// The exact kick-off instant used in the production component.
const FINAL_UTC = new Date("2026-07-19T19:00:00Z");

// ── pad() ────────────────────────────────────────────────────────────────────

describe("pad()", () => {
  it("pads a single-digit number with a leading zero", () => {
    expect(pad(7)).toBe("07");
    expect(pad(0)).toBe("00");
    expect(pad(1)).toBe("01");
  });

  it("does not pad a two-digit number", () => {
    expect(pad(12)).toBe("12");
    expect(pad(59)).toBe("59");
  });

  it("handles triple-digit numbers without truncation", () => {
    // Edge case: large day counts (e.g. 365) should not be trimmed
    expect(pad(365)).toBe("365");
  });
});

// ── getCountdown() ────────────────────────────────────────────────────────────

describe("getCountdown()", () => {
  it("returns started:true and zeroed values when called after the Final kick-off", () => {
    // 1 second AFTER the Final
    const afterFinal = new Date(FINAL_UTC.getTime() + 1_000);
    const cd = getCountdown(afterFinal);
    expect(cd.started).toBe(true);
    expect(cd.days).toBe(0);
    expect(cd.hours).toBe(0);
    expect(cd.minutes).toBe(0);
    expect(cd.seconds).toBe(0);
  });

  it("returns started:true when called at the exact kick-off instant", () => {
    const cd = getCountdown(FINAL_UTC);
    expect(cd.started).toBe(true);
  });

  it("returns started:false with positive values before the Final", () => {
    // 2 days, 3 hours, 4 minutes, 5 seconds before kick-off
    const diff =
      2 * 86_400_000 +
      3 * 3_600_000 +
      4 * 60_000 +
      5 * 1_000;
    const before = new Date(FINAL_UTC.getTime() - diff);
    const cd = getCountdown(before);
    expect(cd.started).toBe(false);
    expect(cd.days).toBe(2);
    expect(cd.hours).toBe(3);
    expect(cd.minutes).toBe(4);
    expect(cd.seconds).toBe(5);
  });

  it("returns started:false with exactly 1 second remaining when 1 second before kick-off", () => {
    const justBefore = new Date(FINAL_UTC.getTime() - 1_000);
    const cd = getCountdown(justBefore);
    expect(cd.started).toBe(false);
    expect(cd.seconds).toBe(1); // 1000ms diff ÷ 1000 = 1 second remaining
  });

  it("floors sub-second remainders — 999ms before shows 0 seconds", () => {
    const subSecond = new Date(FINAL_UTC.getTime() - 999);
    const cd = getCountdown(subSecond);
    expect(cd.started).toBe(false);
    expect(cd.seconds).toBe(0); // Math.floor(999 / 1000) = 0
  });

  it("returns non-negative values for all fields before the Final", () => {
    const past = new Date("2026-01-01T00:00:00Z");
    const cd = getCountdown(past);
    expect(cd.days).toBeGreaterThan(0);
    expect(cd.hours).toBeGreaterThanOrEqual(0);
    expect(cd.minutes).toBeGreaterThanOrEqual(0);
    expect(cd.seconds).toBeGreaterThanOrEqual(0);
  });
});
