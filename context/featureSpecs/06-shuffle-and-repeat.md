Read the 'AGENTS.md' before starting

# Unit 06: Shuffle And Repeat

## Goal

Shuffle and repeat toggles in the player bar that behave exactly as in `project-overview.md` Core Behaviour, and persist.

## Depends On

04, 05.

## Build

- `src/lib/queue.js`: `shuffle(queue, random)` keeps every item up to and including the current one in place and shuffles the rest (Fisher–Yates with the injected `random`). `unshuffle(queue)` sorts the items after the current one by `order`. `next` honours `repeat` "off", "all" and "one" on `ended`, while the Next button always advances. `fromList` with shuffle on places the clicked song first, then the rest shuffled.
- Items added while shuffled get `order = max + 1` (already true from Unit 04, so check it).
- Provider: `toggleShuffle` and `cycleRepeat` (off → all → one → off), plus an `ended` handler. Persist `shuffle` and `repeat` with validation.
- Player bar toggle buttons styled as in `design.md`: shuffle with `aria-pressed`, repeat with an `aria-label` of "Repeat off", "Repeat all" or "Repeat one", and a "1" badge.

## Not In This Unit

Smart shuffle, weighting, history, or "shuffle play" buttons on pages.

## Acceptance Criteria

- [ ] Tests with a seeded random: shuffle keeps the items up to the current one fixed, is a permutation (no loss or duplication), unshuffle restores the original order, and a song added while shuffled stays after unshuffle.
- [ ] Repeat tests: "off" stops at the end, "all" wraps, "one" returns the same qid on `ended`, and the Next button with "one" advances.
- [ ] In the app: shuffle on reorders Up next below the current item while the current track keeps playing uninterrupted. Shuffle off restores the order.
- [ ] Repeat one: let the track end (seek to 2 seconds before the end), and it replays. Repeat off on the last item: playback stops with ▶ shown.
- [ ] Shuffle and repeat states survive a refresh.
- [ ] Negative: `{"repeat":"sideways","shuffle":"yes"}` in storage loads as off and false without errors.

## Verify

Lint, tests and build. Walk the toggle criteria in the app by seeking near the end of tracks.
