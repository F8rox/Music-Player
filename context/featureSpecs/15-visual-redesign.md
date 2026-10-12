Read the 'AGENTS.md' before starting

# Unit 15: Visual Redesign (desktop)

## Goal

Replace the plain dark-grey look with an editorial, Awwwards/Dribbble-grade desktop UI: a near-black canvas with a purple undertone, BMW blue → violet glow, glass panels, and big expressive type. Phone layout is out of scope here (Unit 16).

## Depends On

01–14.

## Build

- New tokens in `:root` (design.md "Theme Tokens", 2026-10-12 redesign): BMW blue `--accent` `#1c69d4`, violet `--accent-2` `#7b5cff`, deep backgrounds `#07060d`/`#0d0b1a`, translucent glass surfaces, gradient tokens. Every existing component uses tokens only, so it re-themes automatically; then restyle the main surfaces.
- Fonts, self-hosted through npm (no CDN, CSP-safe): Inter Variable for UI, Instrument Serif (italic) for editorial accents.
- An ambient background: two or three blurred blue/violet glow "ribbons" drifting slowly (CSS only); static under reduced motion.
- Glass navbar; the player bar becomes a floating rounded "dock" with a gradient progress fill and a stronger visualiser glow; glass Up next panel.
- A "Now playing" hero at the top of All Songs: large title in a sans + italic serif mix, artist, energy and tempo, a big play button, and a soft glow that tints from the track's energy.
- A refined song list: generous rows, hover glow, tabular numbers, a subtle gradient active row.
- Buttons: a gradient primary (blue → violet), glass secondary.

## Not In This Unit

Phone layout, new features, new routes.

## Acceptance Criteria

- [ ] No hex or rgba outside `:root` (grep). Fonts load from the bundle, with no external requests.
- [ ] Text contrast is 4.5:1 or better: body and muted text on the background and on glass (computed at their effective blended colour).
- [ ] At 1280 and 1440 wide, every existing feature still works (play, queue, drag, arrange, settings, playlists, import), checked by re-walking the main flows.
- [ ] The background motion stops under `prefers-reduced-motion` and doesn't run the GPU hot (CSS transform/opacity only).
- [ ] The owner approves the look (screenshots shared).

## Verify

Lint, tests and build. Screenshots at 1440 of All Songs (playing), Up next open, a playlist, and the settings popover.
