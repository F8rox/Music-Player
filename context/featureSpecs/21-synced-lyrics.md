Read the 'AGENTS.md' before starting

# Unit 21: Synced Lyrics (local .lrc only)

## Goal
Show lyrics that highlight in time, and let the user click a line to seek; read from `.lrc` files imported next to songs. No network (LRCLIB is excluded by the no-network rule).

## Depends On
07, 09.

## Build
- Pure LRC parser with tests; `.lrc` files are accepted in import and matched by filename; a lyrics panel with the active line highlighted.

## Acceptance Criteria
- [ ] Parser tests (multiple timestamps per line, offsets, malformed lines).
- [ ] The active line follows playback; clicking a line seeks.
