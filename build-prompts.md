# Music Player Build Prompts

There are six build prompts (1A–1C, 2A–2C), plus four helper prompts. Each build prompt has the agent re-read the context folder before it starts and again before every unit.

| Prompt | Covers | Feature specs | Status |
|--------|--------|---------------|--------|
| 1A | Foundation fixes, tokens and app shell, real durations | 01, 02, 03 | done |
| 1B | Queue, queue reorder (drag), shuffle and repeat | 04, 05, 06 | done |
| 1C | Your own library, playlists | 07, 08 | |
| 2A | Audio engine, track analysis, visualiser | 09, 10, 11 | |
| 2B | Arrange my queue, smart crossfade | 12, 13 | |
| 2C | Beat-matching (experimental), responsive/a11y/release | 14, 15 | |

The order comes from an LLM council review (2026-10-12): import comes first, because the Auto-DJ means nothing on 5 songs; the engine is rebuilt once, on its own, before any audio feature; beat-matching comes last and is confidence-gated.

Phase 3 (Media Session, keyboard shortcuts, playlist import and export, key detection) isn't prompted.

## How To Use

1. `AGENTS.md` and `context/` are already at the repository root.
2. Make sure demo tracks are in `public/songs/` (until Unit 07 replaces them with committed free-licensed tracks, they are gitignored).
3. Open a new agent conversation for each prompt, in plan mode, and paste the prompt.
4. Approve the plan only if it lists every unit in the prompt with a Context Gate before each one. If not, reply: "Revise the plan to include every unit and a Context Gate before each."
5. When the agent finishes, read its final report, then run Helper B (Audit) in the same conversation before the next prompt.
6. If the agent drifts or stops mid-way, paste Helper A (Re-sync).
7. No keys are needed. The one owner input is the free-licensed demo tracks (Unit 07); use Helper D when they're added.

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

## Shared Unit Loop (pasted inside every prompt below as STEP 2)

```text
For EACH unit, run this loop. Do not skip a step.

A. CONTEXT GATE (mandatory, even if you read the files earlier)
Re-open and re-read: the unit's feature spec in full; context/ai-workflow-rules.md "How To Work A Unit" and "Definition Of Done"; context/progress-tracker.md; context/project-overview.md "Core Behaviour" and "Auto-DJ Behaviour"; context/architecture-context.md "State Model", "Audio Engine", "Analysis Pipeline" and "Invariants"; context/code-standards.md; context/design.md (for any UI); context/security-context.md.
Then write a Unit brief of at most 10 lines: goal, files to create or change, what is NOT in this unit, the acceptance criteria you will test, and the security items that apply.

B. BUILD only that unit.
- Pure logic (src/lib, src/audio/analysis/dsp.js) and its tests FIRST, then IndexedDB/engine wiring, then UI.
- Reuse existing pieces (SortableList, SongRow, SongMenu, Notice, formatTime, the queue functions). Never create a second version.
- Validate everything read from localStorage or IndexedDB. Revoke every object URL you create.
- Every new dependency gets a line in Architecture Decisions with its version and why.

C. VERIFY
- npm run lint, npm test, npm run build, npm audit --audit-level=high.
- Walk EVERY acceptance criterion in the real app (dev server on port 5199). Mark each one pass or fail and say how you checked it. Record measurements (timings, heap, BPM tables) in the tracker.
- Run the negative tests named in the spec. Apply the checklist in context/security-context.md.
- Pace keyboard tests like a human (300 ms or more between key presses); zero-delay bursts confuse dnd-kit.
- If the dev server serves stale code (check with fetch of the module source), restart it.

D. CLOSE
Update progress-tracker.md with the evidence, update any context file whose facts changed, and commit with a conventional message.

E. SELF-AUDIT (yes or no)
Tokens only? Rules in src/lib and tested? No dead code or duplication? Dependencies recorded? Nothing from Out Of Scope? Invariants intact (count the audio elements, one decode at a time, object URLs revoked)? Storage validated?
Continue only if every answer is yes and every criterion passed or is blocked only on my input.
```

