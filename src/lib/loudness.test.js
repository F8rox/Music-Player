import { describe, expect, it } from "vitest";
import { normalisationGain } from "./loudness";

const db = (gain) => 20 * Math.log10(gain);

describe("normalisationGain", () => {
  it("cuts a loud song toward -16 dB", () => {
    expect(db(normalisationGain(-10, true))).toBeCloseTo(-6);
  });

  it("boosts a quiet song, but never more than +10 dB", () => {
    expect(db(normalisationGain(-18, true))).toBeCloseTo(2);
    expect(db(normalisationGain(-34, true))).toBeCloseTo(10);
  });

  it("never cuts more than -12 dB", () => {
    expect(db(normalisationGain(5, true))).toBeCloseTo(-12);
  });

  it("is 1 when disabled or not analysed", () => {
    expect(normalisationGain(-10, false)).toBe(1);
    expect(normalisationGain(undefined, true)).toBe(1);
    expect(normalisationGain(null, true)).toBe(1);
  });
});
