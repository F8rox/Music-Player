Read the 'AGENTS.md' before starting

# Unit 11: Live Visualiser

## Goal

The player bar shows frequency bars that move with the actual audio, coloured by the current track's energy. It's cheap to run and never makes React re-render every frame.

## Depends On

09, 10.

## Build

- `Visualiser.jsx`: a `<canvas>` behind the track info, `aria-hidden`. It reads `engine.analyser.getByteFrequencyData` in a `requestAnimationFrame` loop and draws 64 bars directly on the canvas. No React state per frame.
- Bar colour is the current song's `--energy-N` token (read once per song change via `getComputedStyle`). Use `--text-muted` before analysis is done.
- Pause the loop when the document is hidden or nothing is playing. Show one static frame under `prefers-reduced-motion`.
- Scale the canvas for `devicePixelRatio` and handle resize.

## Not In This Unit

Visualiser styles, a full-screen mode, beat-reactive effects.

## Acceptance Criteria

- [ ] The bars move while music plays and stop (flat) when paused.
- [ ] A loud and a quiet track show visibly different bar heights (screenshots of each).
- [ ] React DevTools Profiler: no component re-renders per animation frame while playing (record a 5 s profile).
- [ ] The rAF loop stops when the tab is hidden (count frames before and after `visibilitychange`).
- [ ] The track title and artist still meet 4.5:1 contrast over the bars (state the computed ratio at peak bar colour).
- [ ] Negative: with reduced motion emulated (or the media query forced in code during the test), only one frame is drawn.

## Verify

Lint and build. Profile and screenshot in the browser, and record the results.
