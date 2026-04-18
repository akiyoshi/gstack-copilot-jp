#!/usr/bin/env bash
# bin/browse.sh — Unix ブラウザ CLI ラッパー
# 使い方: ./bin/browse.sh <command> [args...]
# 省略形: $B <command> [args...]

set -euo pipefail

# プロジェクトルート検出
PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || dirname "$(dirname "$(realpath "$0")")")
BROWSE_DIR="$PROJECT_ROOT/browse"
CLI_SCRIPT="$BROWSE_DIR/src/cli.js"

if [ ! -f "$CLI_SCRIPT" ]; then
    GLOBAL_DIR="$HOME/.gstack-copilot-jp/browse"
    CLI_SCRIPT="$GLOBAL_DIR/src/cli.js"
    if [ ! -f "$CLI_SCRIPT" ]; then
        echo "Error: browse CLI not found. gstack-copilot-jp をワークスペースに追加してください。" >&2
        exit 1
    fi
fi

# node 確認
if ! command -v node &>/dev/null; then
    echo "Error: Node.js is required. Install from https://nodejs.org/" >&2
    exit 1
fi

# Playwright インストール確認
NODE_MODULES="$(dirname "$(dirname "$CLI_SCRIPT")")/node_modules"
if [ ! -d "$NODE_MODULES" ]; then
    echo "[browse] Installing dependencies..." >&2
    pushd "$(dirname "$(dirname "$CLI_SCRIPT")")" >/dev/null
    npm install --production 2>/dev/null
    npx playwright install chromium 2>/dev/null
    popd >/dev/null
fi

# 状態ディレクトリ
export BROWSE_STATE_DIR="$PROJECT_ROOT/.gstack"

# CLI 実行
exec node "$CLI_SCRIPT" "$@"
