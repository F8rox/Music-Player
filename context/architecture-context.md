# Architecture Context

## Stack

| Concern | Choice | Note |
|---------|--------|------|
| Build | Vite 7 | the dev port is pinned to 5199; IndexedDB is per origin, so a different port means an empty library |
| UI | React 19, JavaScript (JSX) | no TypeScript migration |
| Routing | `react-router` 7 | |
| Drag and drop | `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` | Mouse, Touch and Keyboard sensors (not Pointer + Touch, which conflict) |
| Tests | Vitest | pure logic in `src/lib/` and the DSP in `src/audio/analysis/` |
| Small state | `localStorage` key `musicPlayer:v1` | queue, settings, playlists |
| Large data | IndexedDB, via `idb-keyval` (about 600 B) or the raw API | imported audio blobs, cover art, metadata, analysis results |
| Tags | `music-metadata` (browser build) | title, artist, album, cover art; added in Unit 07 |
| BPM | `web-audio-beat-detector`, or own onset autocorrelation | chosen in Unit 10 by testing against known tracks |
| Audio | one `AudioContext`, two `<audio>` decks | Unit 09; until then, the single `<audio>` in PlayerBar |
| Hosting | GitHub Pages (static) | Unit 15; Vite `base` set for the repo path |

No backend and no environment variables. No network calls except same-origin app files.

## System Boundaries

```
src/data/songs.js           bundled demo tracks (free-licensed, with credits)
src/lib/*.js                pure rules: queue, playlists, arrange, storage parse, format
src/library/*.js            IndexedDB access: songs, blobs, analysis cache (the only IndexedDB users)
src/audio/engine.js         module singleton: AudioContext, two decks, master gain, analyser, fades
src/audio/analysis/*        decode on the main thread, DSP in a Web Worker, result objects
src/state/MusicProvider     React context: state, actions, persistence; talks to library + engine
src/components, src/pages   render state, call actions; no rules, no audio nodes
```

## State Model

```js
// localStorage (small, validated on load)
{
  queue: { items: [{ qid, songId, order }], currentQid, shuffled },
  repeat: "off" | "all" | "one",
  volume: number,              // 0..1
  position: number,            // seconds, rounded
  playlists: [{ id, name, songIds, createdAt }],
  settings: { crossfade: boolean, fadeSeconds: 2..12, beatMatch: boolean },
  arrangeUndo: null | items[], // one level, cleared on any other queue change
}

// IndexedDB (large)
songs:    { id: "u:<sha256>", title, artist, album, durationSec, addedAt, mime, size, hasCover }
blobs:    { id -> Blob }                  // audio; cover art under id + ":cover"
analysis: { id -> AnalysisResult }

AnalysisResult = {
  v: 2,                    // analysisVersion; an older one is re-analysed once (v1 is still read, so its bpmOverride carries over)
  rmsEnvelope: Uint8Array, // ~10 Hz, 0..255 dB-scaled
  loudness: number,        // mean RMS dB
  onsetDensity: number,
  introEnd: number,        // seconds where the smoothed RMS first rises above (median - 30 dB)
  outroStart: number,      // seconds after which it stays below that threshold
  bpm: number | null,      // folded into 80–160
  bpmConfidence: 0..1,
  beatOffset: number | null, // seconds to the first beat
  bpmOverride: number | null, // the user's correction wins
  keyTonic: 0..11 | null,  // 0 = C … 11 = B; null when nothing fitted (v1 records read as null)
  keyMode: "major" | "minor" | null,
  keyConfidence: 0..1      // Pearson correlation with the best Krumhansl profile; shown only at 0.5 or more
}
```

- **Song ids:** bundled demo songs keep short ids (`"1"`…). Imported songs use `"u:" + SHA-256 of the file`, so importing the same file twice is a no-op.
- **Library load order:** on startup the library is read from IndexedDB first, then localStorage is parsed against the full set of known song ids. Unknown ids (for example, a song deleted in another tab) are dropped.
- **Energy:** derived at use time as a percentile of `loudness` and `onsetDensity` across the analysed library. It isn't stored, so it stays correct as the library grows.
- **Queue rules** are unchanged from Units 04–06. While unshuffled, `order` mirrors position; while shuffled, orders are frozen and new items get `max + 1`.

## Audio Engine (Unit 09)

```
deckA: <audio> -> MediaElementSource -> gainA ┐
deckB: <audio> -> MediaElementSource -> gainB ┴-> masterGain -> analyser -> destination
(Unit 14 only) AudioBufferSourceNode -> gainA/gainB for sample-accurate beat-matched starts
```

- One module-level singleton, created on the first user gesture and resumed with `ctx.resume()`. `createMediaElementSource` can only be called once per element, so the decks are created once and are never tied to React mount and unmount (StrictMode mounts twice).
- The "current" deck alternates. Volume is `masterGain`; deck gains are only for fades.
- All fade timing uses the audio clock (`gain.setValueCurveAtTime` with an equal-power curve against `ctx.currentTime`), never `setTimeout` or `setInterval`.
- The engine knows nothing about the queue. The provider tells it what to play now and what's next. A transition starts at `outroStart - fadeSeconds` of the current song, not on `ended`.
- Cancelling a fade means: stop the outgoing deck, set the incoming deck's gain to 1, and cancel the scheduled values.

## Analysis Pipeline (Unit 10)

1. One song at a time, from a FIFO queue, with progress shown per song.
2. Decode on the main thread with an `OfflineAudioContext` at 11025 Hz mono (decoding isn't available in Workers). The full stereo PCM is never kept: about 92 MB for 4 minutes at 48 kHz stereo, versus about 10 MB at 11025 Hz mono.
3. Transfer the `Float32Array` to a Web Worker, which computes the RMS envelope, loudness, onset density, intro and outro points, BPM, confidence and beat offset.
4. Store the `AnalysisResult` and drop the PCM. Never decode a song again unless `v` changes.
5. Yield between songs so the UI stays responsive during a bulk import.

## Invariants

1. Before Unit 09 there is exactly one playback `<audio>` element. From Unit 09 on, exactly two playback elements, both owned by `src/audio/engine.js`; components never create playback elements or audio nodes. Detached metadata probes (`new Audio()` in the import check and duration probing) are allowed and must release their src.
2. The title, artist, highlighted row and the audible "current" deck always refer to `currentQid`. During a fade the incoming song is already current.
3. Reordering, adding or removing non-current queue items never restarts or changes the playing audio, and never cancels an in-progress fade unless it touches the incoming item.
4. Editing a playlist never changes the queue.
5. Nothing loaded from localStorage or IndexedDB reaches render or audio without validation. Audio URLs come only from `src/data/songs.js` or from blobs in IndexedDB (as object URLs), never from stored strings.
6. After a reload, playback doesn't start until the user acts.
7. `play()` rejections are caught and set `isPlaying` to false.
8. Queue, shuffle, repeat, arrange and playlist rules are pure functions in `src/lib/` with tests.
9. Object URLs are revoked when their song stops being loaded on a deck or is deleted.
10. No more than one song is decoded at a time; no decoded PCM is kept after analysis.
11. Beat-matching is used only when both tempos have confidence ≥ 0.6 and are within ±4% after half/double folding. Otherwise the smart crossfade is used.
