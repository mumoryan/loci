# Loci — Project Memory
_Read this at the start of every session before taking any action._

---

## What Loci Is
A personal VR contemplation tool for Meta Quest using WebXR.
Notes exist as orbs/glyphs that reveal text on proximity approach.
Embedded in discrete 3D environments each with narrative intent.
Name derives from the method of loci — the ancient memory technique.

Aesthetic references:
- The Beginner's Guide (retro, vast, crisp, ambient)
- Hitman Hokkaido mission (sleek, warm wood, floor-to-ceiling glass, snow peaks)

## Current State
Check logs/progress.md for the live state of the current trace.
Do not assume anything about current state — read it.

## Architecture
- Frontend: WebXR, React Three Fiber (R3F), TypeScript, Zustand
- Backend: Fastify, TypeScript, Bun runtime, SQLite (V1)
- Target hardware: Meta Quest (standalone VR)
- Agent primitives repo: ~/Development/loci-root/agent-primitives/
- No AR — ruled out. VR only.
- No cloud infrastructure for V1
- No Postgres until a second human user joins (not a technical threshold)

## Agent Registry

| Agent | Transformation | Model | Sensitive data |
|---|---|---|---|
| supervisor | task → routed agent call | claude-opus-4-6 | false |
| frontend-implementer | spec-path → frontend code | claude-sonnet-4-6 | false |
| backend-implementer | spec-path → API code | claude-sonnet-4-6 | false |
| world-builder | mood/theme → environment JSON | claude-sonnet-4-6 | true |
| reviewer | diff + spec → validation result | claude-haiku-4-5-20251001 | false |

## Input Contract (enforced by supervisor)
- Specialists only accept spec file paths — never freeform descriptions
- A spec must exist before any implementation task is dispatched
- World builder accepts mood/theme strings — not spec paths
- No agent receives note content except world-builder, and only when supervisor explicitly provides it

## Protected Paths (hard block via guard-core.sh)
.claude/, ARCHITECTURE.md, CLAUDE.md, mcp.json, agents/

## Key Decisions (locked — do not revisit without human instruction)
- VR only, no AR
- Orbs/glyphs reveal text at 2m proximity radius
- Entry sequence: darkness → historical quote → ambient world fade (~8s total)
- Default world: Hokkaido-inspired mansion with time-of-day lighting
- Quotes: hardcoded in frontend/src/data/quotes.ts
- SQLite → Postgres migration trigger: second human user, not performance
- Cloud infra: deferred until multi-user. Fly.io or Railway (not GCP)
