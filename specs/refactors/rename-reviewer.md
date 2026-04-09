# Spec: Rename code-reviewer → reviewer

**Type:** Refactor  
**Scope:** agent-primitives + loci  
**Priority:** Do now — no agent runs have occurred yet, clean rename window  

---

## Context

The reviewer agent's transformation has been generalized from `code + spec → validation result` to `diff + spec → validation result`. It now reviews code diffs, config changes, contract updates, and optimization PRs — not just code. The name "code-reviewer" is too narrow. Rename to "reviewer" across all files and references.

---

## Changes required

### 1. File renames

```
agent-primitives/base/code-reviewer.md  →  agent-primitives/base/reviewer.md
loci/.claude/agents/code-reviewer.md    →  loci/.claude/agents/reviewer.md
```

Use `git mv` for both so git tracks the rename.

### 2. Content updates inside renamed files

In `agent-primitives/base/reviewer.md`:
- Update the `name:` field in YAML frontmatter from `code-reviewer` to `reviewer`
- Update the transformation description to: `diff + spec → validation result`
- If the file references itself by the old name anywhere in the body, update those

In `loci/.claude/agents/reviewer.md`:
- Update the `name:` field from `code-reviewer` to `reviewer`
- Update any `extends` or reference path from `code-reviewer.md` to `reviewer.md`
- Update the transformation description to: `diff + spec → validation result`

### 3. References in other files

Search both repos for all occurrences of `code-reviewer` and update to `reviewer`. Known locations:

**In loci/:**
- `ARCHITECTURE.md` — agent registry table, any other mentions
- `.claude/CLAUDE.md` — if it references the agent by name
- `.claude/settings.json` — if hook config references agent names
- `logs/progress.md` — if initial state mentions agent names
- `.claude/agents/orchestrator.md` — almost certainly references reviewer by name for dispatch
- `scripts/log-event.sh` — if agent names are referenced
- `README.md` — agent architecture table

**In agent-primitives/:**
- `README.md` — if it lists agent names

### 4. Transformation update in all registry tables

Wherever the agent registry table appears, update the reviewer row to:

```
| reviewer | diff + spec → validation result | claude-haiku-4-5-20251001 | false |
```

The old row was:
```
| code-reviewer | code + spec → validation result | claude-haiku-4-5-20251001 | false |
```

### 5. Input contract update

If the reviewer's agent definition (base or stub) specifies an input schema, update it to accept:

```yaml
input:
  type: spec_path_and_diff
  schema:
    spec_path: string
    diff: string
    diff_type: code | config | contract | optimization
```

The old input was `spec_path` + `files_written[]`.

---

## Acceptance criteria

- [ ] No file or directory named `code-reviewer` exists in either repo
- [ ] `grep -r "code-reviewer" ~/Development/loci-root/` returns zero results
- [ ] `git mv` used for both renames (history preserved)
- [ ] All agent registry tables show `reviewer` with transformation `diff + spec → validation result`
- [ ] Both repos compile/lint clean (no broken references)
- [ ] Changes committed on a dedicated branch: `refactor/rename-reviewer`

---

## What NOT to change

- Model stays claude-haiku-4-5-20251001
- Cost bucket stays `review`
- Sensitive data flag stays `false`
- Read-only access profile unchanged
- Do not modify any other agent definitions beyond updating their references to the reviewer