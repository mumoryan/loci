# Spec: Scripted Infrastructure Layer

**Type:** Architecture  
**Scope:** agent-primitives/scripts/ (reusable) + loci/scripts/ (wrappers)  
**Branch:** `arch/scripted-infra`  
**Run from:** `~/Development/loci-root/`  

---

## Context

The first agent run revealed that relying on AI for infrastructure operations
(branch naming, PR creation, session tracking, hook verification) produces
silent non-compliance rather than loud failures. This spec separates concerns:

- **Scripts** handle deterministic, mechanical operations (environment setup,
  worktree creation, session lifecycle, log sync, cleanup)
- **Agents** handle intellectual work via MCP (commits, PRs, reviews, merges)
  with their own identities attached to each operation

The boundary: scripts prepare the environment and tear it down. Agents work
inside the prepared environment. Git write operations stay with agents via
GitHub MCP to preserve per-agent identity in the audit trail.

---

## Principle

AI handles judgment only: decomposing specs, writing code, evaluating quality,
deciding retry vs escalate. Scripts handle mechanics: filesystem setup, session
IDs, hook verification, worktree lifecycle, log sync. The handoff point is
explicit in every script.

---

## Script inventory

| Script | Purpose | Invoked by | When |
|---|---|---|---|
| `start.sh` | Session bootstrap, prereqs, ID generation, hook verification | Human | Before Claude starts |
| `dispatch.sh` | Create worktree for agent instance | Orchestrator (via bash) | Before dispatching subagent |
| `end.sh` | Teardown, log sync, worktree cleanup, archive | Human | After Claude exits |

Note: PR creation, review, approval, and merge remain with agents via GitHub
MCP. No `pr.sh`, `review.sh`, or `merge.sh` scripts — those are agent
operations with identity attached.

---

## Part 1: start.sh

Create `agent-primitives/scripts/start.sh`:

Accepts project directory as argument. Performs all prerequisites, generates
session/trace IDs as environment variables, verifies hooks, and launches
Claude Code.

```bash
#!/bin/bash
# start.sh — deterministic session bootstrap
# Usage: start.sh <project-dir>
# Run this instead of `claude` directly. Nothing starts until all checks pass.

set -e

PROJECT_DIR="${1:?Usage: start.sh <project-dir>}"
PROJECT_DIR="$(cd "$PROJECT_DIR" && pwd)"

echo "=== Session bootstrap ==="
echo "Project: $PROJECT_DIR"

# --- Prerequisites ---

echo "Checking prerequisites..."
command -v jq >/dev/null || { echo "FAIL: jq not installed"; exit 1; }
command -v bun >/dev/null || { echo "FAIL: bun not installed"; exit 1; }
command -v git >/dev/null || { echo "FAIL: git not installed"; exit 1; }
command -v claude >/dev/null || { echo "FAIL: claude CLI not installed"; exit 1; }

# --- Scripts executable ---

echo "Ensuring scripts are executable..."
chmod +x "$PROJECT_DIR/scripts/"*.sh 2>/dev/null || true

# --- Required files ---

echo "Checking required files..."
for f in \
  ".claude/CLAUDE.md" \
  "ARCHITECTURE.md" \
  "scripts/guard-core.sh" \
  "scripts/log-event.sh" \
  "logs/progress.md"
do
  [ -f "$PROJECT_DIR/$f" ] || { echo "FAIL: missing $f"; exit 1; }
done

# --- Hooks registered ---

echo "Checking hooks..."
HOOKS=$(jq '.hooks.PostToolUse // empty' "$PROJECT_DIR/.claude/settings.json" 2>/dev/null)
[ -z "$HOOKS" ] && { echo "FAIL: PostToolUse hook not registered in settings.json"; exit 1; }

# --- Git state ---

echo "Checking git state..."
cd "$PROJECT_DIR"
git diff --quiet || { echo "FAIL: uncommitted changes — clean up before starting"; exit 1; }
git diff --cached --quiet || { echo "FAIL: staged changes — commit or reset before starting"; exit 1; }

# --- Generate session/trace IDs ---

export LOCI_SESSION_ID="ses_$(date +%s)"
export LOCI_TRACE_ID="trc_$(git rev-parse --short HEAD)_$(date +%s)"

echo ""
echo "Session ID: $LOCI_SESSION_ID"
echo "Trace ID:   $LOCI_TRACE_ID"

# --- Hook verification (dry run) ---

echo "Verifying hooks fire..."
echo '{"tool_name":"_preflight_check","tool_input":{}}' \
  | "$PROJECT_DIR/scripts/log-event.sh"

if [ -f "$PROJECT_DIR/logs/events.jsonl" ]; then
  LAST_TOOL=$(tail -1 "$PROJECT_DIR/logs/events.jsonl" | jq -r '.tool // ""')
  if [ "$LAST_TOOL" = "_preflight_check" ] || [ -n "$LAST_TOOL" ]; then
    echo "Hook verification: OK"
  else
    echo "WARN: Hook fired but tool field unexpected: $LAST_TOOL"
  fi
else
  echo "WARN: events.jsonl not created — hook may not be writing"
fi

# --- Update progress.md ---

echo "Updating progress.md..."
cat > "$PROJECT_DIR/logs/progress.md.header" << EOF
_Session: $LOCI_SESSION_ID | Trace: $LOCI_TRACE_ID | Started: $(date -u +%Y-%m-%dT%H:%M:%SZ)_

EOF
# Prepend header, keep existing content
cat "$PROJECT_DIR/logs/progress.md.header" "$PROJECT_DIR/logs/progress.md" \
  > "$PROJECT_DIR/logs/progress.md.tmp" \
  && mv "$PROJECT_DIR/logs/progress.md.tmp" "$PROJECT_DIR/logs/progress.md"
rm -f "$PROJECT_DIR/logs/progress.md.header"

# --- Launch Claude ---

echo ""
echo "=== All checks passed. Launching Claude Code ==="
echo "Environment variables exported: LOCI_SESSION_ID, LOCI_TRACE_ID"
echo ""

cd "$PROJECT_DIR"
exec claude
```

