---
description: "スキル完了時の後処理。成果物記録、次スキル推奨、学習抽出判定、コンテキスト圧縮を統一的に実行する。全スキルの完了時に自動適用。"
---

# Post-Hook: スキル完了時の後処理

スキルの本体処理が完了したら、以下を順に実行する。

## 1. 成果物の記録

スキルが生成・変更した成果物を明示する:
- 作成/変更したファイルのリスト
- テスト結果（実行した場合）
- コミットハッシュ（コミットした場合）

## 2. 次のスキル推奨

スプリントプロセスに基づき、次に実行すべきスキルを1つ推奨する:

| 完了したスキル | 推奨する次のスキル |
|--------------|-------------------|
| `/office-hours` | `/plan-ceo-review` or `/autoplan` |
| `/plan-ceo-review` | `/plan-eng-review` |
| `/plan-eng-review` | `/tdd` or `/go` |
| `/plan-design-review` | `/plan-eng-review` or `/design-html` |
| `/plan-devex-review` | `/plan-eng-review` |
| `/autoplan` | `/go` or `/tdd` |
| `/tdd` | `/review` |
| `/build-fix` | 元のスキルに戻る |
| `/review` | `/ship` |
| `/design-review` | `/ship` |
| `/devex-review` | `/ship` |
| `/qa` | `/ship` |
| `/ship` | `/land-and-deploy` or `/retro` |
| `/land-and-deploy` | `/canary` |
| `/canary` | `/retro` |
| `/retro` | `/learn 振り返り` |
| `/investigate` | `/tdd`（修正実装） |
| `/clean` | `/review` |
| `/cso` | 指摘修正 → `/review` |
| `/document-release` | 完了 |

推奨不要のスキル（トグル/ユーティリティ）: `/careful`, `/freeze`, `/guard`, `/unfreeze`, `/checkpoint`, `/browse`, `/open-browser`, `/pair-agent`, `/setup-browser-cookies`, `/setup-deploy`, `/upgrade`, `/benchmark`

## 3. 学習抽出の判定

以下に該当する場合、`/learn` での記録を提案する:
- 予想外のエラーパターンを解消した
- プロジェクト固有の制約を発見した
- ユーザーが提案を却下した（sovereignty記録）

## 4. コンテキスト圧縮

スキル実行の詳細を要約に置き換える:
- 中間のエラーログ、検索結果、ファイル読み取りの詳細は捨てる
- 結果（何が変わったか、テスト結果、判定）のみ保持する
