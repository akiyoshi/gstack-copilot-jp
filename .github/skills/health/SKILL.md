---
name: health
description: "コード品質ダッシュボード。typecheck/lint/test/deadcode の4軸で 0-10 スコアリング。Use when: コード品質、ヘルスチェック、health、品質ダッシュボード、プロジェクトの状態。"
argument-hint: "空（自動検出）またはチェック対象のディレクトリ"
---

# コード品質ダッシュボード

## いつ使うか

- プロジェクトの品質状態を把握したい
- テスト・型チェック・lint の結果を一覧で見たい
- 品質の推移を追跡したい

## ロール

あなたはコード品質エンジニアだ。プロジェクトの健全性を4つの軸で計測し、0-10 スコアで可視化する。

## ステップ1: ツール検出

プロジェクトの設定ファイルからツールを自動検出する:

```bash
# TypeScript / JavaScript
[ -f package.json ] && cat package.json | head -50
[ -f tsconfig.json ] && echo "TypeScript detected"

# Python
[ -f pyproject.toml ] && cat pyproject.toml | head -30
[ -f setup.py ] && echo "Python detected"

# Go
[ -f go.mod ] && echo "Go detected"
```

| カテゴリ | 検出対象 |
|---------|---------|
| typecheck | `tsc --noEmit`, `pyright`, `mypy`, `go vet` |
| lint | `eslint`, `biome`, `ruff`, `golangci-lint` |
| test | `vitest`, `jest`, `pytest`, `go test` |
| deadcode | `knip`, `ts-prune`, `vulture`, `deadcode` |

## ステップ2: 各軸の実行

検出したツールを順に実行する。未検出のカテゴリは `N/A` とし、スコア 0 にはしない。

### typecheck

```bash
# 例: TypeScript
npx tsc --noEmit 2>&1 | tail -5
```

スコアリング:
- 10: エラー 0
- 8: エラー 1-5（軽微な型問題）
- 5: エラー 6-20
- 2: エラー 21-50
- 0: エラー 50+

### lint

```bash
# 例: ESLint
npx eslint . --format compact 2>&1 | tail -10
```

スコアリング:
- 10: 警告+エラー 0
- 8: 警告のみ 1-10
- 5: エラー 1-5 または警告 11-30
- 2: エラー 6-20
- 0: エラー 20+

### test

```bash
# 例: Vitest
npx vitest run 2>&1 | tail -20
```

スコアリング:
- 10: 全テスト通過 + カバレッジ 80%+
- 8: 全テスト通過 + カバレッジ 60-79%
- 5: 全テスト通過 + カバレッジ 40-59%（またはカバレッジ未計測）
- 2: テスト失敗あり（5件以下）
- 0: テスト失敗多数 または テストなし

### deadcode

```bash
# 例: knip
npx knip 2>&1 | tail -20
```

スコアリング:
- 10: 未使用コード 0
- 8: 未使用 1-5 件
- 5: 未使用 6-15 件
- 2: 未使用 16-30 件
- 0: 未使用 30+ 件

## ステップ3: 総合スコア

```
┌──────────────────────────────────────┐
│ HEALTH DASHBOARD                     │
├──────────────────────────────────────┤
│ プロジェクト: [名前]                 │
│ ブランチ: [ブランチ名]               │
├──────────────────────────────────────┤
│ typecheck:  ██████████ 10/10         │
│ lint:       ████████░░  8/10         │
│ test:       ██████░░░░  6/10         │
│ deadcode:   ████████░░  8/10         │
├──────────────────────────────────────┤
│ 総合スコア: 8.0/10                   │
│ 前回比: +0.5                         │
├──────────────────────────────────────┤
│ 改善提案:                            │
│  1. テストカバレッジを 60→80% に     │
│  2. [具体的な改善アクション]         │
└──────────────────────────────────────┘
```

総合スコア = 検出済みカテゴリのスコア平均（N/A は除外）

## ステップ4: 履歴記録

スコアを `~/.gstack/projects/{slug}/health-history.jsonl` に追記する:

```bash
SLUG=$(bin/gstack-slug)
GSTACK_DIR="${HOME}/.gstack/projects/${SLUG}"
mkdir -p "$GSTACK_DIR"
TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo "{\"ts\":\"${TS}\",\"branch\":\"${BRANCH}\",\"score\":[総合],\"typecheck\":[スコア],\"lint\":[スコア],\"test\":[スコア],\"deadcode\":[スコア]}" \
  >> "${GSTACK_DIR}/health-history.jsonl"
```

前回のスコアがあれば差分を表示する。

## 重要ルール

- **ツールが未インストールでも失敗しない**: N/A で skip。インストールの強制はしない（ユーザー主権）
- **スコアは相対指標**: 他プロジェクトとの比較ではなく、同プロジェクト内の推移を追跡する
- **改善提案は具体的に**: 「テストを増やす」ではなく「auth.ts のログイン関数にテストを追加（カバレッジ +5%）」
- **実行に副作用なし**: 読み取りと計測のみ。コードの変更は行わない

次のスキル: スコアに問題がなければ `/ship`。改善が必要なら `/tdd` で修正。
