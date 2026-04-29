#!/usr/bin/env bash
# gstack-session-start.sh — sessionStart hook
# Preamble 相当: 更新チェック、セッション追跡、ELI16 判定、状態復帰
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
GSTACK_DIR="${HOME}/.gstack"
SESSIONS_DIR="${GSTACK_DIR}/sessions"

# ホスト検出: GSTACK_HOST が未設定なら自動検出
if [ -z "${GSTACK_HOST:-}" ]; then
  if [ -n "${VSCODE_PID:-}" ] || { [ "${TERM_PROGRAM:-}" = "vscode" ] && [ -n "${TERM_PROGRAM_VERSION:-}" ]; }; then
    GSTACK_HOST="vscode"
  elif command -v copilot >/dev/null 2>&1; then
    GSTACK_HOST="cli"
  else
    GSTACK_HOST="unknown"
  fi
fi

HOSTS_DIR="${GSTACK_DIR}/hosts/${GSTACK_HOST}"
ELI16_FLAG="${HOSTS_DIR}/eli16"

# ~/.gstack/ が未作成なら初期化
if [ ! -d "$GSTACK_DIR" ]; then
  "$SCRIPT_DIR/gstack-init.sh" 2>/dev/null || true
fi

# セッション追跡（ホスト別にユニークなセッションID）
mkdir -p "$SESSIONS_DIR"
SESS_ID="${PPID:-$$}-${RANDOM}"
SESS_FILE="${SESSIONS_DIR}/${SESS_ID}"
touch "$SESS_FILE"

# ELI16 判定: 2時間以内に更新された session ファイルを数える
ACTIVE=$(find "$SESSIONS_DIR" -maxdepth 1 -type f -mmin -120 2>/dev/null | wc -l | tr -d ' ')
if [ "$ACTIVE" -ge 3 ]; then
  mkdir -p "$HOSTS_DIR"
  echo "$ACTIVE" > "$ELI16_FLAG"
  echo "ELI16: 並列 ${ACTIVE} セッション検出。質問を簡素化する。"
else
  rm -f "$ELI16_FLAG"
fi

# 更新チェック (1時間に1回)
LAST_CHECK="${GSTACK_DIR}/upstream-last-check"
NOW=$(date +%s)
if [ -f "$LAST_CHECK" ]; then
  LAST=$(cat "$LAST_CHECK" 2>/dev/null || echo 0)
  DIFF=$((NOW - LAST))
  if [ "$DIFF" -lt 3600 ]; then
    exit 0
  fi
fi

# 更新チェック実行 (Phase A-5 で実装済み)
if [ -x "$SCRIPT_DIR/gstack-update-check" ]; then
  bash "$SCRIPT_DIR/gstack-update-check" 2>/dev/null || true
elif command -v gstack-update-check >/dev/null 2>&1; then
  gstack-update-check 2>/dev/null || true
fi
echo "$NOW" > "$LAST_CHECK"
