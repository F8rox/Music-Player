Read the 'AGENTS.md' before starting

# Unit 07: Your Own Library

## Goal

People add their own songs from their computer. The songs are stored in the browser (IndexedDB), survive refreshes and restarts, and play exactly like the bundled demo tracks. The commercial mp3s are replaced by free-licensed demo tracks.

## Depends On

01–06.

## Build

- Add `idb-keyval` (or use the raw IndexedDB API if it stays under about 60 lines) and `music-metadata` (browser build). Record both in Architecture Decisions.
- `src/library/db.js`: the only IndexedDB module. It stores `songs`, `blobs` and `analysis` as in `architecture-context.md`. Every record read is validated (Invariant 5); invalid records are dropped with one notice.
- `src/library/importFiles.js`: for each `File`:
  1. Check the type and extension, and the 100 MB limit.
  2. Compute the SHA-256 (`crypto.subtle`). If that id already exists, skip it ("Already in your library").
  3. Read tags with `music-metadata`, and sanitise them with `src/lib/tags.js` (trim, strip control characters, 200 characters max). Fall back to the file name for the title and "Unknown artist".
  4. Accept cover art only if it's JPEG, PNG or WebP under 2 MB.
  5. Check `estimate()` before writing. Each song is stored atomically: blob, cover and record all go in or none do.
  6. Process files one at a time, with progress.
- On the first import, call `navigator.storage.persist()`.
- `useLibrary` hook: on startup it loads the library from IndexedDB, **then** the provider parses localStorage against bundled + imported ids (load order in the architecture doc). Show a loading state; nothing plays until it's ready.
- Playback of imported songs uses object URLs created when a song is loaded into the player, and revoked when it's unloaded (Invariant 9).
- UI from `design.md`: the "Add your music" button, the page drop zone, the "Add a folder" option on Chromium (`showDirectoryPicker`, reading audio files recursively), the import progress panel, and "Remove from library" in the song menu with confirmation. Removing a song deletes it from IndexedDB, the queue and every playlist; if it's playing, playback moves to the next item.
- Replace the 5 commercial mp3s with 5–8 CC0 or CC-BY demo tracks (an owner input: see the tracker). Add `public/songs/CREDITS.md`, remove the `public/songs/*.mp3` line from `.gitignore`, and commit the demo tracks. Until the owner supplies them, keep the current files locally and mark the criterion "blocked on input".
- The All Songs list shows bundled and imported songs together. Imported songs get a small "Yours" tag.

## Not In This Unit

Analysis, energy dots, BPM (Unit 10), playlists (Unit 08), editing tags, and export.

## Acceptance Criteria

- [ ] `tags.test.js`: trimming, control-character stripping, 200-character cap, filename fallback.
- [ ] `library.test.js` (with `fake-indexeddb` as a dev dependency, or the DB layer mocked): store, list, delete, a duplicate hash is skipped, and an invalid record is dropped on load.
- [ ] Import 10 mp3s by drag-and-drop, and 3 more with the file picker. All appear with their tag titles and artists and play. Refresh, then close and reopen the browser: all 13 are still there and play.
- [ ] Importing the same file again shows "Already in your library" and doesn't add a second copy.
- [ ] Remove an imported song that's in the queue and in a playlist: it disappears from both, and if it was playing, the next item plays.
- [ ] A song with a `<script>` tag in its title shows as literal text.
- [ ] Negative: a `.txt` file renamed to `.mp3` shows "Can't play this file", the rest of the batch imports, and nothing crashes. A file over 100 MB is refused with a message.
- [ ] Negative: corrupt a record in IndexedDB (devtools). The app loads, drops the record, and shows one notice.
- [ ] No object URL is left unrevoked after switching songs 10 times (count calls with a temporary wrapper, then remove it).
- [ ] The demo tracks are free-licensed, credited in `CREDITS.md`, and committed; no commercial mp3 is in git history going forward. (Blocked on input until the owner provides the tracks.)

## Verify

Lint, tests, build and audit. Walk the import, refresh, restart and remove flows in Chromium and Firefox, and record the results.
