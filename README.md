# Loci

A personal VR contemplation tool for Meta Quest using WebXR. Notes exist as
orbs and glyphs embedded in discrete 3D environments, each with narrative
intent. Used for contemplation, reflection, memory, and creative world-building.

The name derives from the *method of loci* — the ancient memory technique of
anchoring thoughts to traversable locations.

---

## Aesthetic

- **The Beginner's Guide** — retro, vast, crisp, ambient, intentional low-fi
- **Hitman Hokkaido** — sleek, warm wood, floor-to-ceiling glass, snow peaks

---

## Stack

| Layer | Choice |
|---|---|
| Platform | Meta Quest (standalone), WebXR via browser |
| 3D renderer | React Three Fiber (R3F) |
| XR | @react-three/xr v6 |
| State | Zustand |
| Backend | Fastify + Bun + SQLite |
| Language | TypeScript (strict) |

---

## Structure

```
loci/
  .claude/
    CLAUDE.md          Project memory — read by agents every session
    ARCHITECTURE.md    Constitution — human-authored, agent read-only
    agents/            Claude Code subagent definitions (Layer 3 stubs)
  scripts/
    guard-core.sh      PreToolUse hook — blocks writes to protected paths
    log-event.sh       PostToolUse hook — observability logging
    merge-agent.sh     Merges agent-primitives base + stack + stub at runtime
  logs/
    events.jsonl       Append-only agent event log
    progress.md        Living state document — survives context resets
  specs/               Every feature starts here as a spec file
  loci-docs/           Human-only — session notes, decision logs, design docs
                       Tracked by git, excluded from agent context via .claudeignore
  frontend/src/        R3F + WebXR app
  backend/src/         Fastify API
  .claudeignore        Excludes loci-docs/ from Claude Code — git still tracks it
```

---

## Agent Architecture

Loci uses a multi-agent Claude Code setup. Agent definitions are composed
from three layers:

| Layer | Location | Content |
|---|---|---|
| 0+1 | [agent-primitives/base](https://github.com/mumoryan/agent-primitives/tree/main/base) | Identity + capability, project-agnostic |
| 2 | [agent-primitives/stacks](https://github.com/mumoryan/agent-primitives/tree/main/stacks) | Stack-specific context (R3F/WebXR, Fastify) |
| 3 | .claude/agents/ | Loci-specific constraints and overrides |

| Agent | Transformation | Model |
|---|---|---|
| orchestrator | task → routed agent call | claude-opus-4-6 |
| frontend-implementer | spec-path → frontend code | claude-sonnet-4-6 |
| backend-implementer | spec-path → API code | claude-sonnet-4-6 |
| world-builder | mood/theme → environment JSON | claude-sonnet-4-6 |
| reviewer | diff + spec → validation result | claude-haiku-4-5-20251001 |

---

## Session Lifecycle

```bash
# Start session — runs prerequisites, generates IDs, launches Claude
./scripts/loci-start.sh

# After Claude exits — syncs logs, cleans worktrees, archives
./scripts/loci-end.sh

# View observability dashboard
./scripts/dashboard.sh
```

Never run `claude` directly. Always use `loci-start.sh` — it ensures hooks
are verified, IDs are generated, and the environment is clean before any
agent starts.

---

## Observability Dashboard

Agent activity is logged to `logs/events.jsonl` and synced to `logs/observability.db` (SQLite).

```bash
# Sync latest events to database (also runs automatically at session end)
./scripts/sync-events.sh

# Launch local dashboard (auto-shuts down after 10 min idle)
./scripts/dashboard.sh
# Open http://localhost:3737
```

The dashboard shows cost by agent, cost by bucket, trace summaries, retry
rates, and daily cost trends. Agents can read from the database for
optimization analysis but cannot modify or delete entries.

## V1 Scope

1. Entry sequence — darkness → historical quote → world fade-in
2. Default Hokkaido world with time-of-day lighting
3. Notes as orbs — create, place, reveal on proximity approach
4. Note persistence via backend API
5. One additional world beyond the default