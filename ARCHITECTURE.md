# Loci — Architecture
_Human-authored. Read-only for all agents. Last updated: 2026-04-13._

---

## What Loci Is

A personal VR mind palace for Meta Quest using WebXR. A spatial container
for the full texture of your inner life — thoughts, sounds, images, objects,
moments — anchored in worlds you build, that you can re-enter to think, feel,
and remember.

Name derives from the method of loci — the ancient memory technique of
anchoring thoughts to traversable locations.

**One-sentence value proposition:**
> A place to think out loud — in any form — and come back to.

**The core insight:** Insights don't survive being written down. They survive
being *somewhere*. The act of returning to a thought anchored in a place
recreates the mental state that produced it. This is what breaks the loop.

**Two things that are equally important:**
- **Expression is generative.** Writing, talking, recording — this is how
  insights form, not just how they're captured. Loci must encourage freeform
  input in any medium.
- **Return is transformative.** Coming back to a thought anchored in a place
  you remember recreates the state that made it matter.

**Memory types beyond text** (not V1, but schema-ready): sounds, images,
video, 3D objects, holograms — all should share the same elusive,
proximity-based spatial property as text notes. The medium changes; the
experience of encountering something you left behind does not.

Aesthetic references:
- **The Beginner's Guide** — retro, vast, crisp, ambient, intentional low-fi
- **Hitman Hokkaido** — sleek, warm wood, floor-to-ceiling glass, snow peaks

---

## Platform

- **VR only** — AR ruled out. Environmental control is core to the experience.
- **Primary target:** Meta Quest (standalone, WebXR via browser)
- **Secondary:** PC VR via browser, Pico and other OpenXR-compliant headsets
- **Distribution:** URL — no app store
- **Hardware agnostic:** Stay within WebXR standard and @react-three/xr.
  Never use Quest-specific APIs directly.

---

## Stack

### Frontend
| Concern | Choice | Reason |
|---|---|---|
| 3D renderer | React Three Fiber (R3F) | TS-native, fast iteration, Quest browser support |
| WebGPU renderer | R3F WebGPU backend | High-Fidelity tier on PCVR — renderer swap, not a rewrite |
| XR | @react-three/xr v6 | Cross-platform WebXR, hardware agnostic |
| Text | troika-three-text | Crisp SDF text in VR |
| State | Zustand | Lightweight, R3F-compatible |
| Language | TypeScript strict | Type safety throughout |

### Backend
| Concern | Choice | Reason |
|---|---|---|
| Runtime | Bun | Fast, TS-native, single binary |
| Framework | Fastify | Mature since 2016, typed, plugin ecosystem |
| Database | SQLite (V1) | Zero-infra, sufficient for single user |
| Language | TypeScript strict | Consistent with frontend |

## Rendering Tiers

Two tiers, one codebase. Detected automatically at session start, persisted
to user preferences. User can override in settings.

| Tier | Target | Renderer | Detection signal |
|---|---|---|---|
| Standard | Quest standalone | WebGL | WebGPU unavailable or mobile-class texture limits |
| High-Fidelity | PCVR via Chrome/Edge + OpenXR | WebGPU | WebGPU available + desktop-class texture limits |

### Per-tier strategy

| Feature | Standard | High-Fidelity |
|---|---|---|
| Materials | MeshBasicMaterial | MeshStandardMaterial (PBR) |
| Bloom | Standard: fake emissive halos. High-Fidelity: real WebGPU post-processing. Never UnrealBloomPass. |
| Rendering tiers | Two tiers auto-detected at session start, user-overridable in settings. Standard (WebGL) for Quest standalone, High-Fidelity (WebGPU) for PCVR. |
| Shadows | Baked only | Dynamic soft shadows |
| Lighting | Hemisphere + ambient | Full dynamic lighting |
| Textures | KTX2/Basis Universal compressed | Full resolution |

### Asset authoring standard
Assets authored once at high resolution. KTX2/Basis Universal compressed
variants served to Standard tier. No separate asset pipelines.

### Constraints
- High-Fidelity tier is V1 scope, not PoC.
- Hokkaido is the first world to implement both tiers.
- No native app. URL distribution holds for both tiers.
- PCVR users connect via Chrome/Edge with SteamVR or Oculus as OpenXR runtime.
- WebGPU + WebXR is still maturing — monitor browser support before shipping.

### Infrastructure
- **V1:** Local only. No cloud.
- **Multi-user trigger:** A second human user joins. Not a performance metric.
- **Migration path:** SQLite → Postgres + pgvector when multi-user trigger hit.
- **Cloud:** Fly.io or Railway. GCP explicitly ruled out (longevity concerns).

---

## Data Model Principles

Every table includes from day one:
- `id` — primary key
- `owner_id` — single user in V1, multi-user ready
- `world_id` — scopes all data to a world
- `created_at`, `updated_at` — ISO8601 UTC
- `media_type` — enum: text | audio | image | video | object (text only in V1)

`media_type` is included now so the schema never changes when new memory types
arrive. V1 only writes and reads `text` values.

The V1 → multi-user gap is a WebSocket layer and sessions table.
The schema does not change.

---

## Agent Architecture

### Session lifecycle

Never run `claude` directly. Always use `loci-start.sh` — it ensures hooks
are verified, IDs are generated, and the environment is clean before any
agent starts.

```bash
./scripts/loci-start.sh   # start session
./scripts/loci-end.sh     # sync logs, clean worktrees, archive
./scripts/dashboard.sh    # observability dashboard
```

