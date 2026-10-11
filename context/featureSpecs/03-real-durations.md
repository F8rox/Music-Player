Read the 'AGENTS.md' before starting

# Unit 03: Real Durations

## Goal

Every song row shows the duration read from its audio file, and the player bar shows the live duration of the current track.

## Depends On

01, 02.

## Build

- In `MusicProvider`, probe each library song once at startup: `new Audio()`, `preload = "metadata"`, set `src`. Read `duration` on `loadedmetadata` and record `null` on `error`. Probe one song at a time, release each probe (`removeAttribute("src")`, then `load()`), and clean up on unmount.
- `durations` map in state (not persisted).
- SongRow shows `formatTime(duration)`, "–:––" while loading, and "Unavailable" (muted) when it's `null`.
- The player bar's total time comes from the live `audio.duration`.

## Not In This Unit

Caching durations in storage, and any change to queue or playlist behaviour.

## Acceptance Criteria

- [ ] All 5 rows show a duration within 1 second of the file's real length (compare against the player bar's total after playing each one).
- [ ] No hardcoded duration string remains: `grep -rn "duration: \"" src` finds nothing.
- [ ] Probing doesn't start playback or download whole files. In the network panel, each request is a metadata or range request, or the transfer stays small. Record what you see.
- [ ] Negative: temporarily point one song at a missing file. Its row shows "Unavailable", the others still load, and the console shows no uncaught error. Revert after.
- [ ] StrictMode double-mount doesn't leave two probes running per song (check the network panel or count with a temporary log, then remove it).

## Verify

Run lint, tests and build. Open the dev app and watch the network panel and the rows.
