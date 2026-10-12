# Code Standards

## Lean Code
- Build the smallest thing that meets the spec. No options, flags or abstractions nobody asked for.
- No dead code, no commented-out code, no `console.log` in committed code.
- Don't add a dependency for something a few lines can do. Every new dependency needs a line in Architecture Decisions in `progress-tracker.md`.

## No Repetition
- One `SortableList` for every reorderable list. One `SongRow` for every song list. One `formatTime` in `src/lib/format.js`.
- One state provider (`MusicProvider`). No second hook that copies or recalculates the queue.
- Queue, shuffle, repeat and playlist rules live once, in `src/lib/`.

## Naming And Style
- Components are PascalCase `.jsx` with named exports. Hooks are `useX`. Lib modules are camelCase `.js`.
- Setters are named `setX` consistently (the existing `setcurrentTrack` is removed).
- Lists are keyed by stable ids (`song.id`, `item.qid`, `playlist.id`), never by array index.
- Numbers read from inputs are converted with `Number()` before they go into state.

## React
- Components render state and call provider actions. They don't compute queue order.
- State updater functions are pure: no setState calls and no side effects inside them.
- Effects carry correct dependency arrays and clean up their listeners. Use stable callbacks (`useCallback`) or refs when an effect depends on an action.
- Interactive elements are `<button>`, `<a>` or `<input>`, never a clickable `<div>`.

## Styling
- Styles go in `src/index.css`, grouped by component with a comment header. Colors, radius and spacing come only from tokens (see `design.md`).
- No inline styles except CSS custom properties that carry runtime values (for example `--progress`).

## Data And Storage
- `src/lib/storage.js` is the only module that touches `localStorage`.
- Every value parsed from storage is validated (see `architecture-context.md` Storage Model).

## Testing
- Vitest, `npm test` → `vitest run`. Tests sit next to the module as `*.test.js`.
- Every exported function in `src/lib/` has tests, including at least one edge case: an empty queue, a single item, the current item at the end, or a duplicate song.
- Shuffle tests pass in a seeded or injected random function so the results are deterministic.
- UI behaviour is checked by walking the real app in the browser. Record what you did in the tracker.

## Tooling
- Commands: `npm run dev`, `npm run lint`, `npm test`, `npm run build`. All must pass before a commit.
- Commit messages are conventional (`feat(queue): ...`, `fix(player): ...`, `chore: ...`).

## Size Limits
- Files of 200 lines or fewer (`src/index.css` is exempt; `src/audio/engine.js` is a recorded exception at about 245 lines, because splitting it would spread its module-private deck/transition state across files). Functions of 50 lines or fewer. Split a file by component or concern when it grows past this.

## File Organization

```
src/
  main.jsx
  App.jsx                     routes and layout shell
  index.css                   tokens + component styles
  lib/                        pure rules, each with *.test.js
    format.js  queue.js  storage.js  playlists.js  arrange.js  tags.js (tag sanitising)
  library/                    the only IndexedDB code
    db.js  importFiles.js  library.test.js   (one idb-keyval store, keys song:/blob:/cover:/analysis:<id>)
  audio/
    engine.js                 AudioContext singleton, decks, fades, analyser
    analysis/
      analyse.js              main-thread decode + worker hand-off
      analysis.worker.js      DSP entry point
      dsp.js  dsp.test.js     pure DSP: rms, intro/outro, onset, bpm
  lib/energy.js  lib/tempo.js   energy percentiles; tap tempo + override
  state/
    MusicProvider.jsx  useMusic.js  useDurations.js  useLibrary.js  useSongUrl.js  usePlaylists.js
    usePlayback.js  usePlaybackTime.js   (engine ↔ React; time is PlayerBar-only)
    useAnalysis.js   (cached results + one-at-a-time analysis queue)
    useCrossfade.js  (plans and triggers the fade; owns crossfade settings)
  components/
    Navbar  PlayerBar  QueuePanel  SortableList  SongRow  SongMenu  Notice
    ImportButton  ImportPanel  DropZone  Visualiser  TempoDialog  ConfirmDialog  PlaylistHeader  SettingsPopover
  pages/
    AllSongs.jsx  Playlists.jsx  PlaylistDetail.jsx  About.jsx
```

DSP rules: pure functions over `Float32Array` input, tested with synthetic signals (a click track at a known BPM, a sine with silence at each end). No React, no Web Audio inside `dsp.js`.
