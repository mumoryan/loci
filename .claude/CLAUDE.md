# Loci — Project Memory
_Read by Claude Code at the start of every session. Human-authored._

---

## What This Project Is

Loci is a personal VR contemplation tool for Meta Quest using WebXR. Notes
exist as orbs/glyphs in discrete 3D environments with narrative intent.
Notes are primary; worlds are atmosphere.

---

## Stack

- **Frontend:** React Three Fiber + @react-three/xr v6 + troika-three-text + Zustand. TypeScript strict.
- **Backend:** Fastify + Bun + SQLite (V1). TypeScript strict.
- **Platform:** Meta Quest standalone (primary), PC VR via browser (secondary). WebXR, no app store.
- **Infrastructure:** Local only for V1. No cloud.

---

## Repo Layout

```
~/Development/loci-root/
  agent-primitives/              Shared base definitions (own git repo)
    base/                        Layer 0+1: identity + capability contracts
      orchestrator.md            Supervisor base
      spec-to-code.md           Implementer base (frontend + backend share this)
      world-builder.md          World builder base
      reviewer.md               Reviewer base
    stacks/                      Layer 2: stack-specific context
      r3f-webxr.md
      ts-fastify.md
    schema/                      Contract schema definition
      agent-contract.md          Schema v2 — all agents conform to this

  loci/                          This repo
    .claude/
      CLAUDE.md                  This file
      settings.json              Hook config (PreToolUse + PostToolUse)
      agents/                    Layer 3: Loci-specific stubs
        supervisor.md
        frontend-implementer.md
        backend-implementer.md
        world-builder.md
        reviewer.md
    scripts/
      guard-core.sh              PreToolUse — blocks writes to protected paths
      log-event.sh               PostToolUse — observability logging
      merge-agent.sh             Concatenates base + stack + stub at session start
    logs/
      events.jsonl               Append-only structured event log
      progress.md                Living state doc — supervisor reads/writes each session
    specs/
      features/                  User-facing capabilities
        entry-sequence.md
      refactors/                 Structural changes, renames, dependency upgrades
      optimizations/             Periodic performance + architecture reviews
      architecture/              Contract changes, agent definition proposals
        contract-schema-v2.md
    loci-docs/                   Human-only — excluded via .claudeignore
    frontend/src/
    backend/src/
    ARCHITECTURE.md              Constitution — read this, never write to it
```

---

## Agent Registry

| Agent | Transformation | Model | Sensitive data |
|---|---|---|---|
| supervisor | task → routed agent call | claude-opus-4-6 | false |
| frontend-implementer | spec-path → frontend code | claude-sonnet-4-6 | false |
| backend-implementer | spec-path → API code | claude-sonnet-4-6 | false |
| world-builder | mood/theme → environment JSON | claude-sonnet-4-6 | true |
| reviewer | diff + spec → validation result | claude-haiku-4-5-20251001 | false |

All agents conform to agent contract schema v2 (see agent-primitives/schema/agent-contract.md).

Frontend and backend implementers share the same base (spec-to-code.md).
Differentiation happens at the Layer 3 stub level.

---

## Dispatch Rules

1. No spec → no dispatch. Supervisor writes spec first.
2. Specialists receive spec file paths only — never freeform descriptions.
3. Sensitive data (note content) flows only to world-builder.
4. Reviewer runs after every implementation. Escalates to supervisor on failure.
5. Human approval required for all world-builder outputs.
6. Max 2 retry iterations per agent per spec. Third failure → blocker, human resolves.

---

## Spec Categories

| Directory | Purpose | Workflow |
|---|---|---|
| specs/features/ | User-facing capabilities | Supervisor → implementer → reviewer → human headset test |
| specs/refactors/ | Structural changes | Supervisor → implementer → reviewer |
| specs/optimizations/ | Performance + architecture reviews | Periodic or on-demand, confidence-based autonomy |
| specs/architecture/ | Contract and agent definition changes | Produces recommendations, human executes |

---

## Protected Paths

guard-core.sh blocks all agent writes to:
`.claude/`, `ARCHITECTURE.md`, `CLAUDE.md`, `mcp.json`, `agents/`

Agents have full write access to `frontend/`, `backend/`, `specs/`.

---

## Data Model Rules

Every table must include: `id`, `owner_id`, `world_id`, `created_at`, `updated_at`.
No exceptions. Schema is multi-user ready from day one.

---

## Quest Rendering Budget

- Fake bloom only — additive emissive halos. Never UnrealBloomPass.
- MeshBasicMaterial / MeshToonMaterial. No dynamic shadows.
- No post-processing. No real-time GI.
- Instanced geometry for repeated objects (orbs).
- 72fps minimum, 90fps target. ~4ms frame budget per eye.

---

## Locked Product Decisions

Do not revisit without explicit human instruction:

- Note form: orbs/glyphs, text reveals at 2m proximity
- Entry sequence: darkness → historical quote fade → ambient world (~8s)
- Default world: Hokkaido mansion (Hitman GAMA-inspired)
- Time-of-day lighting keyed to device clock
- Planned worlds: story tower, thought gallery, principles temple
- VR only — AR ruled out permanently
- No multiplayer, no cloud in V1

---

## Observability

- Every tool call → one JSON line to logs/events.jsonl via log-event.sh
- Zero tokens — runs outside agent context
- Agents never re-read events.jsonl
- Supervisor summarises cost in logs/progress.md
- Four cost buckets: code_generation, world_building, review, orchestration

---

## Current Status

- Sessions 01–04 complete
- Both repos on GitHub (private)
- Agent contract schema v2 applied to all agents
- Reviewer renamed from code-reviewer, transformation generalized
- Spec directory structure established (features, refactors, optimizations, architecture)
- First feature spec (entry-sequence.md) ready for dispatch
- Known debug: hook field names showing as `unknown` in log output

---

## Open Items

- Optimization loop spec (periodic review process — designed, not implemented)
- WorldDiff TypeScript type (world-builder output contract)
- Git access policy (branch+commit for implementers, read-only for reviewer)
- Observability dashboard (SQLite schema + browser UI)
- Data privacy / e2e encryption (post-PoC)