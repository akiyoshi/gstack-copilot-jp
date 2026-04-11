---
name: setup-deploy
description: "デプロイ環境の設定。Use when: デプロイ設定、deploy configuration、/land-and-deploy の初期設定。プラットフォーム自動検出。"
argument-hint: "デプロイ先のプラットフォーム（Vercel, Railway, AWS等）"
---

# デプロイ設定

## いつ使うか

- `/land-and-deploy` を使う前の初期設定
- デプロイ先のプラットフォームを設定したい

## ワークフロー

### 1. プラットフォーム自動検出
- `vercel.json` → Vercel
- `railway.json` → Railway
- `Dockerfile` → Docker/k8s
- `fly.toml` → Fly.io
- `netlify.toml` → Netlify

### 2. 設定生成
検出されたプラットフォームに基づき:
- デプロイコマンド
- 本番URL
- ヘルスチェックURL
- ロールバックコマンド

### 3. 設定保存
`.gstack-copilot-jp/deploy.json` に保存:
```json
{
  "platform": "vercel",
  "deploy_command": "vercel --prod",
  "production_url": "https://...",
  "health_check": "https://.../api/health"
}
```

## 重要ルール

- **自動検出優先**: 手動設定より自動検出を優先
- **検証**: 設定後にヘルスチェックURLの疎通確認
