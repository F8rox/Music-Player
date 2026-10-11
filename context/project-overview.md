# Project Overview

Read `AGENTS.md` before starting.

## Overview

A local music player for the browser that plays the bundled mp3s in `public/songs/`. Its playback model copies YouTube Music: there is always an ongoing queue ("Up next") that the listener can reorder by dragging, add to, and remove from, with shuffle and repeat modes. Playlists are saved in the browser and can be played, which loads them into the queue.

There is one user (the person at the browser). There are no accounts and no server.

## Goals

1. Every bundled song plays reliably, and the UI always matches what is actually playing.
2. The listener controls what plays next the way YT Music allows: play next, add to queue, drag to reorder, remove.
3. Shuffle and repeat behave like YT Music (see Core Behaviour).
4. Playlists can be created, edited, reordered and played, and survive a page refresh.
5. Song durations shown in the UI are read from the audio files, not typed by hand.

## Phases

| Phase | Units | Outcome |
|-------|-------|---------|
| 1A | 01 Foundation fixes, 02 Tokens and app shell, 03 Real durations | The existing app works, is lint-clean and has a YT Music-style layout |
| 1B | 04 Queue, 05 Queue reorder, 06 Shuffle and repeat | The ongoing queue with drag-to-reorder, shuffle and repeat |
| 1C | 07 Playlists, 08 Responsive, accessibility and release audit | Saved playlists, mobile layout and a final audit |

Phase 2 (not prompted, out of scope until Phase 1 is done): Media Session hardware keys, keyboard shortcuts, playlist import and export.

## Core Behaviour (YT Music model)

- **Playing from a list:** clicking a song in All Songs or in a playlist replaces the queue with that list, in its displayed order, and starts at the clicked song. If shuffle is on, the rest of the list is shuffled behind the clicked song.
- **Play next:** inserts the song directly after the current item. **Add to queue:** appends it to the end. The same song may appear in the queue more than once.
- **Up next panel:** shows the whole queue with the current item highlighted. Items can be dragged to a new position, moved with the keyboard, or removed. The current item can't be removed. It can be moved, and playback carries on uninterrupted.
- **Next:** goes to the following item. At the end of the queue it wraps to the start if repeat is "all". Otherwise playback stops on the last item.
- **Previous:** restarts the current track if more than 3 seconds have played. Otherwise it goes to the previous item, or restarts the track when already at the first one.
- **Track ends:** with repeat "one", the same track replays. Otherwise this behaves like Next.
- **Repeat** cycles off → all → one → off. **Next** with repeat "one" still skips to the following item, as YT Music does.
- **Shuffle on:** the current item stays where it is and every item after it is shuffled randomly. **Shuffle off:** the items after the current one go back to their original relative order. Items added while shuffled are kept.
- **Editing a playlist doesn't change the ongoing queue.** The queue is a snapshot taken when the playlist was played.
- **Persistence:** the queue, the current item, playback position (to the nearest second), shuffle, repeat, volume and all playlists survive a refresh. After a refresh the app never starts playing on its own.

## User Flows

### Listen Flow
1. Open the app. All Songs lists every bundled song with its title, artist and real duration.
2. Click a song. It plays, and the queue becomes All Songs starting at that song.
3. Use the player bar: play/pause, previous, next, seek, volume, shuffle, repeat.
4. Open Up next. Drag a song to a new position, remove one, and watch playback continue.
5. From any song row's menu, choose "Play next" or "Add to queue".

### Playlist Flow
1. Go to Playlists. Create a playlist with a name (1 to 60 characters, trimmed).
2. Open it. Add songs from the library using a filter box. Remove songs, and drag songs to reorder them.
3. Rename or delete the playlist. Deleting asks for confirmation first.
4. Click Play, or click a song in the playlist. The queue becomes the playlist.

## Features

### Library
The static list of bundled songs in `src/data/songs.js` (id, title, artist, file). Durations are probed from the audio files.

### Player Bar
Current title and artist, seek bar with elapsed and total time, play/pause, previous, next, shuffle, repeat (showing its mode), volume, and an Up next toggle.

### Queue (Up next)
The ongoing queue, with drag-to-reorder, keyboard reorder and remove. Play next and Add to queue are in song row menus.

### Playlists
Create, rename, delete, add and remove songs, reorder, and play. Saved in localStorage.

## Scope

### In Scope
- Fixing every issue listed in Unit 01
- The YT Music-style layout: a fixed bottom player bar and an Up next side panel (a drawer on small screens)
- Queue, drag reorder (mouse, touch and keyboard), shuffle, repeat
- Playlists saved in localStorage
- Durations read from the files
- Responsive layout down to 360px wide, and keyboard and screen reader access

### Out Of Scope
- YouTube, YouTube Music or any streaming API or embed, and any network fetch apart from same-origin song files
- A backend, accounts, login or cross-device sync
- Uploading or importing audio files at runtime
- Search across anything other than the local library (the playlist add-song filter is in scope)
- Lyrics, album art fetching, radio and recommendations, likes and ratings
- Equalizer, crossfade, gapless playback, playback speed
- Downloads, offline/PWA, desktop or mobile app packaging
- Sharing playlists, or playlist import and export (Phase 2)

### Later Phases (not built in Phase 1)
Media Session API, keyboard shortcuts, playlist import and export.

## Success Criteria
- All 5 bundled songs play from All Songs, from a playlist and from the queue.
- Dragging a queue item never interrupts or changes the playing track, and Next then follows the new order.
- Shuffle on, then off, returns the queue to its original order (apart from songs added in between).
- Repeat one replays the track, repeat all wraps, and repeat off stops at the end.
- Playlists and the queue survive a refresh. Corrupt saved data loads defaults instead of crashing.
- `npm run lint`, `npm test` and `npm run build` pass on a clean checkout.
