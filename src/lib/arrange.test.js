import { describe, expect, it } from "vitest";
import { arc, arrange, smoothTempo, totalJump } from "./arrange";

const items = (n) => Array.from({ length: n }, (_, i) => ({ qid: `q${i}`, songId: `s${i}` }));
const energies = [1, 5, 2, 4.5, 3, 1.5, 4, 2.5, 3.5, 1.2, 4.2, 2.2];
const info = Object.fromEntries(energies.map((energy, i) => [`s${i}`, { energy, bpm: 90 + ((i * 37) % 60) }]));
const e = (order) => order.map((item) => info[item.songId].energy);

describe("arc", () => {
  it("rises to its maximum within the 60–80% range, then falls", () => {
    const order = e(arc(items(12), info));
    const peak = order.indexOf(Math.max(...order));
    expect(peak / (order.length - 1)).toBeGreaterThanOrEqual(0.6);
    expect(peak / (order.length - 1)).toBeLessThanOrEqual(0.8);
    for (let i = 1; i <= peak; i++) expect(order[i]).toBeGreaterThanOrEqual(order[i - 1]);
    for (let i = peak + 1; i < order.length; i++) expect(order[i]).toBeLessThanOrEqual(order[i - 1]);
  });

  it("is a permutation", () => {
    const order = arc(items(12), info);
    expect(order.map((i) => i.qid).sort()).toEqual(items(12).map((i) => i.qid).sort());
  });
});

describe("smoothTempo", () => {
  it("lowers the total tempo jump compared with the energy-only order", () => {
    const energyOnly = arc(items(12), info);
    expect(totalJump(smoothTempo(energyOnly, info), info)).toBeLessThan(totalJump(energyOnly, info));
  });

  it("never swaps neighbours more than one energy step apart", () => {
    const two = [{ songId: "lo" }, { songId: "hi" }];
    const tempo = { lo: { energy: 1, bpm: 150 }, hi: { energy: 5, bpm: 80 } };
    expect(smoothTempo(two, tempo)).toEqual(two);
  });
});

describe("arrange", () => {
  it("puts unanalysed songs at the end in their original order", () => {
    const list = [...items(4), { qid: "x1", songId: "none1" }, { qid: "x2", songId: "none2" }];
    const result = arrange(list, info);
    expect(result.slice(-2).map((i) => i.qid)).toEqual(["x1", "x2"]);
    expect(result).toHaveLength(6);
  });

  it("handles 0 and 1 items", () => {
    expect(arrange([], info)).toEqual([]);
    expect(arrange(items(1), info)).toEqual(items(1));
  });
});
