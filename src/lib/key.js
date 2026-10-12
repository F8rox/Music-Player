// Musical key helpers over the analysis fields keyTonic (0 = C … 11 = B), keyMode, keyConfidence.
const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export const MIN_KEY_CONFIDENCE = 0.5; // below this a detected key is shown as nothing, not a guess

// Camelot wheel: a minor key shares its number with its relative major (3 semitones up).
export const camelot = (tonic, mode) => {
  const major = mode === "minor" ? (tonic + 3) % 12 : tonic;
  return `${((major * 7 + 7) % 12) + 1}${mode === "minor" ? "A" : "B"}`;
};

// { name: "A minor", camelot: "8A" }, or null when there's no key or it isn't trustworthy.
export const keyOf = (analysis) => {
  if (!analysis || !Number.isInteger(analysis.keyTonic) || analysis.keyConfidence < MIN_KEY_CONFIDENCE) return null;
  return { name: `${NAMES[analysis.keyTonic]} ${analysis.keyMode}`, camelot: camelot(analysis.keyTonic, analysis.keyMode) };
};
