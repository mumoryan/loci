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
    scripts/                     Reusable infrastructure scripts
      start.sh                   Session bootstrap, prereqs, ID generation
      dispatch.sh                Prepare worktree for agent instance
      end.sh                     Teardown, log sync, worktree cleanup
      guard-supervisor.sh        Bash allowlist for supervisor agent
    observability/               Reusable observability tooling
      schema.sql
      sync-events.sh
      dashboard.ts

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
      guard-supervisor.sh         PreToolUse — bash allowlist for supervisor
      log-event.sh               PostToolUse — observability logging
      merge-agent.sh             Concatenates base + stack + stub at session start
      loci-start.sh              Wrapper → agent-primitives/scripts/start.sh
      loci-dispatch.sh           Wrapper → agent-primitives/scripts/dispatch.sh
      loci-end.sh                Wrapper → agent-primitives/scripts/end.sh
      sync-events.sh             Wrapper → agent-primitives/observability/sync-events.sh
      dashboard.sh               Wrapper → agent-primitives/observability/dashboard.ts
    logs/
      events.jsonl               Append-only structured event log
      observability.db           SQLite — synced from events.jsonl (gitignored)
      progress.md                Living state doc — supervisor reads/writes each session
      archive/                   Session snapshots
      reviews/                   Optimization review reports
    specs/
      features/                  User-facing capabilities
        entry-sequence.md
      refactors/                 Structural changes
      optimizations/             Periodic performance + architecture reviews
        TEMPLATE.md
      architecture/              Contract changes, agent definition proposals
    worktrees/                   Transient agent working directories (gitignored)
    loci-docs/                   Human-only — excluded via .claudeignore
    frontend/src/
    backend/src/
    ARCHITECTURE.md              Constitution — read this, never write to it
```

---

## Session Lifecycle

Never run `claude` directly. Sessions are managed by infrastructure scripts.

```
Human runs: loci-start.sh
  → Prerequisites verified
  → Session/trace IDs generated (LOCI_SESSION_ID, LOCI_TRACE_ID)
  → Hooks verified
  → Claude Code launched

Supervisor works:
  → Reads CLAUDE.md, progress.md, spec
  → Calls loci-dispatch.sh to prepare worktrees
  → Dispatches subagents into worktrees
  → Subagents do git operations via GitHub MCP (agent identity preserved)
  → Routes to reviewer, handles retry loop
  → Updates progress.md

Human runs: loci-end.sh
  → Events synced to observability DB
  → Merged worktrees cleaned up
  → Session archived
```

AI handles judgment (spec decomposition, code, review). Scripts handle
mechanics (worktrees, IDs, hooks, cleanup).

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

---

## Dispatch Rules

1. No spec → no dispatch. Supervisor writes spec first.
2. Specialists receive spec file paths only — never freeform descriptions.
3. Sensitive data (note content) flows only to world-builder.
4. Reviewer runs after every implementation. Escalates to supervisor on failure.
5. Human approval required for all world-builder outputs.
6. Max 2 retry iterations per agent per spec. Third failure → blocker, human resolves.
7. Before dispatching, run `loci-dispatch.sh` to prepare the worktree.
8. Max 5 parallel implementer instances (enforced by dispatch.sh).

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

guard-supervisor.sh restricts supervisor bash to approved scripts and
read-only commands only.

Agents have full write access to `frontend/`, `backend/`, `specs/`.

---

## Git Operations

Agents do all git operations via GitHub MCP with per-role tokens:
- Supervisor: read-only (repos, PRs, issues)
- Implementers: read/write code, create PRs (cannot merge)
- Reviewer: read code, approve/merge PRs (cannot push code)
- World-builder: no git access

Branch naming: `<agent>-<instance>/<category>/<spec-name>`
Implementers work in isolated worktrees created by dispatch.sh.
Scripts/ directory is not visible to any agent except supervisor.

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
- Agents can read logs/observability.db (read-only). Never modify or delete.
- Supervisor syncs events at session end via sync-events.sh
- Dashboard: `./scripts/dashboard.sh` → localhost:3737 (10-min auto-shutdown)
- Four cost buckets: code_generation, world_building, review, orchestration

---

## Current Status

- Sessions 01–04 complete
- Both repos on GitHub (private, GitHub Pro)
- Agent contract schema v2 applied to all agents
- Reviewer renamed from code-reviewer, transformation generalized
- Spec directory structure established
- GitHub MCP: 3 per-role fine-grained PATs, branch protection via `agentic-main-protection` ruleset
- Optimization loop designed (template at specs/optimizations/TEMPLATE.md)
- Observability dashboard designed (agent-primitives/observability/)
- Scripted infrastructure layer implemented (start.sh, dispatch.sh, end.sh, guard-supervisor.sh)
- Known bug: log-event.sh field extraction — all fields show "unknown". Debugging in progress.
- Next action: fix log-event.sh, then run entry sequence via loci-start.sh

---

## Open Items

- Fix log-event.sh hook payload field mapping
- WorldDiff TypeScript type (deferred until first world is built)
- Data privacy / e2e encryption (post-PoC)