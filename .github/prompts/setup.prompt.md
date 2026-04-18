---
description: "gstack-copilot-jpのセットアップ確認。Use when: 初回セットアップ、インストール、setup。"
agent: "agent"
---

gstack-copilot-jpのセットアップ状況を確認してください。

## 前提条件
- Visual Studio Code v1.116 以降
- GitHub Copilot 拡張（Chat対応）

## 確認手順

1. gstack-copilot-jp フォルダがワークスペースに追加されているか確認
2. `.github/skills/` 配下のスキルが認識されているか確認（`/` で一覧表示）
3. `.github/rules/` のルールが適用されているか確認
4. 問題があれば対処方法を案内

## セットアップが完了していない場合

```
git clone https://github.com/[user]/gstack-copilot-jp.git
VS Code で「ファイル」→「ワークスペースにフォルダーを追加...」→ gstack-copilot-jp を選択
```

セットアップスクリプトの実行は不要です。
