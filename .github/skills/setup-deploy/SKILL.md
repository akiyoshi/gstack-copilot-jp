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

プロジェクトルートの設定ファイルから自動検出:

| ファイル | プラットフォーム | デプロイコマンド |
|---------|---------------|----------------|
| `vercel.json` or `.vercel/` | Vercel | `vercel --prod` |
| `netlify.toml` | Netlify | `netlify deploy --prod` |
| `railway.json` or `railway.toml` | Railway | `railway up` |
| `fly.toml` | Fly.io | `fly deploy` |
| `Dockerfile` + `buildspec.yml` | AWS (ECS/EB) | プロジェクト依存 |
| `app.yaml` or `cloudbuild.yaml` | GCP (App Engine/Cloud Run) | `gcloud app deploy` / `gcloud run deploy` |
| `Dockerfile` のみ | Docker (手動) | ユーザーに聞く |

複数の設定が見つかった場合 → ユーザーに選択させる。
何も見つからない場合 → 手動設定モードに入る。

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
  "production_url": "https://myapp.vercel.app",
  "health_check": "https://myapp.vercel.app/api/health",
  "rollback_command": "vercel rollback"
}
```

### 4. プラットフォーム固有の手順

検出結果に応じて、必要なCLIツールのインストール状況を確認:

```bash
# Vercel
command -v vercel >/dev/null || echo "npm i -g vercel でインストール"

# Fly.io
command -v fly >/dev/null || echo "curl -L https://fly.io/install.sh | sh"

# Railway
command -v railway >/dev/null || echo "npm i -g @railway/cli でインストール"
```

## 重要ルール

- **自動検出優先**: 手動設定より自動検出を優先
- **検証**: 設定後にヘルスチェックURLの疎通確認
