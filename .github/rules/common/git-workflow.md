# Gitワークフロー

## コミットメッセージ

Conventional Commits に従う：

```
<type>(<scope>): <description>

[optional body]
```

### type

| type | 用途 |
|------|------|
| `feat` | 新機能 |
| `fix` | バグ修正 |
| `test` | テスト追加・修正 |
| `refactor` | リファクタリング（機能変更なし） |
| `docs` | ドキュメントのみの変更 |
| `chore` | ビルド・CI・依存関係 |
| `style` | フォーマット変更（セミコロン等） |
| `perf` | パフォーマンス改善 |

### ルール

- description は現在形（「追加する」ではなく「追加」）
- 50文字以内
- scope は省略可（ただし大きなプロジェクトでは推奨）

## ブランチ戦略

- `main` / `master` — プロダクション。直接pushしない
- `feature/*` — 新機能
- `fix/*` — バグ修正
- `chore/*` — メンテナンス

## PR（Pull Request）

- タイトルはConventional Commits形式
- 差分は300行以下を目標。超える場合は分割
- セルフレビューしてからPR作成
- CI が通ってからマージ
