// Pure DSP over mono Float32Array samples. No Web Audio or React here, so it runs in a Worker
// and in Node tests. Tempo is an estimate: always paired with a confidence value.
import { estimateKey } from "./key";

export const ANALYSIS_VERSION = 2;
const ENVELOPE_HZ = 10;
const HOP = 128; // onset frames: ~86 per second at 11025 Hz
const MIN_BPM = 60;
const MAX_BPM = 180;

const toDb = (x) => 20 * Math.log10(x + 1e-9);

const median = (values) => {
  if (values.length === 0) return -180;
  const sorted = Float32Array.from(values).sort();
  return sorted[sorted.length >> 1];
};

// RMS level in dB per 1/hz-second frame.
export const rmsEnvelope = (samples, rate, hz = ENVELOPE_HZ) => {
  const size = Math.max(1, Math.round(rate / hz));
  const out = new Float32Array(Math.floor(samples.length / size));
  for (let f = 0; f < out.length; f++) {
    let sum = 0;
    for (let i = f * size; i < (f + 1) * size; i++) sum += samples[i] * samples[i];
    out[f] = toDb(Math.sqrt(sum / size));
  }
  return out;
};

const threshold = (envelope) => median(envelope) - 30;

// Mean level of the audible part (quiet intro/outro excluded).
export const loudness = (envelope) => {
  const audible = envelope.filter((v) => v > threshold(envelope));
  return audible.length ? audible.reduce((a, b) => a + b, 0) / audible.length : -180;
};

// Seconds where the 0.3 s-smoothed level first rises above, and finally falls below, median − 30 dB.
export const introOutro = (envelope, hz = ENVELOPE_HZ) => {
  const limit = threshold(envelope);
  const smooth = (i) => (envelope[Math.max(0, i - 1)] + envelope[i] + envelope[Math.min(envelope.length - 1, i + 1)]) / 3;
  let first = -1;
  let last = -1;
  for (let i = 0; i < envelope.length; i++) {
    if (smooth(i) > limit) {
      if (first < 0) first = i;
      last = i;
    }
  }
  if (first < 0) return { introEnd: 0, outroStart: envelope.length / hz };
  return { introEnd: first / hz, outroStart: (last + 1) / hz };
};

// Half-wave-rectified log-energy flux: spikes where notes and beats start.
export const onsetEnvelope = (samples, hop = HOP) => {
  const frames = Math.floor(samples.length / hop) - 1;
  const onsets = new Float32Array(Math.max(0, frames));
  let previous = null;
  for (let f = 0; f < frames; f++) {
    let sum = 0;
    for (let i = f * hop; i < f * hop + 2 * hop; i++) sum += samples[i] * samples[i];
    const level = Math.log(sum + 1e-10);
    onsets[f] = previous === null ? 0 : Math.max(0, level - previous);
    previous = level;
  }
  return onsets;
};

// Onset peaks per second: a rough "busyness" measure that feeds energy.
export const onsetDensity = (onsets, fps) => {
  if (onsets.length < 3) return 0;
  const mean = onsets.reduce((a, b) => a + b, 0) / onsets.length;
  const sd = Math.sqrt(onsets.reduce((a, b) => a + (b - mean) ** 2, 0) / onsets.length);
  let peaks = 0;
  for (let i = 1; i < onsets.length - 1; i++) {
    if (onsets[i] > mean + 2 * sd && onsets[i] >= onsets[i - 1] && onsets[i] > onsets[i + 1]) peaks += 1;
  }
  return peaks / (onsets.length / fps);
};

// Tempo results are folded into 80–160 so half/double readings compare equal.
export const foldBpm = (bpm) => {
  let value = bpm;
  while (value < 80) value *= 2;
  while (value >= 160) value /= 2;
  return value;
};

// Autocorrelation of the onset envelope over 60–180 BPM, refined by parabolic interpolation.
export const estimateBpm = (onsets, fps) => {
  const none = { bpm: null, confidence: 0, beatOffset: null };
  const mean = onsets.reduce((a, b) => a + b, 0) / (onsets.length || 1);
  const x = onsets.map((v) => v - mean);
  const ac = (lag) => {
    let sum = 0;
    for (let i = lag; i < x.length; i++) sum += x[i] * x[i - lag];
    return sum / (x.length - lag);
  };
  const zero = ac(0);
  const minLag = Math.floor((fps * 60) / MAX_BPM);
  const maxLag = Math.ceil((fps * 60) / MIN_BPM);
  if (!(zero > 0) || x.length < 2 * maxLag) return none;
  let best = minLag;
  for (let lag = minLag; lag <= maxLag; lag++) if (ac(lag) > ac(best)) best = lag;
  const [left, mid, right] = [ac(best - 1), ac(best), ac(best + 1)];
  const shift = (left - right) / (2 * (left - 2 * mid + right) || 1);
  const period = best + Math.max(-0.5, Math.min(0.5, shift));
  return {
    bpm: Math.round(foldBpm((60 * fps) / period) * 10) / 10,
    confidence: Math.max(0, Math.min(1, mid / zero)),
    beatOffset: beatPhase(onsets, period) / fps,
  };
};

// Which offset within one beat period lines up with the most onset energy.
const beatPhase = (onsets, period) => {
  let bestPhase = 0;
  let bestScore = -1;
  for (let phase = 0; phase < period; phase++) {
    let score = 0;
    for (let t = phase; t < onsets.length; t += period) score += onsets[Math.round(t)] ?? 0;
    if (score > bestScore) [bestPhase, bestScore] = [phase, score];
  }
  return bestPhase;
};

// The full analysis of one decoded mono track (run in the Worker).
export const analyse = (samples, rate) => {
  const envelope = rmsEnvelope(samples, rate);
  const onsets = onsetEnvelope(samples);
  const fps = rate / HOP;
  const tempo = estimateBpm(onsets, fps);
  const key = estimateKey(samples, rate);
  return {
    v: ANALYSIS_VERSION,
    // Stored compactly: −90…0 dB mapped to 0…255.
    envelope: Uint8Array.from(envelope, (db) => Math.round(Math.max(0, Math.min(1, (db + 90) / 90)) * 255)),
    loudness: loudness(envelope),
    onsetDensity: onsetDensity(onsets, fps),
    ...introOutro(envelope),
    bpm: tempo.bpm,
    bpmConfidence: tempo.confidence,
    beatOffset: tempo.beatOffset,
    bpmOverride: null,
    keyTonic: key.tonic,
    keyMode: key.mode,
    keyConfidence: key.confidence,
  };
};
