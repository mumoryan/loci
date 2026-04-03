#!/bin/bash
# merge-agent.sh — merges Layer 0+1 (base) + Layer 2 (stack) + Layer 3 (stub)
# into a single file Claude Code can read.
# Static sections first (cache-eligible), dynamic sections last.
#
# Usage: ./scripts/merge-agent.sh <agent-name>
# Example: ./scripts/merge-agent.sh frontend-implementer
#
# Output: .claude/agents/<agent-name>.merged.md (gitignored)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOCI_ROOT="$SCRIPT_DIR/.."
AGENTS_ROOT="$LOCI_ROOT/../../agents"
AGENT_NAME="$1"
STUB="$LOCI_ROOT/.claude/agents/${AGENT_NAME}.md"

if [ -z "$AGENT_NAME" ]; then
  echo "Usage: merge-agent.sh <agent-name>" >&2
  exit 1
fi

if [ ! -f "$STUB" ]; then
  echo "Stub not found: $STUB" >&2
  exit 1
fi

# Extract extends fields from stub frontmatter
BASE_REL=$(grep 'base:' "$STUB" | awk '{print $2}')
STACK_REL=$(grep 'stack:' "$STUB" | awk '{print $2}')

OUTPUT="$LOCI_ROOT/.claude/agents/${AGENT_NAME}.merged.md"

{
  # Layer 0+1: base (static — cache eligible)
  if [ -n "$BASE_REL" ]; then
    BASE_PATH="$LOCI_ROOT/.claude/agents/$BASE_REL"
    if [ -f "$BASE_PATH" ]; then
      # Strip frontmatter from base, keep body
      awk '/^---/{f++; next} f==2{print} f==1' "$BASE_PATH"
      echo ""
    fi
  fi

  # Layer 2: stack (static — cache eligible)
  if [ -n "$STACK_REL" ]; then
    STACK_PATH="$LOCI_ROOT/.claude/agents/$STACK_REL"
    if [ -f "$STACK_PATH" ]; then
      awk '/^---/{f++; next} f==2{print} f==1' "$STACK_PATH"
      echo ""
    fi
  fi

  # Layer 3: stub frontmatter + dynamic body (last — not cached)
  cat "$STUB"

} > "$OUTPUT"

echo "Merged: $OUTPUT"
