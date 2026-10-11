Read the 'AGENTS.md' before starting

# Unit 14: Beat-Matching (experimental)

## Goal

When two songs' tempos are confidently detected and close, the transition is beat-matched: the incoming song's beats land on the outgoing song's beats for the length of the fade. In every other case the smart crossfade is used. This is off by default and labelled "experimental". It must never sound worse than the smart crossfade.

## Depends On

10, 13.

## Build

- `src/lib/beatmatch.js` (pure): `canBeatMatch(a, b)` applies Invariant 11 (both confidences ≥ 0.6, folded tempos within ±4%, or `bpmOverride` set by the user, which counts as confident). `planBeatMatch(a, b, startAt)` returns the playback rate (`b.bpm / a.bpm` inverted as needed), the beat-aligned start offset in the incoming song, and the exact audio-clock start time aligned to the outgoing song's beat grid.
- Engine: for a beat-matched transition, decode only the incoming song's first `fadeSeconds + 4 s` (from `nextOffset`) into an `AudioBuffer`. Start it with `AudioBufferSourceNode.start(when, offset)` at the planned rate (pitch shifts up to ±4%, which is accepted DJ practice). At the end of the fade, hand off seamlessly to the incoming deck's `<audio>` element at rate 1 and the matching position, then free the buffer.
- Fade length for beat-matched transitions: a whole number of beats, at most 8 s.
- A settings toggle "Beat-match (experimental)", off by default. When a transition was beat-matched, the Notice says "Beat-matched (~124 BPM)".

## Not In This Unit

Pitch-preserving time-stretch, bar or phrase alignment, key matching, and manual DJ controls.

## Acceptance Criteria

- [ ] `beatmatch.test.js`: confidence and tolerance gating (3.9% passes, 4.1% fails), half/double folding (70 vs 140 matches), override counts as confident, rate maths, and beat-aligned start-offset maths on a known grid.
- [ ] Two synthetic click tracks at 120 and 123 BPM: the incoming clicks land within 10 ms of the outgoing clicks across the fade (measure by rendering the mix in an `OfflineAudioContext` in a test, or by recording; method recorded).
- [ ] Real songs: listen to 5 beat-matched transitions and record the result of each in the tracker. Any that sounds worse than the smart crossfade is a fail, and the thresholds get tightened.
- [ ] The handoff from the buffer to the element is inaudible: no click or gap (recorded listening check, plus the deck positions logged within 30 ms).
- [ ] Memory: the transition buffer is freed after each fade (heap returns to baseline ±20 MB after 5 transitions).
- [ ] Negative: one song with confidence 0.3 uses the smart crossfade, not beat-matching. With the toggle off, beat-matching never happens.

## Verify

Lint, tests and build. Do the offline-render timing test and a recorded listening session. If it doesn't meet the criteria, ship it off, hidden behind the toggle, with an honest note in the README.
