---
name: land-and-deploy
description: "PRをマージしてデプロイ・本番検証。Use when: マージ、デプロイ、本番反映、land、deploy、merge。マージ→CI通過待ち→デプロイ→ヘルスチェック。"
argument-hint: "マージ対象のPR番号またはブランチ名"
---

# マージ＆デプロイ

`/ship` でPRを作成した後を引き継ぐ。PRをマージし、デプロイを待ち、本番の健全性を検証する。

## 引数

- `/land-and-deploy` — 現在のブランチからPRを自動検出
- `/land-and-deploy <url>` — PR自動検出 + 指定URLでデプロイ検証
- `/land-and-deploy #123` — 特定のPR番号を指定
- `/land-and-deploy #123 <url>` — 特定のPR + 検証URL

## ノンインタラクティブ哲学 — 1つのクリティカルゲート

基本は**自動化**ワークフロー。以下のケース以外では確認を求めない。

**停止するケース:**
- 初回ドライラン検証（Step 1.5）
- マージ前レディネスゲート（Step 3.5）
- GitHub CLI未認証 / PRが見つからない
- CI失敗 / マージコンフリクト / 権限エラー
- デプロイ失敗（リバート提案）
- 本番ヘルスチェック問題（リバート提案）

**停止しないケース:**
- マージ方法の選択（リポジトリ設定から自動検出）
- タイムアウト警告（警告して続行）

## ボイス＆トーン

シニアリリースエンジニアが横に座っている感覚を与える:
- **今何をしているか実況する**: 沈黙ではなく「CIステータスを確認中...」
- **聞く前に理由を説明する**: 「デプロイは不可逆なので、事前にXを確認します」
- **具体的に言う**: 「Fly.ioアプリ 'myapp' は正常です」であって「デプロイは良さそう」ではない
- **初回 = 教師モード**: 各チェックの意味と理由を説明
- **2回目以降 = 効率モード**: 簡潔なステータス更新のみ

---

## Step 0: プラットフォームとベースブランチの検出

リモートURLからGitホスティングプラットフォームを検出する:

```bash
git remote get-url origin 2>/dev/null
```

- URLに "github.com" を含む → **GitHub**
- URLに "gitlab" を含む → **GitLab**
- それ以外: `gh auth status 2>/dev/null` が成功 → **GitHub**（GitHub Enterprise含む）

ベースブランチの判定:

```bash
# GitHub
gh pr view --json baseRefName -q .baseRefName
# フォールバック
gh repo view --json defaultBranchRef -q .defaultBranchRef.name
# git-native フォールバック
git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's|refs/remotes/origin/||'
```

すべて失敗した場合 `main` にフォールバック。以降のステップで `<base>` と表記する箇所にこのブランチ名を使う。

---

## Step 1: プリフライト

「デプロイシーケンスを開始します。まず接続確認とPRの特定を行います。」

1. GitHub CLI認証チェック:
```bash
gh auth status
```
未認証なら**停止**: 「`gh auth login` で接続してから再実行してください。」

2. 引数をパース。`#NNN` が指定されていればそのPR番号を使用。URLが指定されていればStep 7のカナリー検証用に保存。

3. PRの検出:
```bash
# 引数なしの場合
gh pr view --json number,title,state,baseRefName,headRefName,mergeable
```

PRが見つからない場合**停止**: 「このブランチにPRが見つかりません。`/ship` でPRを作成してください。」

---

## Step 1.5: 初回ドライラン検証

このプロジェクトで `/land-and-deploy` が成功したことがあるか確認する:

```bash
SLUG=$(bin/gstack-slug 2>/dev/null)
GSTACK_DIR="${HOME}/.gstack/projects/${SLUG}"
[ -f "${GSTACK_DIR}/land-deploy-confirmed" ] && echo "CONFIRMED" || echo "FIRST_RUN"
```

**CONFIRMED の場合:** 「以前このプロジェクトをデプロイ済みです。レディネスチェックに進みます。」→ Step 2へ。

