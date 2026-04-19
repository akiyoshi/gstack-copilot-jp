---
name: open-browser
description: "GStack Browserの起動。AI制御の可視Chromiumを起動し、リアルタイムでブラウジングを観察。反ボットステルス内蔵。Use when: ブラウザを見せて、headed mode、可視モード、ブラウザ起動、show me the browser。"
argument-hint: "オプション: 開くURL"
---

# open-browser — 可視ブラウザの起動

AI制御の可視 Chromium ブラウザを起動する。
ユーザーがリアルタイムでAIの操作を見れる。

## いつ使うか

- QAテストでAIの操作を目視確認したい
- デザインレビューでAIが見ている画面を確認したい
- CAPTCHAやMFAの処理が必要
- デモでスクリーン共有している

## ステップ1: 起動前クリーンアップ

```bash
# 既存サーバーが動いている場合は停止
$B stop 2>/dev/null || true
```

## ステップ2: headed モードで接続

```bash
$B connect
```

これにより:
- システムの Chrome が起動（または Playwright の Chromium）
- headed モード（ウィンドウ表示）に切り替わる
- 既存の Cookie・セッションが引き継がれる

## ステップ3: 動作確認

```bash
$B status
# → Mode: headed
# → Tabs: 1
```

## ステップ4: デモ

```bash
$B goto https://news.ycombinator.com
$B snapshot -i
# → インタラクティブ要素が @ref 付きで表示
```

ユーザーに：「ブラウザウィンドウが開きました。すべての browse コマンドがこのウィンドウで実行されます。」

## ステップ5: 操作開始

通常の browse コマンドがすべて使える:

```bash
$B goto https://app.com          # ナビゲーション
$B snapshot -i                   # 要素一覧
$B click @e3                     # クリック（ウィンドウで見える）
$B fill @e5 "test@example.com"   # 入力（ウィンドウで見える）
$B screenshot /tmp/demo.png      # スクリーンショット
```

## ステップ6: headless に戻す

```bash
$B disconnect
# → headless モードに戻る（Cookie は保持）
```

## headed モードの活用例

### QAテストの目視確認
```bash
$B connect
$B goto https://staging.app.com
$B snapshot -i
$B click @e3
# ユーザー: 「あ、ボタンの位置がおかしい」
$B screenshot /tmp/qa-issue.png
```

### 認証フローの処理
```bash
$B connect
$B goto https://app.com/login
# ユーザーに: 「ログインしてください」
# ユーザーがログイン操作
$B snapshot -i
# → ダッシュボードが表示されている
$B disconnect
# → headless でテスト続行（ログインセッション保持）
```

### デザインレビュー
```bash
$B connect
$B goto https://app.com
$B viewport 375x812              # モバイルサイズ
# ユーザーと一緒にモバイル表示を確認
$B viewport 1280x720             # デスクトップに戻す
```

## トラブルシューティング

| 問題 | 対処 |
|------|------|
| Chrome が起動しない | `npx playwright install chromium` を実行 |
| ウィンドウが見えない | `$B status` で Mode 確認、`$B connect` を再実行 |
| フリーズ | `$B stop` で停止し、`$B connect` で再起動 |

## headless vs headed の選択基準

| シナリオ | モード |
|----------|--------|
| 自動テスト（CI/CD的） | headless（デフォルト） |
| ユーザーと一緒にQA | headed |
| CAPTCHA・MFA | headed |
| デモ・画面共有 | headed |
| バッチ処理 | headless |

## 推奨する次のスキル

ユーティリティスキルのため、次のスキル推奨はなし。ユーザーの作業フローに戻る。