---

## Part 2: dispatch.sh

Create `agent-primitives/scripts/dispatch.sh`:

Prepares a git worktree for a specific agent instance. Does NOT launch Claude
or create a branch on GitHub — the agent does that via MCP after being
dispatched into the worktree.

```bash
#!/bin/bash
# dispatch.sh — prepare worktree for agent instance
# Usage: dispatch.sh <project-dir> <agent-name> <instance-number> <spec-category> <spec-name>
# Example: dispatch.sh ~/Dev/loci frontend-implementer 1 features entry-sequence
#
# Creates: <project-dir>/worktrees/<agent-name>-<instance>/
# The orchestrator calls this before dispatching a subagent.

set -e

PROJECT_DIR="${1:?Usage: dispatch.sh <project-dir> <agent> <instance> <category> <spec>}"
AGENT="${2:?Missing agent name}"
INSTANCE="${3:?Missing instance number}"
CATEGORY="${4:?Missing spec category}"
SPEC="${5:?Missing spec name}"

PROJECT_DIR="$(cd "$PROJECT_DIR" && pwd)"

BRANCH="${AGENT}-${INSTANCE}/${CATEGORY}/${SPEC}"
WORKTREE_DIR="$PROJECT_DIR/worktrees/${AGENT}-${INSTANCE}"

echo "=== Dispatch: $AGENT instance $INSTANCE ==="
echo "Branch: $BRANCH"
echo "Worktree: $WORKTREE_DIR"

# --- Check instance limit ---

ACTIVE=$(find "$PROJECT_DIR/worktrees" -maxdepth 1 -type d 2>/dev/null | grep -c "$AGENT" || echo "0")
MAX_INSTANCES=5

if [ "$ACTIVE" -ge "$MAX_INSTANCES" ]; then
  echo "FAIL: $AGENT already has $ACTIVE active instances (max: $MAX_INSTANCES)"
  exit 1
fi

# --- Clean up stale worktree if exists ---

if [ -d "$WORKTREE_DIR" ]; then
  echo "Cleaning up stale worktree..."
  git -C "$PROJECT_DIR" worktree remove "$WORKTREE_DIR" --force 2>/dev/null || true
fi

# --- Create worktree ---

echo "Creating worktree..."
cd "$PROJECT_DIR"

# Create branch from current main
git worktree add "$WORKTREE_DIR" -b "$BRANCH" main

# --- Set up sparse checkout per agent type ---
# Each agent only sees the directories it needs.
# scripts/ is excluded from all agents — only orchestrator (main checkout) can see them.

cd "$WORKTREE_DIR"
git sparse-checkout init --cone 2>/dev/null || true

case "$AGENT" in
  frontend-implementer)
    git sparse-checkout set frontend specs .claude ARCHITECTURE.md logs
    ;;
  backend-implementer)
    git sparse-checkout set backend specs .claude ARCHITECTURE.md logs
    ;;
  world-builder)
    git sparse-checkout set frontend/src/worlds specs .claude ARCHITECTURE.md
    ;;
  *)
    # Fallback: conservative set, no scripts
    git sparse-checkout set frontend backend specs .claude ARCHITECTURE.md logs
    ;;
esac

echo "Sparse checkout configured for $AGENT"
echo "Excluded from worktree: scripts/, loci-docs/, worktrees/"

# --- Export env vars for the agent ---

ENV_FILE="$WORKTREE_DIR/.agent-env"
cat > "$ENV_FILE" << EOF
export LOCI_AGENT="$AGENT"
export LOCI_INSTANCE="$INSTANCE"
export LOCI_BRANCH="$BRANCH"
export LOCI_SPEC_CATEGORY="$CATEGORY"
export LOCI_SPEC_NAME="$SPEC"
export LOCI_SESSION_ID="${LOCI_SESSION_ID:-ses_$(date +%s)}"
export LOCI_TRACE_ID="${LOCI_TRACE_ID:-trc_unknown}"
EOF

echo ""
echo "=== Worktree ready ==="
echo "Agent env written to: $ENV_FILE"
echo "Orchestrator: dispatch subagent to work in $WORKTREE_DIR"
echo "Agent should: source .agent-env, then implement spec"
echo ""
```

