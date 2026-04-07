#!/bin/bash
# Wrapper: launches observability dashboard for Loci
# Usage: ./scripts/dashboard.sh
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
exec bun run "$PROJECT_DIR/../agent-primitives/observability/dashboard.ts" "$PROJECT_DIR"
