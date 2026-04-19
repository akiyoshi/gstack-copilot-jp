#!/usr/bin/env bash
# bin/adapt-upstream-skill.sh — 本家スキルを Copilot CLI 向けに変換
# 使い方: bin/adapt-upstream-skill.sh <skill-name>
# 出力: .github/skills/<skill-name>/SKILL.md.draft
set -euo pipefail

UPSTREAM_DIR="$HOME/.gstack/repos/gstack"
SKILL_NAME="${1:?Usage: adapt-upstream-skill.sh <skill-name>}"

# 本家の SKILL.md.tmpl を検索
TMPL=""
for candidate in \
  "$UPSTREAM_DIR/$SKILL_NAME/SKILL.md.tmpl" \
  "$UPSTREAM_DIR/$SKILL_NAME/SKILL.md" \
  "$UPSTREAM_DIR/skills/$SKILL_NAME/SKILL.md.tmpl" \
  "$UPSTREAM_DIR/skills/$SKILL_NAME/SKILL.md"; do
  if [ -f "$candidate" ]; then
    TMPL="$candidate"
    break
  fi
done

if [ -z "$TMPL" ]; then
  echo "Error: Upstream skill '$SKILL_NAME' not found in $UPSTREAM_DIR" >&2
  echo "Available skills:" >&2
  ls -d "$UPSTREAM_DIR"/*/SKILL.md.tmpl 2>/dev/null | sed "s|$UPSTREAM_DIR/||;s|/SKILL.md.tmpl||" >&2
  exit 1
fi

SKILL_DIR=".github/skills/$SKILL_NAME"
mkdir -p "$SKILL_DIR"

DRAFT="$SKILL_DIR/SKILL.md.draft"

# 変換処理
cat "$TMPL" \
  | sed 's/{{PREAMBLE}}//' \
  | sed 's/{{BROWSE_SETUP}}//' \
  | sed 's/{{ETHOS}}//' \
  | sed 's/\bBash\b tool/bash tool/g' \
  | sed 's/\bRead\b tool/view tool/g' \
  | sed 's/\bWrite\b tool/edit tool/g' \
  | sed 's/\bEdit\b tool/edit tool/g' \
  | sed 's/\bGrep\b tool/grep tool/g' \
  | sed 's/\bGlob\b tool/glob tool/g' \
  | sed 's/AskUserQuestion/ask_user/g' \
  | sed 's/\bAgent\b tool/task tool/g' \
  | sed 's/WebSearch/web_fetch/g' \
  > "$DRAFT"

echo "Draft generated: $DRAFT"
echo ""
echo "次のステップ:"
echo "  1. $DRAFT を確認し、日本語で SKILL.md を作成"
echo "  2. SKILL.md が完成したら $DRAFT を削除"
echo "  3. .draft ファイルは .gitignore に含まれているため、コミットされない"