**FIRST_RUN の場合:** 初回なのでドライランを実行する。

「このプロジェクトの初回デプロイです。本番に触れる前に、ドライランを実行してデプロイ基盤を検出・検証し、何が起きるかをお見せします。」

### 1.5a: デプロイ基盤の検出

```bash
# デプロイ設定の有無を確認
[ -f fly.toml ] && echo "PLATFORM:fly"
[ -f render.yaml ] && echo "PLATFORM:render"
([ -f vercel.json ] || [ -d .vercel ]) && echo "PLATFORM:vercel"
[ -f netlify.toml ] && echo "PLATFORM:netlify"
[ -f Procfile ] && echo "PLATFORM:heroku"

# デプロイワークフローの検出
for f in $(find .github/workflows -maxdepth 1 \( -name '*.yml' -o -name '*.yaml' \) 2>/dev/null); do
  grep -qiE "deploy|release|production|cd" "$f" 2>/dev/null && echo "DEPLOY_WORKFLOW:$f"
done
```

検出したプラットフォームとワークフローをユーザーに提示し、確認を得る。確認後、ハッシュを保存して次回はスキップする。

---

## Step 2: マージ前チェック

「CIステータスとマージ準備状況を確認中...」

```bash
gh pr checks --json name,state,status,conclusion
```

1. 必須チェックが**失敗**: **停止**。「CIが失敗中です。失敗チェック: {リスト}。修正してからデプロイしてください。」
2. 必須チェックが**実行中**: 「CIがまだ実行中です。完了を待ちます。」→ Step 3へ。
3. 全チェック通過: 「CI通過。」→ Step 3.5へ。

マージコンフリクトも確認:
```bash
gh pr view --json mergeable -q .mergeable
```
`CONFLICTING` なら**停止**: 「マージコンフリクトがあります。解消してpushしてから再実行してください。」

---

## Step 3: CI待機（実行中の場合）

タイムアウト15分でチェック通過を待つ:

```bash
gh pr checks --watch --fail-fast
```

- CI通過 → 「CI通過（{所要時間}）。レディネスチェックに進みます。」
- CI失敗 → **停止**。失敗内容を表示。
- タイムアウト → **停止**。「15分以上経過。GitHub Actionsタブを確認してください。」

---

## Step 3.5: マージ前レディネスゲート

**マージは不可逆。全証拠を集め、レディネスレポートを作成し、ユーザーの明示的な承認を得る。**

### 3.5a: レビュー鮮度チェック

レビュー履歴を確認し、最新HEADとの差分コミット数で鮮度を判定:

- 0コミット → CURRENT
- 1-3コミット → RECENT（コード変更を含む場合は黄色警告）
- 4コミット以上 → STALE（赤警告）
- レビュー未実行 → NOT RUN

レビューがSTALEまたはNOT RUNの場合、インラインレビューを提案:
- A) クイックレビュー（~2分） — diffのSQLセーフティ、競合状態、セキュリティを確認
- B) 停止して完全な `/review` を先に実行
- C) スキップ — 自分でコードを確認済み

### 3.5b: テスト結果

テストコマンドを実行し、結果を取得:
```bash
# プロジェクトのテストコマンドを実行
npm test 2>&1 | tail -10
```

テスト失敗 → **ブロッカー**。マージ不可。

### 3.5c: PR本文の正確性チェック

```bash
gh pr view --json body -q .body
git log --oneline $(gh pr view --json baseRefName -q .baseRefName 2>/dev/null || echo main)..HEAD | head -20
```

PR本文と実際のコミットを比較。不一致があれば警告。

### 3.5d: ドキュメント更新チェック

```bash
git diff --name-only $(gh pr view --json baseRefName -q .baseRefName 2>/dev/null || echo main)...HEAD -- README.md CHANGELOG.md ARCHITECTURE.md VERSION
```

新機能があるのにCHANGELOG/VERSIONが未更新なら警告。

