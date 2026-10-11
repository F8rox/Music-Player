# Music Player

A browser music player for local mp3s, with a YouTube Music-style queue. Built spec-first: see [AGENTS.md](AGENTS.md) and [context/](context/).

## Setup

```bash
npm install
```

Put the mp3s in `public/songs/` (they are gitignored). The file names are listed in `src/data/songs.js`.

## Commands

| Command | What it does |
|---------|--------------|
| `npm run dev` | start the dev server |
| `npm run lint` | ESLint |
| `npm test` | Vitest |
| `npm run build` | production build to `dist/` |
