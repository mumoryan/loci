# Spec: Root dev scripts

## Status
- [ ] Implementation
- [ ] Human review

## What this is
A root-level `package.json` and `scripts/dev.sh` that let you start the
frontend, backend, or both from the `loci/` root directory without `cd`-ing
into subdirectories.

## Acceptance criteria
- [ ] `bun run fe` starts the frontend dev server from the `loci/` root
- [ ] `bun run be` starts the backend dev server from the `loci/` root
- [ ] `bun run dev` opens frontend and backend in separate terminal tabs
- [ ] All three commands work when run from `~/Development/loci-root/loci/`
- [ ] Existing `frontend/package.json` and `backend/package.json` are unchanged
- [ ] `scripts/dev.sh` is executable (`chmod +x`)
- [ ] No new dependencies installed

## Files to create

### `package.json` (repo root — `loci/package.json`)

```json
{
  "name": "loci",
  "private": true,
  "scripts": {
    "fe":  "cd frontend && bun run dev",
    "be":  "cd backend && bun run dev",
    "dev": "./scripts/dev.sh"
  }
}
```

### `scripts/dev.sh`

```bash
#!/bin/bash
# Opens frontend and backend in separate terminal tabs.
# Run from loci/ root: bun run dev  (or ./scripts/dev.sh)

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [[ "$OSTYPE" == "darwin"* ]]; then
  if [[ "$TERM_PROGRAM" == "iTerm.app" ]]; then
    osascript <<EOF
tell application "iTerm2"
  tell current window
    create tab with default profile
    tell current session of current tab
      write text "cd '$ROOT/frontend' && bun run dev"
    end tell
    create tab with default profile
    tell current session of current tab
      write text "cd '$ROOT/backend' && bun run dev"
    end tell
  end tell
end tell
EOF
  else
    osascript <<EOF
tell application "Terminal"
  do script "cd '$ROOT/frontend' && bun run dev"
  do script "cd '$ROOT/backend' && bun run dev"
end tell
EOF
  fi

elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  if command -v gnome-terminal &>/dev/null; then
    gnome-terminal --tab -- bash -c "cd '$ROOT/frontend' && bun run dev; exec bash" \
                   --tab -- bash -c "cd '$ROOT/backend' && bun run dev; exec bash"
  elif command -v wezterm &>/dev/null; then
    wezterm cli spawn -- bash -c "cd '$ROOT/frontend' && bun run dev"
    wezterm cli spawn -- bash -c "cd '$ROOT/backend' && bun run dev"
  else
    echo "Could not detect terminal. Run these in separate tabs:"
    echo "  cd $ROOT/frontend && bun run dev"
    echo "  cd $ROOT/backend  && bun run dev"
    exit 1
  fi

else
  echo "Unsupported OS. Run these in separate tabs:"
  echo "  cd $ROOT/frontend && bun run dev"
  echo "  cd $ROOT/backend  && bun run dev"
fi
```

## Implementation notes
- Do not run `bun install` at the root — this `package.json` has no
  dependencies and should stay that way
- Do not modify `frontend/package.json` or `backend/package.json`
- The `dev.sh` script uses `$OSTYPE` to detect macOS vs Linux and
  `$TERM_PROGRAM` to distinguish iTerm2 from Terminal.app on Mac
- After creating `scripts/dev.sh`, make it executable:
  ```bash
  chmod +x scripts/dev.sh
  ```
- The backend `bun run dev` command assumes `backend/package.json` has
  a `dev` script defined. If it does not exist yet, create it as:
  ```json
  {
    "scripts": {
      "dev": "bun run --watch src/index.ts"
    }
  }
  ```

## Human review
- [ ] `bun run fe` starts the frontend and opens https://localhost:5173
- [ ] `bun run be` starts the backend without error
- [ ] `bun run dev` opens two separate terminal tabs, one per service
- [ ] Both services run correctly when started together