// Musical key from raw samples: in-house FFT, a chroma (pitch-class) profile and Krumhansl–Kessler key
// profiles. Pure, so it runs in the Worker and in Node tests. No third-party DSP (AGPL avoided).

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
