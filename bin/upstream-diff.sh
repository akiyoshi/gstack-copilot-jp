#!/usr/bin/env bash
# bin/upstream-diff.sh — 本家 gstack との差分を検出し、同期する
# 使い方:
#   bin/upstream-diff.sh              # 差分検出のみ
#   bin/upstream-diff.sh --update     # upstream を pull してから差分検出
#   bin/upstream-diff.sh --sync       # 差分検出 + 変更スキルを自動変換
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
UPSTREAM_DIR="$HOME/.gstack/repos/gstack"
LAST_CHECK_FILE="$HOME/.gstack/upstream-last-check"
TRACKING_JSON="$ROOT_DIR/upstream-tracking.json"
MODE="${1:-check}"

if [ ! -d "$UPSTREAM_DIR" ]; then
  echo "Upstream not found. Cloning..."
  mkdir -p "$(dirname "$UPSTREAM_DIR")"
  git clone --single-branch --depth 50 \
    https://github.com/garrytan/gstack.git "$UPSTREAM_DIR"
fi

# 更新
if [ "$MODE" = "--update" ] || [ "$MODE" = "--sync" ] || [ ! -f "$LAST_CHECK_FILE" ]; then
  echo "Pulling upstream..."
  cd "$UPSTREAM_DIR" && git pull --ff-only 2>/dev/null
  cd "$ROOT_DIR"
fi

# 本家のバージョン・commit 取得
UPSTREAM_VERSION=""
if [ -f "$UPSTREAM_DIR/VERSION" ]; then
  UPSTREAM_VERSION=$(cat "$UPSTREAM_DIR/VERSION" | tr -d '[:space:]')
elif [ -f "$UPSTREAM_DIR/package.json" ]; then
  UPSTREAM_VERSION=$(grep -o '"version": "[^"]*"' "$UPSTREAM_DIR/package.json" | head -1 | sed 's/.*"version": "//;s/"//')
fi

UPSTREAM_COMMIT=$(cd "$UPSTREAM_DIR" && git rev-parse HEAD 2>/dev/null || echo "unknown")

PINNED_COMMIT=""
if [ -f "$TRACKING_JSON" ]; then
  PINNED_COMMIT=$(python3 -c "import json; print(json.load(open('$TRACKING_JSON')).get('upstream_commit',''))" 2>/dev/null || true)
fi

echo "━━━ upstream diff ━━━"
echo "Upstream version: ${UPSTREAM_VERSION:-unknown}"
echo "Upstream commit:  ${UPSTREAM_COMMIT:0:12}"
echo "Pinned commit:    ${PINNED_COMMIT:0:12}"

if [ "$UPSTREAM_COMMIT" = "$PINNED_COMMIT" ]; then
  echo "Status: up to date ✅"
  exit 0
fi

echo "Status: NEW CHANGES AVAILABLE"
echo ""

# 変更されたスキルを検出
CHANGED_SKILLS=""
if [ -n "$PINNED_COMMIT" ]; then
  cd "$UPSTREAM_DIR"
  CHANGED_SKILLS=$(git diff --name-only "$PINNED_COMMIT..HEAD" 2>/dev/null \
    | grep '/SKILL\.md$' \
    | sed 's|/SKILL\.md||' \
    | grep -v 'openclaw/' \
    | sort -u || true)
  cd "$ROOT_DIR"
fi

if [ -n "$CHANGED_SKILLS" ]; then
  echo "変更されたスキル:"
  echo "$CHANGED_SKILLS" | while read -r skill; do
    if [ -d ".github/skills/$skill" ]; then
      echo "  📝 $skill (local あり)"
    else
      echo "  🆕 $skill (local なし — 新スキル?)"
    fi
  done
else
  echo "  (変更スキルの特定にはピン留め commit が必要)"
fi

# --sync モード: 変更スキルを自動変換
if [ "$MODE" = "--sync" ] && [ -n "$CHANGED_SKILLS" ]; then
  echo ""
  echo "━━━ 同期実行 ━━━"
  SUCCESS=0
  FAIL=0
  SKIP=0

  echo "$CHANGED_SKILLS" | while read -r skill; do
    # diverged スキルはスキップ
    SKILL_STATUS=$(python3 -c "import json; print(json.load(open('$TRACKING_JSON'))['skills'].get('$skill',{}).get('status','unknown'))" 2>/dev/null || echo "unknown")
    if [ "$SKILL_STATUS" = "diverged" ] || [ "$SKILL_STATUS" = "excluded" ]; then
      echo "⏭️  $skill (status: $SKILL_STATUS — スキップ)"
      SKIP=$((SKIP + 1))
      continue
    fi

    if [ -d ".github/skills/$skill" ]; then
      echo -n "🔄 $skill ... "
      if bash bin/adapt-upstream-skill.sh "$skill" > /dev/null 2>&1; then
        echo "✅"
        SUCCESS=$((SUCCESS + 1))
      else
        echo "❌"
        FAIL=$((FAIL + 1))
      fi
    fi
  done

  # upstream-tracking.json の commit SHA を更新
  python3 -c "
import json
with open('$TRACKING_JSON') as f:
    data = json.load(f)
data['upstream_commit'] = '$UPSTREAM_COMMIT'
data['upstream_version'] = '${UPSTREAM_VERSION}'
with open('$TRACKING_JSON', 'w') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
    f.write('\n')
print('upstream-tracking.json updated: commit=$UPSTREAM_COMMIT')
"

  echo ""
  echo "━━━ 同期完了 ━━━"
  echo "次のステップ: npm test && git add -A && git commit"
else
  echo ""
  echo "同期するには: bin/upstream-diff.sh --sync"
fi
