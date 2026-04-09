#!/bin/bash
# Wrapper: start Loci session
# Merges all agent stubs with base+stack, then runs session bootstrap.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== Resetting agent stubs from git ==="
git -C "$PROJECT_DIR" checkout -- .claude/agents/
echo "Agent stubs reset."
echo ""

echo "=== Merging agent definitions ==="
for stub in "$PROJECT_DIR/.claude/agents/"*.md; do
  agent_name=$(basename "$stub" .md)
  "$SCRIPT_DIR/merge-agent.sh" "$agent_name"
done
echo ""

# Load GitHub PATs from Keychain
echo "=== Loading GitHub PATs from Keychain ==="
export GITHUB_ORCHESTRATOR_PAT=$(security find-generic-password -a loci -s github-supervisor-pat -w 2>/dev/null) \
  || { echo "FAIL: github-supervisor-pat not found in Keychain"; exit 1; }
export GITHUB_IMPLEMENTER_PAT=$(security find-generic-password -a loci -s github-implementer-pat -w 2>/dev/null) \
  || { echo "FAIL: github-implementer-pat not found in Keychain"; exit 1; }
export GITHUB_REVIEWER_PAT=$(security find-generic-password -a loci -s github-reviewer-pat -w 2>/dev/null) \
  || { echo "FAIL: github-reviewer-pat not found in Keychain"; exit 1; }
echo "GitHub PATs loaded."
echo ""

# Register MCP servers with live token values (Claude Code does not interpolate env vars in headers)
echo "=== Registering GitHub MCP servers ==="
cd "$PROJECT_DIR"
for server in github-orchestrator github-implementer github-reviewer; do
  claude mcp remove "$server" 2>/dev/null || true
done
claude mcp add --transport http github-orchestrator https://api.githubcopilot.com/mcp \
  --header "Authorization: Bearer $GITHUB_ORCHESTRATOR_PAT" \
  || { echo "FAIL: could not register github-orchestrator MCP server"; exit 1; }
claude mcp add --transport http github-implementer https://api.githubcopilot.com/mcp \
  --header "Authorization: Bearer $GITHUB_IMPLEMENTER_PAT" \
  || { echo "FAIL: could not register github-implementer MCP server"; exit 1; }
claude mcp add --transport http github-reviewer https://api.githubcopilot.com/mcp \
  --header "Authorization: Bearer $GITHUB_REVIEWER_PAT" \
  || { echo "FAIL: could not register github-reviewer MCP server"; exit 1; }
echo "GitHub MCP servers registered."
echo ""

exec "$PROJECT_DIR/../agent-primitives/scripts/start.sh" "$PROJECT_DIR" "$@"
