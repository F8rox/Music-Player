// Experimental beat-matching maths (Invariant 11). Pure. A wrong tempo must never reach the
// speakers: anything uncertain returns false and the smart crossfade is used instead.
import { foldBpm } from "../audio/analysis/dsp";

export const CONFIDENCE_GATE = 0.6;
export const TOLERANCE = 0.04;
const MAX_FADE = 8;

const analysed = (a) => typeof a === "object" && a !== null;
const tempo = (a) => a.bpmOverride ?? a.bpm;
// A user-corrected tempo counts as confident.
const confident = (a) => a.bpmOverride != null || a.bpmConfidence >= CONFIDENCE_GATE;

export const canBeatMatch = (a, b) => {
  if (!analysed(a) || !analysed(b) || !tempo(a) || !tempo(b) || !confident(a) || !confident(b)) return false;
  return Math.abs(foldBpm(tempo(b)) / foldBpm(tempo(a)) - 1) <= TOLERANCE + 1e-9;
};

// Snap a time up to the next point on a beat grid.
const nextBeat = (time, gridStart, beat) => gridStart + Math.max(0, Math.ceil((time - gridStart) / beat - 1e-9)) * beat;

// at: outgoing-song time where the blend starts (on a beat). offset: incoming-song time to start
// from (on its beat). rate: incoming playback rate so its beats land on the outgoing grid.
// fadeSeconds: a whole number of outgoing beats, at most 8 s.
export const planBeatMatch = (a, b, { startAt, nextOffset, fadeSeconds }) => {
  const beatA = 60 / foldBpm(tempo(a));
  const beatB = 60 / foldBpm(tempo(b));
  const beats = Math.max(1, Math.floor(Math.min(MAX_FADE, fadeSeconds) / beatA + 1e-9));
  return {
    rate: beatB / beatA,
    at: nextBeat(startAt, a.beatOffset ?? 0, beatA),
    offset: nextBeat(nextOffset, b.beatOffset ?? 0, beatB),
    fadeSeconds: beats * beatA,
  };
};
