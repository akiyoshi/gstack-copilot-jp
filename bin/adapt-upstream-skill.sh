#!/usr/bin/env bash
# bin/adapt-upstream-skill.sh — 3層合成パイプライン
# 本家スキルを取得→スキル固有部分を抽出→互換ルール適用→frontmatter日本語化→最終SKILL.md出力
#
# 使い方:
#   bin/adapt-upstream-skill.sh <skill-name>           # 最終SKILL.mdを生成
#   bin/adapt-upstream-skill.sh <skill-name> --dry-run  # 差分プレビューのみ
#   bin/adapt-upstream-skill.sh <skill-name> --validate # 変換後のバリデーションのみ
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
UPSTREAM_DIR="$HOME/.gstack/repos/gstack"
SKILL_NAME="${1:?Usage: adapt-upstream-skill.sh <skill-name> [--dry-run|--validate]}"
MODE="${2:-apply}"
TRACKING_JSON="$ROOT_DIR/upstream-tracking.json"
SKILL_DIR="$ROOT_DIR/.github/skills/$SKILL_NAME"

# --- Layer 0: upstream ソース取得 ---

# upstream が存在しなければクローン
if [ ! -d "$UPSTREAM_DIR" ]; then
  echo "Upstream not found. Cloning..."
  mkdir -p "$(dirname "$UPSTREAM_DIR")"
  git clone --single-branch --depth 50 \
    https://github.com/garrytan/gstack.git "$UPSTREAM_DIR"
fi

# pinned commit SHA があればチェックアウト
if [ -f "$TRACKING_JSON" ]; then
  PINNED_COMMIT=$(python3 -c "import json; print(json.load(open('$TRACKING_JSON')).get('upstream_commit',''))" 2>/dev/null || true)
  if [ -n "$PINNED_COMMIT" ]; then
    cd "$UPSTREAM_DIR"
    CURRENT_COMMIT=$(git rev-parse HEAD 2>/dev/null || true)
    if [ "$CURRENT_COMMIT" != "$PINNED_COMMIT" ]; then
      git fetch origin 2>/dev/null || true
      git checkout "$PINNED_COMMIT" 2>/dev/null || echo "Warning: Could not checkout pinned commit $PINNED_COMMIT"
    fi
    cd "$ROOT_DIR"
  fi
fi

# 本家の生成済み SKILL.md を検索（.tmpl ではなく生成済みを優先）
UPSTREAM_FILE=""
for candidate in \
  "$UPSTREAM_DIR/$SKILL_NAME/SKILL.md" \
  "$UPSTREAM_DIR/skills/$SKILL_NAME/SKILL.md"; do
  if [ -f "$candidate" ]; then
    UPSTREAM_FILE="$candidate"
    break
  fi
done

if [ -z "$UPSTREAM_FILE" ]; then
  echo "Error: Upstream skill '$SKILL_NAME' not found in $UPSTREAM_DIR" >&2
  exit 1
fi

echo "━━━ Layer 0: upstream ソース ━━━"
echo "File: $UPSTREAM_FILE"
echo "Lines: $(wc -l < "$UPSTREAM_FILE")"

# --- Layer 1: スキル固有部分の抽出 ---

# アンカーパターン: "# <Title>" で始まるスキル固有セクションを検出
# upstream の共有ボイラープレートは "## Preamble" ～ "## SETUP" の範囲
# スキル固有部分はそれ以降の "# " (h1) で始まるセクション

