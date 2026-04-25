#!/usr/bin/env bash
# bin/gstack-detect-host.sh — ホスト環境の capability を検出
# 出力: JSON形式の capability マトリクス
# 使い方: eval "$(bin/gstack-detect-host.sh)"  # 環境変数として読み込む
#         bin/gstack-detect-host.sh --json       # JSON出力

set -euo pipefail

# ホスト検出
detect_host() {
  if [ -n "${GSTACK_HOST:-}" ]; then
    # サニタイズ: 英小文字・数字・ハイフン・アンダースコアのみ許可
    if ! printf '%s' "$GSTACK_HOST" | grep -qE '^[a-z0-9_-]+$'; then
      echo "unknown"
      return
    fi
    echo "$GSTACK_HOST"  # 手動上書き（エスケープハッチ）
    return
  fi
  if [ -n "${VSCODE_PID:-}" ] || { [ -n "${TERM_PROGRAM_VERSION:-}" ] && [ "${TERM_PROGRAM:-}" = "vscode" ]; }; then
    echo "vscode"
  elif command -v copilot >/dev/null 2>&1; then
    echo "cli"
  else
    echo "unknown"
  fi
}

# Capability 検出
has_browse() {
  local script_dir
  script_dir="$(cd "$(dirname "$0")" && pwd)"
  local project_root
  project_root="$(dirname "$script_dir")"
  [ -x "$project_root/browse/dist/browse" ] || [ -f "$script_dir/browse.sh" ]
}

has_codex() {
  command -v codex >/dev/null 2>&1
}

has_hooks() {
  local project_root
  project_root="$(dirname "$(cd "$(dirname "$0")" && pwd)")"
  [ -f "$project_root/.github/hooks/lifecycle.json" ]
}

HOST=$(detect_host)
HAS_BROWSE=$(has_browse && echo "true" || echo "false")
HAS_CODEX=$(has_codex && echo "true" || echo "false")
HAS_HOOKS=$(has_hooks && echo "true" || echo "false")
HAS_BASH=$(command -v bash >/dev/null 2>&1 && echo "true" || echo "false")

if [ "${1:-}" = "--json" ]; then
  echo "{\"host\":\"$HOST\",\"has_browse\":$HAS_BROWSE,\"has_codex\":$HAS_CODEX,\"has_hooks\":$HAS_HOOKS,\"has_bash\":$HAS_BASH}"
else
  # 環境変数として export
  echo "export GSTACK_HOST=\"$HOST\""
  echo "export GSTACK_HAS_BROWSE=\"$HAS_BROWSE\""
  echo "export GSTACK_HAS_CODEX=\"$HAS_CODEX\""
  echo "export GSTACK_HAS_HOOKS=\"$HAS_HOOKS\""
  echo "export GSTACK_HAS_BASH=\"$HAS_BASH\""
fi
