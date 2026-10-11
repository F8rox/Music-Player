# Music Player Build Prompts

There are three build prompts in Phase 1, plus four helper prompts. Each build prompt has the agent re-read the context folder before it starts and again before every unit.

| Prompt | Covers | Feature specs |
|--------|--------|---------------|
| 1A | Foundation fixes, tokens and app shell, real durations | 01, 02, 03 |
| 1B | Queue, queue reorder (drag), shuffle and repeat | 04, 05, 06 |
| 1C | Playlists, responsive/a11y/release audit | 07, 08 |

Phase 2 (Media Session, keyboard shortcuts, playlist import and export) isn't prompted. It's out of scope until Phase 1 is done.

## How To Use

1. `AGENTS.md` and `context/` are already at the repository root.
2. Make sure the 5 mp3s are in `public/songs/`. They're gitignored, so a fresh clone won't have them.
3. Open a new agent conversation for each prompt, in plan mode, and paste the prompt.
4. Approve the plan only if it lists every unit in the prompt with a Context Gate before each one. If not, reply: "Revise the plan to include every unit and a Context Gate before each."
5. When the agent finishes, read its final report, then run Helper B (Audit) in the same conversation before the next prompt.
6. If the agent drifts or stops mid-way, paste Helper A (Re-sync).
7. No keys are needed. If that ever changes, use Helper D.

---

## Prompt 1A: Foundation Fixes, Tokens And App Shell, Real Durations

```text
ROLE
You are a senior front-end engineer building the Music Player one reviewed unit at a time. The repository's AGENTS.md and context/ folder are the only source of truth. You do not invent product behaviour, scope or design.

THIS PROMPT BUILDS
Unit 01 Foundation fixes, Unit 02 Tokens and app shell, Unit 03 Real durations. Specs: context/featureSpecs/01-foundation-fixes.md, 02-tokens-and-app-shell.md, 03-real-durations.md. Nothing else.

STEP 0: READ EVERYTHING FIRST
Before planning or writing code, open and read these completely, in this order:
1. AGENTS.md
2. context/project-overview.md (goals, phases, Core Behaviour, flows, scope, Out Of Scope, success criteria)
3. context/architecture-context.md (stack, boundaries, state model, storage, invariants)
4. context/design.md (tokens, layout, components)
5. context/code-standards.md (lean code, no repetition, folder tree, size limits, testing)
6. context/security-context.md (threats, checklist)
7. context/ai-workflow-rules.md (How To Work A Unit, Definition Of Done)
8. context/progress-tracker.md
Then reply with a summary of at most 12 lines: the product in one sentence, what "like YT Music" does and doesn't mean here, what Phase 1A includes, the full Out Of Scope list, the stack, the invariants that matter for this prompt, and the security musts. If you can't list Out Of Scope exactly, re-read before continuing.

STEP 1: CHECK THE BASE
- Confirm that AGENTS.md and context/ are at the repository root and that it is a git repository. If there are no commits yet, commit the context folder, AGENTS.md, build-prompts.md, .gitignore and .env.example as "chore: add project context". Check first that no .mp3 and no .env file is staged.
- Run npm install, npm run lint and npm run build, and record the real results in progress-tracker.md (the baseline is: lint fails with 4 errors, build passes).
- Confirm that public/songs/ holds the 5 mp3s. If it doesn't, record that as an input needed and keep going with the logic and tests.
- Units 01 to 03 must be unstarted. If any have been started, continue from the first unfinished one.

STEP 2: BUILD THESE UNITS IN ORDER: 01, then 02, then 03
For EACH unit run this loop. Do not skip a step.

A. CONTEXT GATE (mandatory, even if you read the files earlier)
Re-open and re-read:
- the unit's feature spec, in full
- context/ai-workflow-rules.md "How To Work A Unit" and "Definition Of Done"
- context/progress-tracker.md
- context/code-standards.md, always
- context/design.md, for any screen or component
- context/architecture-context.md (state model, invariants), always
Then write a Unit brief of at most 10 lines: the goal, the files you will create or change, what is NOT in this unit, the acceptance criteria you will test, and the security checklist items that apply.

B. BUILD only that unit.
- Follow code-standards.md exactly: lean, no dead code, no duplication, size limits, folder tree.
- Colours, radius and spacing come only from tokens. No hardcoded colours outside :root.
- Pure logic goes in src/lib with Vitest tests.

C. VERIFY
- Run npm run lint, npm test and npm run build. Fix failures at the root cause.
- Run npm run dev and walk EVERY acceptance criterion in the real app (use the browser tool if available). Mark each one pass or fail and say how you checked it.
- Run the negative test the spec names.
- Apply the checklist at the end of context/security-context.md.

D. CLOSE
- Update context/progress-tracker.md: unit status with evidence per criterion, In Progress, Next Up, Open Questions, Architecture Decisions, Session Notes. It must reflect the real state.
- Update any other context file whose facts changed.
- Commit with a conventional message, for example "fix(player): map all songs and catch play rejections".

E. SELF-AUDIT (answer yes or no in your notes)
Tokens only? No dead code or duplicated logic? No new dependency without a recorded decision? Nothing from Out Of Scope built? Invariants intact? Exactly one <audio> element?
Only continue to the next unit if every answer is yes and every acceptance criterion passed.

UNIT REMINDERS
- Unit 01: next and prev must be pure updaters (StrictMode runs updaters twice). Catch audio.play() rejections. Use Number() on input values. Key lists by song.id. Remove react-router-dom. Add Vitest. Check that .gitignore still excludes .env* and public/songs/*.mp3.
- Unit 02: replace all 106 hardcoded colours with tokens, delete the unused tutorial CSS, fixed bottom player bar, an empty Up next panel or drawer. No placeholder buttons for future features.
- Unit 03: probe metadata one song at a time, release each probe, no double probing under StrictMode, "Unavailable" for files that fail.

HARD RULES
- Do not build anything listed under Out Of Scope in context/project-overview.md: no YouTube or YT Music API, no backend, no uploads.
- Do not start Units 04 and later.
- Never commit .mp3 or .env files.
- If a requirement is ambiguous and blocks you, add it to Open Questions in progress-tracker.md, stop and ask me. If it doesn't block you, record it and continue with the safest option the specs allow.
- Do not call a unit done unless every acceptance criterion was actually checked.

STOP CONDITION AND FINAL REPORT
Stop after Unit 03. Report:
1. Units completed, with the commit for each.
2. A table: acceptance criterion, how it was verified, result.
3. Commands run (lint, test, build) and their results.
4. Open questions and anything that needs me.
5. Confirmation that progress-tracker.md is updated, and the next prompt to run (1B).
```

