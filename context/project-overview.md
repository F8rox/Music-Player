# Project Overview

Read `AGENTS.md` before starting.

## Overview

A private, local music player for the browser that plays **your own music** and mixes it like a DJ. People add songs from their computer, and the app keeps them in the browser (IndexedDB). It never uploads them anywhere. A small set of free-licensed demo tracks ships with the app so a first-time visitor can try it right away.

Its playback model copies YouTube Music: an ongoing "Up next" queue you can reorder by dragging, with play next, add to queue, shuffle and repeat. On top of that sits the **Auto-DJ**:
- **Analysis:** every song is analysed once, in the browser, when it's added. This finds its energy, where its quiet intro and outro are, and an approximate tempo (BPM).
- **Arrange my queue:** sorts Up next into a build-up, a peak and a cool-down. It can be undone, and the queue stays draggable afterwards.
- **Smart crossfade:** the next song starts where the current one's outro begins, its quiet intro is skipped, and the two blend with a smooth fade.
- **Live visualiser:** the player bar pulses to the actual audio, coloured by the track's energy.
- **Beat-matching (experimental):** only switches on when both songs' tempo readings are confident and close. Otherwise the smart crossfade is used.

The differentiator: this runs locally and privately on your own files, with no account and no server. Streaming services don't mix your own library like this.

There is one user (the person at the browser). There are no accounts and no server.

## Goals

1. People can add their own songs, and those songs survive a refresh and a browser restart.
2. Every song plays reliably, and the UI always matches what's actually playing.
3. The queue works the way YT Music's does: play next, add to queue, drag to reorder, remove, shuffle and repeat.
4. Transitions between songs sound smooth, with no silence gap and no audible glitch.
5. "Arrange my queue" produces a recognisable build-up, peak and cool-down on a library of 20 or more songs.
6. The app never sounds worse because a measurement was wrong. A low-confidence tempo falls back to a plain crossfade.

## Phases

| Phase | Units | Outcome |
|-------|-------|---------|
| 1A ✅ | 01 Foundation fixes, 02 Tokens and app shell, 03 Real durations | Working base with the YT Music layout |
| 1B ✅ | 04 Queue, 05 Queue reorder, 06 Shuffle and repeat | The Up next queue |
| 1C | 07 Your own library, 08 Playlists | Users add their own songs and organise them |
| 2A | 09 Audio engine, 10 Track analysis, 11 Visualiser | Web Audio playback, analysis data, and the first visible wow |
| 2B | 12 Arrange my queue, 13 Smart crossfade | The Auto-DJ |
| 2C | 14 Beat-matching (experimental), 15 Responsive, accessibility and release | Optional beat-matching, a polished release, and GitHub Pages |

Phase 3 (not prompted): Media Session hardware keys, keyboard shortcuts, playlist import and export, musical key detection.

## Core Behaviour (YT Music model)

- **Playing from a list:** clicking a song in All Songs or in a playlist replaces the queue with that list, in its displayed order, and starts at the clicked song. With shuffle on, the clicked song plays first and the rest of the list is shuffled behind it.
- **Play next:** inserts the song directly after the current item. **Add to queue:** appends it to the end. The same song may appear in the queue more than once.
- **Up next panel:** items can be dragged, moved with the keyboard, or removed. The current item can't be removed. It can be moved, and playback continues uninterrupted.
- **Next:** goes to the following item. At the end of the queue it wraps if repeat is "all" or "one"; with repeat "off" playback stops.
- **Previous:** restarts the current track if more than 3 seconds have played. Otherwise it goes to the previous item.
- **Track ends:** with repeat "one" the same track replays. Otherwise this behaves like Next.
- **Shuffle on:** the current item stays where it is and every item after it is shuffled. **Shuffle off:** the items after the current one return to their original order. Items added while shuffled are kept.
- **Persistence:** the queue, current item, position, shuffle, repeat, volume, playlists, imported songs and their analysis all survive a refresh. Playback never starts on its own after a reload.

## Auto-DJ Behaviour

