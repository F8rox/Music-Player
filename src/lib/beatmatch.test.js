import { describe, expect, it } from "vitest";
import { canBeatMatch, planBeatMatch } from "./beatmatch";

const song = (bpm, extra = {}) => ({ bpm, bpmConfidence: 0.8, bpmOverride: null, beatOffset: 0, ...extra });

describe("canBeatMatch", () => {
  it("passes at 3.9% and fails at 4.1%", () => {
    expect(canBeatMatch(song(120), song(124.68))).toBe(true);
    expect(canBeatMatch(song(120), song(124.92))).toBe(false);
  });

  it("folds half/double readings: 70 matches 140", () => {
    expect(canBeatMatch(song(140), song(140, { bpm: null, bpmOverride: 70 }))).toBe(true);
  });

  it("requires confidence on both songs", () => {
    expect(canBeatMatch(song(120), song(120, { bpmConfidence: 0.3 }))).toBe(false);
  });

  it("treats a user override as confident", () => {
    expect(canBeatMatch(song(120), song(120, { bpmConfidence: 0.1, bpmOverride: 121 }))).toBe(true);
  });

  it("rejects unanalysed songs or missing tempos", () => {
    expect(canBeatMatch("pending", song(120))).toBe(false);
    expect(canBeatMatch(song(120), song(null))).toBe(false);
  });
});

describe("planBeatMatch", () => {
  it("speeds the incoming song to the outgoing tempo", () => {
    expect(planBeatMatch(song(120), song(123), { startAt: 100, nextOffset: 0, fadeSeconds: 6 }).rate).toBeCloseTo(120 / 123);
  });

  it("starts both on a beat of their own grid", () => {
    const plan = planBeatMatch(song(120, { beatOffset: 0.2 }), song(100, { beatOffset: 0.1 }), {
      startAt: 100.33, nextOffset: 2, fadeSeconds: 6,
    });
    expect(plan.at).toBeCloseTo(100.7); // grid 0.2 + n·0.5
    expect(plan.offset).toBeCloseTo(2.5); // grid 0.1 + n·0.6
  });

  it("keeps a time that is already on the beat", () => {
    expect(planBeatMatch(song(120), song(120), { startAt: 50, nextOffset: 0, fadeSeconds: 6 }).at).toBeCloseTo(50);
  });

  it("makes the fade a whole number of beats, at most 8 s", () => {
    expect(planBeatMatch(song(120), song(120), { startAt: 0, nextOffset: 0, fadeSeconds: 6.3 }).fadeSeconds).toBeCloseTo(6);
    expect(planBeatMatch(song(90), song(90), { startAt: 0, nextOffset: 0, fadeSeconds: 12 }).fadeSeconds).toBeCloseTo(8); // 12 beats of 0.667 s
    expect(planBeatMatch(song(100), song(100), { startAt: 0, nextOffset: 0, fadeSeconds: 12 }).fadeSeconds).toBeCloseTo(7.8); // 13 beats
  });
});
