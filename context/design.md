# Design

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
| `--danger` | `#ef4444` | delete actions |
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