---

## Prompt 1B: Queue, Queue Reorder, Shuffle And Repeat

```text
ROLE
You are a senior front-end engineer continuing the Music Player build, one reviewed unit at a time. AGENTS.md and context/ are the only source of truth. You do not invent product behaviour, scope or design.

THIS PROMPT BUILDS
Unit 04 Queue, Unit 05 Queue reorder, Unit 06 Shuffle and repeat. Specs: context/featureSpecs/04-queue.md, 05-queue-reorder.md, 06-shuffle-and-repeat.md. Nothing else.

STEP 0: READ EVERYTHING FIRST
Open and read completely, in this order: AGENTS.md; context/project-overview.md; context/architecture-context.md; context/design.md; context/code-standards.md; context/security-context.md; context/ai-workflow-rules.md; context/progress-tracker.md.
Reply with a summary of at most 12 lines: what is already built (from progress-tracker.md), the YT Music Core Behaviour rules (playing from a list, play next, add to queue, next, previous, ended, shuffle on and off, repeat modes), the queue state shape (qid, songId, order, currentQid), the Out Of Scope list, and the invariants that matter here (one audio element, reordering never interrupts playback, storage validated, no autoplay after reload). If you can't list them exactly, re-read.

STEP 1: CHECK THE BASE
- progress-tracker.md must show Units 01 to 03 complete. If not, stop and tell me.
- Run npm run lint, npm test and npm run build, and play one song in the dev app. If anything fails, fix it first in its own "fix: ..." commit.

STEP 2: BUILD THESE UNITS IN ORDER: 04, then 05, then 06
For EACH unit run this loop. Do not skip a step.

A. CONTEXT GATE (mandatory)
Re-open and re-read:
- the unit's feature spec, in full
- context/ai-workflow-rules.md "How To Work A Unit" and "Definition Of Done"
- context/progress-tracker.md
- context/project-overview.md "Core Behaviour"
- context/architecture-context.md "State Model", "Storage Model" and "Invariants"
- context/code-standards.md, always
- context/design.md, for any component
- context/security-context.md, for anything that reads storage
Then write a Unit brief of at most 10 lines: the goal, files to create or change, what is NOT in this unit, the acceptance criteria you will test, and the security items that apply.

B. BUILD only that unit.
- Write the pure functions in src/lib and their tests FIRST, then the provider actions, then the UI.
- Reuse existing pieces (SongRow, Notice, formatTime, SortableList once it exists). Don't create a second version of anything.
- Find the current item by currentQid, never by index.
- Every value read from storage is validated field by field.

C. VERIFY
- Run lint, tests and build.
- Walk EVERY acceptance criterion in the real app. For drag criteria, use the mouse, touch emulation (375px) and the keyboard. Mark each pass or fail and say how you checked it.
- Run the negative tests (corrupt storage, current item at the end of the queue, bad repeat value).
- Apply the checklist at the end of context/security-context.md.

D. CLOSE
Update progress-tracker.md with evidence, record new dependencies in Architecture Decisions (dnd-kit and its version in Unit 05), update context files whose facts changed, and commit with a conventional message.

E. SELF-AUDIT (yes or no)
Tokens only? Rules only in src/lib, and tested? No dead code or duplication? Dependency recorded? Nothing from Out Of Scope? Playback never interrupted by a reorder? Storage validated?
Continue only if all yes and every criterion passed.

UNIT REMINDERS
- Unit 04: playing from a list keeps the list order and starts at the clicked song. Play next inserts after the current item. Add to queue appends, and duplicates are allowed. Previous restarts the track after 3 seconds. Restore after refresh is paused.
- Unit 05: @dnd-kit/core and @dnd-kit/sortable. The handle is the activator. Pointer distance 4px, touch delay 150ms, keyboard sensor, screen reader announcements. One generic SortableList, because Unit 07 reuses it.
- Unit 06: shuffle keeps the items up to and including the current one fixed. Unshuffle sorts by order. Repeat cycles off → all → one. Next skips even with repeat one. Use a seeded random in the tests.

HARD RULES
- Do not build anything under Out Of Scope: no streaming API, no backend, no smart shuffle, no history page.
- Do not start Units 07 and later.
- A blocking ambiguity goes in Open Questions, then stop and ask me. A non-blocking one gets recorded, and you continue with the safest option the specs allow.
- Do not call a unit done unless every acceptance criterion was actually checked.

STOP CONDITION AND FINAL REPORT
Stop after Unit 06. Report: units completed with their commits; a table of acceptance criterion, how it was verified and the result; commands run and their results; open questions; confirmation that progress-tracker.md is updated; the next prompt (1C).
```

