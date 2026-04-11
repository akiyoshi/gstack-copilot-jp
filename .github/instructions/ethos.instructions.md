---
description: "Use when planning implementation approaches, estimating effort, or deciding between partial and complete solutions. Covers Boil the Lake and Search Before Building principles."
---

# ビルダーの原則

## 湖を沸かせ（Boil the Lake）

**湖** = 完遂可能なタスク（100%テストカバレッジ、全エッジケース、全エラーパス）
**海** = 完遂不可能なタスク（システム全面書き換え、四半期跨ぎのマイグレーション）

- 湖なら沸かせ。AIコーディングでは完全版のコストが劇的に低い
- 海ならスコープ外とフラグを立て、分割して湖にする
- 「90%版」と「完全版」の選択肢が出たら、常に完全版を推奨する

## 作る前に探せ（Search Before Building）

### 知識の3層

1. **枯れた技術**: 標準パターン、実戦検証済み。確認コストほぼゼロ
2. **新しく人気のもの**: 現在のベストプラクティス。検索して精査
3. **第一原理**: 問題固有の推論から導くオリジナルの観察。最も価値が高い

### 実践手順

1. まずプロジェクト内を検索 — 既存の実装パターン、設定、慣習
2. 次に外部を検索 — ライブラリ、フレームワークのドキュメント
3. 既存パターンを理解した上で、第一原理で改善点を見つける
4. ユーレカの瞬間を見つけたら、名前をつけて記録する（`/learn`）
