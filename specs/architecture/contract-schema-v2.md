# Spec: Agent Contract Schema v2 + Apply to All Agents

**Type:** Architecture  
**Scope:** agent-primitives (schema + base agents) + loci/.claude/agents/ (stubs)  
**Branch:** `arch/contract-schema-v2`  
**Run from:** `~/Development/loci-root/`  

---

## Context

The agent architecture uses a four-layer context model. Base agent definitions
live in `agent-primitives/base/`, stack profiles in `agent-primitives/stacks/`,
and project-specific stubs in `loci/.claude/agents/`. Agent definitions are
markdown files with YAML frontmatter.

This spec introduces a standardized contract schema that every agent definition
must conform to. The schema is the reusable, transferable artifact — agents in
any project are instances of it. It also updates all five existing agent
definitions to conform to the new schema.

The reviewer agent was recently renamed from `code-reviewer` and its
transformation generalized to `diff + spec → validation result`.

---

## Part 1: Create the schema definition

Create `agent-primitives/schema/agent-contract.md` with the following content.
This is a reference document, not executable code — it defines the standard
every agent file must follow.

```yaml
# Agent Contract Schema v2
# Every agent definition (base or stub) must include these sections.
# Fields marked [required] must be present. Fields marked [optional] may be
# omitted if not applicable — omission means the default value applies.

# === IDENTITY ===
name: string                          # [required] unique agent identifier
transformation: string                # [required] "input → output" — orchestrator routing signal
model: string                         # [required] model identifier
cost_bucket: enum                     # [required] orchestration | code_generation | world_building | review

# === TRIGGER ===
trigger_type: on_demand | periodic    # [required] default: on_demand
periodic_cadence: string | null       # [optional] e.g. "weekly" — only if trigger_type is periodic
trigger_source: orchestrator | human | schedule  # [optional] who/what initiates — default: orchestrator

# === INPUT CONTRACT ===
input:
  type: string                        # [required] semantic label for what orchestrator passes
  schema:                             # [required] typed fields — orchestrator validates before dispatch
    field_name: type                  #   at minimum one field
  sensitive_data: boolean             # [required] can this agent receive sensitive content (e.g. note text)?
  validation: string                  # [required] human-readable rule orchestrator checks before dispatch

# === OUTPUT CONTRACT ===
output:
  type: string                        # [required] semantic label for what agent returns
  schema:                             # [required] typed fields the output must contain
    field_name: type
  confidence: boolean                 # [optional] does agent self-report confidence? default: false
  review_required: boolean            # [required] must output go through reviewer agent?
  human_approval: boolean             # [required] blocks on human sign-off before application?

# === TOOLS ===
tools:                                # [required] explicit allowlist — least privilege
  - name: string                      #   tool identifier
    type: raw | mcp                   #   PoC (raw) vs post-PoC (mcp) execution path
    scope: string                     #   file glob or resource identifier
    server: string | null             #   MCP server name — null for raw tools

# === EXECUTION ===
execution:
  max_retries: integer                # [required] per spec, before escalation to orchestrator/human
  parallel: boolean                   # [optional] can multiple instances run simultaneously? default: false
  file_scope: string[]                # [required] directories this agent may write to
  protected_paths: string[]           # [optional] explicit deny list — enforced by guard-core.sh
  isolation: string | null            # [optional] scheduling constraints e.g. "no parallel with feature work"

# === SECURITY ===
security:
  injection_surface: string           # [required] where untrusted input could enter — "none" if not applicable
  sanitisation: string                # [required] how untrusted input is handled
```

Also create `agent-primitives/schema/README.md`:

```markdown
# Agent Contract Schema

Standard contract structure for all agent definitions across projects.
Every base agent in `base/` and every project stub must conform to this schema.

See `agent-contract.md` for the full schema with field descriptions and defaults.

## Usage

Base agents (Layer 0+1) define the full contract. Project stubs (Layer 3)
override specific fields — anything not overridden inherits from the base.
The `merge-agent.sh` script in each project concatenates layers at session start.
```

---

## Part 2: Update all five base agents to conform to the schema

Update each file in `agent-primitives/base/` in place. Preserve any existing
system prompt / body text below the frontmatter. Replace or restructure the
YAML frontmatter to match the schema. If existing content maps cleanly to a
schema field, use it. If a field has no existing value, use the values specified
below.

