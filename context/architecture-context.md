# Architecture Context

## Stack

| Concern | Choice | Note |
|---------|--------|------|
| Build | Vite 7 | already in use |
| UI | React 19, JavaScript (JSX) | no TypeScript migration, which would be out of scope |
| Routing | `react-router` 7 | `react-router-dom` gets removed (unused duplicate) |
| Drag and drop | `@dnd-kit/core` and `@dnd-kit/sortable` | added in Unit 05: gives mouse, touch, keyboard and screen reader announcements. Native HTML5 DnD doesn't work on touch and has no keyboard support |
| Tests | Vitest | added in Unit 01, for the pure logic in `src/lib/` |
| Lint | ESLint 9 (existing config) | |
| Storage | `localStorage` | a single versioned key |
| Audio | one `HTMLAudioElement` | owned by the player bar |

No backend, no environment variables, no network calls except same-origin `/songs/*.mp3`.

## System Boundaries

```
src/data/songs.js        static library (source of truth for what can play)
src/lib/*.js             pure functions: queue, playlists, storage parse/serialise, time format
src/state/MusicProvider  React context: holds state, persists it, exposes actions
src/components/*         render state and call actions; no queue/playlist rules here
<audio> in PlayerBar     the only audio element; syncs to state.current item
```

Components never mutate state shapes directly. Every change goes through a `src/lib` function called from a provider action.

## State Model

```js
{
  queue: {
    items: [{ qid, songId, order }], // qid: unique per queue entry; order: position before shuffle
    currentQid: string | null,
    shuffled: boolean,          // lives on the queue so every queue op knows whether to freeze `order`
  },
  repeat: "off" | "all" | "one",
  volume: number,          // 0..1
  position: number,        // seconds into current item, saved rounded
  playlists: [{ id, name, songIds: string[], createdAt }],
}
```

Not persisted: `isPlaying` (always false after load), `currentTime` at sub-second precision, and `durations` (a `{ songId: seconds | null }` map filled by probing).

- The current item is found by `currentQid`, never by index. Reordering keeps the current item because its qid doesn't change.
- While unshuffled, `order` mirrors position (renumbered after every change). While shuffled, existing orders are frozen and new items get `order = max + 1`. Shuffle off sorts the items after the current one by `order`.
- Playlist `songIds` must exist in the library. Unknown ids are dropped when loading.
- Playlist songs are unique within a playlist. Adding a duplicate is a no-op with a visible message.

## Storage Model

- Key `musicPlayer:v1` holds the persisted subset as JSON.
- Writes are debounced (about 300 ms) and wrapped in try/catch. A quota or privacy-mode failure shows a single non-blocking notice and the app carries on in memory.
- Loading: parse, validate every field by type and range, drop unknown song ids and unknown fields. If it's invalid, use defaults for that field (not the whole state). A bump to `v2` gets a migration function, and old keys aren't silently reused.

## Durations

At startup each song's metadata is probed with `new Audio()` and `preload = "metadata"`, one song at a time. `loadedmetadata` records `duration`, and `error` records `null` ("unavailable"). The player bar uses the live `audio.duration` of the current track. Hardcoded durations are removed.

## Invariants

1. Exactly one `<audio>` element exists.
2. The title, artist, highlighted row and audio source always refer to the item whose qid is `currentQid`.
3. Reordering, adding or removing non-current queue items never restarts or changes the playing audio.
4. Editing a playlist never changes the queue.
5. Nothing loaded from storage reaches render or audio without validation. Song URLs come only from `src/data/songs.js`, never from storage.
6. After a reload, playback doesn't start until the user acts.
7. `audio.play()` rejections are caught, and they set `isPlaying` to false.
8. Queue, shuffle, repeat and playlist rules are pure functions in `src/lib/`, each with tests.
