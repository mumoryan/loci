# Spec: End-to-End Agent Test — Entry Sequence

**Type:** Manual test

**Scope:** Full agent pipeline validation

**Prerequisite:** All architecture specs merged, GitHub MCP servers connected

---

## Pre-flight checks

Run these before starting the agent session:

```bash
cd ~/Development/loci-root/loci

# 1. Confirm jq installed
jq --version
# Expected: jq-1.x

# 2. Confirm scripts are executable
ls -la scripts/*.sh
# Expected: all .sh files show -rwxr-xr-x

# 3. If not executable:
chmod +x scripts/*.sh

# 4. Confirm MCP servers connected
claude mcp list
# Expected: github-orchestrator, github-implementer, github-reviewer all show ✓ Connected

# 5. Confirm agent stubs exist
ls .claude/agents/
# Expected: orchestrator.md, frontend-implementer.md, backend-implementer.md,
#           world-builder.md, reviewer.md

# 6. Confirm entry sequence spec exists
cat specs/features/entry-sequence.md | head -5
# Expected: spec file with title and content

# 7. Confirm main branch is clean
git status
# Expected: nothing to commit, working tree clean

# 8. Confirm progress.md exists
cat logs/progress.md | head -10
# Expected: progress file with section headers
```

If any check fails, fix before proceeding.

---

## Execute

```bash
cd ~/Development/loci-root/loci
claude
```

In the Claude Code session:

```
Use the orchestrator agent to implement specs/features/entry-sequence.md
```

Do NOT intervene. Let it run to completion or failure.

---

## Verify: Orchestrator dispatch

