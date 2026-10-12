// Pure DSP over mono Float32Array samples. No Web Audio or React here, so it runs in a Worker
// and in Node tests. Tempo is an estimate: always paired with a confidence value.
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

// In-place radix-2 FFT (size must be a power of two); cos/sin are the precomputed twiddles for that size.
const fft = (re, im, cos, sin) => {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) [re[i], re[j], im[i], im[j]] = [re[j], re[i], im[j], im[i]];
  }
  for (let size = 2; size <= n; size <<= 1) {
    const step = n / size;
    for (let start = 0; start < n; start += size) {
      for (let k = 0; k < size / 2; k++) {
        const wr = cos[k * step];
        const wi = sin[k * step];
        const a = start + k;
        const b = a + size / 2;
        const tr = re[b] * wr - im[b] * wi;
        const ti = re[b] * wi + im[b] * wr;
        re[b] = re[a] - tr;
        im[b] = im[a] - ti;
        re[a] += tr;
        im[a] += ti;
      }
    }
  }
};

// Mean energy per pitch class (C = 0 … B = 11) over 65–2000 Hz, from Hann-windowed 0.74 s frames.
export const chroma = (samples, rate) => {
  const N = 8192;
  const bins = [];
  for (let k = 1; k < N / 2; k++) {
    const hz = (k * rate) / N;
    if (hz >= 65 && hz <= 2000) bins.push([k, (Math.round(12 * Math.log2(hz / 440)) + 69) % 12]);
  }
  const window = Float32Array.from({ length: N }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N));
  const cos = Float32Array.from({ length: N / 2 }, (_, k) => Math.cos((-2 * Math.PI * k) / N));
  const sin = Float32Array.from({ length: N / 2 }, (_, k) => Math.sin((-2 * Math.PI * k) / N));
  const out = new Float64Array(12);
  const [re, im] = [new Float32Array(N), new Float32Array(N)];
  for (let start = 0; start + N <= samples.length; start += N) {
    for (let i = 0; i < N; i++) {
      re[i] = samples[start + i] * window[i];
      im[i] = 0;
    }
    fft(re, im, cos, sin);
    for (const [k, pc] of bins) out[pc] += Math.hypot(re[k], im[k]);
  }
  return out;
};

// Krumhansl–Kessler key profiles, indexed by semitones above the tonic.
const MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

const correlation = (a, b) => {
  const [ma, mb] = [a.reduce((x, y) => x + y, 0) / a.length, b.reduce((x, y) => x + y, 0) / b.length];
  let [ab, aa, bb] = [0, 0, 0];
  for (let i = 0; i < a.length; i++) {
    ab += (a[i] - ma) * (b[i] - mb);
    aa += (a[i] - ma) ** 2;
    bb += (b[i] - mb) ** 2;
  }
  return aa > 0 && bb > 0 ? ab / Math.sqrt(aa * bb) : 0;
};

// Best of 24 keys by correlation with the chroma; confidence is that correlation (0 when nothing fits).
// shortcut: assumes A4 = 440 Hz, so a song tuned off-pitch by a quarter tone can read a neighbouring key.
export const estimateKey = (samples, rate) => {
  const pcp = chroma(samples, rate);
  let best = { tonic: null, mode: null, confidence: 0 };
  for (const [mode, profile] of [["major", MAJOR], ["minor", MINOR]]) {
    for (let tonic = 0; tonic < 12; tonic++) {
      const r = correlation(pcp, Array.from({ length: 12 }, (_, pc) => profile[(pc - tonic + 12) % 12]));
      if (r > best.confidence) best = { tonic, mode, confidence: Math.min(1, r) };
    }
  }
  return best;
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
