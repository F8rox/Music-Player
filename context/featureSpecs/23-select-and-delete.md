Read the 'AGENTS.md' before starting

# Unit 23: Select Several Songs And Delete Them

## Goal
On All Songs, select many songs and delete them from the library in one confirmed action.

## Depends On
07, 08.

## Build
- A "Select" button in the All Songs header turns on select mode: each row gets a checkbox, clicking a row toggles it (it does not play), the ⋯ menus are hidden. The header shows the count, "Select all" / "Select none", "Delete" and "Done".
- "Delete" opens the existing confirm dialog ("Delete N songs?"). Confirming removes every selected song from the library, the queue and the playlists, then leaves select mode.
- `removeFromLibrary` takes a list of ids; the single-song ⋯ menu passes a list of one.

## Not In This Unit
Shift-click ranges, selecting on the playlist page or in Up next, undo.

## Acceptance Criteria
- [ ] Tests: removing several songs from the queue, including the playing one and the one after it, leaves the next remaining song current; none left stops playback.
- [ ] Select 3 songs, delete: they are gone from the list, the queue and playlists; others are untouched; the count in the title updates.
- [ ] Cancel in the dialog and "Done" delete nothing. Select all then delete empties the library.
- [ ] Every control is reachable and operable by keyboard; checkboxes have labels naming the song.
