Read the 'AGENTS.md' before starting

# Unit 17: Loudness Normalisation

## Goal
Every song plays at about the same volume, using the loudness already measured in Unit 10.

## Depends On
09, 10.

## Build
- Pure `src/lib/loudness.js`: `normalisationGain(loudnessDb, enabled)` returns a linear gain toward a fixed target (-16 dB RMS), clamped between -12 dB and +10 dB (owner decision 2026-10-12, was +4).
- Engine: a per-deck normalisation gain node before the fade gain; `setNorm(gain)` ramps the current deck over 0.3 s; crossfades and beat-matches set the incoming deck's gain before the blend.
- Setting 'Normalise volume' (default on), validated and saved.

## Not In This Unit
True LUFS measurement, per-album gain. (A limiter ahead of master was added with the +10 dB cap.)

## Acceptance Criteria
- [ ] Tests: target maths, both clamps, disabled = 1, unanalysed = 1.
- [ ] Analyser RMS of a loud vs a quiet song while playing differs by less than 3 dB with normalisation on, and by the original difference with it off.
- [ ] A crossfade into a song with a different gain blends without a jump (incoming deck gain set before the fade).
- [ ] Negative: an unanalysed song plays at gain 1.
