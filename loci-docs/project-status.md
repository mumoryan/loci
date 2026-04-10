# Loci — Project Status
_Last updated: 2026-04-10 | Human-maintained_

---

## What's Done

| Item | Notes |
|---|---|
| Agent infrastructure | start/dispatch/end scripts, hooks, guard scripts |
| agent-primitives layer architecture | base → stack → stub merge via merge-agent.sh |
| Contract schema v2 | all agents conform |
| GitHub MCP 3-role setup | per-role PATs, branch protection ruleset |
| Observability schema | schema.sql + sync-events.sh + dashboard.ts designed |
| loci-start.sh validated end-to-end | full session lifecycle confirmed |
| Entry sequence | PR #11 merged — EntrySequence.tsx, quotes.ts, timing.ts |
| Frontend scaffold spec | specs/features/frontend-scaffold.md — ready to implement |

---

## V1 Scope — Remaining

Minimum viable experience that feels complete (from ARCHITECTURE.md):

| # | Feature | Spec | Status |
|---|---|---|---|
| 1 | Entry sequence | specs/features/entry-sequence.md | Done — PR #11 |
| 2 | Frontend scaffold | specs/features/frontend-scaffold.md | Spec ready, not implemented |
| 3 | Default Hokkaido world + time-of-day lighting | — | No spec yet |
| 4 | Notes as orbs — create, place, reveal at 2m | — | No spec yet |
| 5 | Note persistence via backend API | — | No spec yet (backend not scaffolded) |
| 6 | One additional world | — | No spec yet |

---

## Active Bugs

### 1. events.jsonl — all fields "unknown"
All logged events show `trace_id: "trc_unknown"`, `agent: "unknown"`,
`cost_bucket: "unknown"`, `tokens: {0,0,0,0}`, `cost_usd: 0`.

log-event.sh is not extracting fields correctly from the hook payload.
This means the observability dashboard has no useful data.

**Fix when:** before the next substantive feature implementation (want cost
visibility before burning more tokens on multi-pass reviewer cycles).

### 2. Session logs unreadable
`logs/session-ses_*.log` files contain raw ANSI terminal escape sequences.
They are binary noise — no plain-text record of what happened in a session.

**Fix when:** same time as above. Likely need to pipe through `col -b` or
`sed` to strip escape codes, or redirect a clean log alongside the terminal log.

### 3. Reviewer PAT lacks merge permission
Reviewer falls back to implementer PAT when merging PRs.
Fix: add `pull_requests: write` to reviewer fine-grained PAT in GitHub settings.

---

## Cost / Token Issues

Implementers and reviewer are consuming too many tokens per session.

**Evidence from entry-sequence trace-007:**
- Reviewer ran 3 passes before approval
- Pass 1: 5 violations (living authors, useEffect for opacity)
- Pass 2: 4 violations (post-1950 authors: Sagan, Bohm, Einstein)
- Pass 3: approved

**Suspected causes:**
- Base agent definitions (orchestrator.md, spec-to-code.md) may be too verbose
- Stack context files (r3f-webxr.md, ts-fastify.md) may be loading in full every dispatch
- CLAUDE.md (the full project memory doc) is loaded into every subagent context
- Reviewer may be running validation that could be encoded more tightly in the spec itself

**Action needed:** audit merged agent file sizes after a `loci-start.sh` run.
Slim base and/or stack definitions, or scope what loads per agent type.
Consider splitting CLAUDE.md into a short agent-facing summary vs. the full doc.

---

## Pending Human Actions

- [ ] **Headset test**: run entry sequence on Quest standalone — verify 72fps,
      fade timings correct, quote readable at VR scale
- [ ] **Fix reviewer PAT**: add `pull_requests: write` scope in GitHub fine-grained
      PAT settings for reviewer token
- [ ] **Fix log-event.sh**: events.jsonl field extraction broken (see Active Bugs #1)
- [ ] **Fix session log format**: strip ANSI from session logs (see Active Bugs #2)
- [ ] **Slim agent context**: audit token usage per agent, reduce where possible

---

## Deferred (Post-PoC / Post-V1)

- WorldDiff TypeScript type (deferred until first world is built)
- Audio implementation (entry sequence references ambient audio — stub for now)
- Data privacy / e2e encryption
- Multi-user support (trigger: second human user)
- Cloud hosting (Fly.io or Railway — trigger: multi-user)
- Backend scaffold (no spec yet, no implementation)
