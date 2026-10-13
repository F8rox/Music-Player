# Music Player

A browser music player for your own music, with a YouTube Music-style queue and an Auto-DJ: smart crossfade, loudness normalisation, Start radio, a "Draw your vibe" mood map and synced lyrics. Everything runs in your browser; your music never leaves your device.

Built spec-first: see [AGENTS.md](AGENTS.md) and [context/](context/).

## Using it

The app starts empty. Add songs with **Add your music** (or drag files onto the page, or **Add a folder** on Chromium). Songs are stored in your browser and analysed once. To show synced lyrics, add an `.lrc` file with the same name as the song.

Libraries are per browser and per address: songs added in one browser are not in another, and `localhost` and `127.0.0.1` are separate libraries.

## Supported browsers

Desktop Chrome, Edge and Firefox are fully supported. Safari works except for **Add a folder** (use the file picker or drag and drop).

## Run it

Download the ZIP (green **Code** button → Download ZIP), unzip it, install [Node.js](https://nodejs.org) 20 or newer, then in the folder run:

```bash
npm install
npm run dev
```

| Command | What it does |
|---------|--------------|
| `npm run dev` | start the dev server |
| `npm run lint` | ESLint |
| `npm test` | Vitest |
| `npm run build` | production build to `dist/` |
