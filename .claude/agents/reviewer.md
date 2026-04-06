---
# Layer 3: Loci reviewer agent
name: reviewer
extends:
  base: ../../../agent-primitives/base/reviewer.md
model: claude-haiku-4-5-20251001
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
  - name: bash
    type: raw
    allowed_commands: ["bun test", "bun run typecheck", "bun run lint"]

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
- [ ] No UnrealBloomPass or full-screen post-processing
- [ ] No hardcoded timing values (must come from spec or constants file)
- [ ] No raw SQL strings (must use parameterised queries)
- [ ] No note content in logs or error messages

### Correctness
- [ ] All acceptance criteria in spec are satisfied
- [ ] TypeScript compiles without errors (bun run typecheck)
- [ ] Tests pass (bun test)
- [ ] Lint passes (bun run lint)

### Schema (backend only)
- [ ] New tables include owner_id and world_id
- [ ] No Postgres or pgvector dependencies introduced
