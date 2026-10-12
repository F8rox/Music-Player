// Loudness normalisation: move every song toward one target level. Boost is capped low so a
// quiet master is never pushed into clipping; cut can be generous.
const TARGET_DB = -16;
const MAX_BOOST_DB = 4;
const MAX_CUT_DB = -12;

// loudnessDb: mean RMS dB from analysis (undefined/null when not analysed) → linear gain.
export const normalisationGain = (loudnessDb, enabled) => {
  if (!enabled || !Number.isFinite(loudnessDb)) return 1;
  const db = Math.min(MAX_BOOST_DB, Math.max(MAX_CUT_DB, TARGET_DB - loudnessDb));
  return 10 ** (db / 20);
};