### orchestrator (agent-primitives/base/orchestrator.md)

```yaml
name: orchestrator
transformation: "task → routed agent call"
model: claude-opus-4-6
cost_bucket: orchestration

trigger_type: on_demand
trigger_source: human

input:
  type: task_description
  schema:
    task: string
    spec_path: string | null
  sensitive_data: false
  validation: "If task requires implementation, a spec file must exist or orchestrator creates one first"

output:
  type: dispatch_result
  schema:
    agents_dispatched: string[]
    specs_referenced: string[]
    status: complete | blocked | escalated
    blockers: string[] | null
  confidence: false
  review_required: false
  human_approval: false

tools:
  - name: Read
    type: raw
    scope: "**/*"
    server: null
  - name: Write
    type: raw
    scope: "specs/**"
    server: null

execution:
  max_retries: 0
  parallel: false
  file_scope: ["specs/", "logs/progress.md"]
  protected_paths: [".claude/", "ARCHITECTURE.md", "CLAUDE.md", "mcp.json"]

security:
  injection_surface: "task description from human — trusted"
  sanitisation: "orchestrator strips sensitive content before dispatching to non-sensitive agents"
```

### frontend-implementer (agent-primitives/base/spec-to-code.md)

Note: `spec-to-code.md` is the generic base. The frontend-implementer identity
comes from the Layer 3 stub. Update the base to use generic field values
appropriate for any spec-to-code agent, then the Loci stub will override
with frontend-specific values.

```yaml
name: spec-to-code
transformation: "spec-path → implemented code"
model: claude-sonnet-4-6
cost_bucket: code_generation

trigger_type: on_demand
trigger_source: orchestrator

input:
  type: spec_path
  schema:
    spec_path: string
  sensitive_data: false
  validation: "spec file must exist at spec_path and contain acceptance criteria"

output:
  type: implementation_result
  schema:
    files_written: string[]
    files_modified: string[]
    assumptions: string[]
    tests_passed: boolean
  confidence: false
  review_required: true
  human_approval: false

tools:
  - name: Read
    type: raw
    scope: "**/*"
    server: null
  - name: Write
    type: raw
    scope: "src/**"
    server: null
  - name: Bash
    type: raw
    scope: "typecheck, lint, test commands"
    server: null

execution:
  max_retries: 2
  parallel: true
  file_scope: ["src/"]
  protected_paths: [".claude/", "ARCHITECTURE.md", "CLAUDE.md", "mcp.json"]

security:
  injection_surface: "none"
  sanitisation: "spec content is human-authored and trusted"
```

### backend-implementer

Uses the same base file `spec-to-code.md` — the backend identity comes from
the Layer 3 stub. No separate base file needed. The Loci stub overrides
`file_scope` to `["backend/src/"]` and adds stack-specific constraints.

**Do not create a separate base file for backend-implementer.** Both frontend
and backend implementers extend `spec-to-code.md`.

### world-builder (agent-primitives/base/world-builder.md)

```yaml
name: world-builder
transformation: "mood/theme → environment JSON"
model: claude-sonnet-4-6
cost_bucket: world_building

trigger_type: on_demand
trigger_source: orchestrator

input:
  type: mood_or_theme
  schema:
    mood: string
    note_context: string | null
  sensitive_data: true
  validation: "mood string must be non-empty; note_context is optional and contains sensitive user content"

output:
  type: world_diff
  schema:
    diff: object
    affected_properties: string[]
    rationale: string
  confidence: false
  review_required: true
  human_approval: true

tools:
  - name: Read
    type: raw
    scope: "**/*.ts, **/*.json"
    server: null
  - name: Write
    type: raw
    scope: "frontend/src/worlds/**"
    server: null

execution:
  max_retries: 2
  parallel: false
  file_scope: ["frontend/src/worlds/"]
  protected_paths: [".claude/", "ARCHITECTURE.md", "CLAUDE.md", "mcp.json"]

security:
  injection_surface: "note_context — contains user-authored personal content"
  sanitisation: "note content validated at MCP layer post-PoC; PoC phase: orchestrator strips injection patterns before dispatch"
```

