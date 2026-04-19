#!/usr/bin/env bash
# gstack-pre-tool-guard.sh — preToolUse hook
# /careful, /freeze のガード実装
# 環境変数 GSTACK_CAREFUL=1, GSTACK_FREEZE_PATH=<path> で制御
set -euo pipefail

TOOL_NAME="${1:-}"
TOOL_ARGS="${2:-}"

# /careful モード: 破壊的コマンドの検出
if [ "${GSTACK_CAREFUL:-0}" = "1" ] && [ "$TOOL_NAME" = "bash" ]; then
  case "$TOOL_ARGS" in
    *"rm -rf"*|*"DROP TABLE"*|*"DROP DATABASE"*|*"--force"*|*"git reset --hard"*|*"git push --force"*|*"git push -f"*)
      echo "⚠️ /careful: 破壊的コマンド検出: ${TOOL_ARGS}"
      echo "続行するにはユーザーの承認が必要。"
      exit 1
      ;;
  esac
fi

# /freeze モード: 許可パス外の書き込み検出
if [ -n "${GSTACK_FREEZE_PATH:-}" ]; then
  case "$TOOL_NAME" in
    edit|create|write)
      case "$TOOL_ARGS" in
        "${GSTACK_FREEZE_PATH}"*) ;; # 許可パス内 — OK
        *)
          echo "⚠️ /freeze: ${GSTACK_FREEZE_PATH} 外への書き込みはブロック。"
          exit 1
          ;;
      esac
      ;;
  esac
fi

exit 0