BODY=$(awk '
  BEGIN { found=0; in_code=0 }
  /^```/ { in_code = !in_code; if (found) print; next }
  # h1 outside code blocks = skill body start
  /^# [A-Z]/ && !in_code && !found {
    found=1
  }
  found { print }
' "$UPSTREAM_FILE")

if [ -z "$BODY" ]; then
  echo "Warning: Could not extract skill body. Using full file." >&2
  BODY=$(cat "$UPSTREAM_FILE")
fi

BODY_LINES=$(echo "$BODY" | wc -l)
echo ""
echo "━━━ Layer 1: スキル固有部分抽出 ━━━"
echo "Extracted: ${BODY_LINES} lines"

# --- Layer 2: 互換ルール適用 ---

CONVERTED=$(echo "$BODY" \
  | sed 's/\bBash\b tool/bash tool/g' \
  | sed 's/\bRead\b tool/view tool/g' \
  | sed 's/\bWrite\b tool/create tool/g' \
  | sed 's/\bEdit\b tool/edit tool/g' \
  | sed 's/\bGrep\b tool/grep tool/g' \
  | sed 's/\bGlob\b tool/glob tool/g' \
  | sed 's/AskUserQuestion/ask_user/g' \
  | sed 's/\bAgent\b tool/task tool/g' \
  | sed 's/WebSearch/web_search/g' \
  | sed 's|~/.claude/skills/gstack/|.github/skills/|g' \
  | sed 's|~/.claude/|.github/|g' \
  | sed '/{{PREAMBLE}}/d' \
  | sed '/{{BROWSE_SETUP}}/d' \
  | sed '/{{ETHOS}}/d' \
  | sed '/{{GBRAIN_CONTEXT_LOAD}}/d' \
  | sed '/{{BENEFITS_FROM}}/d' \
  | sed 's/{{LEARNINGS_SEARCH}}/# Learnings: use store_memory \/ session_store_sql/g' \
  | sed 's/{{BASE_BRANCH_DETECT}}/BASE_BRANCH=$(git symbolic-ref refs\/remotes\/origin\/HEAD 2>\/dev\/null | sed "s|refs\/remotes\/origin\/||" || echo "main")/g' \
  | sed '/<!-- AUTO-GENERATED from SKILL.md.tmpl/d' \
  | sed '/<!-- Regenerate: bun run gen:skill-docs/d' \
)

echo ""
echo "━━━ Layer 2: 互換ルール適用 ━━━"

# --- Layer 2.5: バリデーション ---

ERRORS=0

# 未解決 placeholder チェック
UNRESOLVED=$(echo "$CONVERTED" | grep -n '{{[A-Z_]*}}' || true)
if [ -n "$UNRESOLVED" ]; then
  echo "⚠️  未解決 placeholder:"
  echo "$UNRESOLVED"
  ERRORS=$((ERRORS + 1))
fi

# Claude Code 固有パスチェック
CLAUDE_PATHS=$(echo "$CONVERTED" | grep -n '~/.claude/' || true)
if [ -n "$CLAUDE_PATHS" ]; then
  echo "⚠️  Claude Code 固有パス:"
  echo "$CLAUDE_PATHS"
  ERRORS=$((ERRORS + 1))
fi

# codex コマンドチェック（変換対象だが残っている場合）
CODEX_REFS=$(echo "$CONVERTED" | grep -n '\bcodex\b' || true)
if [ -n "$CODEX_REFS" ]; then
  echo "ℹ️  codex 参照（要確認）:"
  echo "$CODEX_REFS"
fi

if [ "$ERRORS" -gt 0 ]; then
  echo ""
  echo "❌ バリデーション失敗: ${ERRORS} 件の問題"
  if [ "$MODE" = "--validate" ]; then exit 1; fi
else
  echo "✅ バリデーション通過"
fi

if [ "$MODE" = "--validate" ]; then exit 0; fi

# --- Layer 3: frontmatter 日本語化 + 最終出力 ---

# 既存の SKILL.md から日本語 frontmatter を取得（存在する場合）
JP_DESC=""
JP_HINT=""
if [ -f "$SKILL_DIR/SKILL.md" ]; then
  JP_DESC=$(sed -n 's/^description: *"\(.*\)"/\1/p' "$SKILL_DIR/SKILL.md" | head -1)
  JP_HINT=$(sed -n 's/^argument-hint: *"\(.*\)"/\1/p' "$SKILL_DIR/SKILL.md" | head -1)
fi

# fallback: upstream の description を使用
if [ -z "$JP_DESC" ]; then
  JP_DESC=$(sed -n '/^description:/,/^[a-z]/{ /^description:/d; /^[a-z]/d; s/^ *//; p; }' "$UPSTREAM_FILE" | head -3 | tr '\n' ' ')
fi

FRONTMATTER="---
name: ${SKILL_NAME}
description: \"${JP_DESC}\"
argument-hint: \"${JP_HINT:-レビュー対象のプランまたは機能の説明}\"
---"

FINAL="${FRONTMATTER}

${CONVERTED}"

mkdir -p "$SKILL_DIR"

if [ "$MODE" = "--dry-run" ]; then
  echo ""
  echo "━━━ Layer 3: dry-run（差分プレビュー）━━━"
  if [ -f "$SKILL_DIR/SKILL.md" ]; then
    diff --unified=3 "$SKILL_DIR/SKILL.md" <(echo "$FINAL") || true
  else
    echo "(新規ファイル: ${#FINAL} bytes)"
  fi
  echo ""
  echo "適用するには: bin/adapt-upstream-skill.sh $SKILL_NAME"
  exit 0
fi

echo "$FINAL" > "$SKILL_DIR/SKILL.md"

echo ""
echo "━━━ 完了 ━━━"
echo "Output: $SKILL_DIR/SKILL.md"
echo "Lines: $(wc -l < "$SKILL_DIR/SKILL.md")"
echo ""
echo "検証:"
echo "  bin/adapt-upstream-skill.sh $SKILL_NAME --validate"
