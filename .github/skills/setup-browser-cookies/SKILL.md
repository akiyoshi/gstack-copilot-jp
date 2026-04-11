---
name: setup-browser-cookies
description: "ブラウザCookieをヘッドレスセッションにインポート。認証済みページのQAテスト用。Chrome/Edge/Brave等のCookieをJSON形式でエクスポートし、browseセッションに注入。Use when: ログイン状態テスト、認証ページQA、cookie import。"
argument-hint: "インポート元ブラウザまたはCookieファイル"
---

# setup-browser-cookies — セッション管理

ブラウザの Cookie をヘッドレス browse セッションにインポートする。
認証が必要なページの QA テストに使う。

## いつ使うか

- ログイン状態のページをテストしたい
- `/qa` で認証済みページを検証したい
- ステージング環境のテストで認証が必要

## 方法1: headed モードでログイン（推奨）

最もシンプル。可視 Chrome でログインし、セッションを引き継ぐ。

```bash
# 1. headed モードに切替
$B connect

# 2. ログインページに移動
$B goto https://app.com/login

# 3. ユーザーに案内
# 「Chrome ウィンドウでログインしてください。完了したら教えてください。」

# 4. ログイン完了後、headless に戻す
$B disconnect

# 5. Cookie が保持されているので、そのまま QA を継続
$B goto https://app.com/dashboard
$B text
```

## 方法2: Cookie JSON ファイルからインポート

### ステップ1: Cookie エクスポート

ブラウザ拡張機能「EditThisCookie」「Cookie-Editor」等を使い、JSON 形式でエクスポートする。

必要なフォーマット:
```json
[
  {
    "name": "session_id",
    "value": "abc123...",
    "domain": ".example.com",
    "path": "/",
    "httpOnly": true,
    "secure": true,
    "sameSite": "Lax"
  }
]
```

### ステップ2: インポート

```bash
$B cookie-import cookies.json
```

### ステップ3: 確認

```bash
$B cookies example.com          # ドメインのCookie確認
$B goto https://app.com/dashboard
$B is visible ".user-menu"      # ログイン状態確認
```

## 方法3: JavaScript でCookie設定

特定の Cookie のみ必要な場合:

```bash
$B goto https://app.com
$B js "document.cookie = 'session_id=abc123; domain=.app.com; path=/; secure'"
$B reload
$B is visible ".user-menu"
```

## CDPモード（headed）の場合

headed モード（`$B connect` 済み）では、ユーザーが直接ブラウザでログインできるため、Cookie インポートは不要。

```bash
$B status                        # Mode: headed なら不要
```

## トラブルシューティング

| 問題 | 対処 |
|------|------|
| Cookie が効かない | `$B cookies` でドメイン・パスを確認 |
| SameSite エラー | JSON の `sameSite` を `"None"` に変更、`secure: true` を確認 |
| HttpOnly Cookie | ブラウザ拡張でエクスポートするか、headed モードを使用 |
| 期限切れ | フレッシュな Cookie を再エクスポート |

## セキュリティ注意

- Cookie ファイルは**機密情報**。`.gitignore` に追加すること
- テスト用アカウントの Cookie を使う。本番アカウントは避ける
- `cookie-import` したファイルはテスト後に削除する
