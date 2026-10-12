import { describe, expect, it } from "vitest";
import { tapBpm, tempoOf } from "./tempo";

const taps = (count, gapMs, start = 0) => Array.from({ length: count }, (_, i) => start + i * gapMs);

describe("tapBpm", () => {
  it("needs at least 4 taps", () => {
    expect(tapBpm(taps(3, 500))).toBeNull();
    expect(tapBpm(taps(4, 500))).toBe(120);
  });

  it("uses only the last 8 taps", () => {
    expect(tapBpm([...taps(10, 600), ...taps(8, 500, 6100)])).toBe(120);
  });

  it("restarts the count after a pause over 2 s", () => {
    expect(tapBpm([...taps(6, 400), ...taps(3, 500, 10000)])).toBeNull();
  });

  it("rounds to one decimal", () => {
    expect(tapBpm(taps(5, 646))).toBe(92.9);
  });
});

describe("tempoOf", () => {
  it("prefers the user's override", () => {
    expect(tempoOf({ bpm: 140, bpmOverride: 70 })).toBe(70);
    expect(tempoOf({ bpm: 140, bpmOverride: null })).toBe(140);
    expect(tempoOf(undefined)).toBeNull();
  });
});