| # | Check | How to verify | Pass/Fail |
| --- | --- | --- | --- |
| S1 | Orchestrator read [CLAUDE.md](http://claude.md/) | Look for [CLAUDE.md](http://claude.md/) in Claude Code's file reads at session start |  |
| S2 | Orchestrator read [progress.md](http://progress.md/) | Look for [progress.md](http://progress.md/) in file reads |  |
| S3 | Orchestrator read entry-sequence spec | Look for specs/features/entry-sequence.md in file reads |  |
| S4 | Orchestrator delegated to frontend-implementer | Look for subagent invocation in Claude Code output — should see "Agent" tool call |  |
| S5 | Orchestrator passed spec path, not freeform text | Check the subagent invocation — input should reference the spec file path |  |
| S6 | Orchestrator did NOT write code itself | No writes to frontend/src/ by the orchestrator — only by the subagent |  |

**If S4 fails (orchestrator does the work itself):** This is the most likely failure. Note what happened and stop — the orchestrator stub's description field may need tuning to trigger proper delegation.

---

## Verify: Implementer execution

| # | Check | How to verify | Pass/Fail |
| --- | --- | --- | --- |
| I1 | Branch created with correct name | `git branch -a \| grep frontend-implementer` — expected: `frontend-implementer-1/features/entry-sequence` |  |
| I2 | Branch pushed to GitHub | `git ls-remote origin \| grep frontend-implementer` |  |
| I3 | Code written to frontend/src/ only | Check the diff: `git diff main..frontend-implementer-1/features/entry-sequence --stat` — all files in frontend/src/ |  |
| I4 | TypeScript compiles | `git checkout frontend-implementer-1/features/entry-sequence && bun run typecheck` (if typecheck script exists) |  |
| I5 | Commit messages follow convention | `git log main..frontend-implementer-1/features/entry-sequence --oneline` — expected: `feat(entry-sequence): ...` |  |
| I6 | PR created on GitHub | Check [github.com/mumoryan/loci/pulls](http://github.com/mumoryan/loci/pulls) — expected: open PR from the branch |  |
| I7 | PR description links spec file | Open the PR — description should reference specs/features/entry-sequence.md |  |
| I8 | PR title follows format | Expected: `[frontend-implementer-1] Entry Sequence` or similar |  |
| I9 | Implementer did NOT merge | PR should be open, not merged |  |

**If I1 fails (no branch created):** The implementer may have committed to main directly or to a differently-named branch. Check `git log` and `git branch -a`.

**If I6 fails (no PR created):** GitHub MCP was not invoked. Check Claude Code output for any MCP tool calls. The implementer stub may need `github_branch` and `github_pr` tools explicitly listed in the frontmatter `tools:` field.

---

## Verify: Reviewer validation

| # | Check | How to verify | Pass/Fail |
| --- | --- | --- | --- |
| R1 | Reviewer was invoked by orchestrator | Look for second subagent invocation in Claude Code output after implementer completed |  |
| R2 | Reviewer read the PR diff | Check Claude Code output — reviewer should reference specific files/changes |  |
| R3 | Reviewer checked spec acceptance criteria | Reviewer output should reference criteria from [entry-sequence.md](http://entry-sequence.md/) |  |
| R4 | Reviewer checked [ARCHITECTURE.md](http://architecture.md/) constraints | Reviewer output should mention rendering budget, material types, or other constraints |  |
| R5 | Reviewer left PR comments or review | Check the PR on GitHub — should have a review (approve or request changes) |  |
| R6 | If approved: reviewer merged the PR | PR status on GitHub should be "Merged" |  |
| R7 | If rejected: implementer retried | Look for second implementer invocation in Claude Code output |  |

**If R1 fails (reviewer never invoked):** Orchestrator did not route to reviewer after implementation. This means the orchestrator's dispatch logic is incomplete — it finished after implementer instead of continuing the pipeline.

**If R6 fails (approved but not merged):** Reviewer may not have invoked `github_merge` MCP tool, or branch protection blocked the merge. Check PR status on GitHub for details.

---

## Verify: Observability

| # | Check | How to verify | Pass/Fail |
| --- | --- | --- | --- |
| O1 | Events written to events.jsonl | `wc -l logs/events.jsonl` — should be > 0 |  |
| O2 | Event fields are populated (not "unknown") | `tail -1 logs/events.jsonl \| jq .` — check agent, tool, event_type fields |  |
| O3 | [progress.md](http://progress.md/) updated | `cat logs/progress.md` — should show current trace, status, agents dispatched |  |
| O4 | Active implementer table updated | Check [progress.md](http://progress.md/) for implementer instance tracking |  |

**If O2 shows "unknown" fields:** This is the known debug item from Session 03. The hook payload field names don't match what [log-event.sh](http://log-event.sh/) expects. Capture the raw payload for debugging.

---

## Verify: Guard rails

| # | Check | How to verify | Pass/Fail |
| --- | --- | --- | --- |
| G1 | No writes to .claude/ | `git diff --stat` should show no changes in .claude/ |  |
| G2 | No writes to [ARCHITECTURE.md](http://architecture.md/) | `git diff ARCHITECTURE.md` should be empty |  |
| G3 | No writes to [CLAUDE.md](http://claude.md/) | `git diff .claude/CLAUDE.md` should be empty |  |
| G4 | Branch protection enforced | If implementer tried to push to main directly, it should have been rejected |  |

---

## After the run

Regardless of outcome, capture:

```bash
# 1. Save Claude Code session output
# Copy/paste the full terminal output to a file

# 2. Save events log
cp logs/events.jsonl logs/events-test-run-1.jsonl

# 3. Sync to observability DB
./scripts/sync-events.sh

# 4. Check dashboard
./scripts/dashboard.sh
# Open <http://localhost:3737> and screenshot

# 5. Document results
# Fill in all Pass/Fail columns above
# Note any unexpected behavior
```

---

## Expected failures (things we know might break)

| Issue | Likely cause | Fix |
| --- | --- | --- |
| Orchestrator does work itself | Description field doesn't trigger delegation | Tune orchestrator stub description to be more explicit about routing |
| No GitHub MCP usage | Subagents may not inherit MCP tools if tools field is restrictive | Ensure stubs don't have a `tools:` allowlist that excludes MCP |
| Reviewer never triggered | Orchestrator pipeline stops after implementer | Add explicit instruction in orchestrator stub to route to reviewer after implementation |
| Hook fields show "unknown" | [log-event.sh](http://log-event.sh/) field names don't match Claude Code's payload | Capture raw payload, update field names in script |
| [merge-agent.sh](http://merge-agent.sh/) not run | Base agent context not loaded | Check if orchestrator reads base agent via relative path |
| Branch naming wrong | Implementer ignores naming convention | Check stub, make naming more explicit |

---

## Results summary

**Date:**

**Overall result:** PASS / PARTIAL / FAIL

**Steps completed:** S1-S6 / I1-I9 / R1-R7 / O1-O4 / G1-G4

**Failures:**

**Notes:**