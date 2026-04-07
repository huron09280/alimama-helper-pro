#!/usr/bin/env bash
set -euo pipefail

URL="${1:-https://www.baidu.com}"
PROFILE_DIR="${HOME}/.chrome-devtools-profile"
DEFAULT_DEVTOOLS_DIR="${HOME}/Library/Application Support/Google/Chrome"
PROFILE_DEVTOOLS_PORT_FILE="${PROFILE_DIR}/DevToolsActivePort"
DEFAULT_DEVTOOLS_PORT_FILE="${DEFAULT_DEVTOOLS_DIR}/DevToolsActivePort"
CHROME_APP="/Applications/Google Chrome.app"
BROWSER_URL="http://127.0.0.1:9222"
MCP_BIN="${AM_CHROME_DEVTOOLS_MCP_BIN:-}"
if [[ -z "${MCP_BIN}" ]]; then
  MCP_BIN="$(command -v chrome-devtools-mcp || true)"
fi

printf '[1/4] 检查/启动 Chrome 专用 profile\n'
if ! lsof -nP -iTCP:9222 -sTCP:LISTEN >/dev/null 2>&1; then
  rm -f "${PROFILE_DEVTOOLS_PORT_FILE}" "${DEFAULT_DEVTOOLS_PORT_FILE}"
  open -na "${CHROME_APP}" --args \
    --user-data-dir="${PROFILE_DIR}" \
    --profile-directory=Default \
    --remote-debugging-port=9222 \
    --remote-allow-origins='*' \
    --no-first-run \
    --no-default-browser-check \
    --new-window \
    "${URL}"
fi

for _ in $(seq 1 60); do
  if curl -sf "${BROWSER_URL}/json/version" >/tmp/chrome-devtools-version.json 2>/dev/null; then
    break
  fi
  sleep 0.2
done

if ! test -s /tmp/chrome-devtools-version.json; then
  echo 'ERROR: Chrome DevTools 端口 9222 未就绪。'
  exit 1
fi

if ! rg -q '"webSocketDebuggerUrl"' /tmp/chrome-devtools-version.json; then
  echo 'ERROR: DevTools endpoint 缺少 webSocketDebuggerUrl。'
  cat /tmp/chrome-devtools-version.json
  exit 1
fi

printf '[2/4] 同步 DevToolsActivePort 到默认目录\n'
if test -s "${PROFILE_DEVTOOLS_PORT_FILE}"; then
  mkdir -p "${DEFAULT_DEVTOOLS_DIR}"
  cp "${PROFILE_DEVTOOLS_PORT_FILE}" "${DEFAULT_DEVTOOLS_PORT_FILE}"
fi

printf '[3/4] 固化 Codex MCP 配置\n'
if [[ -z "${MCP_BIN}" ]]; then
  echo 'ERROR: 未找到 chrome-devtools-mcp，请先加入 PATH，或设置 AM_CHROME_DEVTOOLS_MCP_BIN。'
  exit 1
fi
if ! test -x "${MCP_BIN}"; then
  echo "ERROR: MCP 可执行文件不可用：${MCP_BIN}"
  exit 1
fi

codex mcp remove chrome-devtools >/dev/null 2>&1 || true
codex mcp add chrome-devtools -- "${MCP_BIN}" "--browser-url=${BROWSER_URL}" >/dev/null
codex mcp get chrome-devtools

printf '[4/4] 浏览器端点冒烟\n'
curl -sf "${BROWSER_URL}/json/list" >/tmp/chrome-devtools-list.json
head -c 240 /tmp/chrome-devtools-list.json; echo

echo '完成：本机浏览器与 MCP 配置已修复。'
echo '若当前 Codex 会话仍报 Transport closed，请重开该会话后再调用 chrome-devtools。'