### reviewer (agent-primitives/base/reviewer.md)

```yaml
name: reviewer
transformation: "diff + spec → validation result"
model: claude-haiku-4-5-20251001
cost_bucket: review

trigger_type: on_demand
trigger_source: orchestrator

input:
  type: spec_path_and_diff
  schema:
    spec_path: string
    diff: string
    diff_type: code | config | contract | optimization
  sensitive_data: false
  validation: "spec file must exist; diff must be non-empty"

output:
  type: validation_result
  schema:
    verdict: pass | fail
    comments: string[]
    blocking_issues: string[] | null
    suggestions: string[] | null
  confidence: false
  review_required: false
  human_approval: false

tools:
  - name: Read
    type: raw
    scope: "**/*"
    server: null

execution:
  max_retries: 0
  parallel: true
  file_scope: []
  protected_paths: [".claude/", "ARCHITECTURE.md", "CLAUDE.md", "mcp.json"]

security:
  injection_surface: "diff content could contain adversarial code — reviewer is read-only so impact is limited"
  sanitisation: "read-only agent — no write tools, no execution capability"
```

---

## Part 3: Update Loci stubs to reference schema and override appropriately

Update each stub in `loci/.claude/agents/` to:
1. Reference the base agent via relative path (already done)
2. Add a comment at the top noting conformance to agent-contract schema v2
3. Override only the fields that differ from the base for Loci specifically

### loci/.claude/agents/frontend-implementer.md

Loci-specific overrides for the spec-to-code base:
```yaml
name: frontend-implementer
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
```

### loci/.claude/agents/backend-implementer.md

Loci-specific overrides for the spec-to-code base:
```yaml
name: backend-implementer
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
```

Additional Loci constraint to add to body text:
- Every table must have `owner_id` and `world_id`
- Stack: Fastify (TypeScript) + Bun + SQLite
- Exit condition: `tsc` compiles clean, no lint errors, migration file included if schema changed

### loci/.claude/agents/world-builder.md

Override `file_scope` to `["frontend/src/worlds/"]`. Add Loci constraint:
- World schema lives at `backend/schema/world.ts` (once created)
- Output must conform to `WorldDiff` type (once defined)
- Hokkaido mansion is the default world reference

### loci/.claude/agents/orchestrator.md

Add to body text:
- Reads `CLAUDE.md` and `logs/progress.md` at session start
- Validates spec exists before any dispatch
- Strips note content from payloads to non-sensitive agents
- Updates `progress.md` after every dispatch cycle
- Spec categories: `features/`, `refactors/`, `optimizations/`, `architecture/`

### loci/.claude/agents/reviewer.md

Override: add Loci-specific validation criteria to body text:
- Check against Quest rendering budget (no bloom post-processing, no dynamic shadows)
- Check TypeScript strict compliance
- Check `owner_id` + `world_id` on any schema changes
- Check ARCHITECTURE.md constraints

---

## Part 4: Update agent-primitives README

Update `agent-primitives/README.md` to reference the new `schema/` directory
and note that all base agents conform to agent-contract schema v2.

---

## Acceptance criteria

- [ ] `agent-primitives/schema/agent-contract.md` exists with full schema
- [ ] `agent-primitives/schema/README.md` exists
- [ ] All four base agents (`orchestrator.md`, `spec-to-code.md`, `world-builder.md`, `reviewer.md`) have YAML frontmatter conforming to schema v2
- [ ] All five Loci stubs updated with schema v2 conformance comment and appropriate overrides
- [ ] `agent-primitives/README.md` updated
- [ ] No base agent file has Loci-specific paths or constraints — those live only in stubs
- [ ] `grep -r "code-reviewer" ~/Development/loci-root/` still returns zero results
- [ ] Changes committed on branch `arch/contract-schema-v2`

## What NOT to change

- Do not rename any base files beyond what the reviewer rename spec already did
- Do not modify `guard-core.sh`, `log-event.sh`, or `merge-agent.sh`
- Do not modify `ARCHITECTURE.md` or `CLAUDE.md` — those are human-authored
- Do not create a separate base file for backend-implementer — it shares spec-to-code.md
- Do not implement the optimization loop agent — that is a separate spec
- Preserve all existing system prompt / body text in agent files below the frontmatter