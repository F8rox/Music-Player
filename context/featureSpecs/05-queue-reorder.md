Read the 'AGENTS.md' before starting

# Unit 05: Queue Reorder (drag up and down)

## Goal

The listener can drag any item in Up next to a new position, with a mouse, touch or the keyboard, the way YT Music does it, without interrupting playback.

## Depends On

04.

## Build

- `src/lib/queue.js`: `move(queue, fromQid, toIndex)`, pure and tested. The current item may be moved. `currentQid` is unchanged, so playback continues.
- Add `@dnd-kit/core` and `@dnd-kit/sortable` (record the versions in Architecture Decisions).
- `src/components/SortableList.jsx`: a generic list taking `items`, `getId`, `renderItem` and `onMove(fromId, toIndex)`. It has a drag handle per row (the handle is the drag activator, so clicking the row still plays). Use PointerSensor with an activation distance of 4px, TouchSensor with a 150ms delay, and KeyboardSensor with sortable coordinates. The lifted row uses `--surface-raised` and there's an accent drop line. Screen reader announcements are set to "Picked up <title>", "Moved to position N" and "Dropped".
- QueuePanel uses SortableList and calls the provider's `moveInQueue`.

## Not In This Unit

Reordering playlists (Unit 07 reuses this component), drag between lists, and multi-select.

## Acceptance Criteria

- [ ] `move` tests: up, down, to the same index (no-op), the current item moved, and an out-of-range index clamped.
- [ ] With the mouse, drag item 5 to position 2 while item 1 plays. The audio doesn't restart or skip (the time keeps counting), and Next then plays the moved song.
- [ ] Touch (mobile emulation at 375px): a long-press on the handle and drag reorders, and scrolling the list without touching a handle still scrolls.
- [ ] Keyboard: Tab to a handle, Space to lift, ArrowUp or ArrowDown to move, Space to drop, and Esc cancels and restores the order. A screen reader live region announces each step.
- [ ] Clicking a row (not its handle) still plays it, and a small drag under 4px doesn't count as a click-drag.
- [ ] The new order survives a refresh.
- [ ] Negative: drag the current item to the end, then press Next. With repeat "all" (the default until Unit 06), playback wraps to the first item and doesn't crash.

## Verify

Lint, tests and build. Walk the mouse and keyboard criteria at 1280px and the touch criterion with mobile emulation. Record the result of each.
