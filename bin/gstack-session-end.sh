#!/usr/bin/env bash
# gstack-session-end.sh — sessionEnd hook
# セッション追跡のクリーンアップ、学習抽出の提案
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
GSTACK_DIR="${HOME}/.gstack"
SESSIONS_DIR="${GSTACK_DIR}/sessions"

# セッションファイル削除（PPID-* パターンで session-start と一致させる）
find "$SESSIONS_DIR" -maxdepth 1 -name "${PPID:-$$}-*" -type f -delete 2>/dev/null
# レガシー形式（PPID のみ）のクリーンアップ
rm -f "${SESSIONS_DIR}/${PPID}" 2>/dev/null

# スキル使用ログ (JSONL)
SLUG=$("$SCRIPT_DIR/gstack-slug" 2>/dev/null || echo "unknown")
USAGE_FILE="${GSTACK_DIR}/projects/${SLUG}/skill-usage.jsonl"
if [ -d "${GSTACK_DIR}/projects/${SLUG}" ]; then
  echo "{\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"event\":\"session_end\",\"pid\":$$,\"project\":\"${SLUG}\"}" >> "$USAGE_FILE"
fi

# 学習抽出の提案
echo "セッション終了。/learn 振り返り を実行して知見を記録することを推奨する。"
