import { describe, expect, it } from "vitest";
import { distance, radio, reasonFor } from "./radio";

const song = (energy, bpm, camelot) => ({ energy, bpm, camelot });

describe("distance", () => {
  it("is 0 for identical songs and grows with each difference", () => {
    const a = song(3, 120, "8A");
    expect(distance(a, a)).toBe(0);
    expect(distance(a, song(3, 123, "8A"))).toBeLessThan(distance(a, song(3, 135, "8A")));
    expect(distance(a, song(3, 120, "9A"))).toBeLessThan(distance(a, song(3, 120, "2A")));
    expect(distance(a, song(3.5, 120, "8A"))).toBeLessThan(distance(a, song(5, 120, "8A")));
  });

  it("prefers a song inside 6% tempo (neighbouring key) over one just outside it (same key)", () => {
    const seed = song(3, 120, "8A");
    expect(distance(seed, song(3, 126.5, "9A"))).toBeLessThan(distance(seed, song(3, 128, "8A")));
  });

  it("treats half and double time as the same tempo", () => {
    expect(distance(song(3, 80, "8A"), song(3, 160 - 0.01, "8A"))).toBeLessThan(0.01);
    expect(distance(song(3, 140, "8A"), song(3, 70, "8A"))).toBe(0);
  });

  it("scores a missing tempo or key as neutral, not as a match", () => {
    const a = song(3, 120, "8A");
    expect(distance(a, song(3, null, "8A"))).toBeGreaterThan(0);
    expect(distance(a, song(3, 120, null))).toBeGreaterThan(0);
  });

  it("puts the relative key and wheel neighbours next to the same key", () => {
    const a = song(3, 120, "8A");
    expect(distance(a, song(3, 120, "8B"))).toBeLessThan(distance(a, song(3, 120, "10A")));
    expect(distance(a, song(3, 120, "7A"))).toBeLessThan(distance(a, song(3, 120, "4A")));
    expect(distance(song(3, 120, "12A"), song(3, 120, "1A"))).toBeLessThan(distance(song(3, 120, "12A"), song(3, 120, "3A"))); // wraps
  });
});

describe("reasonFor", () => {
  it("lists only what is true", () => {
    expect(reasonFor(song(3, 120, "8A"), song(3.2, 123, "9A"))).toBe("Tempo within 3%, key 9A next to 8A, similar energy");
    expect(reasonFor(song(3, 120, "8A"), song(3, 120, "8A"))).toBe("Tempo within 1%, same key (8A), similar energy");
    expect(reasonFor(song(3, 120, "8A"), song(1, 120, "8B"))).toBe("Tempo within 1%, relative key (8B)");
  });

  it("makes no claim about an unknown tempo or key, or a loose match", () => {
    expect(reasonFor(song(3, null, null), song(5, 150, "3A"))).toBe("Closest match left");
    expect(reasonFor(song(3, 120, "8A"), song(5, 150, "3A"))).not.toMatch(/tempo|key|energy/);
  });
});

describe("radio", () => {
  const info = {
    seed: song(3, 120, "8A"),
    a: song(3, 121, "8A"),
    b: song(3.2, 124, "9A"),
    c: song(2.8, 127, "9A"),
    d: song(4, 130, "10A"),
    far: song(1, 85, "2B"),
    unanalysed: { energy: undefined, bpm: null, camelot: null },
  };

  it("starts with the seed and keeps it out of the picks", () => {
    const picks = radio("seed", info);
    expect(picks[0]).toEqual({ songId: "seed", reason: "Radio start" });
    expect(picks.filter((p) => p.songId === "seed")).toHaveLength(1);
  });

  it("takes the most similar songs and drops unanalysed ones", () => {
    const ids = radio("seed", info, 3).map((p) => p.songId);
    expect(ids).toHaveLength(4);
    expect(ids.slice(1).sort()).toEqual(["a", "b", "c"]);
    expect(radio("seed", info).map((p) => p.songId)).not.toContain("unanalysed");
  });

  it("orders picks so each step stays within 6% tempo where the library allows", () => {
    const steps = radio("seed", info, 4).map((p) => info[p.songId].bpm);
    for (let i = 1; i < steps.length; i++) expect(Math.abs(steps[i] - steps[i - 1]) / steps[i - 1]).toBeLessThanOrEqual(0.06);
  });

  it("gives each pick a reason about the seed", () => {
    const picks = radio("seed", info, 2);
    expect(picks[1].reason).toBe(reasonFor(info.seed, info[picks[1].songId]));
  });

  it("is deterministic and returns [] for an unanalysed or unknown seed, and just the seed when alone", () => {
    expect(radio("seed", info)).toEqual(radio("seed", info));
    expect(radio("unanalysed", info)).toEqual([]);
    expect(radio("nope", info)).toEqual([]);
    expect(radio("seed", { seed: info.seed })).toEqual([{ songId: "seed", reason: "Radio start" }]);
  });
});
