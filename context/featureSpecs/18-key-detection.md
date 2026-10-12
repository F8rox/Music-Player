Read the 'AGENTS.md' before starting

# Unit 18: Musical Key Detection

## Goal
Each song gets a musical key (for example, A minor) with a confidence value, shown on its row.

## Depends On
10.

## Build
- In-house chroma (pitch-class profile) + Krumhansl–Schmuckler key profiles in `dsp.js` (no AGPL code); analysis version bumps to 2 so songs are re-analysed once.
- Camelot notation for compatibility (for example, 8A); show the key next to the BPM.

## Acceptance Criteria
- [ ] Tests: synthetic C-major and A-minor chord tones detected; noise gives low confidence.
- [ ] Owner spot-checks 5 songs against published keys (within the same or a relative key).
- [ ] Re-analysis runs once, then is cached.
