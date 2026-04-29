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
# upstream のスキル名を upstream-tracking.json から解決
UPSTREAM_SKILL_NAME="$SKILL_NAME"
if [ -f "$TRACKING_JSON" ]; then
  UPSTREAM_PATH=$(python3 -c "
import json
with open('$TRACKING_JSON') as f:
    data = json.load(f)
entry = data.get('skills', {}).get('$SKILL_NAME', {})
upstream = entry.get('upstream', '')
if upstream:
    print(upstream.replace('/SKILL.md', ''))
" 2>/dev/null || true)
  if [ -n "$UPSTREAM_PATH" ]; then
    UPSTREAM_SKILL_NAME="$UPSTREAM_PATH"
  fi
fi

UPSTREAM_FILE=""
for candidate in \
  "$UPSTREAM_DIR/$UPSTREAM_SKILL_NAME/SKILL.md" \
  "$UPSTREAM_DIR/skills/$UPSTREAM_SKILL_NAME/SKILL.md" \
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

# アンカーパターン: スキル固有部分の h1 (h1 outside code blocks)
# upstream の h1 は通常 `# /skill-name — Title` または `# Title` 形式。
# `^# /` パターン (upstream の正式形式) を最優先、なければ最初の `^# ` outside code block。

BODY=$(awk '
  BEGIN { found=0; in_code=0 }
  /^```/ { in_code = !in_code; if (found) print; next }
  # h1 outside code blocks. upstream の正式形式は `# /skill-name`、稀に大文字始まり。
  /^# (\/|[A-Z])/ && !in_code && !found {
    found=1
  }
  found { print }
' "$UPSTREAM_FILE")

if [ -z "$BODY" ]; then
  echo "ERROR: Could not extract skill body from $UPSTREAM_FILE" >&2
  echo "       (no h1 heading matching '^# (/|[A-Z])' found outside code blocks)" >&2
  echo "Hint:  本家のスキル形式が変わった可能性。awk アンカーを更新するか、" >&2
  echo "       手動で .github/skills/$SKILL_NAME/SKILL.md を編集してください。" >&2
  exit 2
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
  \
  | sed 's|~/.claude/skills/gstack/|.github/skills/|g' \
  | sed 's|~/.claude/|.github/|g' \
  | sed 's/CLAUDE\.md/copilot-instructions.md/g' \
  | sed 's/TODOS\.md/plan.md/g' \
  \
  | sed 's|\.github/skills/review/|.github/skills/gstack-review/|g' \
  | sed 's|/review\b|/gstack-review|g' \
  \
  | sed '/{{PREAMBLE}}/d' \
  | sed '/{{BROWSE_SETUP}}/d' \
  | sed '/{{ETHOS}}/d' \
  | sed '/{{GBRAIN_CONTEXT_LOAD}}/d' \
  | sed '/{{BENEFITS_FROM}}/d' \
  | sed 's/{{LEARNINGS_SEARCH}}/# Learnings: use store_memory \/ session_store_sql/g' \
  | sed 's/{{BASE_BRANCH_DETECT}}/BASE_BRANCH=$(git symbolic-ref refs\/remotes\/origin\/HEAD 2>\/dev\/null | sed "s|refs\/remotes\/origin\/||" || echo "main")/g' \
  | sed '/<!-- AUTO-GENERATED from SKILL.md.tmpl/d' \
  | sed '/<!-- Regenerate: bun run gen:skill-docs/d' \
  \
  | sed 's|\.github/skills/bin/gstack-config[^)]*)||g' \
  | sed '/gstack-config set /d' \
  | sed '/gstack-config get /d' \
  | sed '/gstack-update-check/d' \
  | sed '/gstack-telemetry-log/d' \
  | sed '/gstack-timeline-log/d' \
  | sed '/gstack-repo-mode/d' \
  | sed '/gstack-review-read/d' \
  | sed '/gstack-learnings-search/d' \
  | sed '/gstack-specialist-stats/d' \
  | sed 's|\.github/skills/bin/gstack-slug[^)]*)|true|g' \
  | sed 's|\.github/skills/bin/gstack-learnings-log[^}]*}||g' \
  \
  | sed '/\.claude\/skills\/gstack/d' \
  | sed '/vendored.*deprecated/d' \
  | sed '/vendored copies/d' \
  | sed '/Vendoring is deprecated/d' \
  | sed '/chore: migrate gstack/d' \
  | sed 's|\.claude/skills/review/checklist\.md|the review checklist|g' \
  | sed 's|\.claude/skills/review/TODOS-format\.md|the TODO format|g' \
  | sed 's|\.claude/\.credentials\.json|credentials|g' \
  | sed '/Do NOT read or execute any files under .github\//d' \
  | sed '/Claude Code skill definitions meant for/d' \
  | sed '/Do NOT modify agents\/openai\.yaml/d' \
  | sed 's|ls -la \.claude/skills/ 2>/dev/null||g' \
  | sed 's|\.claude/plans|.gstack/plans|g' \
  | sed 's|\.claude/skills/review/|.github/skills/review/|g' \
  \
  | sed '/ExitPlanMode/d' \
  | sed '/exit_plan_mode/d' \
  | sed '/## Plan Mode Safe Operations/,/^## [A-Z]/{ /^## [A-Z]/!d; }' \
  | sed '/## Skill Invocation During Plan Mode/,/^## [A-Z]/{ /^## [A-Z]/!d; }' \
  | sed '/## Plan Status Footer/,/^## [A-Z]/{ /^## [A-Z]/!d; }' \
  \
  | sed '/EXPLAIN_LEVEL/d' \
  | sed '/QUESTION_TUNING/d' \
  | sed '/_PROACTIVE/d' \
  | sed '/TEL_PROMPTED/d' \
  | sed '/CHECKPOINT_MODE/d' \
  | sed '/SPAWNED_SESSION/d' \
  | sed '/_LAKE_SEEN/d' \
  | sed '/_TEL_START/d' \
  | sed '/_TEL_DUR/d' \
  | sed '/_SESSION_ID/d' \
  | sed '/_SESSIONS/d' \
  | sed '/_SKILL_PREFIX/d' \
  | sed '/REPO_MODE/d' \
  | sed '/_CROSS_PROJ/d' \
  \
  | sed '/codex exec /d' \
  | sed '/codex review/d' \
  | sed '/codex login/d' \
  | sed '/CODEX_PROMPT_FILE/d' \
  | sed '/CODEX_AVAILABLE/d' \
  | sed '/CODEX_NOT_AVAILABLE/d' \
  | sed '/TMPERR_OH/d' \
  | sed '/TMPERR_SKETCH/d' \
  | sed '/TMPERR_ADV/d' \
  \
  | sed '/\$D variants/d' \
  | sed '/\$D compare/d' \
  | sed '/\$D iterate/d' \
  | sed '/\$D serve/d' \
  | sed '/\$D generate/d' \
  | sed '/\$D check/d' \
  | sed '/\$D extract/d' \
  | sed '/\$D evolve/d' \
  | sed '/\$D verify/d' \
  | sed '/\$D prompt/d' \
  | sed '/\$D setup/d' \
  | sed '/design\/dist\/design/d' \
  | sed 's/\$D [a-z]*/[design binary: not available in Copilot CLI]/g' \
  | sed 's/`\$D`/`design binary (not available)`/g' \
  | sed 's/{\$D}/design-binary/g' \
  | sed 's/{\[design binary.*\]}/design-binary/g' \
  \
  | sed '/skill-usage\.jsonl/d' \
  | sed '/\.pending-\*/d' \
  | sed '/analytics/d' \
  \
  | sed 's|\$_REPO_ROOT|$(git rev-parse --show-toplevel)|g' \
  | sed '/eval.*gstack-slug/d' \
  | sed 's|~/.gstack/projects/\$SLUG/|./|g' \
  | sed 's|~/.gstack/projects/\${SLUG}/|./|g' \
  \
  | sed '/^$/N;/^\n$/d' \
)

