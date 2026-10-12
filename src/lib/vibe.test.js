import { describe, expect, it } from "vitest";
import { PRESETS, pickAlongPath, resample, toPoint } from "./vibe";

// A 5 × 5 grid of songs: tempo 80…160 across, energy 1…5 up.
const grid = [];
for (let e = 1; e <= 5; e++) for (let b = 0; b < 5; b++) grid.push({ id: `e${e}b${b}`, bpm: 80 + b * 20, energy: e });
const byId = Object.fromEntries(grid.map((song) => [song.id, song]));

describe("toPoint", () => {
  it("maps tempo and energy onto 0…1, energy up", () => {
    expect(toPoint({ bpm: 80, energy: 1 })).toEqual({ x: 0, y: 0 });
    expect(toPoint({ bpm: 120, energy: 3 })).toEqual({ x: 0.5, y: 0.5 });
    expect(toPoint({ bpm: 160, energy: 5 })).toEqual({ x: 1, y: 1 });
  });

  it("clamps values outside the map", () => {
    expect(toPoint({ bpm: 200, energy: 9 })).toEqual({ x: 1, y: 1 });
    expect(toPoint({ bpm: 10, energy: -3 })).toEqual({ x: 0, y: 0 });
  });
});

describe("resample", () => {
  it("spaces points evenly along the path, ends included", () => {
    const points = resample([{ x: 0, y: 0 }, { x: 1, y: 0 }], 5);
    expect(points.map((p) => p.x)).toEqual([0, 0.25, 0.5, 0.75, 1]);
  });

  it("follows corners by length, not by vertex count", () => {
    const path = [{ x: 0, y: 0 }, { x: 0.1, y: 0 }, { x: 0.1, y: 0.9 }]; // 0.1 across, then 0.9 up
    const mid = resample(path, 3)[1]; // halfway along 1.0 = 0.5 along: on the vertical leg
    expect(mid.x).toBeCloseTo(0.1);
    expect(mid.y).toBeCloseTo(0.4);
  });

  it("handles a single point, a zero-length path, no path, and n of 1", () => {
    expect(resample([{ x: 0.3, y: 0.3 }], 3)).toHaveLength(3);
    expect(resample([{ x: 0.3, y: 0.3 }, { x: 0.3, y: 0.3 }], 2)).toEqual([{ x: 0.3, y: 0.3 }, { x: 0.3, y: 0.3 }]);
    expect(resample([], 4)).toEqual([]);
    expect(resample([{ x: 0, y: 0 }, { x: 1, y: 1 }], 1)).toEqual([{ x: 0, y: 0 }]);
  });
});

describe("pickAlongPath", () => {
  it("never picks a song twice, even when the path stays in one spot", () => {
    const ids = pickAlongPath([{ x: 0.5, y: 0.5 }, { x: 0.5, y: 0.5 }], grid, 10);
    expect(new Set(ids).size).toBe(10);
  });

  it("returns fewer songs when the library is smaller than the count", () => {
    expect(pickAlongPath([{ x: 0, y: 0 }, { x: 1, y: 1 }], grid.slice(0, 3), 12)).toHaveLength(3);
    expect(pickAlongPath([{ x: 0, y: 0 }, { x: 1, y: 1 }], [], 12)).toEqual([]);
  });

  it("a rising line gives songs of rising energy", () => {
    const rising = [{ x: 0.5, y: 0 }, { x: 0.5, y: 1 }];
    const energies = pickAlongPath(rising, grid, 5).map((id) => byId[id].energy);
    expect(energies).toEqual([1, 2, 3, 4, 5]);
  });

  it("a falling line gives falling energy, and a left-to-right line rising tempo", () => {
    const falling = pickAlongPath([{ x: 0.5, y: 1 }, { x: 0.5, y: 0 }], grid, 5).map((id) => byId[id].energy);
    expect(falling).toEqual([5, 4, 3, 2, 1]);
    const across = pickAlongPath([{ x: 0, y: 0.5 }, { x: 1, y: 0.5 }], grid, 5).map((id) => byId[id].bpm);
    expect(across).toEqual([80, 100, 120, 140, 160]);
  });

  it("lets energy outweigh tempo: a vertical line stays in step even with a sparse top", () => {
    const sparse = [
      { id: "calm", bpm: 120, energy: 1 }, { id: "mid", bpm: 120, energy: 3 },
      { id: "fastHigh", bpm: 150, energy: 4 }, { id: "slowTop", bpm: 90, energy: 5 },
    ];
    expect(pickAlongPath([{ x: 0.5, y: 0 }, { x: 0.5, y: 1 }], sparse, 4)).toEqual(["calm", "mid", "fastHigh", "slowTop"]);
  });

  it("is deterministic", () => {
    const path = [{ x: 0.2, y: 0.2 }, { x: 0.8, y: 0.7 }];
    expect(pickAlongPath(path, grid, 8)).toEqual(pickAlongPath(path, grid, 8));
  });
});

describe("PRESETS", () => {
  it("has build-up, peak and cool-down, each yielding songs in the right shape", () => {
    expect(PRESETS.map((p) => p.id)).toEqual(["build-up", "peak", "cool-down"]);
    const energies = (preset) => pickAlongPath(preset.path, grid, 5).map((id) => byId[id].energy);
    const [up, peak, down] = PRESETS.map(energies);
    expect(up[4]).toBeGreaterThan(up[0]);
    expect(down[0]).toBeGreaterThan(down[4]);
    expect(Math.min(...peak)).toBeGreaterThanOrEqual(4);
  });
});