---

## Part 3: end.sh

Create `agent-primitives/scripts/end.sh`:

Session teardown. Syncs logs, cleans up worktrees, archives session data.
Run by human after Claude exits.

```bash
#!/bin/bash
# end.sh — session teardown and archiving
# Usage: end.sh <project-dir>
# Run after Claude Code session ends.

set -e

PROJECT_DIR="${1:?Usage: end.sh <project-dir>}"
PROJECT_DIR="$(cd "$PROJECT_DIR" && pwd)"

echo "=== Session teardown ==="

# --- Sync events to observability DB ---

echo "Syncing events..."
SYNC_SCRIPT="$PROJECT_DIR/../agent-primitives/observability/sync-events.sh"
if [ -x "$SYNC_SCRIPT" ]; then
  "$SYNC_SCRIPT" "$PROJECT_DIR"
else
  echo "WARN: sync-events.sh not found or not executable, skipping"
fi

# --- Clean up merged worktrees ---

echo "Cleaning up worktrees..."
if [ -d "$PROJECT_DIR/worktrees" ]; then
  for wt in "$PROJECT_DIR/worktrees"/*/; do
    [ -d "$wt" ] || continue
    WT_NAME=$(basename "$wt")
    
    # Check if the branch has been merged
    BRANCH=$(git -C "$wt" branch --show-current 2>/dev/null || echo "")
    if [ -n "$BRANCH" ]; then
      MERGED=$(git -C "$PROJECT_DIR" branch --merged main | grep -c "$BRANCH" || echo "0")
      if [ "$MERGED" -gt "0" ]; then
        echo "  Removing merged worktree: $WT_NAME"
        git -C "$PROJECT_DIR" worktree remove "$wt" --force 2>/dev/null || true
      else
        echo "  Keeping unmerged worktree: $WT_NAME (branch: $BRANCH)"
      fi
    fi
  done
fi

# --- Archive session log ---

echo "Archiving session..."
SESSION_ID="${LOCI_SESSION_ID:-unknown}"
ARCHIVE_DIR="$PROJECT_DIR/logs/archive"
mkdir -p "$ARCHIVE_DIR"

# Copy current progress.md as session snapshot
cp "$PROJECT_DIR/logs/progress.md" "$ARCHIVE_DIR/progress_${SESSION_ID}.md" 2>/dev/null || true

# --- Summary ---

EVENT_COUNT=$(wc -l < "$PROJECT_DIR/logs/events.jsonl" 2>/dev/null | tr -d ' ' || echo "0")
WORKTREE_COUNT=$(find "$PROJECT_DIR/worktrees" -maxdepth 1 -type d 2>/dev/null | wc -l | tr -d ' ' || echo "0")
# Subtract 1 for the worktrees directory itself
WORKTREE_COUNT=$((WORKTREE_COUNT > 0 ? WORKTREE_COUNT - 1 : 0))

echo ""
echo "=== Session teardown complete ==="
echo "Events logged: $EVENT_COUNT"
echo "Remaining worktrees: $WORKTREE_COUNT"
echo ""
echo "To view dashboard: ./scripts/dashboard.sh"
echo ""
```