---

## Prompt 1C: Your Own Library, Playlists

```text
ROLE
You are a senior front-end engineer continuing the Music Player build, one reviewed unit at a time. AGENTS.md and context/ are the only source of truth. You do not invent product behaviour, scope or design.

THIS PROMPT BUILDS
Unit 07 Your own library, Unit 08 Playlists. Specs: context/featureSpecs/07-your-own-library.md, 08-playlists.md. Nothing else.

STEP 0: READ EVERYTHING FIRST
Read completely, in this order: AGENTS.md; context/project-overview.md; context/architecture-context.md; context/design.md; context/code-standards.md; context/security-context.md; context/ai-workflow-rules.md; context/progress-tracker.md.
Reply in at most 12 lines: what's built, the library storage model (IndexedDB stores, ids as u:<sha256>, load order), the import validation rules, the playlist rules, the Out Of Scope list, and the invariants for this prompt.

STEP 1: CHECK THE BASE
progress-tracker.md must show Units 01–06 done. Run lint, tests, build and audit, and play a song. Fix any failure first in its own commit.

STEP 2: BUILD UNITS 07, then 08, using the Shared Unit Loop.

UNIT REMINDERS
- 07: one file at a time; SHA-256 dedupe; tags sanitised in src/lib/tags.js; atomic store of blob + cover + record; persist() on the first import; the library loads before localStorage is parsed; removal cascades to the queue and playlists. The CC0 demo tracks are an owner input: ask at the end of the unit and mark that criterion blocked.
- 08: playlists hold bundled and imported ids; editing a playlist never changes the queue.

HARD RULES
No uploads or network, no tag editing, no export. A blocking ambiguity goes in Open Questions; then stop and ask. Never call a unit done unless every criterion was checked.

STOP CONDITION AND FINAL REPORT
Stop after Unit 08. Report: commits; a table of criteria, how verified and result; commands and results; open questions; inputs needed (the demo tracks); the next prompt (2A).
```

---

## Prompt 2A: Audio Engine, Track Analysis, Visualiser

```text
ROLE
You are a senior front-end and audio engineer continuing the Music Player build, one reviewed unit at a time. AGENTS.md and context/ are the only source of truth.

THIS PROMPT BUILDS
Unit 09 Audio engine, Unit 10 Track analysis, Unit 11 Visualiser. Specs: context/featureSpecs/09-audio-engine.md, 10-track-analysis.md, 11-visualiser.md. Nothing else.

STEP 0: READ EVERYTHING FIRST
Read completely, in this order: AGENTS.md and every context file. Reply in at most 12 lines: the two-deck engine graph, why createMediaElementSource must live in a module singleton, the analysis pipeline (where decoding runs, the sample rate, the worker hand-off, caching, v), how energy is derived, Invariants 1, 2, 9, 10, and the Out Of Scope list.

STEP 1: CHECK THE BASE
Units 01–08 must be done. Run lint, tests, build and audit, play a bundled and an imported song, and drag the queue. Fix failures first.

STEP 2: BUILD UNITS 09, then 10, then 11, using the Shared Unit Loop.

UNIT REMINDERS
- 09: NO new features. It's a pure engine swap, then a full regression walk of Units 01–08, criterion by criterion. This is the riskiest refactor in the project; do not combine it with anything else.
- 10: decode on the main thread at 11025 Hz mono, DSP in a Worker, one song at a time. Benchmark web-audio-beat-detector against the in-house estimateBpm on the fixtures plus 5 real songs, and keep ONE. Record the BPM table, the longest main-thread task and the heap peak. BPM is approximate: always show "~", always allow Fix tempo.
- 11: draw on the canvas directly; zero React renders per frame (prove it with the Profiler).

HARD RULES
No crossfades yet (that's Unit 13). No pitch-preserving stretch. A blocking ambiguity: stop and ask. Never call a unit done unless every criterion was checked.

STOP CONDITION AND FINAL REPORT
Stop after Unit 11. Report as in 1C, plus the BPM accuracy table and the performance numbers. Next prompt: 2B.
```

