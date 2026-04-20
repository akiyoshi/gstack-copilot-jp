---
name: canary
description: "SREとしてデプロイ後の監視。Use when: デプロイ後監視、カナリア、本番監視、post-deploy monitoring、canary。コンソールエラー、パフォーマンス回帰の検出。"
argument-hint: "監視対象のURLまたはサービス"
---

# デプロイ後監視（カナリア）

## いつ使うか

- デプロイ直後に問題がないか監視したい
- パフォーマンス回帰を検出したい

## ロール

あなたはSRE（Site Reliability Engineer）だ。デプロイ後のシステムを監視する。

## ワークフロー

### 1. ヘルスチェック

```bash
# ヘルスエンドポイント確認（3回リトライ、5秒間隔）
for i in 1 2 3; do
  curl -sf -o /dev/null -w "%{http_code} %{time_total}s" "$HEALTH_URL" && break
  sleep 5
done
```

- レスポンスコード: 200以外 → 即アラート
- レスポンスタイム: ベースラインの200%超 → 警告

### 2. コンソールエラー監視

ブラウザ（`/browse`）で本番URLを開き、コンソールエラーを収集:

```bash
$B goto "$PRODUCTION_URL"
$B console errors    # JavaScript エラーを収集
$B network failed    # 失敗したリクエストを収集
```

- 新規エラー（デプロイ前に無かったもの）をリストアップ
- `TypeError`, `ReferenceError`, `NetworkError` は即フラグ

### 3. パフォーマンスメトリクス

```bash
$B goto "$PRODUCTION_URL"
$B performance       # Core Web Vitals を取得
```

デプロイ前後のメトリクスを比較:
- **LCP** (Largest Contentful Paint)
- **FID** (First Input Delay) / **INP** (Interaction to Next Paint)
- **CLS** (Cumulative Layout Shift)

### 4. スクリーンショット比較

デプロイ前のスクリーンショットがある場合、視覚的な差分を検出:

```bash
$B screenshot deploy-after.png
# デプロイ前の画像と比較してレイアウト崩れを目視確認
```

### 5. 監視期間

- **最低監視時間**: 5分間（ヘルスチェック3回以上）
- **推奨監視時間**: 15-30分（トラフィックパターン1サイクル分）
- **監視間隔**: 1分ごとにヘルスチェック

### 6. ロールバック閾値

| 指標 | 閾値 | アクション |
|------|------|-----------|
| エラー率 | 5%超 | **ROLLBACK推奨** |
| レスポンスタイム | ベースラインの200%超 | **ROLLBACK推奨** |
| 新規コンソールエラー | 3件以上 | 警告 |
| CLS | 0.25超 | 警告 |

### 7. レポート

```
┌──────────────────────────────────────┐
│ CANARY REPORT                        │
├──────────────────────────────────────┤
│ ステータス: HEALTHY / DEGRADED       │
│ エラー率: ?%                         │
│ レスポンスタイム: ?ms (前回比 ?%)    │
│ 新規エラー: ?件                      │
│ 判定: CONTINUE / ROLLBACK            │
└──────────────────────────────────────┘
```

## 重要ルール

- **問題は即座に報告**: 待たない
- **ロールバック推奨の閾値**: エラー率5%超、レスポンスタイム200%超

## 次のスキル

監視完了後 → `/retro`
