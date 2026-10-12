import { describe, expect, it } from "vitest";
import { camelot, keyOf } from "./key";

describe("camelot", () => {
  it("maps known keys onto the wheel", () => {
    expect(camelot(0, "major")).toBe("8B"); // C major
    expect(camelot(9, "minor")).toBe("8A"); // A minor, C major's relative
    expect(camelot(7, "major")).toBe("9B"); // G major
    expect(camelot(5, "major")).toBe("7B"); // F major
    expect(camelot(4, "minor")).toBe("9A"); // E minor
    expect(camelot(6, "major")).toBe("2B"); // F# major
  });

  it("gives every key a distinct label (24 of them)", () => {
    const labels = new Set();
    for (let tonic = 0; tonic < 12; tonic++) for (const mode of ["major", "minor"]) labels.add(camelot(tonic, mode));
    expect(labels.size).toBe(24);
  });
});

describe("keyOf", () => {
  it("names a confident key", () => {
    expect(keyOf({ keyTonic: 9, keyMode: "minor", keyConfidence: 0.8 })).toEqual({ name: "A minor", camelot: "8A" });
  });

  it("returns null when unanalysed, keyless, legacy, or not confident", () => {
    expect(keyOf(undefined)).toBeNull();
    expect(keyOf("pending")).toBeNull();
    expect(keyOf({ keyTonic: null, keyMode: null, keyConfidence: 0 })).toBeNull();
    expect(keyOf({ v: 1 })).toBeNull();
    expect(keyOf({ keyTonic: 0, keyMode: "major", keyConfidence: 0.3 })).toBeNull();
  });
});