---

## Part 3.5: guard-orchestrator.sh

Create `agent-primitives/scripts/guard-orchestrator.sh`:

A PreToolUse hook registered only on the orchestrator agent. Restricts bash
to an allowlist of approved scripts and read-only commands. Implementers
don't need this because they can't see `scripts/` at all (sparse checkout).

```bash
#!/bin/bash
# guard-orchestrator.sh — PreToolUse hook for orchestrator agent only
# Restricts Bash to approved infrastructure scripts and read-only commands.
# Registered in the orchestrator's agent stub, not globally.

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // ""')

# Only restrict Bash tool — let Read, Write (to specs/), Agent pass through
if [ "$TOOL" != "Bash" ]; then
  exit 0
fi

COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')

# Allowlist: infrastructure scripts the orchestrator may invoke
ALLOWED_SCRIPTS="scripts/loci-dispatch\.sh|scripts/loci-start\.sh|scripts/loci-end\.sh|scripts/sync-events\.sh|scripts/dashboard\.sh"

# Allowlist: read-only commands for inspecting state
ALLOWED_READONLY="^(cat|ls|head|tail|wc|grep|find|git status|git branch|git log|git diff|git ls-remote) "

# Allowlist: source .agent-env (used in dispatch flow)
ALLOWED_SOURCE="^source \.agent-env"

if echo "$COMMAND" | grep -qE "(bash )?(\./)?(${ALLOWED_SCRIPTS})"; then
  exit 0  # approved script
elif echo "$COMMAND" | grep -qE "$ALLOWED_READONLY"; then
  exit 0  # read-only command
elif echo "$COMMAND" | grep -qE "$ALLOWED_SOURCE"; then
  exit 0  # sourcing agent env
else
  echo "Blocked: orchestrator bash restricted to approved scripts and read-only commands" >&2
  echo "Attempted: $COMMAND" >&2
  exit 2  # hard block
fi
```

### Register in orchestrator stub only

Update `loci/.claude/agents/orchestrator.md` frontmatter to include
guard-orchestrator.sh as a PreToolUse hook in addition to the global
guard-core.sh:

```yaml
hooks:
  PreToolUse:
    - matcher: "Write|Edit|Bash"
      hooks:
        - type: command
          command: "./scripts/guard-core.sh"
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/guard-orchestrator.sh"
```

Create the Loci wrapper:

### loci/scripts/guard-orchestrator.sh

```bash
#!/bin/bash
# Wrapper: orchestrator bash guard for Loci
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
exec "$PROJECT_DIR/../agent-primitives/scripts/guard-orchestrator.sh"
```

Must be executable: `chmod +x loci/scripts/guard-orchestrator.sh`

### Defense summary

| Agent | Can see scripts/? | Bash restricted? | Enforcement |
|---|---|---|---|
| orchestrator | Yes (main checkout) | Yes — allowlist only | guard-orchestrator.sh |
| frontend-implementer | No (sparse checkout) | No restriction needed | Filesystem isolation |
| backend-implementer | No (sparse checkout) | No restriction needed | Filesystem isolation |
| world-builder | No (sparse checkout) | No restriction needed | Filesystem isolation |
| reviewer | No worktree — reads via MCP | No bash access | Tool restriction in stub |

---

## Part 4: Loci wrapper scripts

Create thin wrappers in `loci/scripts/`:

### loci/scripts/loci-start.sh

```bash
#!/bin/bash
# Wrapper: start Loci session
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
exec "$PROJECT_DIR/../agent-primitives/scripts/start.sh" "$PROJECT_DIR"
```

### loci/scripts/loci-dispatch.sh

```bash
#!/bin/bash
# Wrapper: dispatch agent worktree for Loci
# Usage: loci-dispatch.sh <agent-name> <instance> <category> <spec-name>
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
exec "$PROJECT_DIR/../agent-primitives/scripts/dispatch.sh" "$PROJECT_DIR" "$@"
```

### loci/scripts/loci-end.sh

```bash
#!/bin/bash
# Wrapper: end Loci session
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
exec "$PROJECT_DIR/../agent-primitives/scripts/end.sh" "$PROJECT_DIR"
```

All wrappers must be executable: `chmod +x loci/scripts/loci-*.sh`

---

## Part 5: Update orchestrator stub

Add to `loci/.claude/agents/orchestrator.md` body text:

