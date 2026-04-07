# Spec: GitHub MCP Server + Git Access Policy

**Type:** Architecture  
**Scope:** loci (MCP config, agent stubs, schema update) + agent-primitives (base contracts)  
**Branch:** `arch/github-mcp-setup`  
**Run from:** `~/Development/loci-root/`  

---

## Context

The agent architecture planned git operations as a post-PoC MCP migration.
GitHub's official MCP server is production-ready and supports Claude Code
natively. This spec brings git operations into the MCP layer immediately,
replacing the "raw tools for PoC" approach for git specifically.

Three per-role GitHub PATs provide least-privilege access. Per-role (not
per-instance) because parallel implementers share a token and are
distinguished by branch naming, not credentials.

Maximum parallel implementer instances: 5.

---

## Part 1: GitHub PATs — COMPLETED MANUALLY

Three fine-grained PATs created and stored securely:
- `GITHUB_PAT_AGENTIC_AI_SUPERVISOR` — read-only (Contents Read, PRs Read, Issues Read)
- `GITHUB_PAT_AGENTIC_AI_IMPLEMENTER` — read/write code, create PRs (Contents R+W, PRs R+W, Issues Read)
- `GITHUB_PAT_AGENTIC_AI_REVIEWER` — read code, approve/merge PRs (Contents Read, PRs R+W, Issues Read)
- World-builder has no token. Intentional.

Permission separation enforced at token level:
- Implementer can push but cannot approve or merge
- Reviewer can approve and merge but cannot push code

---

## Part 2: GitHub MCP servers — COMPLETED MANUALLY

Three MCP server instances registered in Claude Code with `--scope local`
from `~/Development/loci-root/`:
- `github-supervisor` — using GITHUB_PAT_AGENTIC_AI_SUPERVISOR
- `github-implementer` — using GITHUB_PAT_AGENTIC_AI_IMPLEMENTER
- `github-reviewer` — using GITHUB_PAT_AGENTIC_AI_REVIEWER

---

## Part 3: Update agent contract schema

In `agent-primitives/schema/agent-contract.md`, add the following field
to the `execution` section:

```yaml
# === EXECUTION === (additions)
  max_parallel_instances: integer | null  # [optional] max simultaneous instances. default: 5. Project stubs can override.
```

This field is checked by the supervisor before dispatch. If active instances
of the agent type (tracked in progress.md) plus requested new instances
exceed this limit, excess instances are queued.

---

## Part 4: Update base agent contracts

### orchestrator.md (supervisor)

Update the tools section to include GitHub MCP:

```yaml
tools:
  - name: Read
    type: raw
    scope: "**/*"
    server: null
  - name: Write
    type: raw
    scope: "specs/**"
    server: null
  - name: github_read
    type: mcp
    scope: "read repos, read PRs, read issues"
    server: github-supervisor
```

### spec-to-code.md (implementers)

Update tools section and add max_parallel_instances:

```yaml
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
  - name: github_branch
    type: mcp
    scope: "create branch, commit, push"
    server: github-implementer
  - name: github_pr
    type: mcp
    scope: "create PR"
    server: github-implementer

execution:
  max_retries: 2
  parallel: true
  max_parallel_instances: 5
  file_scope: ["src/"]
  protected_paths: [".claude/", "ARCHITECTURE.md", "CLAUDE.md", "mcp.json"]
```

### reviewer.md

Update tools section. Note: reviewer has Contents Read-only — cannot push
code, only read diffs. Merge is performed via Pull Requests API, not git push.

```yaml
tools:
  - name: Read
    type: raw
    scope: "**/*"
    server: null
  - name: github_review
    type: mcp
    scope: "read PRs, read diffs, read file contents, approve, request changes"
    server: github-reviewer
  - name: github_merge
    type: mcp
    scope: "merge PR via API if all criteria met — does not require Contents Write"
    server: github-reviewer
```

### world-builder.md

No changes. Confirm no github tools are present. Add explicit comment:

