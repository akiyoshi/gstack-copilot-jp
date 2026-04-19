---
description: "スキルが生成する成果物の永続化ルール。Use when a skill produces artifacts (design docs, test plans, review logs, CEO plans) that downstream skills consume."
---

# 成果物永続化

## 保存先

| 成果物 | 保存先 | 生成スキル | 消費スキル |
|--------|--------|-----------|-----------|
| デザインドキュメント | プロジェクトルートの `DESIGN.md` | `/office-hours` | `/plan-ceo-review`, `/plan-eng-review`, `/autoplan` |
| テスト計画 | `.gstack/plans/` | `/plan-eng-review` | `/qa`, `/tdd` |
| CEOプラン | `.gstack/plans/` | `/plan-ceo-review` | `/plan-eng-review`, `/go` |
| レビューログ | `/memories/repo/` | `/review`, `/plan-*-review` | `/ship`, `/retro` |
| 学習記録 | `/memories/repo/` or `/memories/` | `/learn` | 全スキル（セッション開始時） |

## 発見ルール

成果物を探すスキルは以下の順で検索する:

1. `DESIGN.md`（プロジェクトルート）
2. `.gstack/plans/` 内のファイル（更新日時降順）
3. `/memories/repo/` 内の関連ファイル

見つからなければ前提スキルの実行を提案する。ユーザーがスキップしたらそのまま進行。

## 永続化ルール

- 成果物は上書きではなく追記。既存のデザインドキュメントに `Supersedes:` フィールドを追加
- レビューログは1行1エントリのJSON形式で追記
- ファイルサイズが肥大化したら古いエントリを要約に置き換える
- プロジェクトファイル（DESIGN.md等）とユーザー設定（/memories/）を混同しない

## スキル完了時

成果物を生成したスキルは、完了レポートに以下を含める:

```
成果物:
- [ファイルパス]: [1行の説明]
下流スキルへの引き渡し:
- [消費スキル名] が [ファイルパス] を自動検出する
```
