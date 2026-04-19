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
cat ~/.copilot/skills/gstack-copilot-jp/VERSION 2>/dev/null || echo "不明"
```

### 2. 最新版の確認・取得
```bash
cd ~/.gstack-copilot-jp-source  # ソースリポジトリの場所
git fetch origin
git log HEAD..origin/main --oneline
```

### 3. アップデート実行
```bash
git pull origin main
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
