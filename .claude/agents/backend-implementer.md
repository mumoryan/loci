---
# Layer 3: Loci backend implementation agent
# Conforms to agent-contract schema v2 (agent-primitives/schema/agent-contract.md)
name: backend-implementer
extends:
  base: ../../../agent-primitives/base/spec-to-code.md
  stack: ../../../agent-primitives/stacks/ts-fastify.md
model: sonnet
cost_bucket: code_generation

execution:
  file_scope: ["backend/src/"]

tools:
  - name: Read
    type: raw
    scope: "backend/**, specs/**, ARCHITECTURE.md"
    server: null
  - name: Write
    type: raw
    scope: "backend/src/**"
    server: null
  - name: Bash
    type: raw
    scope: "typecheck, lint, migration"
    server: null

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

## Git workflow

- Uses github-implementer MCP server
- Branch naming: `backend-implementer-{n}/features/{spec-name}` or
  `backend-implementer-{n}/refactors/{spec-name}` (match spec category)
- {n} is the instance number (1-5), assigned by supervisor at dispatch
- Commit messages: `feat({scope}): {description}` or `refactor({scope}): {description}`
- Create PR on completion with spec file linked in description
- PR title: `[backend-implementer-{n}] {spec title}`
- Do not merge — reviewer handles merge decision
- Comment on own PR to explain assumptions or respond to reviewer feedback on retry

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
- Stack: Fastify (TypeScript) + Bun + SQLite
- Exit condition: `tsc` compiles clean, no lint errors, migration file included if schema changed
