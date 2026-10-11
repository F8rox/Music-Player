# Progress Tracker

## Current State (baseline, 2026-10-12)

The app is a Vite + React tutorial-stage player. Checked on 2026-10-12:

- `npm run build`: passes.
- `npm run lint`: **fails, 4 errors**. These are unused `useMusic` imports in AllSongs and MusicPlayer, unreachable code in AllSongs, and an unused `setAllSongs`.
- `npm test`: no test script exists.
- Playback: only song 1 has a URL. Songs 2 to 5 have `url: ""`.
- Playlists page is a stub. `src/index.css` already holds unused playlist and modal styles from a tutorial, which Unit 02 replaces.
- Git: initialised. Context and the untouched baseline app are committed. The project was moved to `D:\music player` on 2026-10-12.

## Units

| Unit | Status | Evidence |
|------|--------|----------|
| 01 Foundation fixes | Done | lint 0 problems; `npm test` 8/8 (format.test.js); build ok; `npm audit --audit-level=high` 0 (after `npm audit fix`, which cleared 9 pre-existing highs). Browser walk on 127.0.0.1:5199: all 5 songs clicked, each `audio.paused=false`, src/title/active card match. Prev on song 1 → "Into You", Next → "I Wanna Be Yours" (one step each, StrictMode on). Seek click → audio 92.7s, label 1:32. Seek and volume pass `Number()` (code). Negative: song 2 → missing.mp3, so MediaError 4, button back to ▶, no console errors, then reverted. grep finds no react-router-dom, console.log or tracl. |
| 02 Tokens and app shell | Done (1 criterion by inspection) | lint 0, tests 8/8, build ok. Hex grep: matches only `:root` lines 3–13 of index.css. At 1280×320 the page scrolls, the bar is `fixed`, and the last row's bottom (224) is above the bar's top (248). Up next at 1280 is a `sticky` side panel with no backdrop; at 375 it's a `fixed` drawer, 360px wide, backdrop shown, no x-overflow. Esc closes it and focus returns to the "Up next" toggle (aria-expanded false). Tab walk over brand, nav links, rows and player buttons: all show a `--focus` outline. Contrast (computed): muted/surface 7.26, muted/bg 8.25, text/surface 14.92. Reduced motion: **not emulated** (the browser tool can't emulate `prefers-reduced-motion`); the live stylesheet's rule sets animation and transition to none. Regression: My Love plays, Next → Manic in Disguise, one `<audio>`. |
| 03 Real durations | Done | lint 0, tests 8/8, build ok; no `duration: "` in src. Rows match the player labels (3:03, 2:40, 4:36, 3:34, 4:14), max diff from `audio.duration` 1.0s (label floors). Network on reload: one 206 range request per song, aborted after metadata, plus the player's own request for song 1, so no double probe under StrictMode. Negative: My Love → missing.mp3 shows "Unavailable", the later songs still load, no uncaught errors, then reverted. Note: Vite's watcher missed one edit; restarting the dev server fixed it. |
| 04 Queue | Done | lint 0, tests 34/34 (queue.test.js covers every export plus empty, single, end and repeat, duplicates, removal before/after current; storage.test.js has a round trip and negatives for non-JSON, wrong types, unknown song ids, duplicate qids, out-of-range volume/position, `__proto__`, missing key, extra item fields), build ok. Browser: fresh storage shows "Nothing playing" with controls disabled. Click My Love gives the queue in list order 1–5, current at 3, playing. Play next (menu opened, then Enter from the keyboard) on Into You while song 1 plays puts it at position 2 with the notice "Playing next", and focus returns to the ⋯ button. Duplicate: second Into You entry starts at 1.1s, not 100s. Add to queue appends a duplicate My Love with a notice. Removing a non-current item keeps the same audio element playing (9.6s → 10.4s), and the current item has no remove button. Previous after 47s restarts at 0.0; Previous at 0 goes back one. Refresh restores the queue, current item and position 47s, paused. Negative: `{"queue":"junk","volume":"loud","position":-9}` gives an empty queue, volume 0.5, and no new uncaught errors (count unchanged). |
| 05 Queue reorder | Done pending manual touch check | lint 0, tests 39/39 (5 `move` tests: up, down, same index or unknown no-op, current moved, clamping), build ok, audit 0. Mouse: dragged Into You handle to position 2 while song 1 played; the same audio element kept going (3.9s → 12.0s), then Next played Into You. Order survived a reload. Keyboard (paced like a person): Space lifts ("Picked up The Way I Are."), ArrowDown ("Moved to position 4."), Space drops ("Dropped … at position 4.") and focus stays on the handle; Space, ArrowUp, Esc restores the order exactly ("Cancelled. … returned to its place.") and the panel stays open; a second Esc closes it and focus returns to the toggle. Clicking a row (not its handle) plays it. Negative: current item dragged to the end, then Next wraps to item 1, no errors. **Touch not verified:** the browser tool sends mouse events even in mobile emulation, so it needs one manual long-press test on a phone. Note: key presses fired with zero delay confused dnd-kit's keyboard sensor during testing; not reproducible at human speed. |
| 06 Shuffle and repeat | Done | lint 0, tests 51/51 (seeded-LCG shuffle: prefix fixed, permutation, deterministic, unshuffle restores, added-while-shuffled kept after originals, remove while shuffled, unshuffle mid-queue, empty; `afterEnded`: one keeps the qid, all wraps, off stops; Next with one advances; storage: bad repeat or shuffled falls back), build ok. Browser: shuffle on while song 1 plays reorders only the songs below it (same audio element, 0.7 → 1.1s), shuffle off restores the order exactly. Repeat cycles off → all → one with a badge. Repeat one: seek to end−2s, then the same song replays from 0.7s on the same element. Next with repeat one goes to The Way I Are. Repeat off on the last item: track ends, ▶ shown, paused. Shuffle on and repeat all survive a reload. Negative: `repeat:"sideways"`, `shuffled:"yes"` loads as off/false with no errors. |
| 07 Your own library | Done, 2 items pending | lint 0, tests 74/74 (tags.test.js: trim, control chars, 200 cap, non-strings, filename fallback; library.test.js with fake-indexeddb: store/list/blob/delete, corrupt record dropped **and deleted**, checkFile types and 100 MB limit; queue.test.js `removeSong`: every copy, current → next remaining, skips later copies, last → stopped), build ok (main chunk 424 kB, tag parsers lazy-loaded), audit 0. Browser (test files served from a git-excluded folder, deleted afterwards): synthetic drag-drop of 5 owner mp3s shows the overlay, then all Added with real durations; file-picker path for 3 more, including a hand-made ID3v2.3 file: the title `<img src=x onerror=alert(1)>` renders as literal text (0 img elements) and the artist `Tagged\u0007 Artist  ` shows as "Tagged Artist". The owner files have ID3 headers but no title/artist frames, so they correctly fall back to filename + "Unknown artist". Imported songs play from blob: URLs; Next walks all 8. Refresh: 13 rows (8 "Yours"). Duplicate import shows "Already in your library"; a text file named .mp3 and a .txt show "Can't play this file"; 101 MB shows "Too big" (failures in red); no rows added. Remove Payphone while it plays: native dialog (focus on Cancel), then gone from the list and queue (12 items) and Sweet but Psycho plays, with a notice. Object URLs: 10 switches between imported songs created 11 and revoked 10, and only the current one is live. Corrupt IndexedDB record: dropped, notice shown once (about 3 s), record deleted, no notice on the next load. **Not verified:** Firefox (only Chromium is available here); a full browser restart (reloads only); `persist()` was declined by Chrome's heuristics (expected, not an error). **Blocked on input:** free-licensed demo tracks. |
| 08 Playlists | Not started | |
| 09 Audio engine | Not started | |
| 10 Track analysis | Not started | |
| 11 Visualiser | Not started | |
| 12 Arrange my queue | Not started | |
| 13 Smart crossfade | Not started | |
| 14 Beat-matching (experimental) | Not started | |
| 15 Responsive, a11y, release | Not started | |

