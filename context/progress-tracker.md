# Progress Tracker

## Current State (baseline, 2026-10-12)

The app is a Vite + React tutorial-stage player. Checked on 2026-10-12:

- `npm run build`: passes.
- `npm run lint`: **fails, 4 errors**. These are unused `useMusic` imports in AllSongs and MusicPlayer, unreachable code in AllSongs, and an unused `setAllSongs`.
- `npm test`: no test script exists.
- Playback: only song 1 has a URL. Songs 2 to 5 have `url: ""`.
- Playlists page is a stub. `src/index.css` already holds unused playlist and modal styles from a tutorial, which Unit 02 replaces.
- Git: initialised, nothing committed yet.

## Units

| Unit | Status | Evidence |
|------|--------|----------|
| 01 Foundation fixes | Not started | |
| 02 Tokens and app shell | Not started | |
| 03 Real durations | Not started | |
| 04 Queue | Not started | |
| 05 Queue reorder | Not started | |
| 06 Shuffle and repeat | Not started | |
| 07 Playlists | Not started | |
| 08 Responsive, a11y, release audit | Not started | |

## In Progress
None.

## Next Up
Prompt 1A (Units 01, 02, 03) in `build-prompts.md`.

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
