#!/bin/bash
# Wrapper: end Loci session
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
exec "$PROJECT_DIR/../agent-primitives/scripts/end.sh" "$PROJECT_DIR"
