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
- Linux / macOS / WSL (Ubuntu)
- Bun v1.0+（browse 機能を使う場合のみ）

## クイックスタート

gstack-copilot-jp は **VS Code 公式の Agent Plugin 仕様**に準拠しており、`.github/skills/` `.github/agents/` `plugin.json` を提供する。インストール方法は3つ。

### 1. インストール

#### 方式 A: VS Code Plugin From Source（最推奨・全リポで再利用）

1 回入れるだけで **どのワークスペースを開いても全スキルが `/` メニューに出る**。

1. VS Code でコマンドパレット (`Ctrl+Shift+P`) を開く
2. `Chat: Install Plugin From Source` を実行
3. URL に貼る: `https://github.com/akiyoshi/gstack-copilot-jp`
4. インストール完了後、Copilot Chat で `/office-hours` を確認

更新は `Extensions: Check for Extension Updates` または 24h ごとの自動チェック。

> 詳しい使い方とトラブルシューティングは [INSTALL.md](INSTALL.md) と [docs/vscode-setup.md](docs/vscode-setup.md) を参照。

#### 方式 B: ローカルクローン + `chat.pluginLocations`（カスタマイズ派向け）

スキルを編集しながら使いたい場合に。

```bash
git clone https://github.com/akiyoshi/gstack-copilot-jp.git ~/.gstack-copilot-jp
```

各 VS Code ワークスペース、または **ユーザー設定 (`Ctrl+,` → `settings.json`)** に追加:

```json
{
  "chat.pluginLocations": {
    "~/.gstack-copilot-jp": true
  }
}
```

#### 方式 C: Copilot CLI（ターミナル派向け）

```bash
git clone https://github.com/akiyoshi/gstack-copilot-jp.git
cd gstack-copilot-jp && ./setup --mode user-link
```

`--mode user-link` で `~/.copilot/skills/gstack-copilot-jp` にシンボリックリンクを張る。CLI と VS Code Chat の両方で使える。

#### Tips: 親リポからの自動発見（monorepo / multi-folder workspace）

別リポを VS Code で開いたとき gstack のスキルを認識させたい場合:

```jsonc
// .vscode/settings.json または ユーザー settings.json
{
  "chat.useCustomizationsInParentRepositories": true
}
```

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

- 方式 A: VS Code の `Extensions: Check for Extension Updates` を実行（24h 自動更新）
- 方式 B / C: `cd ~/.gstack-copilot-jp && git pull`

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

アーキテクチャの詳細は [ARCHITECTURE.md](ARCHITECTURE.md)、設計方針は [DESIGN.md](DESIGN.md) を参照。

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

## アンインストール

- 方式 A（Plugin From Source）: VS Code の Extensions ビュー → `Agent Plugins - Installed` → 右クリック `Uninstall`
- 方式 B（`chat.pluginLocations`）: settings.json からエントリを削除し、`~/.gstack-copilot-jp` を `rm -rf`
- 方式 C（CLI）: `cd gstack-copilot-jp && ./setup --uninstall`

## ライセンス

[MIT](LICENSE)

## クレジット

- 原作: [gstack](https://github.com/garrytan/gstack) by [Garry Tan](https://x.com/garrytan)
- 本プロジェクトはgstackの思想とプロセスを参考に、日本語GitHub Copilot向けに一から再実装したものです
