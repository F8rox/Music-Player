// Energy is relative to the user's own library (mastering loudness varies wildly between
// tracks), so it's a percentile, recomputed as the library grows. Result: 1 (calm) … 5 (intense).

// Rank in 0…1; ties share their average rank; a single value sits in the middle.
const percentiles = (values) => {
  if (values.length === 1) return [0.5];
  const sorted = [...values].sort((a, b) => a - b);
  return values.map((v) => {
    const first = sorted.indexOf(v);
    const last = sorted.lastIndexOf(v);
    return (first + last) / 2 / (values.length - 1);
  });
};

// analyses: { [songId]: { loudness, onsetDensity } } → { [songId]: 1…5 (fractional) }
export const energyLevels = (analyses) => {
  const ids = Object.keys(analyses);
  if (ids.length === 0) return {};
  const loud = percentiles(ids.map((id) => analyses[id].loudness));
  const busy = percentiles(ids.map((id) => analyses[id].onsetDensity));
  return Object.fromEntries(ids.map((id, i) => [id, 1 + 4 * ((loud[i] + busy[i]) / 2)]));
};
