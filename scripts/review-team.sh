#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

SCRIPT_FILE="阿里妈妈多合一助手.js"
README_FILE="README.md"
CLAUDE_FILE="CLAUDE.md"
TEST_FILES=()

pass() {
  printf '[PASS] %s\n' "$1"
}

fail() {
  printf '[FAIL] %s\n' "$1" >&2
  exit 1
}

require_file() {
  local file="$1"
  [[ -f "$file" ]] || fail "Missing required file: $file"
}

collect_test_files() {
  TEST_FILES=()
  while IFS= read -r file; do
    TEST_FILES+=("$file")
  done < <(find tests -maxdepth 1 -type f -name '*.test.mjs' | sort)
  [[ "${#TEST_FILES[@]}" -gt 0 ]] || fail 'No test files found under tests/'
}

require_cmd() {
  local cmd="$1"
  command -v "$cmd" >/dev/null 2>&1 || fail "Missing required command: $cmd"
}

has_match() {
  local pattern="$1"
  local file="$2"
  if command -v rg >/dev/null 2>&1; then
    rg -q "$pattern" "$file"
  else
    grep -qE "$pattern" "$file"
  fi
}

find_matches() {
  local pattern="$1"
  local file="$2"
  if command -v rg >/dev/null 2>&1; then
    rg -n "$pattern" "$file" || true
  else
    grep -nE "$pattern" "$file" || true
  fi
}

extract_script_version() {
  sed -nE 's#^// @version[[:space:]]+([0-9]+(\.[0-9]+)*)#\1#p' "$SCRIPT_FILE" | head -n1
}

extract_readme_version() {
  sed -nE 's/^### v([0-9]+(\.[0-9]+)*) .*/\1/p' "$README_FILE" | head -n1
}

extract_claude_version() {
  sed -nE 's/^- \*\*当前版本\*\*: `v([0-9]+(\.[0-9]+)*)`/\1/p' "$CLAUDE_FILE" | head -n1
}

assert_no_pattern() {
  local pattern="$1"
  local label="$2"
  local matches
  matches="$(find_matches "$pattern" "$SCRIPT_FILE")"
  if [[ -n "$matches" ]]; then
    printf '%s\n' "$matches" >&2
    fail "$label"
  fi
  pass "$label"
}

main() {
  require_cmd node
  require_file "$SCRIPT_FILE"
  require_file "$README_FILE"
  collect_test_files

  printf '== Review Team Check ==\n'

  printf '\n[Architecture] Baseline contract checks\n'
  has_match '__ALIMAMA_OPTIMIZER_TOGGLE__' "$SCRIPT_FILE" || fail 'Missing bridge: __ALIMAMA_OPTIMIZER_TOGGLE__'
  has_match '__AM_HOOK_MANAGER__' "$SCRIPT_FILE" || fail 'Missing hook manager: __AM_HOOK_MANAGER__'
  pass 'Core integration contracts exist'

  printf '\n[Security] Dangerous API checks\n'
  assert_no_pattern 'eval[[:space:]]*\(' 'No eval(...) usage'
  assert_no_pattern 'new[[:space:]]+Function[[:space:]]*\(' 'No new Function(...) usage'

  printf '\n[Test] Syntax and automated tests\n'
  node --check "$SCRIPT_FILE"
  pass 'Syntax check passed'
  node --test "${TEST_FILES[@]}"
  pass "Regression tests passed (${#TEST_FILES[@]})"

  printf '\n[Release] Version consistency checks\n'
  local script_version
  local readme_version
  script_version="$(extract_script_version)"
  readme_version="$(extract_readme_version)"

  [[ -n "$script_version" ]] || fail 'Cannot parse @version from userscript header'
  [[ -n "$readme_version" ]] || fail 'Cannot parse latest version from README.md'

  [[ "$script_version" == "$readme_version" ]] || fail "Version mismatch: script=$script_version README=$readme_version"
  pass "Version aligned with README.md: $script_version"

  if [[ -f "$CLAUDE_FILE" ]]; then
    local claude_version
    claude_version="$(extract_claude_version)"
    [[ -n "$claude_version" ]] || fail 'Cannot parse current version from CLAUDE.md'
    [[ "$script_version" == "$claude_version" ]] || fail "Version mismatch: script=$script_version CLAUDE=$claude_version"
    pass "Version aligned with CLAUDE.md: $script_version"
  else
    pass 'Optional version file missing: CLAUDE.md (skipped)'
  fi

  printf '\nAll automated review checks passed.\n'
}

main "$@"
