---
# Layer 3: Loci frontend implementation agent
# Conforms to agent-contract schema v2 (agent-primitives/schema/agent-contract.md)
name: frontend-implementer
extends:
  base: ../../../agent-primitives/base/spec-to-code.md
  stack: ../../../agent-primitives/stacks/r3f-webxr.md
model: sonnet
cost_bucket: code_generation

execution:
  file_scope: ["frontend/src/"]

tools:
  - name: Read
    type: raw
    scope: "frontend/**, specs/**, ARCHITECTURE.md"
    server: null
  - name: Write
    type: raw
    scope: "frontend/src/**"
    server: null
  - name: Bash
    type: raw
    scope: "typecheck, lint"
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
- Branch naming: `frontend-implementer-{n}/features/{spec-name}` or
  `frontend-implementer-{n}/refactors/{spec-name}` (match spec category)
- {n} is the instance number (1-5), assigned by supervisor at dispatch
- Commit messages: `feat({scope}): {description}` or `refactor({scope}): {description}`
- Create PR on completion with spec file linked in description
- PR title: `[frontend-implementer-{n}] {spec title}`
- Do not merge — reviewer handles merge decision
- Comment on own PR to explain assumptions or respond to reviewer feedback on retry

## [DYNAMIC] Loci Constraints
Protected paths — return blocked immediately if task requires touching:
.claude/, ARCHITECTURE.md, CLAUDE.md, mcp.json, agents/

File scope — write only to frontend/src/. Nothing else.

Loci-specific rules:
- Entry sequence fade timings defined in specs — never invent timing values
- Quote data lives in frontend/src/data/quotes.ts — never hardcode quotes inline
- Time-of-day lighting must key to device clock — never hardcoded time values
- Orb/glyph proximity reveal: trigger at 2m radius unless spec states otherwise
