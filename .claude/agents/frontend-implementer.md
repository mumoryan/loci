---
# Layer 3: Loci frontend implementation agent
name: frontend-implementer
extends:
  base: ../../../agent-primitives/base/spec-to-code.md
  stack: ../../../agent-primitives/stacks/r3f-webxr.md
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
    scope: "frontend/src/**, specs/**"
  - name: str_replace
    type: raw
    scope: "frontend/src/**"
  - name: create_file
    type: raw
    scope: "frontend/src/**"
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

File scope — write only to frontend/src/. Nothing else.

Loci-specific rules:
- Entry sequence fade timings defined in specs — never invent timing values
- Quote data lives in frontend/src/data/quotes.ts — never hardcode quotes inline
- Time-of-day lighting must key to device clock — never hardcoded time values
- Orb/glyph proximity reveal: trigger at 2m radius unless spec states otherwise
