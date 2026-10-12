# Music Player

A browser music player for your own music, with a YouTube Music-style queue and an Auto-DJ: smart crossfade, loudness normalisation, Start radio, a "Draw your vibe" mood map and synced lyrics. Everything runs in your browser; your music never leaves your device.

**Live app:** https://f8rox.github.io/Music-Player/ (once GitHub Pages is on: Settings → Pages → Source: GitHub Actions).

Built spec-first: see [AGENTS.md](AGENTS.md) and [context/](context/).

## Using it

The app starts empty. Add songs with **Add your music** (or drag files onto the page, or **Add a folder** on Chromium). Songs are stored in your browser and analysed once. To show synced lyrics, add an `.lrc` file with the same name as the song.

Libraries are per browser and per address: songs added on your computer are not on your phone, and `localhost` and `127.0.0.1` are separate libraries.

## Supported browsers

Desktop Chrome, Edge and Firefox are fully supported. Safari works except for **Add a folder** (use the file picker or drag and drop). Phones work through the browser, using files stored on the phone.

## Development

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

## Deploying

Pushing to `main` builds and deploys to GitHub Pages (`.github/workflows/deploy.yml`). The workflow sets the Vite base path to the repository name and copies `index.html` to `404.html` so a refresh on any page still loads the app. To try the production build locally: `npm run build && npm run preview`.

Never commit audio files; `.gitignore` excludes them.
