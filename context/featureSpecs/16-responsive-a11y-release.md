Read the 'AGENTS.md' before starting

# Unit 16: Responsive, Accessibility And Release

## Goal

The app works from 360px to desktop, is fully usable by keyboard and screen reader, passes a final audit against every context file, and is live on GitHub Pages so visitors can try it without cloning.

## Depends On

01–15.

## Build

- The small-screen player bar described in `design.md`: under 640px it collapses, and seek, volume, shuffle, repeat and settings move into the drawer header.
- Check and fix:
  - every icon button has an `aria-label`
  - menus use the `menu` and `menuitem` roles, with arrow-key navigation and Esc to close
  - the drawer and dialogs trap focus
  - sliders have `aria-valuetext` ("1:23 of 3:04", "Volume 50%", "Fade 6 seconds")
  - energy is never conveyed by colour alone
- About page with the demo track credits and the privacy note.
- GitHub Pages:
  - Vite `base` set to the repo path, with an SPA fallback (copy `index.html` to `404.html`)
  - a GitHub Actions workflow that builds and deploys on push to `main`
  - the production CSP meta tag from `security-context.md`
  - the README gets the live link and a "Supported browsers" section (Chromium and Firefox desktop fully; Safari: no folder import)
- Remove anything dead or duplicated that has crept in. Make sure files stay within the size limits. Update `README.md` and every context file to the real state.

## Not In This Unit

New features of any kind, including the Phase 3 items.

## Acceptance Criteria

- [ ] At 360px, 768px and 1280px there's no horizontal scroll, the player bar controls are reachable, and Up next works.
- [ ] Full flow by keyboard only: import a file (via the button), play a song, open the menu, add it to the queue, open Up next, reorder an item, Arrange, toggle shuffle and repeat, change the crossfade setting, create a playlist and add a song.
- [ ] axe or Lighthouse shows no serious or critical accessibility issues on `/`, `/playlists`, a playlist detail page and `/about` (record the scores).
- [ ] `grep` checks: no `dangerouslySetInnerHTML`, no `console.log`, no hex or rgba outside `:root`, and no `react-router-dom`.
- [ ] `npm audit --audit-level=high` passes. Lint, tests and build pass on a fresh `npm ci`.
- [ ] The GitHub Pages URL loads, plays a demo track, imports a local file, and a deep link (`/playlists`) refreshes without a 404. The CSP is present and nothing is blocked in the console.
- [ ] Negative: fill `localStorage` to its quota (in the console), then create a playlist. The "Couldn't save" Notice appears once and the app keeps working.
- [ ] Every criterion from Units 01–14 is re-checked and the result is recorded in the tracker.

## Verify

Run the commands on a fresh `npm ci`. Do a resize walk, a keyboard-only walk and a Lighthouse or axe run, test the deployed site, and re-run every earlier criterion.
