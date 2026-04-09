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

After implementation is complete, push to GitHub and open a PR using the
github-implementer MCP server. Steps in order:

1. Read `.agent-env` to get `GITHUB_OWNER`, `GITHUB_REPO`, `LOCI_BRANCH`, `LOCI_INSTANCE`
2. Use `push_files` (github-implementer) to push all written/modified files:
   - owner: value of GITHUB_OWNER
   - repo: value of GITHUB_REPO
   - branch: value of LOCI_BRANCH
   - message: `feat(frontend): {description}` or `refactor(frontend): {description}`
   - files: every file written or modified during implementation
3. Use `create_pull_request` (github-implementer) to open the PR:
   - title: `[frontend-implementer-{LOCI_INSTANCE}] {spec title}`
   - body: link to spec file path, list assumptions made
   - head: value of LOCI_BRANCH
   - base: main
4. Do not merge — reviewer handles merge
5. On retry: use `add_issue_comment` to explain what changed in response to reviewer feedback

## [DYNAMIC] Loci Constraints
Protected paths — return blocked immediately if task requires touching:
.claude/, ARCHITECTURE.md, CLAUDE.md, mcp.json, agents/

File scope — write only to frontend/src/. Nothing else.

Loci-specific rules:
- Entry sequence fade timings defined in specs — never invent timing values
- Quote data lives in frontend/src/data/quotes.ts — never hardcode quotes inline
- Time-of-day lighting must key to device clock — never hardcoded time values
- Orb/glyph proximity reveal: trigger at 2m radius unless spec states otherwise