### 3.5e: レディネスレポートと確認

```
╔══════════════════════════════════════════════════════════╗
║              マージ前レディネスレポート                    ║
╠══════════════════════════════════════════════════════════╣
║  PR: #NNN — タイトル                                     ║
║  ブランチ: feature → main                                ║
║                                                          ║
║  レビュー                                                ║
║  ├─ Eng Review:    CURRENT / STALE / —                   ║
║  ├─ CEO Review:    CURRENT / — (任意)                    ║
║  └─ Design Review: CURRENT / — (任意)                    ║
║                                                          ║
║  テスト                                                   ║
║  ├─ ユニットテスト: PASS / FAIL (ブロッカー)              ║
║  └─ E2Eテスト:     PASS / NOT RUN                        ║
║                                                          ║
║  ドキュメント                                             ║
║  ├─ CHANGELOG:     更新済み / 未更新 (警告)               ║
║  └─ VERSION:       バンプ済み / 未バンプ (警告)           ║
║                                                          ║
║  PR本文                                                   ║
║  └─ 正確性:        最新 / 古い (警告)                    ║
║                                                          ║
║  警告: N件  |  ブロッカー: N件                            ║
╚══════════════════════════════════════════════════════════╝
```

ブロッカーがあれば修正を推奨。警告のみならマージ可能か確認:
- A) マージ実行
- B) 停止 — 問題を先に修正
- C) マージして警告は後で対応

---

## Step 4: PRのマージ

まずオートマージを試行（リポジトリ設定とマージキューを尊重）:

```bash
gh pr merge --auto --delete-branch
```

`--auto` が利用不可の場合、直接マージ:

```bash
gh pr merge --squash --delete-branch
```

- 権限エラー → **停止**。「マージ権限がありません。ブランチ保護ルールを確認してください。」
- マージキューに入った場合 → 30秒ごとにポーリング、最大30分待機。

### 4b: CI自動デプロイ検出

マージ後、デプロイワークフローがトリガーされたか確認:

```bash
gh run list --branch <base> --limit 5 --json name,status,workflowName,headSha
```

---

## Step 5: デプロイ戦略の検出

プロジェクトの種類とデプロイ検証方法を判定する。

```bash
# プラットフォーム自動検出
[ -f fly.toml ] && echo "PLATFORM:fly"
[ -f render.yaml ] && echo "PLATFORM:render"
([ -f vercel.json ] || [ -d .vercel ]) && echo "PLATFORM:vercel"
[ -f netlify.toml ] && echo "PLATFORM:netlify"

# デプロイワークフロー検出
for f in $(find .github/workflows -maxdepth 1 \( -name '*.yml' -o -name '*.yaml' \) 2>/dev/null); do
  grep -qiE "deploy|release|production|cd" "$f" 2>/dev/null && echo "DEPLOY_WORKFLOW:$f"
done
```

**判定ツリー（順に評価）:**

1. ユーザーが本番URLを引数で指定 → カナリー検証に使用
2. GitHub Actionsデプロイワークフローが存在 → Step 6でポーリング → カナリー実行
3. ドキュメントのみの変更 → 検証スキップ。「ドキュメントのみの変更です。デプロイ不要。」→ Step 9へ
4. デプロイワークフローもURLもない → ユーザーに確認:
   - A) 本番URL: {入力を受け付ける}
   - B) デプロイ不要 — ライブラリ/CLIツール

### 5a: ステージング先行オプション

ステージング環境が検出された場合、コード変更を含むデプロイでステージング先行を提案:
- A) まずステージングにデプロイし、検証後に本番へ
- B) ステージングをスキップ — 本番に直行
- C) ステージングのみ — 本番は後で

---

## Step 6: デプロイ待機

### 戦略A: GitHub Actionsワークフロー

マージコミットSHAに一致するワークフローランを検出し、30秒ごとにポーリング:
```bash
gh run view <run-id> --json status,conclusion
```

### 戦略B: プラットフォームCLI（Fly.io, Render, Heroku）

