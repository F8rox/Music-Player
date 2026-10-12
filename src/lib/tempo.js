// Tap tempo: BPM from the average gap between the last (up to 8) taps; needs at least 4 taps.
// A pause of more than 2 s starts a fresh count, so stray old taps don't skew the result.
export const tapBpm = (timestamps) => {
  let start = timestamps.length - 1;
  while (start > 0 && timestamps[start] - timestamps[start - 1] <= 2000) start -= 1;
  const taps = timestamps.slice(Math.max(start, timestamps.length - 8));
  if (taps.length < 4) return null;
  const gap = (taps.at(-1) - taps[0]) / (taps.length - 1);
  return Math.round((60000 / gap) * 10) / 10;
};

// The tempo a song is treated as: the user's correction wins over detection.
export const tempoOf = (analysis) => analysis?.bpmOverride ?? analysis?.bpm ?? null;
