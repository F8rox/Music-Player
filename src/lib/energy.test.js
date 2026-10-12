import { describe, expect, it } from "vitest";
import { energyLevels } from "./energy";

describe("energyLevels", () => {
  it("ranks across the library: loudest and busiest is 5, quietest and calmest is 1", () => {
    const levels = energyLevels({
      calm: { loudness: -20, onsetDensity: 1 },
      mid: { loudness: -14, onsetDensity: 2 },
      hot: { loudness: -8, onsetDensity: 4 },
    });
    expect(levels).toEqual({ calm: 1, mid: 3, hot: 5 });
  });

  it("averages loudness and busyness, so a loud but sparse ballad lands in the middle", () => {
    const levels = energyLevels({
      ballad: { loudness: -6, onsetDensity: 0.5 },
      dance: { loudness: -10, onsetDensity: 5 },
    });
    expect(levels.ballad).toBe(3);
    expect(levels.dance).toBe(3);
  });

  it("puts a single-song library in the middle", () => {
    expect(energyLevels({ only: { loudness: -9, onsetDensity: 3 } })).toEqual({ only: 3 });
  });

  it("gives ties the same level", () => {
    const levels = energyLevels({
      a: { loudness: -10, onsetDensity: 2 },
      b: { loudness: -10, onsetDensity: 2 },
      c: { loudness: -5, onsetDensity: 4 },
    });
    expect(levels.a).toBe(levels.b);
    expect(levels.c).toBe(5);
  });

  it("handles an empty library", () => {
    expect(energyLevels({})).toEqual({});
  });
});
