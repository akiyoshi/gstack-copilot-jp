#!/usr/bin/env bash
# bin/upstream-diff.sh — 本家 gstack との差分を検出し、同期する
# 使い方:
#   bin/upstream-diff.sh                       # 差分検出のみ
#   bin/upstream-diff.sh --update              # upstream を pull してから差分検出
#   bin/upstream-diff.sh --sync                # 差分検出 + 変更スキルを自動変換
#   bin/upstream-diff.sh --sync --interactive  # diff プレビューと確認プロンプト付き
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
UPSTREAM_DIR="$HOME/.gstack/repos/gstack"
LAST_CHECK_FILE="$HOME/.gstack/upstream-last-check"
TRACKING_JSON="$ROOT_DIR/upstream-tracking.json"
MODE="${1:-check}"
INTERACTIVE=0
if [ "${2:-}" = "--interactive" ]; then
  INTERACTIVE=1
fi

if [ ! -d "$UPSTREAM_DIR" ]; then
  echo "Upstream not found. Cloning (full history for reliable diffs)..."
  mkdir -p "$(dirname "$UPSTREAM_DIR")"
  git clone --single-branch \
    https://github.com/garrytan/gstack.git "$UPSTREAM_DIR"
fi

# 浅いクローン (--depth 50) で取得済みの古い repo を完全履歴へ昇格
# 浅いクローン + 多コミット間隔の pull はサイレント失敗するため必須。
if [ -f "$UPSTREAM_DIR/.git/shallow" ]; then
  echo "Existing upstream is shallow — promoting to full history..."
  if ! ( cd "$UPSTREAM_DIR" && git fetch --unshallow ); then
    echo "ERROR: git fetch --unshallow failed for $UPSTREAM_DIR" >&2
    echo "Hint: rm -rf $UPSTREAM_DIR && rerun this script" >&2
    exit 1
  fi
fi

# 更新（pull の失敗をサイレントにしない）
# --sync は既存のローカル upstream 状態を使う（pull は --update で明示的に実施）
if [ "$MODE" = "--update" ] || [ ! -f "$LAST_CHECK_FILE" ]; then
  echo "Pulling upstream..."
  if ! ( cd "$UPSTREAM_DIR" && git pull --ff-only ); then
    echo "ERROR: git pull --ff-only failed in $UPSTREAM_DIR" >&2
    echo "Hint: ローカル変更がないか、ネットワーク状態を確認。" >&2
    echo "      手動で復旧する場合: cd $UPSTREAM_DIR && git fetch && git reset --hard origin/main" >&2
    exit 1
  fi
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

# pinned commit と HEAD のあいだに何コミットあるか（lag の可視化）
LAG_COUNT=""
if [ -n "$PINNED_COMMIT" ] && [ "$UPSTREAM_COMMIT" != "$PINNED_COMMIT" ]; then
  LAG_COUNT=$(cd "$UPSTREAM_DIR" && git rev-list --count "$PINNED_COMMIT..HEAD" 2>/dev/null || echo "")
  if [ -n "$LAG_COUNT" ] && [ "$LAG_COUNT" -gt 0 ]; then
    echo "Lag:              $LAG_COUNT commits behind upstream"
    if [ "$LAG_COUNT" -gt 50 ]; then
      echo ""
      echo "⚠️  WARNING: $LAG_COUNT commits behind. Frequent sync recommended." >&2
    fi
  fi
fi

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
  # dirty tree ガード — 未コミット変更がある状態で一括上書きするとロールバック不能
  if ! git -C "$ROOT_DIR" diff --quiet HEAD -- .github/skills/ 2>/dev/null; then
    echo "" >&2
    echo "ERROR: .github/skills/ に未コミット変更があります。" >&2
    echo "  --sync は破壊的操作です。先に commit するか stash してください:" >&2
    echo "    git stash push -m pre-sync -- .github/skills/" >&2
    echo "  または変更を破棄:" >&2
    echo "    git checkout -- .github/skills/" >&2
    exit 1
  fi

  # interactive モード: diff プレビューと確認
  if [ "$INTERACTIVE" = "1" ]; then
    echo ""
    echo "━━━ 同期対象（プレビュー）━━━"
    echo "$CHANGED_SKILLS" | sed 's|^|  - |'
    echo ""
    if [ -t 0 ] || [ -e /dev/tty ]; then
      printf "続行しますか？ [y/N] "
      if [ -e /dev/tty ]; then
        read -r ANSWER < /dev/tty || ANSWER=""
      else
        read -r ANSWER || ANSWER=""
      fi
      case "$ANSWER" in
        y|Y|yes|YES) ;;
        *) echo "中止しました。"; exit 0 ;;
      esac
    else
      echo "ERROR: --interactive は対話端末が必要。CI 等では --sync 単体で実行してください。" >&2
      exit 1
    fi
  fi

  echo ""
  echo "━━━ 同期実行 ━━━"
  SUCCESS=0
  FAIL=0
  SKIP=0
  FAILED_SKILLS=""

  # サブシェルでカウンタが消えるバグの修正:
  # `echo | while` のパイプは右側がサブシェルになり SUCCESS/FAIL/SKIP が親に伝播しない。
  # プロセス置換 `< <(...)` を使えば while が親シェルで実行される。
  while read -r skill; do
    [ -z "$skill" ] && continue
    # diverged / excluded / planned スキルはスキップ
    SKILL_STATUS=$(python3 -c "import json; print(json.load(open('$TRACKING_JSON'))['skills'].get('$skill',{}).get('status','unknown'))" 2>/dev/null || echo "unknown")
    case "$SKILL_STATUS" in
      diverged|excluded|planned)
        echo "⏭️  $skill (status: $SKILL_STATUS — スキップ)"
        SKIP=$((SKIP + 1))
        continue
        ;;
    esac

    if [ -d "$ROOT_DIR/.github/skills/$skill" ]; then
      echo -n "🔄 $skill ... "
      if bash "$SCRIPT_DIR/adapt-upstream-skill.sh" "$skill" > /dev/null 2>&1; then
        echo "✅"
        SUCCESS=$((SUCCESS + 1))
      else
        echo "❌"
        FAIL=$((FAIL + 1))
        FAILED_SKILLS="$FAILED_SKILLS $skill"
      fi
    fi
  done < <(echo "$CHANGED_SKILLS")

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
  echo "結果: $SUCCESS 成功 / $FAIL 失敗 / $SKIP スキップ"
  if [ "$FAIL" -gt 0 ]; then
    echo "失敗したスキル:$FAILED_SKILLS" >&2
    echo "次のステップ: 失敗したスキルを手動で確認してから commit してください。" >&2
    echo "  ロールバック: git checkout HEAD -- .github/skills/" >&2
    exit 2
  fi
  echo "次のステップ: npm test && git add -A && git commit"
elif [ "$MODE" = "--sync" ]; then
  echo ""
  echo "  (--sync 指定だが、変更されたスキルが検出されませんでした)"
else
  echo ""
  echo "同期するには: bin/upstream-diff.sh --sync"
  echo "プレビュー付きで同期: bin/upstream-diff.sh --sync --interactive"
fi
