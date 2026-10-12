# Design

> **2026-10-12 redesign (Unit 15):** the token table below is superseded by the `:root` block in `src/index.css` (near-black + BMW blue → violet, glass surfaces, Inter Variable + Instrument Serif italic). Components and rules below still apply.

The look follows YouTube Music's layout and density, with this app's existing green accent kept. It is dark only.

## Theme Tokens

All colors live as CSS custom properties in the `:root` block at the top of `src/index.css`. No hex, `rgb()` or `rgba()` values anywhere else in the CSS or JSX.

| Token | Value | Use |
|-------|-------|-----|
| `--bg` | `#0f0f0f` | page background |
| `--surface` | `#1d1d1d` | cards, panels, player bar |
| `--surface-raised` | `#2a2a2a` | hover, menus, dragged item |
| `--border` | `#ffffff1a` | dividers and outlines |
| `--text` | `#f1f1f1` | primary text |
| `--text-muted` | `#aaaaaa` | artist, time, secondary text |
| `--accent` | `#10b981` | active row, progress fill, on-state toggles |
| `--accent-strong` | `#059669` | accent hover |
| `--danger` | `#f87171` | delete actions (dark `--bg` text on it; 5.2:1 or better as text on surfaces) |
| `--focus` | `#7dd3fc` | focus ring (`outline: 2px solid var(--focus)`) |
| `--overlay` | `#000000b3` | modal and drawer backdrop |

Contrast: `--text` and `--text-muted` must pass WCAG AA (4.5:1) on `--bg` and `--surface`.

## Typography
- System stack: `Inter, system-ui, sans-serif` (no web font download).
- Sizes: 0.75rem meta, 0.875rem body rows, 1rem titles, 1.5rem page headings. Weight 400/500/700.
- Times use `font-variant-numeric: tabular-nums`.

## Radius And Spacing
- `--radius-sm: 4px` (rows, inputs), `--radius-md: 8px` (cards, panels), `--radius-full: 999px` (play button, toggles).
- Spacing comes from a 4px scale: `--space-1` (4px) to `--space-6` (24px).

## Layout (YT Music)

```
┌ Navbar: brand · All Songs · Playlists ───────────────┐
│ Main content (route)          │ Up next panel        │
│                               │ (≥1024px: side panel │
│                               │  toggled from bar;   │
│                               │  <1024px: drawer)    │
├───────────────────────────────┴──────────────────────┤
│ Player bar (fixed bottom, 72px): track · controls ·   │
│ seek · shuffle · repeat · volume · Up next toggle     │
└───────────────────────────────────────────────────────┘
```

- The main area gets bottom padding equal to the player bar height so nothing hides behind it.
- Under 640px the player bar collapses to title, play/pause, next and an Up next toggle, with a thin progress line along its top edge. Seek, volume, shuffle and repeat move into the Up next drawer header.

## Components
- **SongRow:** index or playing indicator, title, artist, duration, and a "⋯" menu (Play next, Add to queue, Add to playlist ▸). The whole row is a button that plays the song. The menu button stops propagation.
- **SortableList:** the only drag-and-drop list, used by Up next and the playlist detail page. Each row has a drag handle (⠿) on the left and lifts on `--surface-raised` while dragged. A drop line shows in `--accent`.
- **Toggle buttons** (shuffle and repeat): `--text-muted` when off, `--accent` when on. Repeat "one" shows a small "1" badge. Each has `aria-pressed` (shuffle) or an `aria-label` that names the mode (repeat).
- **Confirm dialog:** a native `<dialog>` for deleting a playlist.
- **Notice:** a small toast at the bottom above the player bar, for "Already in playlist" and "Couldn't save". It disappears after 3 seconds and uses `role="status"`.
- **Empty states:** a short line of muted text with one action, for example "No playlists yet. Create one."

## Icons
Use Unicode glyphs or inline SVG in `currentColor`. No icon font or icon package. Every icon-only button has an `aria-label`.

## Motion
Transitions are 150ms ease on background and transform. Respect `prefers-reduced-motion` by turning off transform transitions. The gradient title animation is removed.

## Library And Auto-DJ Components (Units 07–14)

- **Add music:** a button in the All Songs header ("Add your music") plus a drop zone. Dragging files over the page shows a full-height dashed `--accent` outline with "Drop to add". It also works from the keyboard: the button opens the file picker. On Chromium an "Add a folder" option sits next to it.
- **Import progress:** a compact list in a Notice-style panel: file name, then "Reading tags…", "Analysing…", "Done", or "Can't play this file" in `--danger`.
- **Song row additions:** a small energy dot before the duration (colour on the energy scale below), and "~124" BPM in `--text-muted` with `title="Approximate tempo"`. While a song is analysing, the dot is a pulsing ring (static under reduced motion). Imported songs get "Remove from library" in their ⋯ menu.
- **Energy scale:** five tokens, `--energy-1` (cool, `#38bdf8`) to `--energy-5` (warm, `#f97316`), with `--energy-2: #22d3ee`, `--energy-3: #10b981`, `--energy-4: #facc15`. Energy is never shown by colour alone: the dot has an `aria-label` such as "Energy 4 of 5".
- **Visualiser:** a `<canvas>` behind the track info in the player bar, 64 frequency bars, at 15% opacity: the highest that keeps the muted artist text at 4.5:1 or more over a full-height bar (checked in Unit 11). Bar colour is the current track's energy token. It's `aria-hidden`.
- **Arrange my queue:** a button in the Up next header with an icon and the label "Arrange". After use it becomes "Undo arrange" until the queue next changes. The Notice says "Arranged 14 songs: build-up, peak, cool-down".
- **Settings popover** (gear in the player bar): Crossfade on/off, fade length slider (2–12 s), "Beat-match (experimental)" on/off, and storage used (for example, "1.2 GB of 8 GB").
- **Tempo fix:** in the song menu, "Fix tempo…" opens a small dialog with ½×, 2× and Tap buttons and the current value.
- **About page:** a privacy note ("Your music stays on your device"), and a short how-it-works note. There is no credits section (owner decision, 2026-10-13). Under 640px the navbar hides the wordmark (the orb stays as the labelled home link) and the dock collapses as described above.
