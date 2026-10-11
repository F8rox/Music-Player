Read the 'AGENTS.md' before starting

# Unit 08: Responsive, Accessibility And Release Audit

## Goal

The app works from 360px to desktop, is fully usable by keyboard and screen reader, and passes a final audit against every context file.

## Depends On

01–07.

## Build

- The small-screen player bar described in `design.md`: under 640px it collapses, and seek, volume, shuffle and repeat move into the drawer header.
- Check and fix: every icon button has an `aria-label`, the menu has the `menu` and `menuitem` roles with arrow-key navigation and Esc to close, the drawer traps focus while it's open, and the seek and volume sliders have `aria-label`s and `aria-valuetext` ("1:23 of 3:04", "Volume 50%").
- Remove anything dead or duplicated that has crept in. Make sure files stay within the size limits.
- Update `README.md` and every context file to the real state.

## Not In This Unit

New features of any kind, including the Phase 2 items.

## Acceptance Criteria

- [ ] At 360px, 768px and 1280px there's no horizontal scroll, the player bar controls are reachable, and Up next works.
- [ ] Full flow by keyboard only: play a song, open the menu, add it to the queue, open Up next, reorder an item, toggle shuffle and repeat, create a playlist and add a song.
- [ ] An axe or Lighthouse accessibility check shows no serious or critical issues on `/`, `/playlists` and a playlist detail page (record the score).
- [ ] `grep` checks: no `dangerouslySetInnerHTML`, no `console.log`, no hex or rgba outside `:root`, and no `react-router-dom`.
- [ ] `npm audit --audit-level=high` passes. Lint, tests and build pass on a fresh `npm ci`.
- [ ] Negative: fill `localStorage` to its quota (in the console), then create a playlist. The "Couldn't save" Notice appears once and the app keeps working.
- [ ] Every criterion from Units 01–07 is re-checked and the result is recorded in the tracker.

## Verify

Run the commands on a fresh `npm ci`. Do a resize walk, a keyboard-only walk and a Lighthouse or axe run, and re-run every earlier criterion.
