#!/usr/bin/env bash
# bin/upstream-diff.sh — 本家 gstack との差分を検出する
# 使い方: bin/upstream-diff.sh [--update]
# 前提: ~/.gstack/repos/gstack/ に本家がクローンされている
set -euo pipefail

UPSTREAM_DIR="$HOME/.gstack/repos/gstack"
LAST_CHECK_FILE="$HOME/.gstack/upstream-last-check"

if [ ! -d "$UPSTREAM_DIR" ]; then
  echo "Upstream not found. Cloning..."
  mkdir -p "$(dirname "$UPSTREAM_DIR")"
  git clone --single-branch --depth 50 \
    https://github.com/garrytan/gstack.git \
    "$UPSTREAM_DIR"
fi

# 更新
if [ "${1:-}" = "--update" ] || [ ! -f "$LAST_CHECK_FILE" ]; then
  echo "Pulling upstream..."
  cd "$UPSTREAM_DIR" && git pull --ff-only 2>/dev/null
fi

# 本家のバージョン取得
UPSTREAM_VERSION=""
if [ -f "$UPSTREAM_DIR/VERSION" ]; then
  UPSTREAM_VERSION=$(cat "$UPSTREAM_DIR/VERSION" | tr -d '[:space:]')
elif [ -f "$UPSTREAM_DIR/package.json" ]; then
  UPSTREAM_VERSION=$(grep -o '"version": "[^"]*"' "$UPSTREAM_DIR/package.json" | head -1 | sed 's/.*"version": "//;s/"//')
fi

LAST_CHECKED_VERSION=""
if [ -f "$LAST_CHECK_FILE" ]; then
  LAST_CHECKED_VERSION=$(cat "$LAST_CHECK_FILE" | tr -d '[:space:]')
fi

echo "━━━ upstream diff ━━━"
echo "Upstream version: ${UPSTREAM_VERSION:-unknown}"
echo "Last checked:     ${LAST_CHECKED_VERSION:-never}"

if [ "$UPSTREAM_VERSION" = "$LAST_CHECKED_VERSION" ]; then
  echo "Status: up to date"
  exit 0
fi

echo "Status: NEW VERSION AVAILABLE"
echo ""

# 変更されたスキルを検出
if [ -d "$UPSTREAM_DIR" ]; then
  echo "Changed skills since last check:"
  cd "$UPSTREAM_DIR"
  if [ -n "$LAST_CHECKED_VERSION" ]; then
    git log --oneline --name-only "v${LAST_CHECKED_VERSION}..HEAD" 2>/dev/null \
      | grep -E 'SKILL\.md|\.tmpl' \
      | sort -u \
      | while read -r file; do
        echo "  📝 $file"
      done
  else
    echo "  (initial check — no diff available)"
  fi
fi

# バージョン記録
echo "$UPSTREAM_VERSION" > "$LAST_CHECK_FILE"
echo ""
echo "Run 'bin/adapt-upstream-skill.sh <skill-name>' to generate drafts."
