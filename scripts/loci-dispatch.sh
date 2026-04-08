#!/bin/bash
# Wrapper: dispatch agent worktree for Loci
# Usage: loci-dispatch.sh <agent-name> <instance> <category> <spec-name>
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
exec "$PROJECT_DIR/../agent-primitives/scripts/dispatch.sh" "$PROJECT_DIR" "$@"
