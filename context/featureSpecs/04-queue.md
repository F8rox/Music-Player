Read the 'AGENTS.md' before starting

# Unit 04: Queue (Up next)

## Goal

An ongoing queue that follows the YT Music rules in `project-overview.md` Core Behaviour: playing from a list, play next, add to queue, remove, next/previous/ended. It's shown in the Up next panel and survives a refresh.

## Depends On

01, 02, 03.

## Build

- `src/lib/queue.js` (pure, no React): `fromList(songIds, startIndex)`, `current(queue)`, `next(queue, repeat)`, `prev(queue)`, `insertNext(queue, songId)`, `append(queue, songId)`, `remove(queue, qid)`. Items are `{ qid, songId, order }`. qids come from `crypto.randomUUID()`, and the id function is injectable for tests. `next` returns `{ queue, stopped }` at the end with repeat "off".
- `src/lib/storage.js`: `load()` and `save(state)` for the `musicPlayer:v1` key, with per-field validation as in `architecture-context.md`. In this unit it persists `queue`, `volume` and `position`. Save is debounced, and a failure raises a Notice once.
- Provider actions: `playFromList`, `playNext`, `addToQueue`, `removeFromQueue`, `next`, `prev`, `playQid`. Previous restarts the track when more than 3 seconds have played.
- The song row ⋯ menu (`SongMenu`) has "Play next" and "Add to queue", and they work from the keyboard. A Notice reads "Added to queue" or "Playing next".
- `QueuePanel` lists the queue items, using SongRow in a compact style. The current item is highlighted. Clicking an item plays it. Every non-current item has a remove button (`aria-label` "Remove <title> from queue").
- On load, restore the queue, current item and position paused (never autoplay).

## Not In This Unit

Drag reorder, shuffle, repeat buttons (`next` takes `repeat` but the UI passes "all" until Unit 06, which matches today's wrap behaviour), and playlists.

## Acceptance Criteria

- [ ] `queue.test.js` covers every exported function, plus an empty queue, a single item, the last item with each repeat mode, duplicate songs, and removal before and after the current item.
- [ ] `storage.test.js`: valid round trip, plus a negative test for each of: non-JSON, wrong types, unknown song ids, out-of-range volume, `__proto__` key, and a missing key. Each loads defaults for that field, and none throws.
- [ ] Clicking song 3 in All Songs makes the queue the list 1–5 in its displayed order, with the current item at song 3 (YT Music keeps the list order and doesn't rotate it). Up next shows all 5 with song 3 highlighted.
- [ ] "Play next" on song 5 while song 1 plays: Up next shows 5 directly after 1, and Next plays 5.
- [ ] "Add to queue" for a song already in the queue adds a second entry, and both play in turn.
- [ ] Removing a non-current item doesn't interrupt playback.
- [ ] Refresh: the queue, current item and position (±1s) are restored, and nothing plays until ▶ is pressed.
- [ ] Negative: put `{"queue":"junk"}` into `localStorage["musicPlayer:v1"]` and reload. The app loads with an empty queue and no error.

## Verify

`npm test`, lint and build. Walk each UI criterion in the dev app, using the console to set localStorage for the negative case.
