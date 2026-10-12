# Security Context

This is a client-only app with no backend, no accounts and no secrets. Its attack surface is: data saved in the browser, files the user imports (and the tags inside them), text the user types, and dependencies. Imported music never leaves the device.

## Threats Covered

| Threat | Where | Control |
|--------|-------|---------|
| Tampered or corrupt localStorage crashes the app or injects values | load at startup | Strict validation per field. Defaults on failure. Unknown keys dropped. Never `eval` and never spread raw parsed objects into state |
| Corrupt or hostile IndexedDB records | library load | Same rule: validate every record's fields and types. Drop invalid records and log one notice. Blobs are only used as audio or image sources, never parsed as code |
| Malicious or malformed audio file (huge, wrong type, crafted to crash a decoder) | import, analysis | Accept only `audio/*` MIME types and known extensions (mp3, m4a/aac, ogg/opus, wav, flac). Max 100 MB per file. A failed decode marks the song "Can't play this file" and never crashes the app. One decode at a time (memory) |
| Hostile ID3 tags (script in a title, giant strings, fake image data) | import | Tag text is trimmed, stripped of control characters and limited to 200 characters. It's rendered only as React text. Cover art is accepted only as `image/jpeg`, `image/png` or `image/webp` under 2 MB, and shown via an object URL in `<img>` |
| XSS through a playlist name or a tag | pages, menus | React text rendering only. No `dangerouslySetInnerHTML` |
| Prototype pollution from parsed JSON | storage parse | Build new objects from known fields only. Ignore `__proto__`, `constructor` and `prototype` |
| Arbitrary URL playback | audio `src` | Stored data holds song ids only. URLs come from `src/data/songs.js` or from object URLs of IndexedDB blobs |
| Object URL leaks (memory) | decks, covers | Revoke every object URL when it's no longer used (Invariant 9) |
| Memory exhaustion from bulk import or analysis | analysis | One decode at a time, downsampled mono, PCM dropped after use (Invariant 10) |
| Storage quota, eviction or privacy mode | save, import | try/catch on every write. `navigator.storage.persist()` requested on the first import. Quota shown from `navigator.storage.estimate()`. An import that doesn't fit is refused with a clear message and stores nothing partial |
| Supply chain | npm | Lockfile committed, `npm audit --audit-level=high` clean, every new package justified in the tracker |
| Secrets committed | git | Root `.gitignore` excludes `.env` and `.env.*` (not `.env.example`). No env vars needed |

## Content Security
- No third-party scripts, fonts, analytics or CDNs.
- On GitHub Pages, CSP is set with a `<meta http-equiv="Content-Security-Policy">` in the production build: `default-src 'self'; media-src 'self' blob:; img-src 'self' blob: data:; style-src 'self'; script-src 'self'; worker-src 'self' blob:`. Not enforced in dev, where Vite injects inline styles.

## Copyright
- No audio is committed: the app ships empty and `.gitignore` excludes `public/songs/` and `*.mp3`. A clean clone has 0 tracked audio files.
- Imported user files are stored only in the user's own browser.

## Security Checklist For Every Unit
- [ ] No `dangerouslySetInnerHTML`, `eval`, `new Function` or `innerHTML`.
- [ ] Every new value read from localStorage or IndexedDB is validated, with a test covering bad input.
- [ ] No new network host. Audio comes only from the library file or IndexedDB blobs.
- [ ] User-typed text and file tags are trimmed, length-limited and rendered as text.
- [ ] Imported files are type- and size-checked; a bad file fails gracefully.
- [ ] Object URLs created in the unit are revoked.
- [ ] New dependencies are justified, in the lockfile, and `npm audit --audit-level=high` passes.
- [ ] No secrets or `.env` files committed.
- [ ] Acceptance criteria include at least one negative test.
