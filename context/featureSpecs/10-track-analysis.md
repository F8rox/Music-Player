Read the 'AGENTS.md' before starting

# Unit 10: Track Analysis

## Goal

Every song is analysed once, in the browser, for loudness and energy, its quiet intro and outro, and an approximate tempo with a confidence value. The results are cached in IndexedDB and shown in the song rows. It's honest about uncertainty, and the user can correct the tempo.

## Depends On

07, 09.

## Build

- `src/audio/analysis/dsp.js` (pure, tested with synthetic signals):
  - `rmsEnvelope(samples, rate, hz = 10)`
  - `loudness(envelope)`
  - `introOutro(envelope, hz)`: first and last points above (median − 30 dB), smoothed
  - `onsetEnvelope` and `onsetDensity`
  - `estimateBpm(onsets, rate)`: autocorrelation over 60–180, folded into 80–160, returning `{ bpm, confidence, beatOffset }`
- First compare `web-audio-beat-detector` against the in-house `estimateBpm` on the test fixtures and 5 real songs with known tempos. Keep whichever is more accurate and record the comparison in Architecture Decisions. Don't keep both.
- `analysis.worker.js` runs the DSP. `analyse.js` decodes on the main thread with `OfflineAudioContext(1, …, 11025)`, transfers the samples, stores the result as `AnalysisResult` with `v: 1`, and drops the PCM. A FIFO queue runs one song at a time and yields between songs.
- Analyse bundled songs on first launch and imported songs right after import. Re-analyse only when `v` changes.
- `src/lib/energy.js` (pure): an energy percentile from 1 to 5 across the analysed library (loudness + onset density).
- Song rows get the energy dot and "~BPM" from `design.md`, with a pulsing ring while analysing. The song menu gets "Fix tempo…" (½×, 2× and Tap, which averages the last 4–8 taps), saved as `bpmOverride`.

## Not In This Unit

Using the analysis for arranging, fading or beat-matching (Units 12–14), and the visualiser.

## Acceptance Criteria

- [ ] `dsp.test.js`:
  - a synthetic 120 BPM click track gives 120 ±1 with confidence ≥ 0.6
  - a 90 BPM click gives 90 (not 180 or 45)
  - white noise gives confidence < 0.4
  - a sine with 3 s of silence at each end gives introEnd ≈ 3 ±0.3 and outroStart ≈ duration − 3 ±0.3
  - an empty or all-silent buffer returns safe defaults and doesn't throw
- [ ] `energy.test.js`: percentiles across a library, a single-song library, and ties.
- [ ] On 5 real songs with known tempos (listed in the tracker): at least 3 within ±2 BPM after folding, and each result's confidence is recorded.
- [ ] Importing 20 songs keeps the UI responsive (record the longest main-thread task from a Performance trace; target < 300 ms) and analyses them one at a time with visible progress.
- [ ] Peak JS heap during a bulk analysis stays under about 300 MB (recorded).
- [ ] Results survive a refresh, and a second launch performs zero decodes (count them).
- [ ] Fix tempo: ½× on a 140 reading shows ~70, and the value persists after a refresh.
- [ ] Negative: a corrupt file in analysis marks the song "Couldn't analyse", it still plays, and the queue continues.

## Verify

Lint, tests and build. Record the real-song tempo table, the performance trace numbers and the heap peak in the tracker.
