Read the 'AGENTS.md' before starting

# Unit 13: Smart Crossfade

## Goal

Songs blend like a DJ mix: the next song starts as the current one's outro begins, skipping its own quiet intro, with a smooth equal-power fade and no silence gap. Any interruption during a fade is handled cleanly.

## Depends On

09, 10.

## Build

- `src/lib/transition.js` (pure): `planTransition(current, next, settings)` returns `{ startAt, nextOffset, fadeSeconds }` or `null`. It returns `null` (no crossfade) for: crossfade off, repeat "one", the queue stopping at the end, missing analysis on either song, or a song shorter than 3× the fade length. `startAt = outroStart − fadeSeconds` (clamped so it's never before 30% of the song). `nextOffset = introEnd` of the next song (clamped to at most 15 s).
- Engine `crossfadeTo` implements an equal-power fade (`setValueCurveAtTime` with cos/sin curves) on the audio clock. The incoming deck starts at `nextOffset`.
- The provider schedules the transition from `timeupdate` when the current time passes `startAt`. When the fade starts, the next item becomes current (the title, row and progress switch then).
- Cancellation rules (`project-overview.md` Auto-DJ Behaviour): Next, Previous, seek, pause, a queue change that touches the incoming item, or a song removal during a fade calls `cancelTransition()`. The incoming song is current at full volume, and the outgoing song stops.
- Settings popover: crossfade on/off and fade length 2–12 s, persisted (`settings` in localStorage, validated).

## Not In This Unit

Beat-matching (Unit 14), per-song fade overrides, and a crossfade on manual skip.

## Acceptance Criteria

- [ ] `transition.test.js`: every `null` case, clamping of `startAt` and `nextOffset`, and the normal case.
- [ ] Two analysed songs: let the first reach its outro. The second fades in with no silence gap (record `audio` timestamps: the incoming deck starts before the outgoing one reaches 0 gain), and the title switches when the fade starts.
- [ ] The incoming song skips its quiet intro (its deck starts at about `introEnd`, recorded).
- [ ] Mid-fade Next: exactly one song is audible afterwards (check both decks: one paused, gain 1 on the other).
- [ ] Mid-fade drag of the incoming item to a later position: cancel, and playback continues on the item that is now current per the queue (documented in the tracker).
- [ ] Mid-fade pause, then play: one song, no overlap.
- [ ] Crossfade off: transitions are plain cuts on `ended`, as before Unit 13.
- [ ] Negative: a song with no analysis transitions by a plain cut, and repeat "one" never crossfades.

## Verify

Lint, tests and build. Walk every mid-fade interruption in the browser with both deck states checked through the console, and record the results.