echo ""
echo "━━━ Layer 2: 互換ルール適用 ━━━"

# --- Layer 2.5: バリデーション ---

ERRORS=0
WARNS=0

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

# CLAUDE.md 参照チェック
CLAUDE_MD=$(echo "$CONVERTED" | grep -n 'CLAUDE\.md' || true)
if [ -n "$CLAUDE_MD" ]; then
  echo "⚠️  CLAUDE.md 参照（copilot-instructions.md に置換すべき）:"
  echo "$CLAUDE_MD"
  ERRORS=$((ERRORS + 1))
fi

# ExitPlanMode チェック
PLAN_MODE=$(echo "$CONVERTED" | grep -n 'ExitPlanMode\|exit_plan_mode' || true)
if [ -n "$PLAN_MODE" ]; then
  echo "⚠️  Plan Mode 参照（Copilot CLI に Plan Mode なし）:"
  echo "$PLAN_MODE"
  ERRORS=$((ERRORS + 1))
fi

# gstack-config チェック
GCONFIG=$(echo "$CONVERTED" | grep -n 'gstack-config\|gstack-update-check\|gstack-telemetry\|gstack-timeline-log\|gstack-repo-mode' || true)
if [ -n "$GCONFIG" ]; then
  echo "⚠️  本家固有 bin ユーティリティ:"
  echo "$GCONFIG"
  ERRORS=$((ERRORS + 1))
fi

# codex コマンドチェック
CODEX_REFS=$(echo "$CONVERTED" | grep -n '\bcodex\b' || true)
if [ -n "$CODEX_REFS" ]; then
  echo "ℹ️  codex 参照（情報のみ — task tool で代替可能）:"
  echo "$CODEX_REFS"
  WARNS=$((WARNS + 1))
fi

# $D チェック（コマンド文脈のみ — テキスト内の$D言及は許容）
DESIGN_BIN=$(echo "$CONVERTED" | grep -n '^\$D \|`\$D \| \$D [a-z]' || true)
if [ -n "$DESIGN_BIN" ]; then
  echo "⚠️  \$D (design binary) コマンド参照:"
  echo "$DESIGN_BIN"
  ERRORS=$((ERRORS + 1))
fi