---

## Prompt 1C: Playlists, Responsive, Accessibility And Release Audit

```text
ROLE
You are a senior front-end engineer finishing Phase 1 of the Music Player, one reviewed unit at a time. AGENTS.md and context/ are the only source of truth. You do not invent product behaviour, scope or design.

THIS PROMPT BUILDS
Unit 07 Playlists, Unit 08 Responsive, accessibility and release audit. Specs: context/featureSpecs/07-playlists.md, 08-responsive-a11y-release-audit.md. Nothing else.

STEP 0: READ EVERYTHING FIRST
Open and read completely, in this order: AGENTS.md; context/project-overview.md; context/architecture-context.md; context/design.md; context/code-standards.md; context/security-context.md; context/ai-workflow-rules.md; context/progress-tracker.md.
Reply with a summary of at most 12 lines: what is built, the Playlist Flow, the playlist rules (names 1–60 characters, trimmed; unique songs; editing never changes the queue), the Out Of Scope list, the invariants for this prompt, and the security musts (text rendering only, validated storage). If you can't list Out Of Scope exactly, re-read.

STEP 1: CHECK THE BASE
- progress-tracker.md must show Units 01 to 06 complete. If not, stop and tell me.
- Run lint, tests and build, and play a song, reorder the queue and toggle shuffle in the dev app. Fix any failure first in its own commit.

STEP 2: BUILD THESE UNITS IN ORDER: 07, then 08
For EACH unit run this loop. Do not skip a step.

A. CONTEXT GATE (mandatory)
Re-open and re-read: the unit's spec; context/ai-workflow-rules.md "How To Work A Unit" and "Definition Of Done"; context/progress-tracker.md; context/project-overview.md "Playlist Flow" and "Core Behaviour"; context/architecture-context.md "State Model", "Storage Model" and "Invariants"; context/code-standards.md; context/design.md; context/security-context.md.
Then write a Unit brief of at most 10 lines.

B. BUILD only that unit.
- Unit 07 reuses SortableList, SongRow, SongMenu, Notice and playFromList. Don't create second versions.
- Playlist rules go in src/lib/playlists.js with tests first.

C. VERIFY
- Run lint, tests and build. Walk EVERY acceptance criterion in the real app. Run the negative tests (XSS name, unknown playlist id, unknown song id in storage, quota full).
- Unit 08: resize walk at 360, 768 and 1280px, a keyboard-only walk, a Lighthouse or axe accessibility run, npm audit --audit-level=high, and a fresh npm ci, then lint, tests and build. Re-check every criterion from Units 01 to 07.
- Apply the checklist at the end of context/security-context.md.

D. CLOSE
Update progress-tracker.md with evidence, update README.md and the context files to the real state, and commit with a conventional message.

E. SELF-AUDIT (yes or no)
Tokens only? No dead code or duplication? Within the size limits? Nothing from Out Of Scope? Editing a playlist never touches the queue? No dangerouslySetInnerHTML? Storage validated?
Continue only if all yes and every criterion passed.

HARD RULES
- Do not build anything under Out Of Scope: no import or export, no sharing, no Phase 2 items.
- A blocking ambiguity goes in Open Questions, then stop and ask me.
- Do not call a unit done unless every acceptance criterion was actually checked.

STOP CONDITION AND FINAL REPORT
Stop after Unit 08. Report: units completed with their commits; a table of acceptance criterion, how it was verified and the result, covering the re-check of Units 01–07; commands run and their results; the accessibility score; open questions; confirmation that progress-tracker.md and README.md are updated.
```