- **Analysis:** runs once per song, when it's added (bundled songs on first launch). It processes one song at a time with visible progress, and the results are cached. A song can play before its analysis finishes; until then it uses a plain transition.
- **Energy:** the loudness and density of a song, ranked against the rest of the user's library (a percentile, not an absolute number), because mastering loudness varies widely.
- **Tempo:** shown as approximate ("~124 BPM"). The user can halve, double or tap it to correct it, and a corrected value is kept.
- **Arrange my queue:** reorders only the items after the current one. Energy rises to a peak about 65–75% of the way through, then falls; neighbouring songs avoid big tempo jumps. One "Undo arrange" is offered until the queue next changes. With fewer than 4 items after the current one, it does nothing and says why.
- **Smart crossfade:** an on/off setting (default on) with a fade length of 2–12 s (default 6 s). The next song starts at the current song's outro, skipping the next song's quiet intro. It doesn't crossfade on repeat "one", when the queue has stopped, or when the user presses Next or Previous; those cut immediately.
- **Interrupting a fade:** any queue change, skip, seek or pause during a fade cancels it cleanly. The incoming song becomes current and the outgoing one stops.
- **Beat-matching (experimental, off by default):** used only when both tempos are high-confidence and within ±4% after correcting half/double readings. The incoming song is rate-matched (which shifts its pitch slightly, like DJ vinyl) and phase-aligned on the beat. In every other case the smart crossfade is used.
- **Visualiser:** frequency bars in the player bar, coloured from cool to warm by the track's energy. It's static when `prefers-reduced-motion` is set and paused while the tab is hidden.

## User Flows

### First Run
1. Open the app. The free-licensed demo tracks are listed, and a prominent "Add your music" button shows a drop zone.
2. Drag in a folder's files, or pick files. Each song appears immediately with its title and artist from its tags (or its filename), then shows an analysis progress indicator that turns into an energy dot and "~BPM" when done.

### Listen Flow
1. Click a song. It plays, and the queue becomes that list starting at the clicked song.
2. Use the player bar: play/pause, previous, next, seek, volume, shuffle, repeat, Up next, and the visualiser behind the track info.
3. Open Up next. Drag songs, remove them, Play next, Add to queue.
4. Press "Arrange my queue". The upcoming songs reorder into an energy arc. Drag any of them afterwards, or Undo.
5. Let a song end. The next one blends in at the outro with no silence gap.

### Library Management
1. Remove an imported song (with confirmation). It's deleted from storage, the queue and every playlist; if it's playing, playback moves to the next item.
2. Correct a song's tempo with halve, double or tap.
3. See the storage used and available.

### Playlist Flow
1. Go to Playlists. Create a playlist (name 1–60 characters, trimmed).
2. Open it. Add songs with a filter box, remove songs, drag to reorder.
3. Rename or delete it (delete asks for confirmation).
4. Click Play, or a song in it. The queue becomes the playlist.

## Scope

### In Scope
- Everything already built (Units 01–06)
- Importing local audio files (picker and drag-and-drop; on Chromium, optionally a folder), stored in IndexedDB, with tag and cover-art reading
- Removing imported songs, and showing storage use; requesting persistent storage
- Free-licensed (CC0/CC-BY) demo tracks with credits, replacing the commercial mp3s
- Playlists in localStorage
- The Web Audio playback engine, the analysis, Arrange my queue, smart crossfade, the visualiser and experimental beat-matching
- Responsive layout down to 360px, keyboard and screen reader access
- Deploying the static build to GitHub Pages

### Out Of Scope
- YouTube, YouTube Music, Spotify or any streaming API or embed
- A backend, accounts, login, uploads to any server, or sync between devices
- Any network request except same-origin app files and bundled demo tracks
- Lyrics, fetching album art from the internet, radio and recommendations, likes and ratings
- Equalizer, playback speed control, pitch-preserving time-stretch, musical key detection
- Downloads, an offline/PWA install, desktop or mobile app packaging
- Sharing playlists, playlist import and export (Phase 3)
- Mixing more than two songs at once, loops, cue points or manual DJ controls

## Success Criteria
- A user can import 50 of their own mp3s, refresh, and still play all of them.
- Arrange my queue on 20+ analysed songs produces an energy arc, verified by the energy values in order.
- A transition between two analysed songs has no silence gap, and a skip mid-fade never leaves two songs playing.
- A song whose tempo is wrongly detected never gets beat-matched badly: it falls back to the plain crossfade.
- Corrupt saved data or a corrupt audio file never crashes the app.
- `npm run lint`, `npm test` and `npm run build` pass on a clean checkout, and the GitHub Pages build plays the demo tracks.
