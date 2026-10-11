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
| 04 Queue | Not started | |
| 05 Queue reorder | Not started | |
| 06 Shuffle and repeat | Not started | |
| 07 Playlists | Not started | |
| 08 Responsive, a11y, release audit | Not started | |

## In Progress
None.

## Next Up
Prompt 1A is done. Run Helper B (audit), then Prompt 1B (Units 04–06).

Dev server: `npm run dev -- --port 5199 --host 127.0.0.1`. Port 5173 is used by another local project.

## Open Questions
1. **mp3s in git:** the bundled songs are commercial recordings, so they're gitignored by default and a fresh clone has no audio. Should they be committed instead, given the repo stays private? Owner to decide.
2. **Deploy host:** not chosen yet. A CSP header gets set there (`security-context.md`).
3. **Song metadata:** song 5's artist is fixed from "Ariana Granede" to "Ariana Grande". The others are kept as they are.

## Architecture Decisions
- 2026-10-12: Copy the YT Music UX only. No YouTube or YT Music API (the owner's choice).
- 2026-10-12: Persist to localStorage (`musicPlayer:v1`). No backend or accounts (the owner's choice).
- 2026-10-12: Library is `public/songs` only. No runtime uploads (the owner's choice).
- 2026-10-12: Use `@dnd-kit/core` and `@dnd-kit/sortable` for reordering, because they cover touch, keyboard and screen reader support that native HTML5 DnD doesn't.
- 2026-10-12: Vitest for the pure logic in `src/lib`.
- 2026-10-12: Stay on JavaScript. A TypeScript migration is out of scope.

## Inputs Needed From User

| Input | Where | Why | Unblocks |
|-------|-------|-----|----------|
| none | | | |

## Session Notes
- 2026-10-12: Context folder, feature specs and build prompts created. The earlier `SPEC.md` issue list was folded into `featureSpecs/01-foundation-fixes.md`.
