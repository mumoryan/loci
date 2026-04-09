#!/bin/bash
# merge-agent.sh — merges Layer 0+1 (base) + Layer 2 (stack) + Layer 3 (stub)
# into a single file Claude Code can read.
# Static sections first (cache-eligible), dynamic sections last.
#
# Usage: ./scripts/merge-agent.sh <agent-name>
# Example: ./scripts/merge-agent.sh frontend-implementer
#
# Output: .claude/agents/<agent-name>.md (gitignored — source is .stub.md)

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

# Extract extends fields from stub frontmatter (-m1 = first match only)
BASE_REL=$(grep -m1 '^\s*base:' "$STUB" | awk '{print $2}')
STACK_REL=$(grep -m1 '^\s*stack:' "$STUB" | awk '{print $2}')

TMPFILE="$(mktemp)"
OUTPUT="$LOCI_ROOT/.claude/agents/${AGENT_NAME}.md"

{
  # Stub frontmatter FIRST — Claude Code reads model/description from top of file
  awk '/^---/{f++; print; next} f==1{print} f==2{exit}' "$STUB"
  echo ""

  # Layer 0+1: base body (static — cache eligible, frontmatter stripped)
  if [ -n "$BASE_REL" ]; then
    BASE_PATH="$LOCI_ROOT/.claude/agents/$BASE_REL"
    if [ -f "$BASE_PATH" ]; then
      awk '/^---/{f++; next} f>=2{print}' "$BASE_PATH"
      echo ""
    fi
  fi

  # Layer 2: stack body (static — cache eligible, frontmatter stripped)
  if [ -n "$STACK_REL" ]; then
    STACK_PATH="$LOCI_ROOT/.claude/agents/$STACK_REL"
    if [ -f "$STACK_PATH" ]; then
      awk '/^---/{f++; next} f>=2{print}' "$STACK_PATH"
      echo ""
    fi
  fi

  # Layer 3: stub body only (frontmatter already output above)
  awk '/^---/{f++; next} f>=2{print}' "$STUB"

} > "$TMPFILE" && mv "$TMPFILE" "$OUTPUT"

echo "Merged: $OUTPUT"
