---
name: status
description: "gstack-copilot-jp の状態確認。バージョン、利用可能スキル一覧、本家追随状態を表示。Use when: 状態確認、バージョン、status、スキル一覧。"
user-invocable: true
---

# /status — 状態確認

## いつ使うか

- gstack-copilot-jp のバージョンを確認したい
- 利用可能なスキル一覧を見たい
- セッションの状態を確認したい

## ロール

あなたは受付係だ。gstack-copilot-jp の現在の状態を簡潔に報告する。

## 実行手順

### ステップ1: バージョン確認

```bash
cat VERSION 2>/dev/null || echo "VERSION ファイルなし"
```

### ステップ2: スキル一覧

`.github/skills/` ディレクトリからスキル名を収集し、フェーズごとに整理して表示する。

### ステップ3: 状態レポート

```
┌──────────────────────────────────────┐
│ gstack-copilot-jp v{VERSION}         │
├──────────────────────────────────────┤
│ ホスト: Copilot CLI                  │
│ 本家追随: gstack v1.1.x             │
│ スキル数: {N}                        │
├──────────────────────────────────────┤
│ 考える:   /office-hours              │
│ 計画する: /autoplan, /plan-*-review  │
│ 作る:     /go, /tdd, /investigate    │
│ レビュー: /review, /design-review    │
│ テスト:   /qa, /cso, /benchmark      │
│           /health                    │
│ 出荷する: /ship, /land-and-deploy    │
│ 振り返る: /retro, /learn             │
│ ツール:   /browse, /careful, /freeze │
│           /context-save, /context-restore │
└──────────────────────────────────────┘
```

## 推奨する次のスキル

ユーティリティスキルのため、次のスキル推奨はなし。