## In Progress
None.

## Next Up
Unit 08 (Playlists).

Dev server: `npm run dev -- --port 5199 --host 127.0.0.1`. Port 5173 is used by another local project.

## Open Questions
1. **Demo tracks:** resolved by direction. The commercial mp3s get replaced with free-licensed (CC0/CC-BY) tracks that are committed and credited (Unit 07). The owner picks the tracks.
2. **Deploy host:** resolved as GitHub Pages (Unit 15), with CSP via a meta tag.
3. **Song metadata:** song 5's artist was fixed from "Ariana Granede" to "Ariana Grande". Moot once the demo tracks are replaced.
4. **BPM library:** `web-audio-beat-detector` or the in-house estimator. Decided by benchmark in Unit 10.

## Architecture Decisions
- 2026-10-12: Copy the YT Music UX only. No YouTube or YT Music API (the owner's choice).
- 2026-10-12: Persist to localStorage (`musicPlayer:v1`). No backend or accounts (the owner's choice).
- 2026-10-12: ~~Library is `public/songs` only~~ **Superseded the same day:** the owner chose bring-your-own-music. Imported files are stored in IndexedDB and never uploaded.
- 2026-10-12: The Auto-DJ direction and the build order come from an LLM council (5 independent members plus blind peer review). Its consensus: import first; rebuild the engine once on its own; the analysis is the foundation; smart crossfade over beat-matching; beat-matching last and confidence-gated. The ranking was Domain rigorist > Red-teamer > Generalist > First-principles > Pragmatist. The scope change added units 07 and 09–14; the old 07/08 became 08/15.
- 2026-10-12: Use `@dnd-kit/core` and `@dnd-kit/sortable` for reordering, because they cover touch, keyboard and screen reader support that native HTML5 DnD doesn't.
- 2026-10-12: Vitest for the pure logic in `src/lib`.
- 2026-10-12: Installed @dnd-kit/core 6.3.1, @dnd-kit/sortable 10.0.0 and @dnd-kit/utilities 3.2.2 (CSS transform helper). Sensors are Mouse (4px) + Touch (150ms delay) + Keyboard, not Pointer + Touch, because dnd-kit's docs warn the Pointer and Touch sensors conflict.
- 2026-10-12: Drag transforms go through CSS custom properties (`--drag-transform`, `--drag-transition`) to keep the no-inline-styles rule.
- 2026-10-12: Installed idb-keyval 6.3.0 (tiny IndexedDB wrapper; `setMany` gives atomic multi-key writes), music-metadata 12.1.1 (ID3/MP4/FLAC/Ogg tags + cover art, browser build via `parseBlob`; parsers are lazy chunks), and fake-indexeddb 6.2.5 (dev, tests only). One store with key prefixes instead of separate stores, because idb-keyval's `createStore` is one store per database.
- 2026-10-12: The import decode check uses the browser's own decoder (`Audio` loadedmetadata on an object URL), so a file is only accepted if this browser can play it.
- 2026-10-12: Stay on JavaScript. A TypeScript migration is out of scope.

## Inputs Needed From User

| Input | Where | Why | Unblocks |
|-------|-------|-----|----------|
| Free-licensed demo tracks (5–8, CC0 or CC-BY) with their licence links | `public/songs/` + `CREDITS.md` | The commercial mp3s can't be published | Unit 07 last criterion, Unit 15 deploy |
| 5 songs with known BPM (for the accuracy table) | any local files | Proves the tempo detection on real music | Unit 10 real-song criterion. **Partly provided 2026-10-12:** the owner's test files are in `D:\DAD songs` (outside the repo; never commit them). Payphone and Beggin' are usable references if they're the original versions (published ~110 and ~134 BPM; confirm by tap test). The three "sped up" files have unknown tempos: use them for import and half/double stress tests only. Owner added 3 more on 2026-10-12: `Jennie (Studio Killers).MP3`, `Manic In Disguise.MP3` and `one more night.MP3` (in `C:\Users\gurki\OneDrive\Desktop\THIS DESKTOP\iphone vlc songs`). Their BPMs need confirming by tap test before they count as references. |
| Test files for import | `D:\DAD songs` (5 mp3s) | Unit 07 import, dedupe and refresh tests | provided 2026-10-12 |

## Session Notes
- 2026-10-12: Specs rewritten for bring-your-own-music + Auto-DJ (overview, architecture, security, design, code standards, 9 feature specs, prompts 1C–2C).
- 2026-10-12: Context folder, feature specs and build prompts created. The earlier `SPEC.md` issue list was folded into `featureSpecs/01-foundation-fixes.md`.
