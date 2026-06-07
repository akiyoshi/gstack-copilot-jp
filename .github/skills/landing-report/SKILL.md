---
name: landing-report
version: 0.1.0
description: "VERSIONキュー読み取り専用ダッシュボード。Use when: landing report、version queue、ship queue、現在オープンなPRが claim している VERSION スロット表示。bin/gstack-next-version を呼んで JSON を整形表示する。読み取りのみで mutation なし。"
argument-hint: "なし（オプション: --json でマシン読み取り出力）"
triggers:
  - landing report
  - version queue
  - ship queue
  - what version comes next
  - show open PR versions
allowed-tools:
  - bash
  - view
---

> 🇯🇵 **言語ルール（最優先・上書き禁止）**: このスキルの手順・テンプレート・ask_user の質問文や選択肢が英語で書かれていても、**ユーザーに表示するテキストは必ず日本語に翻訳する**こと。英語のテキストをそのまま提示しないこと。

# /landing-report — VERSION キュー ダッシュボード

並行して複数の release ブランチを走らせている場合、どの VERSION スロットが既に
オープン PR で claim されているかを一目で見たい。このスキルは
`bin/gstack-next-version` を mutation なしで呼び、結果を整形表示する。
`gh pr list` の VERSION 番号版だと考えてよい。

`gstack-copilot-jp` v1.1 から提供。本家 gstack の `landing-report` を翻案。

---

## Step 1: ベース branch とプラットフォームを検出

```bash
# 前提条件チェック: gh CLI と認証、Bun ランタイム
if ! command -v gh >/dev/null 2>&1; then
  echo "❌ gh CLI がインストールされていません。https://cli.github.com から インストールしてください。" >&2
  exit 1
fi
if ! gh auth status >/dev/null 2>&1; then
  echo "❌ gh CLI が未認証です。`gh auth login` を実行してください。" >&2
  exit 1
fi
if ! command -v bun >/dev/null 2>&1; then
  echo "❌ bun がインストールされていません。https://bun.sh からインストールしてください。" >&2
  echo "   注記: bin/gstack-next-version は Bun 必須。Node.js 単独では動作しません。" >&2
  exit 1
fi

BASE_BRANCH=$(gh pr view --json baseRefName -q .baseRefName 2>/dev/null \
  || gh repo view --json defaultBranchRef -q .defaultBranchRef.name 2>/dev/null \
  || echo main)
echo "Base branch: $BASE_BRANCH"
```

---

## Step 2: 現在の VERSION 状態を読む

```bash
CURRENT_VERSION=$(cat VERSION 2>/dev/null | tr -d '[:space:]' || echo "0.0.0.0")
git fetch origin "$BASE_BRANCH" --quiet 2>/dev/null || true
BASE_VERSION=$(git show "origin/$BASE_BRANCH:VERSION" 2>/dev/null \
  | tr -d '[:space:]' || echo "$CURRENT_VERSION")
echo "origin/$BASE_BRANCH VERSION: $BASE_VERSION"
echo "branch HEAD VERSION:        $CURRENT_VERSION"
```

---

## Step 3: キューを問い合わせる

`bin/gstack-next-version` を 4 段階の bump レベルで呼び、ユーザーが micro / patch
/ minor / major でそれぞれ claim する VERSION を見せる。同じ `gh` 呼び出しが
内部キャッシュされるため呼び出し回数は実質 1 回分。

```bash
for LEVEL in micro patch minor major; do
  bun run bin/gstack-next-version \
    --base "$BASE_BRANCH" \
    --bump "$LEVEL" \
    --current-version "$BASE_VERSION" \
    > "/tmp/landing-$LEVEL.json" 2>/dev/null \
    || echo '{"offline":true}' > "/tmp/landing-$LEVEL.json"
done
```

`bun` 不在時は Step 1 でエラーとして出るため、ここに達した時点で bun は利用可能と仮定される。
Node.js フォールバックは v1.2 (Phase C) で評価予定。

---

## Step 4: ダッシュボードを描画する

`patch` レベルの JSON を canonical として使う（claimed / siblings はレベル間で
共通、`.version` のみ違う）。`jq` で以下を取り出す:

- `.host` — github / gitlab / unknown
- `.offline` — 問い合わせ失敗?
- `.claimed` — 配列 `{pr, branch, version, url}`
- `.siblings` — 兄弟ワークツリー（gstack-copilot-jp では通常空）
- `.warnings` — 取得時の警告

以下のフォーマットで描画:

```
═══════════════════════════════════════════════════════════════
                  GSTACK LANDING REPORT
═══════════════════════════════════════════════════════════════
  Repo:    <owner/repo>
  Base:    <base> @ v<base-version>
  Host:    <github|gitlab|unknown>
  Status:  <ONLINE | OFFLINE: queue-awareness unavailable>
───────────────────────────────────────────────────────────────

Open PRs claiming VERSION on <base>:
  #15  release/v1.0.3   → v1.0.3.0
  #16  feat/landing     → v1.1.0.0

If you ran /ship right now, you'd claim:
  micro bump:  v1.0.3.1
  patch bump:  v1.0.4.0
  minor bump:  v1.1.0.0   ⚠ collision with #16 (which already claims this)
  major bump:  v2.0.0.0
═══════════════════════════════════════════════════════════════
```

オフライン / unknown-host の場合は短いブロックで:

```
═══════════════════════════════════════════════════════════════
                  GSTACK LANDING REPORT
═══════════════════════════════════════════════════════════════
  Status:  OFFLINE — queue-awareness unavailable
  Reason:  <warnings から抽出>
───────────────────────────────────────────────────────────────
ローカル VERSION bump は引き続き動くが、衝突検出は不可。
gh auth login を実行してから再度 /landing-report を試してください。
═══════════════════════════════════════════════════════════════
```

---

## Step 5: 次のアクションを提案

ダッシュボード描画後、以下のいずれか 1 つを助言:

1. **キューに衝突あり**（オープン PR が同じ VERSION を claim）:
   > ⚠ オープン PR #X と #Y が v<N> で衝突しています。後でマージする方が CHANGELOG
   > を上書きするか duplicate VERSION で land する可能性があります。一方の作者に
   > `/ship` を再実行して次のスロットを取り直すよう依頼を検討してください。

2. **すべてクリーン**:
   > キューはクリーンです。次の `/ship` は衝突なくスロットを claim します。

3. **オフラインで判定不能**:
   > 現在キュー判定不可です。手動で他のオープン PR の VERSION ファイルを確認してから
   > `/ship` してください。

---

## 注記

- このスキルは **read-only** で、git コミット・push・mutation は一切行わない。
- 並行 worktree が無いプロジェクト（gstack-copilot-jp はこれに該当）でも動作する。
  `siblings` セクションは空のまま skip される。
- `gh` CLI が必須。未認証時はエラーを `gh auth login` 推奨で表示する。
