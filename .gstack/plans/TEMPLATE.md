---
# /multi-plan が生成するプランファイルのテンプレート
# /multi-execute がこのフォーマットをパースして実行する
#
# 使い方: このファイルをコピーして .gstack/plans/[feature-name].md として保存

feature: "[機能名]"
created: "YYYY-MM-DD"
status: draft  # draft | approved | in-progress | completed

models:
  backend: "[使用モデル名]"
  frontend: "[使用モデル名]"
  testing: "[使用モデル名]"
  orchestrator: "[使用モデル名]"

cost_estimate:
  total_multiplier: "0x"
  breakdown:
    - role: backend
      multiplier: "1x"
    - role: frontend
      multiplier: "1x"
    - role: testing
      multiplier: "1x"
    - role: orchestrator
      multiplier: "3x"

tasks:
  - id: 1
    name: "[タスク名]"
    depends: []
    model: backend
    files: []
    estimated_minutes: 0
  - id: 2
    name: "[タスク名]"
    depends: [1]
    model: frontend
    files: []
    estimated_minutes: 0
---

# [機能名] — マルチモデル設計プラン

## 合意点

全モデルが同意した設計判断（高信頼度）:

- [合意点1]
- [合意点2]

## 相違点

モデル間で判断が分かれた点（要判断）:

| 観点 | モデルA | モデルB | 推奨 |
|------|--------|--------|------|
| [観点] | [判断] | [判断] | [根拠付き推奨] |

## 独自発見

1モデルのみが指摘した点（マルチモデル分析の真価）:

- [発見1] — 指摘モデル: [モデル名]
- [発見2] — 指摘モデル: [モデル名]

## 実装手順

依存関係順に並べたタスクリスト:

1. **[タスク1]** (model: backend)
   - ファイル: [対象ファイル]
   - 内容: [実装内容]

2. **[タスク2]** (model: frontend, depends: タスク1)
   - ファイル: [対象ファイル]
   - 内容: [実装内容]

## テスト計画

| # | テストケース | 種別 | 優先度 |
|---|------------|------|--------|
| 1 | [テスト名] | Unit | P0 |
| 2 | [テスト名] | Integration | P1 |

## リスクと緩和策

| リスク | 影響度 | 緩和策 |
|--------|--------|--------|
| [リスク] | 高/中/低 | [対策] |