# Preamble config flags チェック
CONFIG_FLAGS=$(echo "$CONVERTED" | grep -n 'EXPLAIN_LEVEL\|QUESTION_TUNING\|_PROACTIVE\|TEL_PROMPTED\|CHECKPOINT_MODE\|SPAWNED_SESSION\|_LAKE_SEEN' || true)
if [ -n "$CONFIG_FLAGS" ]; then
  echo "⚠️  Preamble config flags:"
  echo "$CONFIG_FLAGS"
  ERRORS=$((ERRORS + 1))
fi

# コードフェンス balance チェック (Phase A-3 で発見した extraction バグへの再発防止)
FENCE_COUNT=$(echo "$CONVERTED" | grep -cE '^[`]{3}' || true)
if [ "$((FENCE_COUNT % 2))" -ne 0 ]; then
  echo "⚠️  コードフェンス不均衡: ${FENCE_COUNT} 個 (奇数)"
  echo "    → 抽出が preamble 部分を巻き込んでいる可能性あり。"
  ERRORS=$((ERRORS + 1))
fi

if [ "$ERRORS" -gt 0 ]; then
  echo ""
  echo "❌ バリデーション失敗: ${ERRORS} エラー, ${WARNS} 警告"
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

# upstream から version を取得
UP_VERSION=$(sed -n 's/^version: *\(.*\)/\1/p' "$UPSTREAM_FILE" | head -1 | tr -d ' ')

# upstream から triggers を取得
UP_TRIGGERS=$(sed -n '/^triggers:/,/^[a-z]/{
  /^triggers:/d
  /^[a-z]/d
  /^---/d
  s/^ *- *"\{0,1\}\([^"]*\)"\{0,1\}/  - \1/p
}' "$UPSTREAM_FILE")

# upstream から allowed-tools を取得し、Copilot CLI ツール名に変換
UP_TOOLS=$(sed -n '/^allowed-tools:/,/^[a-z]/{
  /^allowed-tools:/d
  /^[a-z]/d
  s/^ *- *//p
}' "$UPSTREAM_FILE" \
  | sed 's/^Bash$/bash/' \
  | sed 's/^Read$/view/' \
  | sed 's/^Write$/create/' \
  | sed 's/^Edit$/edit/' \
  | sed 's/^Grep$/grep/' \
  | sed 's/^Glob$/glob/' \
  | sed 's/^Agent$/task/' \
  | sed 's/^AskUserQuestion$/ask_user/' \
  | sed 's/^WebSearch$/web_search/' \
  | sort -u \
  | sed 's/^/  - /')

# frontmatter 組み立て
FRONTMATTER="---
name: ${SKILL_NAME}
version: ${UP_VERSION:-1.0.0}
description: \"${JP_DESC}\"
argument-hint: \"${JP_HINT:-レビュー対象のプランまたは機能の説明}\""

# triggers 追加
if [ -n "$UP_TRIGGERS" ]; then
  FRONTMATTER="${FRONTMATTER}
triggers:
${UP_TRIGGERS}"
fi

# allowed-tools 追加
if [ -n "$UP_TOOLS" ]; then
  FRONTMATTER="${FRONTMATTER}
allowed-tools:
${UP_TOOLS}"
fi

FRONTMATTER="${FRONTMATTER}
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

# --- Layer 4: サイドカーファイルのコピー ---

# upstream スキルディレクトリ内の SKILL.md, SKILL.md.tmpl 以外の .md ファイルを同期
UPSTREAM_SKILL_DIR=$(dirname "$UPSTREAM_FILE")
SIDECAR_COUNT=0

if [ -d "$UPSTREAM_SKILL_DIR" ]; then
  # トップレベルの .md サイドカー
  for src in "$UPSTREAM_SKILL_DIR"/*.md; do
    [ -f "$src" ] || continue
    base=$(basename "$src")
    case "$base" in
      SKILL.md|SKILL.md.tmpl) continue ;;
    esac
    cp "$src" "$SKILL_DIR/$base"
    SIDECAR_COUNT=$((SIDECAR_COUNT + 1))
  done

  # サブディレクトリ（specialists/ 等）
  for subdir in "$UPSTREAM_SKILL_DIR"/*/; do
    [ -d "$subdir" ] || continue
    subname=$(basename "$subdir")
    has_md=false
    for src in "$subdir"*.md; do
      [ -f "$src" ] || continue
      has_md=true
      break
    done
    if $has_md; then
      mkdir -p "$SKILL_DIR/$subname"
      for src in "$subdir"*.md; do
        [ -f "$src" ] || continue
        cp "$src" "$SKILL_DIR/$subname/"
        SIDECAR_COUNT=$((SIDECAR_COUNT + 1))
      done
    fi
  done
fi

echo ""
echo "━━━ 完了 ━━━"
echo "Output: $SKILL_DIR/SKILL.md"
echo "Lines: $(wc -l < "$SKILL_DIR/SKILL.md")"
if [ "$SIDECAR_COUNT" -gt 0 ]; then
  echo "Sidecars: $SIDECAR_COUNT files copied"
fi
echo ""
echo "検証:"
echo "  bin/adapt-upstream-skill.sh $SKILL_NAME --validate"
