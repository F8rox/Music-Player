# Development Workflow

## Approach

Build this project one unit at a time, against the spec. The context files define what to build, how to build it, and the current state. Don't infer or invent behaviour.

## How To Work A Unit

When told to build a unit (for example "build featureSpecs/05-queue-reorder.md"):

1. Read `AGENTS.md`, then `project-overview.md`, `architecture-context.md`, `design.md`, `code-standards.md`, `security-context.md`, `progress-tracker.md`, and the named feature spec.
2. Restate the unit's scope and acceptance criteria in a few lines before writing code.
3. Implement only that unit.
4. Run `npm run lint`, `npm test` and `npm run build`, and walk through every acceptance criterion in the running app (`npm run dev`, using the browser tool if one is available).
5. Update `progress-tracker.md`.
6. Commit with a conventional message.
7. Report which acceptance criteria passed, how each was checked, and anything left open.

## Definition Of Done

A unit is done only when all of these are true:

- Every acceptance criterion in its spec is met and was actually checked, with evidence (command output, a named test, or a recorded walk of the real app) written next to it in `progress-tracker.md`.
- Lint, tests and build pass.
- Nothing from Out Of Scope in `project-overview.md` was added.
- No invariant in `architecture-context.md` was violated.
- The security checklist in `security-context.md` passes, including at least one negative test.
- The code follows `code-standards.md`: no dead code, no duplication, within the size limits, tokens only.
- `progress-tracker.md` reflects the real state.

Statuses are never copied from earlier text. Before a new prompt's units start, re-run lint, tests and build, and play one song.

## Scoping Rules

- One unit at a time. Prefer small, verifiable steps.
- Pure logic (`src/lib`) and its tests come first. Wiring into the provider comes next, then UI.
- If a change can't be verified in the app in a few minutes, split it.

## Handling Missing Requirements

- Don't invent product behaviour. The YT Music behaviour rules are in `project-overview.md`, under Core Behaviour.
- If a requirement is ambiguous, add it to Open Questions in `progress-tracker.md`. If it blocks you, stop and ask. If it doesn't, take the safest option the specs allow and record it.
- If a request conflicts with Out Of Scope, stop and ask.

## Inputs Needed From The User

This app needs no keys or credentials. If a future unit needs one, the rule is:

1. Add the variable name to `.env.example` and a row to "Inputs Needed From User" in `progress-tracker.md`.
2. Use a fallback and keep building. Mark the affected criteria "blocked on input".
3. Ask at the end of the unit. Never ask for secret values in chat. The user puts them in `.env.local`.

The bundled mp3 files are an input of a sort: they aren't in git. If `public/songs/` is empty on a fresh checkout, record it as an input needed and keep building the logic and tests.

## Protected Files

- Don't modify `node_modules`, the dnd-kit internals or `package-lock.json` by hand.
- Don't rename or re-encode the files in `public/songs/`. Reference them as they are named.

## Keeping Docs In Sync

Update the relevant context file whenever the implementation changes the state model, storage, tokens, layout, folder tree or scope. The progress tracker must reflect the actual state, not the intended one.
