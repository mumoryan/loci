#!/bin/bash
# Wrapper: orchestrator bash guard for Loci
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
exec "$PROJECT_DIR/../agent-primitives/scripts/guard-orchestrator.sh"
