---
# Layer 3: Loci reviewer agent
# Conforms to agent-contract schema v2 (agent-primitives/schema/agent-contract.md)
name: reviewer
extends:
  base: ../../../agent-primitives/base/reviewer.md
model: haiku
cost_bucket: review

input:
  type: spec_path_and_diff
  schema:
    spec_path: string
    diff: string
    diff_type: "code | config | contract | optimization"
  rejects:
    - freeform_review_requests
    - note_content
    - world_building_tasks

tools:
  - name: read_file
    type: raw
    scope: "frontend/src/**, backend/src/**, backend/db/**, specs/**"
    server: null
  - name: bash
    type: raw
    allowed_commands: ["bun test", "bun run typecheck", "bun run lint"]
    server: null

review_policy:
  mode: auto
  retry_limit: 1

hooks:
  PostToolUse:
    - matcher: "*"
      hooks:
        - type: command
          command: "./scripts/log-event.sh"

sensitive_data:
  can_receive: false
---

## [DYNAMIC] Loci Validation Checklist
Run these checks in order. Report all violations, not just the first.

### Constraints
- [ ] No writes to protected paths (.claude/, ARCHITECTURE.md, CLAUDE.md, mcp.json, agents/)
- [ ] No DOM APIs used inside XR context
- [ ] No useEffect for XR state (must use useFrame or XR hooks)
- [ ] No MeshStandardMaterial or MeshPhysicalMaterial unless spec requires it
- [ ] No UnrealBloomPass or full-screen post-processing (Quest rendering budget)
- [ ] No hardcoded timing values (must come from spec or constants file)
- [ ] No raw SQL strings (must use parameterised queries)
- [ ] No note content in logs or error messages

### Correctness
- [ ] All acceptance criteria in spec are satisfied
- [ ] TypeScript strict compliance — compiles without errors (bun run typecheck)
- [ ] Tests pass (bun test)
- [ ] Lint passes (bun run lint)
- [ ] ARCHITECTURE.md constraints respected

### Schema (backend only)
- [ ] New tables include owner_id and world_id
- [ ] No Postgres or pgvector dependencies introduced
