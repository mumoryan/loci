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
