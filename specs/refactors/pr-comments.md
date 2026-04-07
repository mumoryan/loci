# Spec: Add PR Comment Capability

**Type:** Refactor  
**Scope:** agent-primitives (base contracts) + loci/.claude/agents/ (stubs)  
**Branch:** `refactor/pr-comments`  
**Run from:** `~/Development/loci-root/`  

---

## Context

Implementers and reviewer agents need to comment on PRs to create a
reviewable audit trail of agent reasoning — why the reviewer rejected,
what the implementer changed on retry, assumptions made during implementation.

---

## Changes

### agent-primitives/base/spec-to-code.md (implementers)

Add to tools section:

```yaml
  - name: github_comment
    type: mcp
    scope: "comment on own PRs — explain assumptions, flag decisions, respond to reviewer feedback"
    server: github-implementer
```

### agent-primitives/base/reviewer.md

Add to tools section:

```yaml
  - name: github_comment
    type: mcp
    scope: "comment on PRs with specific feedback when requesting changes or approving"
    server: github-reviewer
```

### loci/.claude/agents/frontend-implementer.md

Add to git workflow section:

```markdown
- Comment on own PR to explain assumptions or respond to reviewer feedback on retry
```

### loci/.claude/agents/backend-implementer.md

Add to git workflow section:

```markdown
- Comment on own PR to explain assumptions or respond to reviewer feedback on retry
```

### loci/.claude/agents/reviewer.md

Add to git workflow section:

```markdown
- Comments on PR with specific, actionable feedback when requesting changes
- Comments on PR with summary when approving
```

---

## Acceptance criteria

- [ ] spec-to-code.md has github_comment tool in tools section
- [ ] reviewer.md has github_comment tool in tools section
- [ ] All three Loci stubs (frontend-implementer, backend-implementer, reviewer) updated
- [ ] No comment capability added to supervisor or world-builder
- [ ] Changes committed on branch `refactor/pr-comments`

## What NOT to change

- Do not modify supervisor or world-builder agents
- Do not modify ARCHITECTURE.md or CLAUDE.md
- Do not modify guard-core.sh or log-event.sh