#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

SEARCH_SCOPE=(
  src
  tests
  scripts
  docs
  README.md
  package.json
  AGENTS.md
)

usage() {
  cat <<'EOF'
Usage:
  bash scripts/codex-context.sh map
  bash scripts/codex-context.sh find <pattern>
  bash scripts/codex-context.sh changed
EOF
}

map_scope() {
  if command -v rg >/dev/null 2>&1; then
    rg --files "${SEARCH_SCOPE[@]}" | sort
    return
  fi

  find src tests scripts docs -type f | sort
  printf '%s\n' README.md package.json AGENTS.md
}

find_pattern() {
  local pattern="${1:-}"
  if [[ -z "$pattern" ]]; then
    printf '[FAIL] Missing pattern for "find"\n' >&2
    usage
    exit 1
  fi

  if command -v rg >/dev/null 2>&1; then
    rg -n \
      --hidden \
      --glob '!阿里妈妈多合一助手.js' \
      --glob '!dist/**' \
      --glob '!node_modules/**' \
      "$pattern" \
      "${SEARCH_SCOPE[@]}" || true
    return
  fi

  grep -RIn \
    --exclude='阿里妈妈多合一助手.js' \
    --exclude-dir='dist' \
    --exclude-dir='node_modules' \
    -- "$pattern" src tests scripts docs README.md package.json AGENTS.md || true
}

show_changed() {
  git status --short -- "${SEARCH_SCOPE[@]}"
}

main() {
  local cmd="${1:-}"
  case "$cmd" in
    map)
      map_scope
      ;;
    find)
      shift || true
      find_pattern "$@"
      ;;
    changed)
      show_changed
      ;;
    *)
      usage
      exit 1
      ;;
  esac
}

main "$@"
