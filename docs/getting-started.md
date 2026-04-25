# はじめに

gstack-copilot-jp には38のスキルがある。全部を覚える必要はない。

**最初に試す3つ**:

| スキル | 何が起きるか | 所要時間 |
|--------|-------------|---------|
| `/office-hours` | アイディアの壁打ち。6つの問いで本質を見つける | 5-10分 |
| `/gstack-review` | コードレビュー。専門家サブエージェントが並列で分析 | 2-5分 |
| `/ship` | テスト→VERSION更新→PR作成まで一気通貫 | 3-5分 |

この3つでgstack-copilot-jpの価値の80%を体験できる。

## セットアップ（~40秒）

### 前提条件

- GitHub Copilot CLI（`copilot` コマンド）
- Bun v1.0+
- Git

### 手順

```bash
git clone https://github.com/akiyoshi/gstack-copilot-jp.git
cd gstack-copilot-jp && ./setup
```

> **実験的:** `copilot plugin install akiyoshi/gstack-copilot-jp` でもインストール可能（プラグインシステム安定化後に正式対応予定）。

終わり。プロジェクトディレクトリで `copilot` を起動し、スキルを呼び出す。

## 最初の体験: `/office-hours`

自分のプロジェクトフォルダで Copilot CLI を開き:

```
/office-hours
TODOアプリを作りたい
```

Copilotが6つの問いかけで「TODOアプリ」を磨く。終わると `DESIGN.md` が生成される。この DESIGN.md が後続のスキル（`/plan-ceo-review`, `/plan-eng-review` 等）への入力になる。

## スプリントプロセス

スキルは単体で使えるが、連鎖させると真価を発揮する:

```
/office-hours     → DESIGN.md 生成
/plan-ceo-review  → 戦略レビュー
/plan-eng-review  → アーキテクチャ図・テスト計画
/gstack-review           → コードレビュー・自動修正
/qa               → QA・バグ修正ループ
/ship             → PR作成・出荷
```

全部手動で呼ぶのが面倒なら `/autoplan` で計画フェーズを一括実行できる。

## よくある問題

### スキルが認識されない

Copilot CLI のバージョンとプラグインを確認:

```bash
copilot --version
copilot plugin list
```

プラグインが表示されない場合、再インストール: `copilot plugin install akiyoshi/gstack-copilot-jp`
手動インストールの場合は `./setup` を再実行。

### `/browse` でChromiumが起動しない

Playwrightのブラウザをインストール:

```bash
cd gstack-copilot-jp/browse && bun install && bunx playwright install chromium
```

### スキルが多すぎてどれを使えばいいか分からない

このガイドの冒頭にある3つ（`/office-hours`, `/gstack-review`, `/ship`）から始める。慣れたらREADMEの[スプリントプロセス表](../README.md#スプリントプロセス)で全体像を把握する。

## 次のステップ

- [README.md](../README.md) — 全スキル一覧とアーキテクチャ
- [ETHOS.md](../ETHOS.md) — 3つの原則（湖を沸かせ、作る前に探せ、ユーザー主権）
- [BROWSER.md](../BROWSER.md) — ブラウザ自動化の技術詳細
