Read the 'AGENTS.md' before starting

# Unit 08: Playlists

## Goal

The listener can create, rename, delete, fill, reorder and play playlists saved in localStorage, following `project-overview.md` Playlist Flow.

## Depends On

04, 05, 06, 07 (playlists hold both bundled and imported song ids).

## Build

- `src/lib/playlists.js` (pure): `create(list, name, id, now)`, `rename`, `remove`, `addSong` (returns `{ list, added: false }` on a duplicate), `removeSong`, `moveSong`. `validateName` trims and requires 1–60 characters.
- Persist `playlists` with validation: drop entries that aren't arrays or have bad ids or names, and drop unknown song ids.
- Routes `/playlists` (list plus a create form) and `/playlists/:id` (detail). An unknown id shows "Playlist not found" with a link back.
- Detail page: name (inline rename), song count, total duration (from probed durations, ignoring unavailable ones), a Play button, a filter box plus results to add songs, and the songs in `SortableList` (reused) with remove buttons. Clicking a song or Play calls `playFromList(playlist.songIds, index)`.
- Delete uses the native `<dialog>` confirm.
- SongMenu gains "Add to playlist ▸" with a submenu of playlists. A duplicate shows the Notice "Already in <name>".
- Empty states as in `design.md`.
- When an imported song is deleted from the library (Unit 07), it's also removed from every playlist.

## Not In This Unit

Import and export, sharing, cover images, playlist folders, and auto playlists.

## Acceptance Criteria

- [ ] `playlists.test.js` covers every function, plus name validation (empty, spaces only, 61 characters, exactly 60 characters), duplicate add, and moving the first and last items.
- [ ] Create "Gym", add 3 songs, drag the third to the top, refresh: the playlist and its order persist.
- [ ] A playlist can mix bundled and imported songs, and it plays both.
- [ ] Play the playlist, then remove a song from the playlist. The ongoing queue is unchanged (Invariant 4).
- [ ] Rename to an empty name is rejected with an inline message, and the old name is kept.
- [ ] Delete asks for confirmation. Cancel keeps it, Confirm removes it and leaves the page for `/playlists`.
- [ ] A name containing `<img src=x onerror=alert(1)>` renders as literal text.
- [ ] Negative: `/playlists/does-not-exist` shows "Playlist not found". Storage with a playlist whose `songIds` contains `"999"` loads it without that id.

## Verify

Lint, tests and build. Walk every UI criterion in the app, and set storage through the console for the negative cases.
