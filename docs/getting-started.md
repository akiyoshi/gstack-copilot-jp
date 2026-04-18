# はじめに

gstack-copilot-jp には40のスキルがある。全部を覚える必要はない。

**最初に試す3つ**:

| スキル | 何が起きるか | 所要時間 |
|--------|-------------|---------|
| `/office-hours` | アイディアの壁打ち。6つの問いで本質を見つける | 5-10分 |
| `/review` | コードレビュー。専門家サブエージェントが並列で分析 | 2-5分 |
| `/ship` | テスト→VERSION更新→PR作成まで一気通貫 | 3-5分 |

この3つでgstack-copilot-jpの価値の80%を体験できる。

## セットアップ（~40秒）

### 前提条件

- Visual Studio Code **v1.116 以降**
- GitHub Copilot 拡張（Chat対応）

### 手順

```bash
git clone https://github.com/[your-username]/gstack-copilot-jp.git
```

VS Code → `ファイル` → `ワークスペースにフォルダーを追加...` → `gstack-copilot-jp` を選択。

終わり。Copilot Chat で `/` を入力するとスキル一覧が出る。

## 最初の体験: `/office-hours`

自分のプロジェクトフォルダで Copilot Chat を開き:

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
/tdd              → テストファースト実装
/review           → コードレビュー・自動修正
/qa               → QA・バグ修正ループ
/ship             → PR作成・出荷
```

全部手動で呼ぶのが面倒なら `/autoplan` で計画フェーズを一括実行できる。

実装タスクを自動で回したいなら `/loop` でプランファイルを投入 → テスト付きで順次実行できる。

## よくある問題

### スキルが表示されない

VS Code のバージョンを確認:

```
ヘルプ → バージョン情報 → v1.116 以上か？
```

v1.116未満の場合、VS Codeを更新する。

### `/browse` でChromiumが起動しない

Playwrightのブラウザをインストール:

```bash
cd gstack-copilot-jp/browse && npm install && npx playwright install chromium
```

### スキルが多すぎてどれを使えばいいか分からない

このガイドの冒頭にある3つ（`/office-hours`, `/review`, `/ship`）から始める。慣れたらREADMEの[スプリントプロセス表](../README.md#スプリントプロセス)で全体像を把握する。

## 次のステップ

- [README.md](../README.md) — 全スキル一覧とアーキテクチャ
- [ETHOS.md](../ETHOS.md) — 3つの原則（湖を沸かせ、作る前に探せ、ユーザー主権）
- [BROWSER.md](../BROWSER.md) — ブラウザ自動化の技術詳細