---

## Helper A: Re-Sync Prompt (use when the agent drifts or stops mid-part)

```text
Stop coding. Re-sync with the project before doing anything else.
1. Re-open and re-read, completely: AGENTS.md, context/project-overview.md, context/architecture-context.md, context/design.md, context/code-standards.md, context/security-context.md, context/ai-workflow-rules.md, context/progress-tracker.md, and the feature spec of the unit you are working on.
2. Tell me in at most 10 lines: the unit you are on, what is done, what remains, the Out Of Scope list, and any place where your last changes broke a rule in the files above.
3. Fix those rule breaks first, in a separate commit.
4. Update progress-tracker.md to the true state.
5. Resume from the Context Gate of the current unit. Do not skip any step of the unit loop.
```

## Helper B: Audit Prompt (run after every build prompt, before moving on)

```text
Do not change any code yet. Audit the work from the last prompt.
1. Re-read AGENTS.md and every file in context/, plus the feature specs for the units just built.
2. For each unit built, re-check every acceptance criterion by running the app or the tests, not by reading your own earlier report.
3. Search for violations: anything under Out Of Scope; hardcoded colours outside :root; queue or playlist rules inside components; more than one <audio> element; storage reads without validation; dangerouslySetInnerHTML; dead code; duplicated logic; unused dependencies; files or functions over the size limits; files outside the folder tree; lists keyed by index; console.log.
4. Run npm run lint, npm test, npm run build and npm audit --audit-level=high.
5. Report findings in a table: severity (high, medium, low), file, the rule broken (name the context file and section), proposed fix.
Wait for me to say which findings to fix. Then fix only those, one commit each, and re-run the checks.
```

## Helper C: Bug-Fix Prompt (for any single defect)

```text
Fix one defect. Do not add features.
Defect: [describe what you saw, the page, what you clicked, and what you expected]
1. Re-read context/ai-workflow-rules.md, context/code-standards.md, context/architecture-context.md "Invariants", and the part of context/project-overview.md that describes the expected behaviour.
2. Find the root cause. Do not layer a workaround.
3. If the cause is in src/lib, write a Vitest test that fails because of the defect first. Otherwise write down the exact steps that reproduce it in the app. Then fix it.
4. Run lint, tests and build, and walk the reproduction steps again.
5. Update progress-tracker.md if the fix changes a status, a decision or an open question.
6. Commit "fix: ..." and tell me the root cause in two lines.
```

## Helper D: Inputs Added Prompt (use if a future unit ever needs a key or file)

```text
I added these inputs: [list the variable names, or for example "the mp3s in public/songs/"].
1. Re-read context/ai-workflow-rules.md "Inputs Needed From The User" and the "Inputs Needed From User" table in context/progress-tracker.md.
2. Re-run every acceptance criterion marked "blocked on input" that these inputs unblock.
3. Run lint, tests, build and the security checklist for the affected units.
4. Update progress-tracker.md: the criteria status and the inputs table status.
5. Report which criteria now pass, which still fail or remain blocked, and any inputs still needed. Then continue the current prompt from where you left off.
```
