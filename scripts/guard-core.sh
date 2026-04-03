#!/bin/bash
# guard-core.sh — PreToolUse hook
# Blocks any agent write to protected core paths.
# Exit 2 = hard block. Claude Code will not proceed.

INPUT=$(cat)
TOOL_PATH=$(echo "$INPUT" | jq -r '.tool_input.path // ""')
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')

# Protected path patterns
PROTECTED_PATTERN='(^|/)(\.(claude|git)/|ARCHITECTURE\.md|CLAUDE\.md|mcp\.json|agents/)'

# Check direct path writes
if echo "$TOOL_PATH" | grep -qE "$PROTECTED_PATTERN"; then
  echo "BLOCKED: write to protected path: $TOOL_PATH" >&2
  exit 2
fi

# Check bash commands that might write to protected paths
if echo "$COMMAND" | grep -qE "(>|tee|cp|mv|rm).*(\.claude|ARCHITECTURE\.md|CLAUDE\.md|mcp\.json|agents/)"; then
  echo "BLOCKED: bash command targets protected path" >&2
  exit 2
fi

exit 0
