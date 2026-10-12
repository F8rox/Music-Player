Read the 'AGENTS.md' before starting

# Unit 20: Draw Your Vibe (mood map)

## Goal
The whole library as dots (energy vs tempo); the user draws a path, and the player queues songs along it.

## Depends On
10, 19.

## Build
- A canvas or SVG map page; drag to draw a path; the songs nearest each point along the path (no repeats) become the queue.
- Keyboard alternative: preset shapes (build-up, peak, cool-down).

## Acceptance Criteria
- [ ] Tests: path resampling and nearest-song selection without repeats.
- [ ] Drawing a rising line yields a queue of increasing energy.
- [ ] Accessible alternative works without a pointer.
