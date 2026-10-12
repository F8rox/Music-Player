Read the 'AGENTS.md' before starting

# Unit 09: Audio Engine (two decks, no new features)

## Goal

Playback moves from the single `<audio>` in PlayerBar onto the Web Audio engine in `architecture-context.md`: one AudioContext and two decks. Everything that works today keeps working exactly the same. This unit adds no new user-facing feature. It's the foundation for the visualiser, crossfades and beat-matching.

## Depends On

04–08.

## Build

- `src/audio/engine.js`: a module singleton with `init()` (on the first user gesture; resumes a suspended context) and `load(deck, url)`, `play()`, `pause()`, `seek(t)`, `setVolume(v)`, `currentDeck()`, `analyser`, `crossfadeTo(url, { fadeSeconds, startAt })` (implemented here as an instant cut; the fade comes in Unit 13), and `cancelTransition()`. It fires events for `timeupdate`, `loadedmetadata`, `ended` and `error` from the current deck only.
- Two `<audio>` elements, created once by the engine (not React), each wired with `createMediaElementSource` exactly once, into gain nodes, then the master gain, the analyser and the destination.
- PlayerBar becomes a view: it renders controls and calls provider actions. The provider drives the engine. Remove the keyed `<audio>` from PlayerBar.
- Preserve all current behaviour: the duplicate song restarts from 0, the saved position is restored paused, Previous after 3 s restarts, repeat "one" replays, repeat "off" stops at the end, and a `play()` rejection resets the button.
- Move fast-changing playback time (`currentTime`, `duration`) out of the main music context into its own small context (or a subscription read only by PlayerBar), so song lists don't re-render about 4×/s during playback (audit finding, 2026-10-12).
- Update Invariant 1 in the tracker's Architecture Decisions.

## Not In This Unit

Crossfades, the visualiser, analysis, and any new UI.

## Acceptance Criteria

- [ ] Exactly two `<audio>` elements exist in the DOM, and the console shows no "already connected" error after 5 StrictMode remounts (navigate between pages 5 times).
- [ ] The first play after a reload works (the AudioContext resumes on the click), and no sound happens before a user action.
- [ ] Regression: every Unit 01–08 playback criterion is re-run and passes. List each with its result in the tracker (seek, volume, next/prev wrap, duplicate restart, restore paused, Previous after 3 s, repeat one/off, shuffle during play, drag during play, imported and bundled songs).
- [ ] React Profiler during 5 s of playback: AllSongs and the song rows don't re-render (only PlayerBar does).
- [ ] Volume changes apply through the master gain, and the deck element volume stays at 1.
- [ ] Negative: a broken file on a deck triggers the error path: the button resets to ▶, no uncaught errors, and the next song still plays.
- [ ] Playing 20 songs in a row (Next ×20) doesn't increase the number of AudioContexts (still 1) or leave object URLs unrevoked.

## Verify

Lint, tests and build. Do a full regression walk in the browser, recorded criterion by criterion.
