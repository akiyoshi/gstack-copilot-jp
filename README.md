# gstack-copilot-jp

日本人のGitHub Copilotユーザーのための、AIソフトウェアファクトリー。

[gstack](https://github.com/garrytan/gstack)（Garry Tan作）の思想とプロセスを、**日本語のGitHub Copilot向けスキル・エージェント**として一から再実装。

## 前提条件

- Visual Studio Code v1.116 以降
- GitHub Copilot 拡張（Chat対応）

## クイックスタート

### 1. クローン

```bash
git clone https://github.com/[your-username]/gstack-copilot-jp.git
```

### 2. ワークスペースに追加

VS Code で `ファイル` → `ワークスペースにフォルダーを追加...` → クローンした `gstack-copilot-jp` フォルダを選択。

これだけ。スキル・エージェント・ルールが自動認識される。

> **なぜ動くのか**: VS Code v1.116+ では、ワークスペース内の `.github/skills/`、`.github/agents/`、`.github/instructions/`、`.github/prompts/` を Copilot が自動で読み込む。セットアップスクリプト不要、管理者権限不要、シンボリックリンク不要。

### 3. 更新

```bash
cd gstack-copilot-jp && git pull
```

### 4. 使い始める

> **初めての方は [docs/getting-started.md](docs/getting-started.md) へ。** 最初に試すべき3つのスキルとトラブルシューティングをまとめている。

VS Code Copilot Chat で `/` を入力 → スキル一覧が表示される。

```
あなた: /office-hours
        カレンダーのブリーフィングアプリを作りたい

Copilot: [痛みを聞く — 具体的なエピソードを引き出す]
         [前提を挑戦する — 「ブリーフィングアプリ」ではなく「参謀AI」では？]
         [3つの実装アプローチを工数見積もり付きで提示]

あなた: /plan-ceo-review
Copilot: [デザインドキュメントを読み、10セクションのCEOレビューを実行]

あなた: /review
Copilot: [diff分析 → 専門家サブエージェント並列dispatch → 自動修正 → レポート]

あなた: /ship
Copilot: [テスト → レビュー → VERSION更新 → CHANGELOG → PR作成]
```

## スプリントプロセス

gstack-copilot-jpは**プロセス**であり、ツール集ではない。スキルは以下の順で連携する：

**考える → 計画する → 作る → レビューする → テストする → 出荷する → 振り返る**

| フェーズ | スキル | ロール |
|---------|--------|--------|
| 考える | `/office-hours` | YCパートナー — 6つの問いで本質を見つける |
| 計画する | `/plan-ceo-review` | CEO — 4つのスコープモードで戦略レビュー |
| | `/plan-eng-review` | エンジニアリングMgr — アーキテクチャ図・テスト計画 |
| | `/plan-design-review` | シニアデザイナー — 7次元0-10評価 |
| | `/plan-devex-review` | DXリード — TTHW計測・8次元評価 |
| | `/autoplan` | オーケストレーター — 全レビュー一括実行 |
| 作る | `/tdd` | TDDコーチ — RED→GREEN→REFACTOR サイクル |
| | `/design-html` | デザインエンジニア — 本番品質HTML変換 |
| | `/build-fix` | ビルドエンジニア — エラー自動修復 |
| | `/clean` | コード清掃 — AI生成コードのスロップ除去 |
| | `/loop` | タスクランナー — プラン自動ループ実行 |
| | `/investigate` | デバッガー — Iron Law: 調査なし修正禁止 |
| レビューする | `/review` | スタッフエンジニア — 専門家サブエージェント |
| | `/design-review` | デザイナー兼エンジニア — UI実装修正 |
| | `/devex-review` | DXテスター — 実地検証 |
| テストする | `/qa` | QAリード — 修正→テスト→検証ループ |
| | `/qa-only` | QAレポーター — レポートのみ |
| | `/cso` | CISO — OWASP + STRIDE監査 |
| | `/benchmark` | パフォーマンスエンジニア — 計測・比較 |
| 出荷する | `/ship` | リリースエンジニア — テスト→PR作成 |
| | `/land-and-deploy` | SRE — マージ→デプロイ→検証 |
| | `/canary` | SRE — デプロイ後監視 |
| 振り返る | `/retro` | エンジニアリングMgr — 週次振り返り |
| | `/document-release` | テクニカルライター — ドキュメント更新 |
| | `/learn` | メモリマネージャー — 学習記録管理 + セッション振り返り |

### パワーツール

プロセス外で任意のタイミングで使えるスキル。

| カテゴリ | スキル | 用途 |
|---------|--------|------|
| マルチモデル | `/multi-plan` | 複数モデルで並列設計分析→統合プラン |
| | `/multi-execute` | プランに基づく自動実行 |
| | `/second-opinion` | クロスモデル信頼度マトリクス |
| デザイン探索 | `/design-consultation` | デザインシステム構築 |
| | `/design-shotgun` | 4-6個のデザイン案生成・比較 |
| ブラウザ | `/browse` | ヘッドレスChromium QAテスト |
| | `/open-browser` | 可視ブラウザ起動 |
| | `/setup-browser-cookies` | Cookie インポート |
| | `/pair-agent` | マルチエージェント ブラウザ共有 |
| 安全 | `/careful` | 破壊的コマンド警告 |
| | `/freeze` | 編集ロック（指定ディレクトリのみ許可） |
| | `/guard` | careful + freeze 統合 |
| | `/unfreeze` | ロック解除 |
| その他 | `/setup-deploy` | デプロイ環境設定 |
| | `/upgrade` | 自己アップデート |

## ブラウザ

`/browse` はAIにブラウザを与える。Playwright ベースのヘッドレス Chromium で
リアルなクリック、スクリーンショット、フォーム入力が可能。

```
あなた: /browse
        https://staging.myapp.com をテストして

Copilot: $B goto https://staging.myapp.com
         $B snapshot -i                  # インタラクティブ要素一覧
         $B text                         # ページコンテンツ確認
         $B console                      # JSエラーチェック
         $B screenshot /tmp/staging.png  # スクリーンショット

         ページは正常に読み込まれました。コンソールエラーなし。
         3つのフォームフィールドと2つのCTAボタンを確認。
```

### 主要機能

- **スナップショット**: `snapshot -i` でインタラクティブ要素に `@ref` 割り当て → `click @e3` で操作
- **差分検出**: `snapshot -D` で前回との変化を unified diff 表示
- **レスポンシブ**: `responsive` でmobile/tablet/desktop 同時撮影
- **パフォーマンス**: `perf` でDNS/TTFB/FCP/Load計測
- **headed モード**: `connect` で可視Chrome、手動ログインやデモに
- **50+コマンド**: ナビゲーション、読み取り、操作、検査、ビジュアル、タブ管理

技術詳細は [BROWSER.md](BROWSER.md) を参照。

## 3つの原則

1. **湖を沸かせ（Boil the Lake）** — 完遂できるタスクは完全にやり切る。AIの時代、完全性のコストは安い
2. **作る前に探せ（Search Before Building）** — 枯れた技術→新しい技術→第一原理の3層で調査
3. **ユーザー主権（User Sovereignty）** — AIは推奨する。決めるのはユーザー

詳細は [ETHOS.md](ETHOS.md) を参照。

## ルール体系

スキルは呼び出し時のみ発動するが、**ルールは常時適用**される。

```
.github/rules/
  common/               # 言語非依存（常に適用）
    coding-style.md     # 命名、不変性、ファイル構成
    git-workflow.md     # コミット形式、ブランチ戦略
    testing.md          # カバレッジ基準、テスト構造
    security.md         # 入力検証、シークレット管理
  typescript/           # TS/JS ファイルに適用
    coding-style.md     # 型安全性、React規約
    testing.md          # Vitest/Jest、Testing Library
  python/               # Python ファイルに適用
    coding-style.md     # 型ヒント、構造、フォーマット
    testing.md          # pytest、フィクスチャ
```

詳細は [rules/README.md](.github/rules/README.md) を参照。

## サブエージェント

`/review` 等のスキルは、専門家サブエージェントに処理を委譲する：

| エージェント | ツール | 役割 |
|------------|--------|------|
| `reviewer` | read, search, edit | コードレビュー・修正 |
| `adversarial` | read, search | 敵対的レビュー（read-only） |
| `security` | read, search, execute | セキュリティ監査 |
| `testing` | read, search, execute | テスト戦略・実装 |
| `design-critic` | read, search | デザイン批評（read-only） |
| `dx-tester` | read, search, execute, web | DX実地テスト |
| `architect` | read, search | アーキテクチャレビュー（read-only） |

## gstackとの違い

| 観点 | gstack | gstack-copilot-jp |
|------|--------|------------------|
| ターゲット | Claude Code | GitHub Copilot (VS Code) |
| 言語 | 英語 | 日本語 |
| インストール | シンボリックリンク + スクリプト | ワークスペースにフォルダ追加のみ |
| ブラウザ | Bun コンパイル済みバイナリ (~58MB) | Node.js + Playwright（コンパイル不要） |
| ホスト | 8エージェント対応 | Copilot単一 |
| セカンドオピニオン | Codex CLI依存 | model fallbackで汎用化 |
| テンプレート | .tmpl + gen-skill-docs | 直接SKILL.md |

## アンインストール

VS Codeのワークスペースから `gstack-copilot-jp` フォルダを削除するだけ。

## ライセンス

MIT

## クレジット

- 原作: [gstack](https://github.com/garrytan/gstack) by [Garry Tan](https://x.com/garrytan)
- 本プロジェクトはgstackの思想とプロセスを参考に、日本語GitHub Copilot向けに一から再実装したものです
