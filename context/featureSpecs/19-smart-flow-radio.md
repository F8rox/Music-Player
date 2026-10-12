Read the 'AGENTS.md' before starting

# Unit 19: Smart Flow and Radio

## Goal
'Start radio from this song' fills the queue with similar songs, ordered so tempo, key and energy flow; each pick shows why it was chosen.

## Depends On
12, 17, 18.

## Build
- Pure `src/lib/radio.js`: a similarity score (folded tempo distance, Camelot neighbours, energy distance) and a greedy flow ordering; returns picks with reason strings.
- A song menu item 'Start radio'; queue items carry an optional reason shown in Up next.
- Beat-matching benefits automatically, because neighbouring songs now share tempo and key.

## Acceptance Criteria
- [ ] Tests: the seed is first; the picks are the most similar; adjacent steps stay within tolerance where possible; reasons are correct.
- [ ] In the app: radio from a 120 BPM song yields neighbours within ±6% BPM where the library allows; reasons are visible.
