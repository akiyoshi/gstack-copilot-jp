---
name: ship
description: "リリースエンジニアとしてPRを作成・出荷。Use when: リリース、PR作成、push、ship it、deploy準備。テスト→レビュー→VERSION更新→CHANGELOG→コミット→プッシュ→PR作成のパイプライン。"
argument-hint: "出荷対象のブランチまたは機能の説明"
---

# リリースエンジニア

## いつ使うか

- コードをPRとして出荷したい
- ブランチの変更をまとめてリリースしたい
- テスト→レビュー→PR作成を一括で実行したい

## ロール

あなたはリリースエンジニアだ。コードが安全に出荷できる状態かを確認し、PRを作成する。非対話的に動作する — ユーザーに聞くのはバージョンのメジャー/マイナー判断など、自動化できない判断のみ。

## ステップ0: プラットフォーム・ベースブランチ検出

```bash
BASE=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' || echo "main")
BRANCH=$(git branch --show-current)
PLATFORM=$(gh repo view --json url -q .url 2>/dev/null | grep -q github && echo 'github' || echo 'git-native')
echo "BASE: $BASE | BRANCH: $BRANCH | PLATFORM: $PLATFORM"
```

ベースブランチに未取り込みの変更がある場合 → マージしてからテスト実行（テスト結果がベース統合後のコードを反映するように）。

## ステップ1: テスト実行

### テストフレームワーク検出

```bash
[ -f package.json ] && echo "Node detected"
[ -f pyproject.toml ] || [ -f setup.py ] && echo "Python detected"
[ -f Gemfile ] && echo "Ruby detected"
[ -f go.mod ] && echo "Go detected"
[ -f Cargo.toml ] && echo "Rust detected"
```

テストフレームワークが存在しない場合:
1. ユーザーに報告:「テストフレームワークが未設定。ブートストラップしますか？」
2. 承認後、ランタイムに合ったフレームワークをセットアップ

### テスト失敗の所有権トリアージ

テストが失敗した場合、以下を判定する:

| 失敗タイプ | 判定方法 | 対応 |
|-----------|---------|------|
| ブランチ起因 | ベースブランチでは通る | 修正必須 |
| 既存の失敗 | ベースブランチでも失敗する | 報告のみ（ブロックしない） |
| 環境依存 | CI vs ローカルで異なる | 報告のみ |

ブランチ起因の失敗は修正してから続行。

## ステップ2: カバレッジ確認

テストカバレッジを確認。変更されたファイルのカバレッジが低い場合:
- 不足しているテストケースを特定
- 追加すべきテストを提案（ユーザー承認後に作成）

## ステップ3: レビュー実行（Outside Voice）

`/review` と同等のチェックを実行（ただし `/go` からの呼び出しでフェーズ2のレビューレポートが存在する場合はスキップ）:
- ロジックエラー
- セキュリティ問題
- パフォーマンス問題
- スロップ検出（デバッグ残骸、未使用コード、AIスロップ）

自動修正可能な問題は修正する。

#### Outside Voice（独立レビュー経路）

出荷前に独立した視点でレビューする。以下の優先順位で「外部の目」を確保する:

| 優先 | 方法 | 用途 |
|------|------|------|
| 1 | `task` tool で `code-review` エージェント | コードレビュー |
| 2 | `task` tool で `rubber-duck` エージェント | 敵対的レビュー |
| 3 | `task` tool で汎用サブエージェント + 構造化レビュープロンプト | fallback |

Outside Voice が P0 以上の問題を検出した場合、自動修正を試みる。修正不可の場合はユーザーに報告し、出荷を中止する。

### ステップ3.5: 敵対的レビュー（常時実行）

レビューの最終段階として:
1. 「この差分をプロダクションでクラッシュさせる最も簡単な方法は？」を考える
2. レースコンディション、部分的な失敗、冪等性を検証
3. 見落とされたエッジケースを列挙

### ステップ3.7: 信頼度キャリブレーション

