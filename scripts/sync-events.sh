#!/bin/bash
# Wrapper: syncs Loci events to observability DB
# Usage: ./scripts/sync-events.sh
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
exec "$PROJECT_DIR/../agent-primitives/observability/sync-events.sh" "$PROJECT_DIR"
