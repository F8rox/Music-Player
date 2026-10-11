Read the 'AGENTS.md' before starting

# Unit 02: Design Tokens And App Shell

## Goal

The app uses the token system and the YT Music layout from `design.md`: navbar, main content, a fixed bottom player bar, and an (empty) Up next panel that can be toggled.

## Depends On

01.

## Build

- `:root` token block in `src/index.css` exactly as listed in `design.md`. Replace every hardcoded color in the file with tokens. Delete the unused tutorial styles (old `.playlist*`, `.modal*`, `.song-option`, `.app-header`, gradient animation).
- Rename `MusicPlayer` to `PlayerBar`, fixed at the bottom, 72px tall, laid out as in `design.md`. The main area gets matching bottom padding.
- Rename `AllSongs` to `pages/AllSongs.jsx`, rendering a vertical list of `SongRow` (no grid of cards). Each row shows its index or ♪ when it's the current song, title, artist, and an empty duration slot. The ⋯ menu is NOT built yet.
- Add `QueuePanel` as an empty shell with the heading "Up next" and the empty state "Nothing queued". Add a player bar toggle (`aria-expanded`) that opens it as a side panel at 1024px and wider, and as a drawer over `--overlay` below that. Esc and the backdrop close the drawer.
- Focus ring style using `--focus`, and `prefers-reduced-motion` handling.

## Not In This Unit

Queue contents, the song menu, shuffle and repeat buttons, durations and playlists. Leave no disabled placeholder buttons for future features.

## Acceptance Criteria

- [ ] `grep -nE "#[0-9a-fA-F]{3,8}|rgba?\(" src` matches only lines inside the `:root` block.
- [ ] The player bar stays visible while the song list scrolls, and the last song row is fully visible above it.
- [ ] Up next opens as a side panel at 1280px and as a drawer at 375px. Esc closes the drawer and focus returns to the toggle.
- [ ] Every interactive element shows a visible focus ring when tabbing.
- [ ] Contrast of `--text-muted` on `--surface` is 4.5:1 or more (state the computed ratio).
- [ ] Negative: with `prefers-reduced-motion: reduce` emulated, the drawer opens without a transform transition.
- [ ] Unit 01 criteria still pass (play all 5 songs, next/prev wrap).

## Verify

Run lint, tests and build. Walk the app at 1280px and 375px with the browser's resize tool, and tab through the page.
