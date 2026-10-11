Read the 'AGENTS.md' before starting

# Unit 01: Foundation Fixes

## Goal

The existing app plays all 5 songs correctly, is lint-clean, has a test runner, and follows the folder tree. No new features.

## Depends On

None.

## Build

- Move the song list to `src/data/songs.js` with stable string ids and a `file` name. URLs are built once as `encodeURI("/songs/" + file)`. Map all 5 files that exist in `public/songs/`. Fix "Ariana Granede" to "Ariana Grande". Remove the hardcoded `duration` strings (Unit 03 shows real ones, and until then rows show no duration).
- Move `formatTime` to `src/lib/format.js` with tests (0, 59.9, 60, 3599, `NaN`, `Infinity`, negative → "0:00").
- Replace prop-drilled `music` with `src/state/MusicProvider.jsx` and `src/state/useMusic.js`. State keeps the current song by id, not as a duplicate object plus an index. Next and previous are pure updaters (no setState inside an updater).
- `audio.play()` rejection is caught and sets `isPlaying` to false.
- Seek and volume values are converted with `Number()`. The volume step is `0.01`.
- Reset `currentTime` and `duration` to 0 when the track changes.
- The `ended` listener doesn't re-subscribe on every render (use a ref or a stable callback).
- Song cards are `<button>`s keyed by `song.id`. Fix the `tracl-artist` class.
- Remove the unused imports, the unreachable code, `setAllSongs`, the `console.log`s and the unused `react-router-dom` dependency.
- Fix `index.html`: title "Music Player", and either remove the missing `/vite.svg` favicon link or add an icon.
- Add Vitest (dev dependency) and an `"test": "vitest run"` script.
- Root `.gitignore` (`.env`, `.env.*`, `!.env.example`, `public/songs/*.mp3`) and `.env.example` already exist (added at setup). Check they're still intact.
- `README.md`: what it is, `npm install`, put mp3s in `public/songs/`, and the four commands, with a link to `context/`.

## Not In This Unit

Queue, shuffle, repeat, playlists, new layout or tokens, and duration probing.

## Acceptance Criteria

- [ ] `npm run lint` passes with 0 errors and 0 warnings.
- [ ] `npm test` passes and includes the `formatTime` tests.
- [ ] `npm run build` passes.
- [ ] Each of the 5 songs plays when its card is clicked, and the title and artist in the player match.
- [ ] Next on song 5 goes to song 1, and previous on song 1 goes to song 5. With StrictMode on, each press moves exactly one step.
- [ ] Seeking jumps the audio, and the time label updates. In React DevTools or with a log, the state value is a number.
- [ ] Negative: point one song at a missing file temporarily. Clicking it leaves the play button showing ▶ (not ⏸), and there's no uncaught promise error in the console. Revert after.
- [ ] `grep -r "react-router-dom" src package.json` finds nothing.

## Verify

Run the three commands. Run `npm run dev` and walk through the song, next/prev and seek criteria in the browser while watching the console.