```yaml
# No git access. World-builder outputs require human approval.
# Changes are committed by the human after review.
```

---

## Part 5: Update Loci agent stubs

### loci/.claude/agents/supervisor.md

Add to body text:

```markdown
## Git operations

- Uses github-supervisor MCP server (read-only)
- Can read repo state, PR status, and issues
- Cannot create branches, commit, or merge
- Tracks active implementer instances in progress.md
- Before dispatching parallel implementers, verify count ≤ 5
```

### loci/.claude/agents/frontend-implementer.md

Add to body text:

```markdown
## Git workflow

- Uses github-implementer MCP server
- Branch naming: `frontend-implementer-{n}/features/{spec-name}` or
  `frontend-implementer-{n}/refactors/{spec-name}` (match spec category)
- {n} is the instance number (1-5), assigned by supervisor at dispatch
- Commit messages: `feat({scope}): {description}` or `refactor({scope}): {description}`
- Create PR on completion with spec file linked in description
- PR title: `[frontend-implementer-{n}] {spec title}`
- Do not merge — reviewer handles merge decision
```

### loci/.claude/agents/backend-implementer.md

Add to body text:

```markdown
## Git workflow

- Uses github-implementer MCP server
- Branch naming: `backend-implementer-{n}/features/{spec-name}` or
  `backend-implementer-{n}/refactors/{spec-name}` (match spec category)
- {n} is the instance number (1-5), assigned by supervisor at dispatch
- Commit messages: `feat({scope}): {description}` or `refactor({scope}): {description}`
- Create PR on completion with spec file linked in description
- PR title: `[backend-implementer-{n}] {spec title}`
- Do not merge — reviewer handles merge decision
```

### loci/.claude/agents/reviewer.md

Add to body text:

```markdown
## Git workflow

- Uses github-reviewer MCP server
- Reads PR diff and linked spec file
- Validates against:
  - Spec acceptance criteria
  - ARCHITECTURE.md constraints
  - Quest rendering budget (no bloom, no dynamic shadows)
  - TypeScript strict compliance
  - owner_id + world_id on schema changes
- Approves PR if all criteria pass
- Requests changes with specific comments if criteria fail
- Merges PR if approved and all GitHub branch protection rules pass
- Never merges without approval — even if technically possible
```

### loci/.claude/agents/world-builder.md

Add to body text:

```markdown
## Git workflow

- No git access. This is intentional.
- World-builder outputs are reviewed and committed by the human.
- All world-builder output requires human approval before application.
```

---

## Part 6: Update progress.md tracking

Add to `logs/progress.md`:

```markdown
## Active Implementer Instances

| Instance | Agent | Branch | Spec | Status |
|---|---|---|---|---|
```

The supervisor updates this table on every dispatch and completion.
Before dispatching new implementers, check that active count + requested ≤ 5.

---

## Part 7: Branch protection — COMPLETED MANUALLY

GitHub Pro enabled. Ruleset `agentic-main-protection` configured on both repos:
- Targets: `main` branch
- Require PR before merging
- Require at least 1 approval
- Do not allow bypassing
- Auto-merge enabled

---

## Acceptance criteria

- [ ] Agent contract schema includes `max_parallel_instances` field
- [ ] All four base agents updated with appropriate GitHub MCP tools
- [ ] All five Loci stubs updated with git workflow documentation
- [ ] `progress.md` has active implementer instances tracking table
- [ ] No GitHub MCP tools on world-builder (verified explicitly)
- [ ] Reviewer has merge capability but documented "never merge without approval"
- [ ] Branch naming convention documented in all implementer stubs
- [ ] Changes committed on branch `arch/github-mcp-setup`

## What NOT to change

- Do not modify ARCHITECTURE.md or CLAUDE.md
- Do not modify guard-core.sh or log-event.sh
- Do not modify MCP server configuration (already set up manually)
- Do not modify GitHub branch protection rules (already configured)