### Repo structure
```
~/Development/loci-root/
  agent-primitives/            Shared base definitions (own git repo)
    base/                      Layer 0+1: identity + capability
    stacks/                    Layer 2: stack-specific context
  loci/                        Loci monorepo (this repo)
    .claude/
      CLAUDE.md                Project memory (agents read this)
      ARCHITECTURE.md          This file (agents read, never write)
      settings.json            Hook config (PreToolUse + PostToolUse)
      agents/                  Layer 3: Loci-specific stubs
    scripts/
      guard-core.sh            PreToolUse — blocks writes to protected paths
      agent-log.sh             PostToolUse — structured session logging
      new-agent-worktree.sh    Sparse checkout per agent worktree
      loci-start.sh            Session bootstrap — always use this, never claude directly
      loci-end.sh              Teardown, log sync, worktree cleanup
      sync-events.sh           Syncs events.jsonl → observability.db
      dashboard.sh             Launches observability dashboard on localhost:3737
    logs/
      events.jsonl             Append-only agent event log
      observability.db         SQLite synced from events.jsonl (gitignored)
      progress.md              Living state doc — survives context resets
    specs/                     Feature specs — all features start here
    worktrees/                 Transient agent working dirs (gitignored)
    loci-docs/                 Human-only — excluded via .claudeignore
    frontend/src/
    backend/src/
    .claudeignore              Excludes loci-docs/ from Claude Code context
```

### Agent registry

| Agent | Transformation | Model | Sensitive data |
|---|---|---|---|
| supervisor | task → routed agent call | claude-opus-4-6 | false |
| frontend-implementer | spec-path → frontend code | claude-sonnet-4-6 | false |
| backend-implementer | spec-path → API code | claude-sonnet-4-6 | false |
| world-builder | mood/theme → environment JSON | claude-sonnet-4-6 | true |
| reviewer | diff + spec → validation result | claude-haiku-4-5-20251001 | false |

### Dispatch rules
1. No spec → no dispatch. Supervisor writes spec first.
2. Specialists receive spec file paths only — never freeform descriptions.
3. Sensitive data (note content) flows only to world-builder, stripped from all others.
4. Reviewer runs after every implementation. Escalates failures to supervisor.
5. Human approval required for all world-builder outputs.
6. Max 2 retry iterations per agent per spec. Third failure → human resolves.

### Protected paths (guard-core.sh blocks all agent writes)
`.claude/`, `ARCHITECTURE.md`, `CLAUDE.md`, `mcp.json`, `agents/`

### Observability
- Every tool call → one JSON line to `logs/session-{PPID}.log`
- Four fields per line: timestamp, agent, task, action
- One log file per Claude Code invocation (PPID as session anchor)
- `logs/` is gitignored — never committed

Events sync to `logs/observability.db` (SQLite). Dashboard at localhost:3737,
auto-shuts down after 10 min idle. Shows cost by agent, cost by bucket, trace
summaries, retry rates, daily trends. Agents can read but never modify.

```bash
./scripts/sync-events.sh  # sync events.jsonl → observability.db
./scripts/dashboard.sh    # launch dashboard
```

---

## Locked Product Decisions

These are final for V1. Do not revisit without explicit human instruction.

| Decision | Value |
|---|---|
| Core interaction | Expression + return — equally weighted |
| Note form | Orbs/glyphs — reveal content at 2m proximity radius |
| Memory types V1 | Text only — schema ready for audio/image/video/object |
| Entry sequence | Darkness → historical quote fade → ambient world (~8s total) |
| Entry purpose | State change from ordinary life to reflection — not just animation |
| Quote source | Hardcoded in `frontend/src/data/quotes.ts` |
| Default world | Hokkaido mansion — see hokkaido-mansion-design.md |
| Time-of-day lighting | Keyed to real device clock — morning/afternoon/evening |
| Planned worlds | Story tower, thought gallery, principles temple |
| Bloom | Fake — additive emissive halos. Never UnrealBloomPass. |
| AR | Ruled out permanently |
| Multi-user V1 | No |
| Cloud V1 | No |
| Hardware | WebXR standard only — never Quest-specific APIs |
| Desktop nav | WASD + mouse look via @react-three/drei — disabled when isPresenting |

---

## Rendering Constraints

### Standard tier (Quest standalone)
**Forbidden:**
- UnrealBloomPass or any full-screen post-processing
- Dynamic shadows — baked lighting only
- Real-time global illumination
- Particle counts above 2,000
- DOM UI overlays inside VR session
- Uncompressed textures
**Approved:**
- Fake bloom: emissive MeshBasicMaterial + additive halo mesh behind object
- Ambient shifts: interpolated hemisphere light + fog keyed to device clock
- Text: troika-three-text (SDF) only — no canvas textures
- State: Zustand for world state, React state for UI only

### High-Fidelity tier (PCVR)
**Approved additions over Standard:**
- Real bloom via WebGPU post-processing
- Dynamic soft shadows
- MeshStandardMaterial with PBR textures
- Full-resolution KTX2 textures
- Screen-space ambient occlusion

---

## V1 Scope

Minimum viable experience that feels complete:
1. Entry sequence (darkness → quote → world) — ritual state change
2. Default Hokkaido mansion with time-of-day lighting
3. Notes as orbs — create via voice/controller/import, reveal on approach
4. Basic note persistence via backend API
5. Desktop WASD navigation (non-VR fallback)
6. One additional world beyond the default
7. High-Fidelity rendering tier for PCVR (Hokkaido as first dual-tier world)

### Current status

| Item | Status |
|---|---|
| Entry sequence (darkness → quote → world) | Done — PR #11, #14 |
| Frontend scaffold (Vite + R3F + XR + HTTPS) | Done — PR #12 |
| Default Hokkaido mansion with time-of-day lighting | Not started |
| Notes as orbs — create, place, reveal on proximity | Not started |
| Note persistence via backend API | Not started |
| Desktop WASD navigation | Spec written |
| One additional world beyond the default | Not started |