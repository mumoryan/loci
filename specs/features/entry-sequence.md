# Spec: Entry Sequence
_Status: implemented | Created: 2026-04-02 | Merged: PR #11, PR #14 | Agent: frontend-implementer_

---

## What This Is

The experience a user has from session start to arriving in their default world.
This is the first thing seen every time Loci is opened.

---

## Sequence

```
0s      Darkness — full black, silence
1s      Historical quote fades in (white text, centre screen, 1s)
2s      Quote holds (2s)
4s      World fades in + quote fades out concurrently (1s)
4s      Ambient world audio begins (quiet, underneath)
5s      Complete
```

Total duration: ~5 seconds. All timings are constants, not hardcoded values.

Note: quote fade-out is not a discrete phase — it runs concurrently with WORLD_FADE_IN,
driven by the same timer. The scene background is set to pure black (`<color attach="background">`)
rather than a darkness overlay mesh, avoiding z-ordering conflicts with the WebXR compositor.

---

## Acceptance Criteria

- [x] Session opens to full black — no flash of 3D scene
- [x] A quote is selected randomly from `frontend/src/data/quotes.ts`
- [x] Quote renders using troika-three-text, centred, white, readable in VR
- [x] Quote fades in over 1s, holds for 2s, fades out concurrently with world fade-in over 1s
- [x] World fades in over 1s after quote hold ends
- [x] All timing values are exported constants in `frontend/src/constants/timing.ts`
- [x] No DOM elements used — all rendering via R3F
- [ ] Runs at 72fps on Quest — headset test pending

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
  DARKNESS_HOLD_MS: 1000,
  QUOTE_FADE_IN_MS: 1000,
  QUOTE_HOLD_MS: 2000,
  AUDIO_START_OFFSET_MS: 4000,
  WORLD_FADE_IN_MS: 1000,
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
