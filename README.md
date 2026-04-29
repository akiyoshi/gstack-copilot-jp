# gstack-copilot-jp

日本語の GitHub Copilot ユーザーのための、AIソフトウェアファクトリー。

[gstack](https://github.com/garrytan/gstack)（Garry Tan作）の思想とプロセスを、**GitHub Copilot（CLI + VS Code Chat）+ 日本語**で使う最速の方法。

**なぜ gstack 本体ではなくこれを使うのか:**
- **Copilot CLIネイティブ** — Claude Code 不要。GitHub Copilot だけで動く
- **VS Code Chat 統合** — CLI だけでなく VS Code Copilot Chat でも同じスキルが使える
- **日本語ワークフロー** — スキル出力・レビュー・ドキュメントが全て日本語

## 前提条件

- GitHub Copilot（VS Code Copilot Chat 拡張 0.45+ または Copilot CLI）
- Git
- Linux / macOS / WSL (Ubuntu) / Windows 11 (Git Bash) — [Windows 対応](#windows-対応実験的)
- Bun v1.0+（browse 機能を使う場合のみ）
- GitHub CLI (`gh`) — `/ship`, `/landing-report`, `/land-and-deploy` で使用。`gh auth login` 推奨

## クイックスタート

gstack-copilot-jp は **VS Code 公式の Agent Plugin 仕様**に準拠しており、`.github/skills/` `.github/agents/` `plugin.json` を提供する。

### 1. インストール（最速）

VS Code でコマンドパレット (`Ctrl+Shift+P`) → `Chat: Install Plugin From Source` → URL に `https://github.com/akiyoshi/gstack-copilot-jp` を貼る。

これで **どのワークスペースを開いても全スキルが `/` メニューに出る**。

> **その他のインストール方式（編集しながら使う・Copilot CLI 中心など）と詳細なトラブルシューティングは [INSTALL.md](INSTALL.md) を参照。**
> VS Code 固有の機能差分・hook 設定は [docs/vscode-setup.md](docs/vscode-setup.md) を参照。

### 2. 使い始める

> **初めての方は [docs/getting-started.md](docs/getting-started.md) へ。** 最初に試すべき3つのスキルとトラブルシューティングをまとめている。

Copilot CLI でスキルを呼び出す:

```
あなた: /office-hours
        カレンダーのブリーフィングアプリを作りたい

Copilot: [痛みを聞く → 前提を挑戦 → 3つのアプローチを工数付きで提示]

あなた: /gstack-review
Copilot: [diff分析 → 専門家サブエージェント並列dispatch → 自動修正 → レポート]
```

### 3. 更新

- VS Code Plugin: `Extensions: Check for Extension Updates`（24h 自動更新）
- ローカルクローン: `cd ~/.gstack-copilot-jp && git pull`

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
| 作る | `/design-html` | デザインエンジニア — 本番品質HTML変換 |
| | `/investigate` | デバッガー — Iron Law: 調査なし修正禁止 |
| レビューする | `/gstack-review` | スタッフエンジニア — 専門家サブエージェント |
| | `/design-review` | デザイナー兼エンジニア — UI実装修正 |
| | `/devex-review` | DXテスター — 実地検証 |
| テストする | `/qa` | QAリード — 修正→テスト→検証ループ |
| | `/qa-only` | QAレポーター — レポートのみ |
| | `/cso` | CISO — OWASP + STRIDE監査 |
| | `/benchmark` | パフォーマンスエンジニア — 計測・比較 |
| | `/health` | コード品質ダッシュボード — 4軸0-10スコア |
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
| マルチモデル | `/benchmark-models` | 複数モデルで同一プロンプト実行・比較 |
| デザイン探索 | `/design-consultation` | デザインシステム構築 |
| | `/design-shotgun` | 4-6個のデザイン案生成・比較 |
| ブラウザ | `/browse` | ヘッドレスChromium QAテスト |
| | `/open-gstack-browser` | 可視ブラウザ起動 |
| | `/setup-browser-cookies` | Cookie インポート |
| | `/pair-agent` | マルチエージェント ブラウザ共有 |
| ドキュメント | `/make-pdf` | Markdown → 出版品質PDF変換 |
| | `/context-save` | セッション保存（チェックポイント） |
| | `/context-restore` | セッション復帰 |
| 安全 | `/careful` | 破壊的コマンド警告 |
| | `/freeze` | 編集ロック（指定ディレクトリのみ許可） |
| | `/guard` | careful + freeze 統合 |
| | `/unfreeze` | ロック解除 |
| その他 | `/setup-deploy` | デプロイ環境設定 |
| | `/gstack-upgrade` | 自己アップデート |

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
`copilot-instructions.md` の「コーディング規約」セクションに定義:

- **共通**: 命名、不変性、ファイル構成、エラー処理
- **TypeScript**: `any` 禁止、`import type`、`async/await`
- **Python**: 型ヒント、`dataclass`/`pydantic`、裸の `except` 禁止
- **Git**: Conventional Commits、PR差分300行以下
- **セキュリティ**: 入力バリデーション、シークレット管理
- **テスト**: AAAパターン、カバレッジ基準（ビジネスロジック80%+）

詳細は `copilot-instructions.md` を参照。

## サブエージェント

`/gstack-review` 等のスキルは、専門家サブエージェントに処理を委譲する：

| エージェント | 役割 |
|------------|------|
| `architect` | アーキテクチャレビュー |
| `security` | セキュリティ監査 |
| `testing` | テスト戦略・実装 |
| `design-critic` | デザイン批評 |
| `dx-tester` | DX実地テスト |

Copilot CLI ビルトインの `code-review` と `rubber-duck` エージェントも Outside Voice として使用する。

アーキテクチャの全体像は [ARCHITECTURE.md](ARCHITECTURE.md)、設計判断の記録は [DESIGN.md](DESIGN.md)、未実装項目は [ROADMAP.md](ROADMAP.md) を参照。

## gstackとの違い

| 観点 | gstack | gstack-copilot-jp |
|------|--------|------------------|
| ターゲット | Claude Code | GitHub Copilot（VS Code Copilot Chat + CLI） |
| 言語 | 英語 | 日本語 |
| インストール | `./setup` + シンボリックリンク | VS Code Plugin From Source / `chat.pluginLocations` / `./setup` |
| ブラウザ | Bun コンパイル済みバイナリ | Bun コンパイル済み（CLI専用） |
| ホスト | 10エージェント対応 | Copilot CLI + VS Code Chat |
| 外部の目 | Codex CLI | `code-review` + `rubber-duck` + fallback |
| テンプレート | .tmpl + gen-skill-docs | 直接 SKILL.md |

## Windows 対応（実験的）

> **作者検証済み（dogfooding）**。実ユーザーからの issue 報告は歓迎。

| 項目 | サポート状況 |
|---|---|
| **方式 A** (VS Code Plugin From Source) | ✅ Windows 11 で完全動作（hook を除く） |
| **方式 C** (`./setup --mode user-link`) | ⚠️ Git Bash または WSL2 で動作。Developer Mode 推奨 |
| browse 機能 | ⚠️ Bun の Playwright pipe transport bug ([bun#4253](https://github.com/oven-sh/bun/issues/4253)) を Node.js + tsx フォールバックで自動回避 |
| hooks | ❌ Plugin Preview 段階。VS Code Copilot Chat の hook 仕様変動中で v1.2 で再評価 |

### 必要なソフトウェア（Windows）

- **Git for Windows**（Git Bash 同梱）または WSL2 Ubuntu
- **Bun v1.0+** — **必須**: `browse` 機能 + `bin/gstack-next-version`（`/landing-report` の前提）。Node.js 単独では動かない
- **Node.js v18+** — `browse` 機能専用の Bun#4253 回避フォールバック（Playwright pipe transport bug）。`gstack-next-version` には影響しない
- **GitHub CLI (`gh`)** — `/ship` `/landing-report` `/land-and-deploy` で必須。`gh auth login` 推奨

### Windows でのインストール

**推奨: 方式 A（VS Code Plugin From Source）**:

1. VS Code でコマンドパレット (`Ctrl+Shift+P`)
2. `Chat: Install Plugin From Source`
3. URL に `https://github.com/akiyoshi/gstack-copilot-jp` を貼る
4. 任意のワークスペースで `/office-hours` 等が `/` メニューに出れば成功

これでファイルシステム周りの心配（symlink、改行コード等）は全て VS Code 側が処理する。

**方式 C を使う場合（CLI 中心）**:

Git Bash または WSL2 ターミナルから:

```bash
git clone https://github.com/akiyoshi/gstack-copilot-jp.git ~/.gstack-copilot-jp
cd ~/.gstack-copilot-jp
./setup --mode user-link
```

> **Git Bash + Developer Mode**: シンボリックリンク作成のため Windows の開発者モードを ON にしておくこと（設定 → プライバシーとセキュリティ → 開発者向け）。OFF の場合は setup がジャンクション フォールバックで動作するが、対象によっては失敗する。

> **WSL2**: `/proc/version` に `microsoft` を含む環境では `bin/gstack-open-url` が自動的に `powershell.exe Start-Process` 経由で URL を開く（WSL2 にブラウザがない場合の対応）。

詳細は [INSTALL.md](INSTALL.md) を参照。

## アンインストール

各方式のアンインストール手順は [INSTALL.md](INSTALL.md) を参照。

## ドキュメント目次

| ファイル | 内容 |
|---------|------|
| [INSTALL.md](INSTALL.md) | 3 方式のインストール手順・トラブルシューティング |
| [docs/getting-started.md](docs/getting-started.md) | 初学者向けクイックスタート |
| [docs/vscode-setup.md](docs/vscode-setup.md) | VS Code 固有の機能差分・hook 設定 |
| [ARCHITECTURE.md](ARCHITECTURE.md) | システム構成・データフロー |
| [DESIGN.md](DESIGN.md) | 設計判断の記録（なぜ現在の形なのか） |
| [BROWSER.md](BROWSER.md) | `/browse` の技術詳細・コマンドリファレンス |
| [ETHOS.md](ETHOS.md) | 3 つの原則（哲学） |
| [ROADMAP.md](ROADMAP.md) | 未実装項目・将来計画 |
| [CHANGELOG.md](CHANGELOG.md) | リリース履歴 |
| [upstream-tracking.md](upstream-tracking.md) | 本家 gstack との互換性台帳 |
| [docs/archive/](docs/archive/) | 過去の設計探索資料 |

## ライセンス

[MIT](LICENSE)

## クレジット

- 原作: [gstack](https://github.com/garrytan/gstack) by [Garry Tan](https://x.com/garrytan)
- 本プロジェクトはgstackの思想とプロセスを参考に、日本語GitHub Copilot向けに一から再実装したものです
