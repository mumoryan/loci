# Loci — Session 03 Summary
**Type:** Architecture design + scaffold  
**Status:** Complete — ready for first agent run  
**Next step:** Run entry sequence spec via supervisor agent in Claude Code

---

## What This Session Did

Designed and scaffolded the complete v0.2 agent architecture for Loci. All
major decisions are locked. Two GitHub repos are live. The first feature spec
is written and ready for dispatch.

---

## Scope Locked at Start of Session

The session was deliberately scoped to:
- Loci's agent framework and reusable base context definitions
- Six requirements: accuracy, observability, GitHub compatibility, data privacy,
  cost visibility, security
- Loci-first priority when conflicts arise with framework generalisability

Explicitly deferred: model-agnostic design, MCP migration (post-PoC), full
data privacy/e2e encryption, git agent access, observability dashboard UI.

---

## Key Decisions

### 1. Context layering model (four layers)

Agent definitions are composed from four layers, each with a distinct git home:

| Layer | Content | Location | Changes when |
|---|---|---|---|
| 0+1 | Identity + capability contract | `agent-primitives/base/` | Toolchain changes |
| 2 | Stack-specific context | `agent-primitives/stacks/` | New project stack |
| 3 | Project-specific overrides | `loci/.claude/agents/` | Per feature/sprint |

Static sections (Layers 0–2) load first in every agent prompt — eligible for
Anthropic prompt caching (~10% of normal input token cost on cache hits).
Dynamic sections (Layer 3 task injection) load last.

### 2. Feature-based agent definitions, not role-based

Agents are defined by their **transformation**, not their job title:

| Agent | Transformation | Model | Sensitive data |
|---|---|---|---|
| supervisor | task → routed agent call | claude-opus-4-6 | false |
| frontend-implementer | spec-path → frontend code | claude-sonnet-4-6 | false |
| backend-implementer | spec-path → API code | claude-sonnet-4-6 | false |
| world-builder | mood/theme → environment JSON | claude-sonnet-4-6 | true |
| code-reviewer | code + spec → validation result | claude-haiku-4-5-20251001 | false |

Reviewer intentionally on Haiku — validation is not a reasoning task.
World-builder is the only agent that can receive note content (sensitive data).
World-builder outputs always require human approval before application.

### 3. Input contract enforcement

Specialists accept exactly one input type. The supervisor enforces this before
dispatch:

- `frontend-implementer` / `backend-implementer`: spec file path only
- `world-builder`: mood/theme string (+ optional note context)
- `code-reviewer`: spec path + files_written[]

A spec must exist before any implementation task is dispatched. The supervisor
writes the spec if it doesn't exist — it never passes freeform descriptions
to specialist agents.

### 4. MCP / edge functions as execution boundary

MCP tools sit at the boundary between agent reasoning and real-world actions.
They provide typed schemas, sandboxed execution, audit trails, and the
enforcement point for input sanitisation and least-privilege access.

**PoC phase:** raw tools (bash, str_replace, create_file) with guard hooks
as safety nets. Fast to build, acceptable risk.

**Post-PoC:** high-risk operations (DB reads/writes, git ops, note content
access) migrate to MCP tools. Agent contracts already declare `type: raw` vs
`type: mcp` per tool — migration is a one-line change per tool, not a rewrite.

The `guard-core.sh` PreToolUse hook is the PoC-phase enforcement mechanism.
Path-based now, capability-based (MCP) post-PoC.

### 5. Observability schema

Every tool call writes one JSON line to `logs/events.jsonl` via the
PostToolUse `log-event.sh` hook. Zero tokens — runs outside agent context.

Key fields: `event_id`, `session_id`, `trace_id`, `agent`, `model`,
`event_type`, `tool`, `tool_type` (raw|mcp), `ts`, `duration_ms`,
`tokens` (input/output/cache_read/cache_write), `cost_usd`, `cost_bucket`,
`input_summary`, `output_summary`, `sensitive_data`, `review_required`,
`retry_count`, `error`.

Four cost buckets: `code_generation`, `world_building`, `review`,
`orchestration`.

`trace_id` spans a full feature implementation across multiple sessions.
`session_id` is one Claude Code invocation.

Token counts are currently 0 — Claude Code does not expose token usage to
PostToolUse hooks yet. Schema is ready for when this becomes available.

### 6. Progress artifact

`logs/progress.md` is the living state document the supervisor reads and
writes each session. Survives context window resets. Contains:

- Current trace ID, feature, status
- Completed items this trace
- Blockers (first-class — always surfaced)
- Last agent output summary
- Open decisions needed from human (lightweight HITL gate)
- Session cost summary

Agents never re-read `events.jsonl` — logs are write-only from the agent's
perspective. Cost is summarised in `progress.md` for human review.

### 7. Cost reduction decisions

