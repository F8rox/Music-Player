Read the 'AGENTS.md' before starting

# Unit 12: Arrange My Queue

## Goal

One button reorders the upcoming songs into an energy arc (build-up, peak, cool-down) with gentle tempo steps. It can be undone, and the queue stays fully draggable afterwards.

## Depends On

05, 06, 10.

## Build

- `src/lib/arrange.js` (pure): `arrange(items, infoById)` takes the items **after** the current one, plus energy (1–5, fractional) and folded BPM (or null), and returns a new order:
  1. Sort by energy and place the songs on an arc that peaks at about 70% of the way through: rising to the peak with the higher-energy songs, then falling.
  2. Run a local pass that swaps neighbours where it reduces the tempo jumps between them without breaking the arc by more than one energy step.
  3. Songs without analysis keep their relative order and go at the end.
- The provider action `arrangeQueue()` keeps every item up to and including the current one fixed and replaces the tail. It saves the previous items as `arrangeUndo`. Any other queue change clears `arrangeUndo`. While shuffled, it still works (order fields stay frozen per the queue rules).
- UI: the "Arrange" button and "Undo arrange" in the Up next header (`design.md`). With fewer than 4 upcoming songs, show the Notice "Add a few more songs to arrange".

## Not In This Unit

Arranging a playlist, choosing the arc shape, musical key.

## Acceptance Criteria

- [ ] `arrange.test.js`:
  - 12 songs with known energies give an order whose energy rises to a maximum within the 60–80% range, then falls (assert the shape)
  - it's a permutation (nothing lost or duplicated)
  - the current item and the ones before it are untouched
  - unanalysed songs go to the end in their original order
  - the tempo pass reduces the total folded-BPM jump compared with the energy-only order, on a fixture
  - 0–3 items are a no-op
- [ ] In the app with 20+ analysed songs: press Arrange, and the energy dots in Up next visibly rise then fall (screenshot). Playback isn't interrupted.
- [ ] Drag a song after arranging: it moves normally, and "Undo arrange" disappears (the queue changed).
- [ ] Undo restores the exact previous order.
- [ ] Negative: with 2 upcoming songs, Arrange shows the notice and changes nothing.

## Verify

Lint, tests and build. Walk the flow with a real imported library, and record the before/after energy sequence.