```markdown
## Session infrastructure

The session environment is set up by loci-start.sh before you are invoked.
Environment variables available:
- LOCI_SESSION_ID — unique session identifier
- LOCI_TRACE_ID — trace spanning the full feature implementation

## Dispatching agents

Before dispatching a subagent, prepare its worktree:
1. Run: `bash scripts/loci-dispatch.sh <agent-name> <instance> <category> <spec>`
2. Verify the worktree was created successfully
3. Dispatch the subagent to work in `worktrees/<agent-name>-<instance>/`
4. The subagent should `source .agent-env` before starting work

After the subagent completes:
- The subagent creates a branch and PR via GitHub MCP (agent identity preserved)
- Route the PR to the reviewer subagent for validation
- If reviewer passes: reviewer merges via GitHub MCP
- If reviewer fails: dispatch implementer again to the same worktree (max 2 retries)
- If max retries exceeded: write blocker to progress.md, escalate to human

## Conflict resolution

Before parallel dispatch, verify:
- Each agent works in a separate worktree (dispatch.sh handles this)
- File scopes don't overlap (frontend/ vs backend/)
- Max 5 active implementer instances (dispatch.sh enforces this)
```

---

## Part 6: Update agent-primitives README

Add to `agent-primitives/README.md`:

```markdown
## Infrastructure Scripts

Deterministic session lifecycle scripts. AI handles judgment; scripts handle
mechanics.

```
scripts/
  start.sh       Session bootstrap, prereqs, ID generation, hook verification
  dispatch.sh    Prepare worktree for agent instance
  end.sh         Teardown, log sync, worktree cleanup, archiving
```

Each project creates thin wrappers that call these with the correct project
path. See any project's `scripts/` directory for examples.

### Usage

```bash
# Start session (replaces running `claude` directly)
./scripts/loci-start.sh

# Inside Claude — orchestrator prepares worktrees before dispatch
bash scripts/loci-dispatch.sh frontend-implementer 1 features entry-sequence

# After Claude exits
./scripts/loci-end.sh
```
```

---

## Part 7: Update loci README

Add to `loci/README.md`:

```markdown
## Session Lifecycle

```bash
# Start session — runs prerequisites, generates IDs, launches Claude
./scripts/loci-start.sh

# After Claude exits — syncs logs, cleans worktrees, archives
./scripts/loci-end.sh

# View observability dashboard
./scripts/dashboard.sh
```

Never run `claude` directly. Always use `loci-start.sh` — it ensures hooks
are verified, IDs are generated, and the environment is clean before any
agent starts.
```

---

## Part 8: Add worktrees/ to .gitignore

Worktrees are transient working directories, never committed.

Add to `loci/.gitignore`:

```
worktrees/
```

---

## Acceptance criteria

- [ ] `agent-primitives/scripts/start.sh` exists and is executable
- [ ] `agent-primitives/scripts/dispatch.sh` exists and is executable
- [ ] `agent-primitives/scripts/end.sh` exists and is executable
- [ ] `agent-primitives/scripts/guard-orchestrator.sh` exists and is executable
- [ ] `loci/scripts/loci-start.sh` wrapper exists and is executable
- [ ] `loci/scripts/loci-dispatch.sh` wrapper exists and is executable
- [ ] `loci/scripts/loci-end.sh` wrapper exists and is executable
- [ ] `loci/scripts/guard-orchestrator.sh` wrapper exists and is executable
- [ ] `dispatch.sh` uses per-agent sparse checkout (no scripts/ for implementers/world-builder)
- [ ] Orchestrator stub has guard-orchestrator.sh registered as PreToolUse hook for Bash
- [ ] Orchestrator stub updated with session infrastructure and dispatch instructions
- [ ] `agent-primitives/README.md` updated with infrastructure scripts section
- [ ] `loci/README.md` updated with session lifecycle section
- [ ] `worktrees/` added to `loci/.gitignore`
- [ ] `logs/archive/` directory created
- [ ] All scripts accept project directory as argument (reusable pattern)
- [ ] No git write operations in any script (agents do git via MCP)
- [ ] Changes committed on branch `arch/scripted-infra`

## What NOT to change

- Do not modify ARCHITECTURE.md or CLAUDE.md — human-authored
- Do not modify guard-core.sh or log-event.sh — separate concern
- Do not add PR creation, review, or merge scripts — those stay with agents via MCP
- Do not modify base agent contracts in agent-primitives/base/
- Do not modify GitHub MCP configuration