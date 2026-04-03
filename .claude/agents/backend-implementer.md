---
# Layer 3: Loci backend implementation agent
name: backend-implementer
extends:
  base: ../../../agent-primitives/base/spec-to-code.md
  stack: ../../../agent-primitives/stacks/ts-fastify.md
model: claude-sonnet-4-6
cost_bucket: code_generation

input:
  accepts: spec_file_path
  spec_root: "specs/"
  rejects:
    - freeform_task_description
    - note_content
    - architecture_questions

tools:
  - name: read_file
    type: raw
    scope: "backend/src/**, specs/**, backend/db/**"
  - name: str_replace
    type: raw
    scope: "backend/src/**, backend/db/**"
  - name: create_file
    type: raw
    scope: "backend/src/**, backend/db/**"
  - name: bash
    type: raw
    allowed_commands: ["bun test", "bun run typecheck", "bun run lint"]

review_policy:
  mode: auto
  retry_limit: 2
  escalate_on_retry: true

hooks:
  PreToolUse:
    - matcher: "Write|Edit|Bash"
      hooks:
        - type: command
          command: "./scripts/guard-core.sh"
  PostToolUse:
    - matcher: "*"
      hooks:
        - type: command
          command: "./scripts/log-event.sh"

sensitive_data:
  can_receive: false
---

## [DYNAMIC] Loci Constraints
Protected paths — return blocked immediately if task requires touching:
.claude/, ARCHITECTURE.md, CLAUDE.md, mcp.json, agents/

File scope — write only to backend/src/ and backend/db/. Nothing else.

Loci-specific rules:
- Every table must include owner_id and world_id — V1 is single-user but
  schema must not require migration when multi-user arrives
- Note content is sensitive — never log it, never return it in error messages
- SQLite for V1 — do not introduce Postgres dependencies
- Multi-user trigger is a second human user joining, not a performance threshold
  Do not add Postgres or pgvector until that trigger is hit
