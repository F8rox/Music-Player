import { describe, expect, it } from "vitest";
import { analyse, estimateBpm, foldBpm, introOutro, onsetEnvelope, rmsEnvelope } from "./dsp";
import { estimateKey } from "./key";

const RATE = 11025;
const FPS = RATE / 128;

// A short decaying click every beat, starting at `offset` seconds.
const clickTrack = (bpm, seconds = 30, offset = 0) => {
  const out = new Float32Array(RATE * seconds);
  for (let t = offset; t < seconds; t += 60 / bpm) {
    const start = Math.round(t * RATE);
    for (let i = 0; i < 200 && start + i < out.length; i++) out[start + i] = Math.exp(-i / 40) * (i % 2 ? 0.8 : -0.8);
  }
  return out;
};

// Deterministic noise so the test can't flake.
const noise = (seconds = 30) => {
  let seed = 7;
  return Float32Array.from({ length: RATE * seconds }, () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296 - 0.5;
  });
};

describe("estimateBpm", () => {
  it("finds 120 BPM on a click track with high confidence", () => {
    const { bpm, confidence } = estimateBpm(onsetEnvelope(clickTrack(120)), FPS);
    expect(Math.abs(bpm - 120)).toBeLessThanOrEqual(1);
    expect(confidence).toBeGreaterThanOrEqual(0.6);
  });

  it("finds 90, not 180 or 45", () => {
    expect(Math.abs(estimateBpm(onsetEnvelope(clickTrack(90)), FPS).bpm - 90)).toBeLessThanOrEqual(1);
  });

  it("locates the first beat", () => {
    const { beatOffset } = estimateBpm(onsetEnvelope(clickTrack(120, 30, 0.2)), FPS);
    expect(Math.abs(beatOffset - 0.2)).toBeLessThan(0.03);
  });

  it("has low confidence on noise", () => {
    expect(estimateBpm(onsetEnvelope(noise()), FPS).confidence).toBeLessThan(0.4);
  });

  it("returns no tempo for silence or a too-short buffer", () => {
    expect(estimateBpm(onsetEnvelope(new Float32Array(RATE * 10)), FPS).bpm).toBeNull();
    expect(estimateBpm(onsetEnvelope(new Float32Array(100)), FPS).bpm).toBeNull();
  });
});

describe("foldBpm", () => {
  it.each([[70, 140], [140, 140], [173, 86.5], [45, 90], [80, 80], [160, 80]])("%s -> %s", (input, out) => {
    expect(foldBpm(input)).toBe(out);
  });
});

describe("introOutro", () => {
  it("finds 3 s of silence at each end of a 16 s sine", () => {
    const samples = new Float32Array(RATE * 16);
    for (let i = 3 * RATE; i < 13 * RATE; i++) samples[i] = 0.5 * Math.sin((2 * Math.PI * 440 * i) / RATE);
    const { introEnd, outroStart } = introOutro(rmsEnvelope(samples, RATE));
    expect(Math.abs(introEnd - 3)).toBeLessThanOrEqual(0.3);
    expect(Math.abs(outroStart - 13)).toBeLessThanOrEqual(0.3);
  });

  it("handles an all-silent or empty envelope without throwing", () => {
    const silent = rmsEnvelope(new Float32Array(RATE * 2), RATE);
    expect(introOutro(silent)).toEqual({ introEnd: 0, outroStart: silent.length / 10 });
    expect(introOutro(new Float32Array(0))).toEqual({ introEnd: 0, outroStart: 0 });
  });
});

// A chord of sines (with two harmonics each) at the given frequencies.
const chord = (freqs, seconds = 20) =>
  Float32Array.from({ length: RATE * seconds }, (_, i) =>
    freqs.reduce((sum, f) => sum + [1, 0.5, 0.25].reduce((h, amp, n) => h + amp * Math.sin((2 * Math.PI * f * (n + 1) * i) / RATE), 0), 0) / 20);

describe("estimateKey", () => {
  it("finds C major from a C-E-G chord with the tonic in the bass", () => {
    const key = estimateKey(chord([65.41, 261.63, 329.63, 392]), RATE);
    expect(key).toMatchObject({ tonic: 0, mode: "major" });
    expect(key.confidence).toBeGreaterThan(0.6);
  });

  it("finds A minor from an A-C-E chord with the tonic in the bass", () => {
    const key = estimateKey(chord([110, 220, 261.63, 329.63]), RATE);
    expect(key).toMatchObject({ tonic: 9, mode: "minor" });
    expect(key.confidence).toBeGreaterThan(0.6);
  });

  it("gives low confidence for noise, and no key for silence or a short buffer", () => {
    expect(estimateKey(noise(), RATE).confidence).toBeLessThan(0.4);
    expect(estimateKey(new Float32Array(RATE * 20), RATE)).toEqual({ tonic: null, mode: null, confidence: 0 });
    expect(estimateKey(new Float32Array(100), RATE).tonic).toBeNull();
  });
});

describe("analyse", () => {
  it("returns a complete, versioned result", () => {
    const result = analyse(clickTrack(120, 20), RATE);
    expect(result).toMatchObject({ v: 2, bpmOverride: null });
    expect(result.envelope).toBeInstanceOf(Uint8Array);
    expect(result.onsetDensity).toBeGreaterThan(1);
    expect(Number.isFinite(result.loudness)).toBe(true);
  });

  it("survives an empty buffer", () => {
    expect(() => analyse(new Float32Array(0), RATE)).not.toThrow();
  });
});
