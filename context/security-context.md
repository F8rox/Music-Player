# Security Context

This is a client-only app with no backend, no accounts and no secrets. Its attack surface is small: data saved in the browser, rendering of user-typed text, and dependencies.

## Threats Covered

| Threat | Where | Control |
|--------|-------|---------|
| Tampered or corrupt localStorage crashes the app or injects values | load at startup | Strict validation per field. Defaults on failure. Unknown keys dropped. Never `eval` and never spread raw parsed objects into state |
| XSS through a playlist name | playlist pages, menus | React text rendering only. No `dangerouslySetInnerHTML`. Names trimmed and limited to 1–60 characters |
| Prototype pollution from parsed JSON | storage parse | Build new objects from known fields only. Ignore `__proto__`, `constructor` and `prototype` |
| Arbitrary URL playback (storage pointing audio at another origin) | audio `src` | Storage holds song ids only. URLs come from `src/data/songs.js` |
| Storage quota or privacy mode | save | try/catch, one notice, keep working in memory |
| Supply chain | npm | Lockfile committed, `npm audit --audit-level=high` clean, new packages justified |
| Secrets committed | git | Root `.gitignore` excludes `.env` and `.env.*` (not `.env.example`). No env vars needed today |

## Content Security
- No third-party scripts, fonts, analytics or CDNs.
- When the app is deployed, the host sets a CSP of `default-src 'self'; media-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'`. This is not enforced in dev, because Vite injects inline styles there. It's recorded as an open question until a host is chosen.

## Copyright
The bundled mp3s are commercial recordings. They are excluded from git so they're never published by accident (see progress-tracker).

## Security Checklist For Every Unit
- [ ] No `dangerouslySetInnerHTML`, `eval`, `new Function` or `innerHTML`.
- [ ] Every new value read from storage is validated, with a test covering bad input.
- [ ] No new network host. Audio URLs come only from the library file.
- [ ] User-typed text is trimmed, length-limited and rendered as text.
- [ ] New dependencies are justified, in the lockfile, and `npm audit --audit-level=high` passes.
- [ ] No secrets or `.env` files committed.
- [ ] Acceptance criteria include at least one negative test (bad input, corrupt storage, or an edge of the queue).
