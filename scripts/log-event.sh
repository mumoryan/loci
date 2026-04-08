#!/bin/bash
# log-event.sh — PostToolUse hook
# Writes one structured JSON line to logs/events.jsonl per tool call.
# Zero tokens — this runs outside the agent context window.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/../logs/events.jsonl"
INPUT=$(cat)
echo "$INPUT" >> "$SCRIPT_DIR/../logs/raw-hook-payload.log"

# Extract fields from hook input
AGENT=$(echo "$INPUT" | jq -r '.agent_name // "unknown"')
TOOL=$(echo "$INPUT" | jq -r '.tool_name // "unknown"')
TOOL_INPUT_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.command // ""')
TOOL_RESULT=$(echo "$INPUT" | jq -r '.tool_result // {}')
SESSION_ID="${LOCI_SESSION_ID:-ses_$(date +%s)}"
TRACE_ID="${LOCI_TRACE_ID:-trc_unknown}"

# Derive event metadata
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
EVENT_ID="evt_$(date +%s%N | sha256sum | head -c 12)"

# Determine tool type (raw vs mcp — extend as MCP tools are added)
TOOL_TYPE="raw"

# Determine cost bucket from agent name
case "$AGENT" in
  *supervisor*)    COST_BUCKET="orchestration" ;;
  *frontend*)      COST_BUCKET="code_generation" ;;
  *backend*)       COST_BUCKET="code_generation" ;;
  *world-builder*) COST_BUCKET="world_building" ;;
  *reviewer*)      COST_BUCKET="review" ;;
  *)               COST_BUCKET="unknown" ;;
esac

# Sensitive data flag — never log path contents for world-builder
SENSITIVE="false"
if [ "$AGENT" = "world-builder" ]; then
  SENSITIVE="true"
  TOOL_INPUT='"[redacted]"'
fi

# Write event line
jq -nc \
  --arg event_id "$EVENT_ID" \
  --arg session_id "$SESSION_ID" \
  --arg trace_id "$TRACE_ID" \
  --arg agent "$AGENT" \
  --arg tool "$TOOL" \
  --arg tool_type "$TOOL_TYPE" \
  --arg cost_bucket "$COST_BUCKET" \
  --arg ts "$TIMESTAMP" \
  --argjson sensitive "$SENSITIVE" \
  '{
    event_id: $event_id,
    session_id: $session_id,
    trace_id: $trace_id,
    agent: $agent,
    event_type: "tool_call",
    tool: $tool,
    tool_type: $tool_type,
    cost_bucket: $cost_bucket,
    ts: $ts,
    tokens: { input: 0, output: 0, cache_read: 0, cache_write: 0 },
    cost_usd: 0,
    sensitive_data: $sensitive,
    review_required: false,
    retry_count: 0,
    error: null
  }' >> "$LOG_FILE"

# Note: token counts are 0 here — Claude Code does not expose token usage
# to PostToolUse hooks currently. The schema is ready when this becomes available.

exit 0
