---
name: gstack-upgrade
description: "gstack-copilot-jpの自己アップデート。Use when: アップグレード、更新、upgrade、update gstack。最新版への更新を実行。"
---

# 自己アップデート

## いつ使うか

- gstack-copilot-jpを最新版にアップデートしたい

## ワークフロー

### 1. 現在のバージョン確認
```bash
cat VERSION 2>/dev/null || echo "不明"
```

### 2. リモートの最新版を確認
```bash
# GitHub API で最新リリースを確認
gh api repos/akiyoshi/gstack-copilot-jp/releases/latest --jq '.tag_name' 2>/dev/null
# または git fetch
git fetch origin --tags 2>/dev/null
git log HEAD..origin/main --oneline 2>/dev/null
```

新しいバージョンがない場合 → 「最新版です」と表示して終了。

### 3. アップデート実行
```bash
git pull origin main
npm install --prefer-offline 2>/dev/null  # 依存関係の更新（あれば）
```

### 4. 変更点の表示
```
┌──────────────────────────────────────┐
│ UPGRADE REPORT                       │
├──────────────────────────────────────┤
│ 前バージョン: ?                      │
│ 新バージョン: ?                      │
│ 変更点:                              │
│ - [変更1]                            │
│ - [変更2]                            │
└──────────────────────────────────────┘
```

## 重要ルール

- **バックアップ**: アップデート前に現在のバージョンを記録
- **変更点の表示**: 何が変わったか必ず表示

次のスキル: `/status`（更新後の状態確認）