```bash
# Fly.io
fly status --app {app} 2>/dev/null
# Render — URLポーリング
curl -sf {production-url} -o /dev/null -w "%{http_code}" 2>/dev/null
```

### 戦略C: 自動デプロイ（Vercel, Netlify）

マージ時に自動デプロイ。60秒待機後、Step 7のカナリー検証へ。

**タイミングと失敗処理:**
- デプロイ成功 → 「デプロイ完了（{所要時間}）。ヘルスチェックに進みます。」
- デプロイ失敗 → ユーザーに確認: A) ログ調査 / B) 即リバート / C) ヘルスチェック続行
- タイムアウト（20分） → 続行するか確認

---

## Step 7: カナリー検証（条件付き深度）

「デプロイ完了。ライブサイトの健全性を確認します。」

変更スコープに応じてカナリー深度を決定:

| 変更スコープ | カナリー深度 |
|------------|-------------|
| ドキュメントのみ | Step 5でスキップ済み |
| 設定のみ | スモーク: ステータス200確認 |
| バックエンドのみ | コンソールエラー + パフォーマンス |
| フロントエンド含む | フル: コンソール + パフォーマンス + スクリーンショット |

**フルカナリー:**
1. ページ読み込み確認（200ステータス）
2. コンソールエラーチェック（`Error`, `Uncaught`, `TypeError` 等）
3. パフォーマンスチェック（10秒以内）
4. コンテンツ存在確認（空白やエラーページでないこと）
5. スクリーンショット取得

**ヘルス判定:** 全項目パス → HEALTHY。いずれか失敗 → ユーザーに確認:
- A) 想定内 — サイトはウォームアップ中。正常とマーク
- B) 壊れている — マージをリバート
- C) 追加調査 — ログを確認してから判断

---

## Step 8: リバート（必要な場合）

「マージをリバートします。前バージョンのサイトが復元されます。」

```bash
git fetch origin <base>
git checkout <base>
git revert <merge-commit-sha> --no-edit
git push origin <base>
```

- コンフリクト発生 → 手動解決を案内
- ブランチ保護あり → リバートPRを作成: `gh pr create --title 'revert: <元PR タイトル>'`

---

## Step 9: デプロイレポート

```
LAND & DEPLOY REPORT
═════════════════════
PR:           #<番号> — <タイトル>
ブランチ:     <head> → <base>
マージ:       <タイムスタンプ> (<マージ方法>)
マージSHA:    <sha>
初回実行:     <はい (ドライラン検証済み) / いいえ>

タイミング:
  CI待機:     <所要時間>
  デプロイ:   <所要時間 / ワークフローなし>
  カナリー:   <所要時間 / スキップ>
  合計:       <エンドツーエンド所要時間>

レビュー:
  Eng Review: <CURRENT / STALE / NOT RUN>

CI:           <PASSED / SKIPPED>
デプロイ:     <PASSED / FAILED / NO WORKFLOW>
検証:         <HEALTHY / DEGRADED / SKIPPED / REVERTED>

判定: <DEPLOYED AND VERIFIED / DEPLOYED (UNVERIFIED) / REVERTED>
```

レポートを `.gstack/deploy-reports/{date}-pr{number}-deploy.md` に保存。

---

## Step 10: フォローアップの提案

- DEPLOYED AND VERIFIED → 「変更は本番で動作確認済みです。」
- DEPLOYED (UNVERIFIED) → 「マージ済みですが検証できませんでした。手動で確認してください。」
- REVERTED → 「マージをリバートしました。ブランチは残っているので修正して再出荷できます。」

フォローアップ提案:
- 本番URL検証済み → 「`/canary <url>` で10分間の継続監視を実行しますか？」
- パフォーマンスデータあり → 「`/benchmark <url>` で詳細分析しますか？」
- 「`/document-release` でドキュメントを同期しますか？」

## 次のスキル

デプロイ完了後 → `/canary`（監視）