---

## Prompt 2B: Arrange My Queue, Smart Crossfade

```text
ROLE
You are a senior front-end and audio engineer continuing the Music Player build. AGENTS.md and context/ are the only source of truth.

THIS PROMPT BUILDS
Unit 12 Arrange my queue, Unit 13 Smart crossfade. Specs: context/featureSpecs/12-arrange-my-queue.md, 13-smart-crossfade.md. Nothing else.

STEP 0: READ EVERYTHING FIRST
Read AGENTS.md and every context file. Reply in at most 12 lines: the arc shape and the tempo pass, the undo rule, the transition plan (startAt, nextOffset, every no-crossfade case), every mid-fade cancellation rule, Invariants 2 and 3, and Out Of Scope.

STEP 1: CHECK THE BASE
Units 01–11 must be done. Run lint, tests, build and audit; play, drag, and confirm analysis results exist. Fix failures first.

STEP 2: BUILD UNITS 12, then 13, using the Shared Unit Loop.

UNIT REMINDERS
- 12: arrange is a pure function over the items after the current one; test the arc SHAPE, not exact orders. Undo is one level and clears on any other queue change.
- 13: all fade timing is on the audio clock. The next item becomes current when the fade STARTS. Test every mid-fade interruption and check both decks' state in the console each time. Exactly one song is audible after any interruption.

HARD RULES
No beat-matching yet. A blocking ambiguity: stop and ask. Never call a unit done unless every criterion was checked.

STOP CONDITION AND FINAL REPORT
Stop after Unit 13. Report as in 1C, plus the before/after energy sequence and the mid-fade test table. Next prompt: 2C.
```

---

## Prompt 2C: Beat-Matching (experimental), Responsive, Accessibility And Release

```text
ROLE
You are a senior front-end and audio engineer finishing the Music Player. AGENTS.md and context/ are the only source of truth.

THIS PROMPT BUILDS
Unit 14 Beat-matching, Unit 15 Responsive, accessibility and release. Specs: context/featureSpecs/14-beat-matching.md, 15-responsive-a11y-release.md. Nothing else.

STEP 0: READ EVERYTHING FIRST
Read AGENTS.md and every context file. Reply in at most 12 lines: Invariant 11 (the gating), why media elements can't be beat-matched (start jitter) and what the AudioBuffer path does, the buffer-to-element handoff, the GitHub Pages requirements (base, 404 fallback, CSP), and Out Of Scope.

STEP 1: CHECK THE BASE
Units 01–13 must be done. Run lint, tests, build and audit, and do one crossfade transition. Fix failures first.

STEP 2: BUILD UNITS 14, then 15, using the Shared Unit Loop.

UNIT REMINDERS
- 14: prove the timing with an OfflineAudioContext render of two click tracks (within 10 ms). Do a listening session on 5 real transitions. If any sounds worse than the smart crossfade, tighten the gates. If it still fails, ship it off by default with an honest README note; that is an acceptable outcome.
- 15: re-check EVERY criterion from Units 01–14, deploy to GitHub Pages, and test the live URL.

HARD RULES
No pitch-preserving stretch, no key detection, no Phase 3. Never call a unit done unless every criterion was checked.

STOP CONDITION AND FINAL REPORT
Stop after Unit 15. Report as in 1C, plus the beat-match timing results, the listening notes, the accessibility scores and the live URL.
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
3. Search for violations: anything under Out Of Scope; hardcoded colours outside :root; queue or playlist rules inside components; the wrong number of <audio> elements (1 before Unit 09, exactly 2 engine decks after); object URLs not revoked; more than one decode at a time; storage reads without validation; dangerouslySetInnerHTML; dead code; duplicated logic; unused dependencies; files or functions over the size limits; files outside the folder tree; lists keyed by index; console.log.
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
