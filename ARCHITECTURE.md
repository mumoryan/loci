# Loci — Architecture
_Human-authored. Read-only for all agents. Last updated: 2026-04-02._

---

## What Loci Is

A personal VR contemplation tool for Meta Quest using WebXR. Notes exist as
orbs/glyphs embedded in discrete 3D environments, each with narrative intent.
Used for contemplation, reflection, memory, and creative world-building.

Name derives from the method of loci — the ancient memory technique of
anchoring thoughts to traversable locations.

Aesthetic references:
- **The Beginner's Guide** — retro, vast, crisp, ambient, intentional low-fi
- **Hitman Hokkaido** — sleek, warm wood, floor-to-ceiling glass, snow peaks

---

## Platform

- **VR only** — AR ruled out. Environmental control is core to the experience.
- **Primary target:** Meta Quest (standalone, WebXR via browser)
- **Secondary:** PC VR via browser
- **Distribution:** URL — no app store

---

## Stack

### Frontend
| Concern | Choice | Reason |
|---|---|---|
| 3D renderer | React Three Fiber (R3F) | TS-native, fast iteration, Quest browser support |
| XR | @react-three/xr v6 | Cross-platform WebXR |
| Text | troika-three-text | Crisp SDF text in VR |
| State | Zustand | Lightweight, R3F-compatible |
| Language | TypeScript strict | Type safety throughout |

### Backend
| Concern | Choice | Reason |
|---|---|---|
| Runtime | Bun | Fast, TS-native, single binary |
| Framework | Fastify | Mature, typed, plugin ecosystem |
| Database | SQLite (V1) | Zero-infra, sufficient for single user |
| Language | TypeScript strict | Consistent with frontend |

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

The V1 → multi-user gap is a WebSocket layer and sessions table.
The schema does not change.

---

## Agent Architecture

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
      settings.json            Hook config
      agents/                  Layer 3: Loci-specific stubs
    scripts/                   guard-core.sh, log-event.sh, merge-agent.sh
    logs/                      events.jsonl, progress.md, loci.db
    specs/                     Feature specs — all features start here
    frontend/src/
    backend/src/
```

### Agent registry

| Agent | Transformation | Model | Sensitive data |
|---|---|---|---|
| orchestrator | task → routed agent call | claude-opus-4-6 | false |
| frontend-implementer | spec-path → frontend code | claude-sonnet-4-6 | false |
| backend-implementer | spec-path → API code | claude-sonnet-4-6 | false |
| world-builder | mood/theme → environment JSON | claude-sonnet-4-6 | true |
| reviewer | diff + spec → validation result | claude-haiku-4-5-20251001 | false |

### Dispatch rules
1. No spec → no dispatch. Orchestrator writes spec first.
2. Specialists receive spec file paths only — never freeform descriptions.
3. Sensitive data (note content) flows only to world-builder, stripped from all others.
4. Reviewer runs after every implementation. Escalates failures to orchestrator.
5. Human approval required for all world-builder outputs.

### Protected paths (guard-core.sh blocks all agent writes)
`.claude/`, `ARCHITECTURE.md`, `CLAUDE.md`, `mcp.json`, `agents/`

### Observability
- Every tool call → one line appended to `logs/events.jsonl`
- Orchestrator reads/writes `logs/progress.md` each session
- SQLite dashboard synced from events.jsonl on session end

---

## Locked Product Decisions

These are final for V1. Do not revisit without explicit human instruction.

| Decision | Value |
|---|---|
| Note form | Orbs/glyphs — reveal text at 2m proximity radius |
| Entry sequence | Darkness → historical quote fade → ambient world (~8s total) |
| Quote source | Hardcoded in `frontend/src/data/quotes.ts` |
| Default world | Hokkaido-inspired mansion |
| Time-of-day lighting | Keyed to device clock |
| Planned worlds | Story tower, thought gallery, principles temple |
| Bloom | Fake — additive emissive halos. Never UnrealBloomPass. |
| AR | Ruled out permanently |
| Multi-user V1 | No |
| Cloud V1 | No |

---

## V1 Scope

Minimum viable experience that feels complete:
1. Entry sequence (darkness → quote → world)
2. Default Hokkaido world with time-of-day lighting
3. Notes as orbs — create, place, reveal on approach
4. Basic note persistence via backend API
5. One additional world beyond the default
