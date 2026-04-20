---
name: context-save
description: "セッション保存。作業状態をチェックポイントとして保存。Use when: セッション終了前、作業の中断、context-save、save progress、セッション保存。"
argument-hint: "チェックポイントのタイトル（省略可）"
user-invocable: true
---

# /context-save — セッション保存

本家 `/context-save`（v1.1.3）に対応。旧 `/checkpoint save` の後継。

## サブコマンド

| コマンド | 動作 |
|---------|------|
| `/context-save` | 現在の作業状態を保存（デフォルト） |
| `/context-save {タイトル}` | タイトル指定で保存 |
| `/context-restore` | 最新のチェックポイントから復帰（→ context-restore スキル） |
| `/context-restore 一覧` | 保存済みチェックポイント一覧（→ context-restore スキル） |

## いつ使うか

- セッションを中断する前に作業状態を保存したい
- 長いセッションの途中でスナップショットを取りたい

## ロール

あなたはメモを取るスタッフエンジニアだ。作業コンテキストを正確に記録し、未来のセッションが即座に再開できるようにする。

**ハードゲート**: コード変更は行わない。コンテキストの記録のみ。

## ステップ1: git 状態を収集

```bash
echo "=== BRANCH ==="
git rev-parse --abbrev-ref HEAD 2>/dev/null
echo "=== COMMIT ==="
git rev-parse --short HEAD 2>/dev/null
echo "=== STATUS ==="
git status --short 2>/dev/null
echo "=== STASH ==="
git stash list 2>/dev/null | head -3
echo "=== RECENT LOG ==="
git log --oneline -5 2>/dev/null
```

コミットされていない変更がある場合は、チェックポイントの「ノート」に明記する。

## ステップ2: 会話コンテキストを要約

セッション内の会話から以下を抽出:

1. **何をしていたか** — 作業の高レベル目標
2. **決定事項** — アーキテクチャ選択、トレードオフ、採用/不採用の判断と理由
3. **残作業** — 具体的な次のステップ、優先順位付き
4. **ノート** — ゴッチャ、ブロッカー、試して失敗したこと

タイトルが未指定の場合、作業内容から3-6語で自動生成する。

## ステップ3: チェックポイント保存

`store_memory` ツールで保存する。

パス: `/memories/repo/checkpoints/{timestamp}-{slug}.md`

```markdown
# チェックポイント: {タイトル}

- **ブランチ**: {branch}
- **日時**: {ISO-8601}
- **ステータス**: in-progress

## 作業内容
{1-3文の要約}

## 決定事項
{箇条書き}

## 残作業
{番号付きリスト、優先順位順}

## ノート
{ゴッチャ、ブロッカー、試して失敗したこと}

## git状態
{git status --short}
{git log --oneline -5}
```

## ステップ4: 古いチェックポイント整理（自動クリーンアップ）

チェックポイントが6件以上ある場合、最古のものを削除して**最新5件**を保持する。

削除前にユーザーへの通知は不要（自動実行）。削除されたチェックポイントのタイトルをログに記録する。

## ステップ5: 確認

```
━━━ CONTEXT SAVED ━━━
  タイトル: {タイトル}
  ブランチ: {branch}
  保存先:   /memories/repo/checkpoints/{filename}
  変更ファイル: {N}件
━━━━━━━━━━━━━━━━━━━━━━━━
  復帰: /context-restore
━━━━━━━━━━━━━━━━━━━━━━━━
```

## 推奨する次のスキル

ユーティリティスキルのため、次のスキル推奨はなし。セッション終了前に実行されることが多い。
