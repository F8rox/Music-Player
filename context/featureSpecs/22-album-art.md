Read the 'AGENTS.md' before starting

# Unit 22: Album Art

## Goal
Show each song's cover art in the song rows, Up next, the Now Playing hero and the player bar. Art comes only from the song's own file (stored at import, Unit 07). A song without art gets a generated tile. No network.

## Depends On
07.

## Build
- `getCover(id)` in `src/library/db.js`: the stored cover as a Blob, or null when missing, not a Blob, not JPEG/PNG/WebP, or over 2 MB (IndexedDB is untrusted).
- `useCoverUrl`: one reference-counted object URL per song, revoked when nobody shows it.
- `Cover` component: loads the image only when it scrolls into view; otherwise an energy-coloured tile with the title's first letter (`aria-hidden`; the title is already text beside it).

## Not In This Unit
Fetching art from the internet, picking an image by hand, resizing covers, album pages.

## Acceptance Criteria
- [ ] Tests: `getCover` returns a valid cover, and null for missing, wrong type, oversize and non-Blob values; deleting a song deletes its cover.
- [ ] A song with a stored cover shows it in its row, in Up next, in the hero and in the player bar; a song without one shows the tile.
- [ ] Rows below the fold create no object URL until scrolled to; every URL created is revoked.
