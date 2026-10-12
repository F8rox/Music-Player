import { describe, expect, it } from "vitest";
import { fadeCurves, planTransition } from "./transition";

const song = (introEnd, outroStart) => ({ introEnd, outroStart });
const base = {
  current: song(0, 200), next: song(4, 180), duration: 210,
  settings: { crossfade: true, fadeSeconds: 6 }, repeat: "all",
};

describe("planTransition", () => {
  it("starts the fade at outroStart − fade and skips the next song's quiet intro", () => {
    expect(planTransition(base)).toEqual({ startAt: 194, nextOffset: 4, fadeSeconds: 6 });
  });

  it.each([
    ["crossfade off", { settings: { crossfade: false, fadeSeconds: 6 } }],
    ["repeat one", { repeat: "one" }],
    ["no next song (queue stops)", { next: undefined }],
    ["current not analysed", { current: "pending" }],
    ["next failed analysis", { next: "failed" }],
    ["song shorter than 3× the fade", { duration: 17 }],
  ])("returns null for %s", (_, change) => {
    expect(planTransition({ ...base, ...change })).toBeNull();
  });

  it("never starts before 30% of the song", () => {
    expect(planTransition({ ...base, current: song(0, 20) }).startAt).toBeCloseTo(63);
  });

  it("never skips more than 15 s of intro", () => {
    expect(planTransition({ ...base, next: song(40, 180) }).nextOffset).toBe(15);
  });
});

describe("fadeCurves", () => {
  it("is equal-power: out² + in² = 1 at every point, from full to silent", () => {
    const { out, into } = fadeCurves();
    expect(out[0]).toBe(1);
    expect(into[0]).toBe(0);
    expect(out.at(-1)).toBeCloseTo(0);
    for (let i = 0; i < out.length; i++) expect(out[i] ** 2 + into[i] ** 2).toBeCloseTo(1);
  });
});
