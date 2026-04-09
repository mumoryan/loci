#!/bin/bash
# Wrapper: start Loci session
# Merges all agent stubs with base+stack, then runs session bootstrap.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== Merging agent definitions ==="
for stub in "$PROJECT_DIR/.claude/agents/"*.md; do
  agent_name=$(basename "$stub" .md)
  "$SCRIPT_DIR/merge-agent.sh" "$agent_name"
done
echo ""

# Load GitHub PATs from Keychain
echo "=== Loading GitHub PATs from Keychain ==="
export GITHUB_SUPERVISOR_PAT=$(security find-generic-password -a loci -s github-supervisor-pat -w 2>/dev/null) \
  || { echo "FAIL: github-supervisor-pat not found in Keychain"; exit 1; }
export GITHUB_IMPLEMENTER_PAT=$(security find-generic-password -a loci -s github-implementer-pat -w 2>/dev/null) \
  || { echo "FAIL: github-implementer-pat not found in Keychain"; exit 1; }
export GITHUB_REVIEWER_PAT=$(security find-generic-password -a loci -s github-reviewer-pat -w 2>/dev/null) \
  || { echo "FAIL: github-reviewer-pat not found in Keychain"; exit 1; }
echo "GitHub PATs loaded."
echo ""

exec "$PROJECT_DIR/../agent-primitives/scripts/start.sh" "$PROJECT_DIR" "$@"
