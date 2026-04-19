#!/usr/bin/env bash
# bin/browse.sh — Unix ブラウザ CLI ラッパー
# 使い方: ./bin/browse.sh <command> [args...]
# 省略形: $B <command> [args...]

set -euo pipefail

# プロジェクトルート検出
PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || dirname "$(dirname "$(realpath "$0")")")
BROWSE_DIR="$PROJECT_ROOT/browse"

# コンパイル済みバイナリを優先、なければ TypeScript ソースを使う
COMPILED_BIN="$BROWSE_DIR/dist/browse"
CLI_SCRIPT="$BROWSE_DIR/src/cli.ts"

if [ -f "$COMPILED_BIN" ] && [ -x "$COMPILED_BIN" ]; then
    export BROWSE_STATE_DIR="$PROJECT_ROOT/.gstack"
    exec "$COMPILED_BIN" "$@"
fi

if [ ! -f "$CLI_SCRIPT" ]; then
    GLOBAL_DIR="$HOME/.gstack-copilot-jp/browse"
    CLI_SCRIPT="$GLOBAL_DIR/src/cli.ts"
    if [ ! -f "$CLI_SCRIPT" ]; then
        echo "Error: browse CLI not found. gstack-copilot-jp をワークスペースに追加してください。" >&2
        exit 1
    fi
fi

# bun 確認（node フォールバック）
if command -v bun &>/dev/null; then
    RUNTIME="bun"
elif command -v node &>/dev/null; then
    RUNTIME="node"
else
    echo "Error: Bun or Node.js is required. Install Bun from https://bun.sh/" >&2
    exit 1
fi

# 依存確認
NODE_MODULES="$(dirname "$(dirname "$CLI_SCRIPT")")/node_modules"
if [ ! -d "$NODE_MODULES" ]; then
    echo "[browse] Installing dependencies..." >&2
    pushd "$(dirname "$(dirname "$CLI_SCRIPT")")" >/dev/null
    if [ "$RUNTIME" = "bun" ]; then
        bun install 2>/dev/null
    else
        npm install --production 2>/dev/null
    fi
    npx playwright install chromium 2>/dev/null
    popd >/dev/null
fi

# 状態ディレクトリ
export BROWSE_STATE_DIR="$PROJECT_ROOT/.gstack"

# CLI 実行
exec "$RUNTIME" "$CLI_SCRIPT" "$@"