| Decision | Impact |
|---|---|
| Prompt caching (static context first) | ~60-80% reduction on repeated context |
| Compressed agent output schemas (JSON, max_tokens) | High — no prose responses |
| Haiku for code-reviewer | ~75% cheaper than Sonnet for validation tasks |
| Logs as write-only (never re-read into context) | Correct — already enforced |
| MCP for logging | Wrong — adds token cost. Shell hooks only. |
| Multi-model architecture | Deferred — switching cost is low by design (one config line), revisit post-PoC if needed |

Estimated cost per well-optimised agent session: $0.05–0.15.
Without caching and output compression: $0.50–1.50 for the same session.

### 8. Framework comparison conclusion

Evaluated: LangGraph, AutoGen, CrewAI, LlamaIndex, Anthropic Claude Agent SDK.

**Conclusion:** Stay on Claude Agent SDK (Claude Code subagents). The
framework-owned orchestration approaches (LangGraph, CrewAI) solve for
teams that need infrastructure handed to them. This architecture is native
to the toolchain, auditable at every layer, and already validated by
Anthropic's own production multi-agent research (Opus lead + Sonnet
specialists outperformed single-agent Opus by 90.2%).

LlamaIndex remains relevant for the future Reflection agent / semantic search
use case (RAG-centric). Not relevant for development agent orchestration.

### 9. Parallel agent dispatch

Architecture supports multiple simultaneous instances of the same agent type
(e.g. two frontend-implementers in parallel). Pre-conditions enforced by
supervisor: distinct spec files, non-overlapping file scopes. File lock
tracking added to `progress.md` when parallel dispatch is used.

---

## What Was Scaffolded

### Repos (both on GitHub)

```
~/Development/loci-root/
  agent-primitives/        github.com/mumoryan/agent-primitives
    base/
      orchestrator.md      Layer 0+1
      spec-to-code.md      Layer 0+1
      world-builder.md     Layer 0+1
      code-reviewer.md     Layer 0+1
    stacks/
      r3f-webxr.md         Layer 2
      ts-fastify.md        Layer 2

  loci/                    github.com/mumoryan/loci
    .claude/
      CLAUDE.md            Project memory
      settings.json        Hook config (PreToolUse + PostToolUse)
      agents/              Layer 3 stubs
        supervisor.md
        frontend-implementer.md
        backend-implementer.md
        world-builder.md
        code-reviewer.md
    scripts/
      guard-core.sh        Write protection (PreToolUse)
      log-event.sh         Observability logging (PostToolUse)
      merge-agent.sh       Layer composition at session start
    logs/
      events.jsonl         Append-only event log (empty, ready)
      progress.md          Initial state
    specs/
      entry-sequence.md    First spec — ready for dispatch
    ARCHITECTURE.md        Constitution
    README.md
```

---

## Open Items (Carried Forward)

### Immediately before first agent run
- [ ] Confirm `jq` installed locally (`jq --version`)
- [ ] Confirm scripts are executable (`chmod +x scripts/*.sh`)
- [ ] Decide: run `merge-agent.sh` before session for caching, or let Claude
      Code read stubs directly (simpler, loses static-first ordering)

### Next design decisions
- [ ] **Git access policy** — what git operations agents can perform, credential
      scoping, fine-grained GitHub token vs git MCP tool. Consensus: branch +
      commit for implementers, read-only for reviewer, none for world-builder.
      Git operations become an MCP tool post-PoC.
- [ ] **Observability dashboard** — SQLite schema and browser UI views. Agreed:
      local SQLite synced from events.jsonl, lightweight browser dashboard.
      Design the views before building the schema.
- [ ] **World builder output schema** — `WorldDiff` TypeScript type referenced
      in specs and agent contracts but not yet written. Needed before world
      building work begins.
- [ ] **Agent contract schema v2** — add parallel dispatch policy and file lock
      tracking to supervisor stub.

### Post-PoC
- [ ] Migrate high-risk operations to MCP tools (DB, git, note content access)
- [ ] Data privacy / e2e encryption design
- [ ] Cost dashboard with per-agent and per-trace breakdowns
- [ ] Note content flagged as sensitive data class in all agent contracts (flag
      exists, formal policy doc not written)

---

## How to Start the Next Session

Open Claude Code in `~/Development/loci-root/loci/` and run:

```
Use the supervisor agent to implement specs/entry-sequence.md
```

The supervisor will:
1. Read CLAUDE.md and logs/progress.md
2. Validate the spec exists
3. Dispatch to frontend-implementer with spec path
4. Hooks fire automatically (guard-core.sh, log-event.sh)
5. Return structured JSON result
6. Update progress.md

Review the diff, run `bun run typecheck`, commit manually.

---

*Generated end of Session 03. Feed ARCHITECTURE.md + CLAUDE.md + this file
into context before starting Session 04.*