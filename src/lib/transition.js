// When and how to blend the current song into the next one. Pure; null means "no crossfade,
// play the plain way" (Invariant: never sound worse than a cut).
const MIN_START = 0.3; // never start fading before 30% of the song
const MAX_SKIP = 15; // never skip more than 15 s of the next song's intro

const analysed = (value) => typeof value === "object" && value !== null;

// current/next: AnalysisResult (or anything else when not analysed); duration in seconds.
export const planTransition = ({ current, next, duration, settings, repeat }) => {
  if (!settings.crossfade || repeat === "one" || !analysed(current) || !analysed(next)) return null;
  const fadeSeconds = settings.fadeSeconds;
  if (!(duration >= 3 * fadeSeconds)) return null;
  return {
    startAt: Math.max(current.outroStart - fadeSeconds, MIN_START * duration),
    nextOffset: Math.min(next.introEnd, MAX_SKIP),
    fadeSeconds,
  };
};

// Equal-power fade curves (cos out, sin in) so loudness stays constant through the blend.
export const fadeCurves = (points = 64) => {
  const out = new Float32Array(points);
  const into = new Float32Array(points);
  for (let i = 0; i < points; i++) {
    const t = (i / (points - 1)) * (Math.PI / 2);
    out[i] = Math.cos(t);
    into[i] = Math.sin(t);
  }
  return { out, into };
};
