# Spec: Entry Sequence
_Status: ready | Created: 2026-04-02 | Agent: frontend-implementer_

---

## What This Is

The experience a user has from session start to arriving in their default world.
This is the first thing seen every time Loci is opened.

---

## Sequence

```
0s      Darkness — full black, silence
2s      Historical quote fades in (white text, centre screen)
5s      Quote fades out
6s      Ambient world audio begins (quiet, underneath)
8s      World fades in — Hokkaido mansion, time-of-day lighting
```

Total duration: ~8 seconds. All timings are constants, not hardcoded values.

---

## Acceptance Criteria

- [ ] Session opens to full black — no flash of 3D scene
- [ ] A quote is selected randomly from `frontend/src/data/quotes.ts`
- [ ] Quote renders using troika-three-text, centred, white, readable in VR
- [ ] Quote fades in over 1s, holds for 2s, fades out over 1s
- [ ] World fades in over 2s after quote exits
- [ ] All timing values are exported constants in `frontend/src/constants/timing.ts`
- [ ] No DOM elements used — all rendering via R3F
- [ ] Runs at 72fps on Quest — no heavy computation during sequence

---

## Files to Create

```
frontend/src/components/EntrySequence.tsx   Main sequence component
frontend/src/data/quotes.ts                 Quote data (min 12 quotes)
frontend/src/constants/timing.ts            All timing constants
```

---

## Quote Data Shape

```typescript
export interface Quote {
  text: string
  author: string
}

export const quotes: Quote[] = [
  // minimum 12 entries
  // historical figures only — philosophers, writers, scientists
  // themes: memory, contemplation, space, thought, time
]
```

---

## Timing Constants Shape

```typescript
export const ENTRY_TIMING = {
  DARKNESS_HOLD_MS: 2000,
  QUOTE_FADE_IN_MS: 1000,
  QUOTE_HOLD_MS: 2000,
  QUOTE_FADE_OUT_MS: 1000,
  AUDIO_START_OFFSET_MS: 6000,
  WORLD_FADE_IN_MS: 2000,
} as const
```

---

## Constraints

- No post-processing effects during entry sequence (GPU budget)
- troika-three-text only — no HTML/CSS text
- Quote selection must be deterministic per session (seed from session start time)
  so the same quote doesn't repeat twice in a row
- World component is a stub for now — a placeholder mesh is acceptable
  until the Hokkaido world is built

---

## Out of Scope for This Spec

- Hokkaido world implementation (separate spec)
- Audio implementation (separate spec)
- Note orbs (separate spec)
