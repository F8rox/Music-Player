# AGENTS.md

Instructions for any AI coding agent working on the Music Player.

## Read First, In This Order

1. `context/project-overview.md`: what the product is, the user flows, scope and out of scope
2. `context/architecture-context.md`: stack, state model, storage, invariants
3. `context/design.md`: theme, tokens, layout, components
4. `context/code-standards.md`: how code is written, kept lean and organised
5. `context/security-context.md`: security rules and the per-unit checklist
6. `context/ai-workflow-rules.md`: how to work a unit, and the definition of done
7. `context/progress-tracker.md`: current state and open questions
8. The feature spec you were asked to build in `context/featureSpecs/`

## Rules

- Build only the unit you were asked to build.
- Do not invent behavior. If something is missing or ambiguous, add it to Open Questions in `progress-tracker.md` and ask.
- Do not build anything listed under Out Of Scope in `project-overview.md`. In particular there is no YouTube or YouTube Music API, no backend and no accounts. "Like YT Music" means copying its UX only.
- Do not start a later phase's units early.
- Use the design tokens in `src/index.css` only. No hardcoded colors outside the `:root` token block.
- Write lean code: no dead code, no duplicated logic, no speculative features, no unneeded dependencies.
- Queue, shuffle, repeat and playlist rules live in pure functions in `src/lib/`, with Vitest tests. Components don't hold these rules.
- There is exactly one `<audio>` element in the app.
- Treat everything read from `localStorage` as untrusted. Validate it, and fall back to defaults when it's invalid.
- Apply the security checklist to every unit.

## Lessons Carried Over

- Before trusting a "complete" tracker, check that the repo really runs: `npm run lint`, `npm test` and `npm run build` must pass, and the app must play a song.
- The root `.gitignore` excludes every `.env` file. Never paste secrets into chat or screenshots. This app needs none today.
- One implementation per feature. One owner per file. Don't create a second queue, list or drag component when one already exists.

## Finishing

Do not say a unit is done until every acceptance criterion in its spec has been checked and `progress-tracker.md` is updated. Report each criterion as passed or not, and how you checked it.
