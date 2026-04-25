#!/usr/bin/env bash
# gstack-init.sh — ~/.gstack/ ディレクトリ構造を初期化する
# 本家 gstack と同一の root 構造。Copilot 固有 state は hosts/copilot-cli/ に隔離。
set -euo pipefail

GSTACK_DIR="${HOME}/.gstack"

# ホスト検出
if [ -z "${GSTACK_HOST:-}" ]; then
  if [ -n "${VSCODE_PID:-}" ] || { [ "${TERM_PROGRAM:-}" = "vscode" ] && [ -n "${TERM_PROGRAM_VERSION:-}" ]; }; then
    GSTACK_HOST="vscode"
  elif command -v copilot >/dev/null 2>&1; then
    GSTACK_HOST="cli"
  else
    GSTACK_HOST="unknown"
  fi
fi

echo "gstack-copilot-jp: ~/.gstack/ を初期化 (host: $GSTACK_HOST)..."

# ディレクトリ構造
mkdir -p "$GSTACK_DIR"/{projects,plans,analytics,sessions}
mkdir -p "$GSTACK_DIR"/hosts/"$GSTACK_HOST"/{installations,env}
mkdir -p "$GSTACK_DIR"/repos

# config.yaml（存在しなければ作成）
if [ ! -f "$GSTACK_DIR/config.yaml" ]; then
  cat > "$GSTACK_DIR/config.yaml" << 'EOF'
# gstack-copilot-jp configuration
# 本家 gstack と共有するキーのみ。Copilot 固有設定は hosts/copilot-cli/ に置く。
telemetry: false
auto_upgrade: false
EOF
  echo "  config.yaml を作成"
fi

# capabilities.json（ホスト固有）
CAPS_FILE="$GSTACK_DIR/hosts/$GSTACK_HOST/capabilities.json"
if [ ! -f "$CAPS_FILE" ]; then
  cat > "$CAPS_FILE" << EOF
{
  "host": "$GSTACK_HOST",
  "detected_at": null,
  "builtins": {
    "code-review": "unknown",
    "rubber-duck": "unknown",
    "explore": "unknown",
    "research": "unknown",
    "task": "unknown"
  },
  "mcp": {
    "github": "unknown",
    "playwright": "unknown",
    "fetch": "unknown"
  }
}
EOF
  echo "  capabilities.json を作成"
fi

echo "  完了: $GSTACK_DIR"