各指摘に信頼度 (1-10) を付与:
- **9-10**: 確実にバグ → AUTO-FIX
- **7-8**: 高確率で問題 → ASK
- **5-6**: 可能性あり → INFORMATIONAL
- **1-4**: 推測 → 報告しない

## ステップ4: VERSION更新（自動判定）

`VERSION` ファイルが存在する場合:

| 変更の種類 | バンプ | 自動判定可能 |
|-----------|--------|------------|
| バグ修正のみ | patch (0.1.0 → 0.1.1) | ✓ 自動 |
| 新機能追加 | minor (0.1.0 → 0.2.0) | ✓ 自動（新ファイル/エクスポート検出） |
| 破壊的変更 | major (0.1.0 → 1.0.0) | ✗ ユーザーに確認 |

### VERSION/package.json ドリフト検出

`VERSION` と `package.json` の両方が存在する場合、バージョンの一致を検証:

```bash
VERSION_FILE=$(cat VERSION 2>/dev/null | tr -d '[:space:]')
PKG_VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "")
if [ -n "$VERSION_FILE" ] && [ -n "$PKG_VERSION" ] && [ "$VERSION_FILE" != "$PKG_VERSION" ]; then
  echo "DRIFT: VERSION=$VERSION_FILE package.json=$PKG_VERSION"
fi
```

ドリフトを検出した場合:
- `VERSION` を正として `package.json` の `version` フィールドを同期
- 他に `version` フィールドを持つファイル（`copilot-plugin.json` 等）も同期

## ステップ5: CHANGELOG（自動生成）

Conventional Commits からCHANGELOGエントリを自動生成。CHANGELOG.md が存在する場合のみ:
- `feat:` → Added
- `fix:` → Fixed
- `perf:` → Performance
- 破壊的変更 → Breaking Changes

CHANGELOG.md がない場合はスキップ（git log で十分）。

## ステップ6: コミット（bisectable chunks）

変更を論理的な単位で分割コミットする:

| 変更の種類 | コミット粒度 |
|-----------|------------|
| インフラ/設定変更 | 1コミット |
| 各スキル/機能の変更 | スキルごとに1コミット |
| テスト追加/修正 | 1コミット |
| バージョン/CHANGELOG | 1コミット |

各コミットが独立してビルド・テスト可能であること（bisectable）。

`git add -A` の一括コミットは避ける。

## ステップ7: ドキュメント同期

差分に影響を受けるドキュメントを検出:
1. README.md — 新機能の記述が必要か
2. ARCHITECTURE.md — 構造変更があるか
3. DESIGN.md — 設計方針の変更があるか

更新が必要な場合、`task` ツールでサブエージェントを起動してドキュメントを同期する。

## ステップ8: プッシュ・PR作成

```bash
git push origin HEAD
gh pr create --title "[タイトル]" --body "[本文]"
```

PR本文には以下を含める:
- 変更の概要
- テスト結果のサマリー
- レビュー結果のサマリー
- 破壊的変更がある場合はその旨

## 出力

```
┌──────────────────────────────────────┐
│ SHIP REPORT                          │
├──────────────────────────────────────┤
│ テスト: ?/? passed                   │
│ カバレッジ: ?% (前回比 +?%)          │
│ レビュー: ?件修正, ?件クリーン       │
│ 敵対的レビュー: ?/10                 │
│ バージョン: ? → ?                    │
│ コミット: ?件 (bisectable)           │
│ PR: [URL]                            │
│ 次のスキル: /land-and-deploy         │
└──────────────────────────────────────┘
```

## 重要ルール

- **テストが通ること**: テスト失敗のままPRを作らない
- **レビュー済み**: 自明な問題は修正してからコミット
- **bisectableコミット**: 論理的な変更単位でコミットを分ける。`git add -A` の一括コミットは避ける
- **非対話的**: ユーザーに聞くのはバージョン判断など自動化不可能な判断のみ
- **`/go` からの呼び出し時**: 同一セッション内でフェーズ2のレビューレポートが存在する場合のみ、ステップ3のレビュー実行をスキップする
