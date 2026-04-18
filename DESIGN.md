# gstack-copilot-jp — デザインドキュメント

## 概要

[gstack](https://github.com/garrytan/gstack)（Garry Tan作）の思想とプロセスを、**GitHub Copilot（VS Code）向けに日本語で一から再設計したAIソフトウェアファクトリー**。

gstackのコードではなく概念を移植し、Copilotのマルチモデル対応と日本語ネイティブという独自の優位性を活かした「GitHub Copilot唯一の本格エージェントハーネス最適化システム」。

## 現在の状態

**VERSION: 0.10.0**（v0.5〜v0.10のロードマップ全項目実装済み）

| カテゴリ | 数量 | 内容 |
|---------|------|------|
| スキル | 42 | スプリント全フェーズ + パワーツール |
| エージェント | 7 | architect, design-critic, adversarial, dx-tester, reviewer, security, testing |
| ルール | 9 | common/5 + typescript/2 + python/2 |
| 命令 | 6 | ask-format, completeness, context-management, ethos, sovereignty, voice |
| プロンプト | 2 | setup, status |
| ブラウザ | 1 | Playwright ベースの QA ブラウザツール |

### スプリントプロセス

```
考える → 計画する → 作る → レビューする → テストする → 出荷する → 振り返る
```

各スキルは前のスキルの成果物を読み、次のスキルが使える成果物を残す。

| フェーズ | スキル |
|---------|--------|
| 考える | `/office-hours` |
| 計画する | `/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review`, `/plan-devex-review`, `/autoplan` |
| 作る | `/tdd`, `/design-html`, `/build-fix`, `/clean`, `/loop`, `/investigate`, `/go` |
| レビューする | `/review`, `/design-review`, `/devex-review` |
| テストする | `/qa`, `/qa-only`, `/cso`, `/benchmark` |
| 出荷する | `/ship`, `/land-and-deploy`, `/canary` |
| 振り返る | `/retro`, `/document-release`, `/learn` |

パワーツール: `/multi-plan`, `/multi-execute`, `/second-opinion`, `/design-consultation`, `/design-shotgun`, `/browse`, `/open-browser`, `/pair-agent`, `/setup-browser-cookies`, `/setup-deploy`, `/careful`, `/freeze`, `/guard`, `/unfreeze`, `/checkpoint`, `/upgrade`

## v0.5〜v0.10 で実装した機能

### v0.5: ECC概念統合

gstack（旧: everything-claude-code）の戦場で磨かれたパターンから、最もインパクトの高い概念を選別してCopilot環境に再設計。

| 機能 | スキル/ファイル | 概要 |
|------|----------------|------|
| TDDワークフロー | `/tdd` | RED→GREEN→REFACTOR の厳格なサイクル。80%+カバレッジ必須 |
| ビルドエラー自動修復 | `/build-fix` | ビルドシステム自動検出→エラー解析→依存順でインクリメンタル修正 |
| ルール体系 | `.github/rules/` | 常時適用のガイドライン。common + typescript + python |
| 自動学習ループ | `/learn` 強化 | セッション振り返り型のパターン自動抽出。信頼度スコア付き |
| De-Sloppify | `/clean` | AI生成コードのスロップ除去（console.log、未使用import、any型等） |

### v0.6: マルチモデル活用

GitHub Copilotのマルチモデル対応を活かした独自優位性。

| 機能 | スキル | 概要 |
|------|-------|------|
| マルチモデルルーティング | `/multi-plan` | 複数モデルによる並列設計分析→統合プラン生成 |
| 並列実行 | `/multi-execute` | プランに基づく最適モデルでの順次実行 |
| クロスモデルレビュー | `/second-opinion` | 異なるモデルで独立レビュー→信頼度マトリクス |

モデルルーティング設定: `.gstack/model-routing.yaml`

### v0.7: セッション管理 & コンテキスト最適化

| 機能 | ファイル/スキル | 概要 |
|------|----------------|------|
| セッション管理 | `context-management.instructions.md` | タスク境界でのコンテキスト整理 |
| 戦略的コンパクション | instructions | フェーズ間でのコンテキスト圧縮 |
| 自律ループ | `/loop` | プランファイルの自動ループ実行 |

### v0.8: 安定化 & インストール体験改善

- ワークスペースフォルダ追加方式への移行（setup.ps1/sh 廃止）
- `git clone` + VS Code ワークスペース追加のみで動作
- シンボリックリンク・管理者権限・スクリプト再実行の問題が全て消滅
- スキル間の一貫性向上、テンプレート統一
- browseサブシステムの品質ゲートテスト

### v0.9: スプリントオーケストレーター

| 機能 | スキル | 概要 |
|------|-------|------|
| `/go` | フルスプリント | 計画判定→tdd→review→ship→retro 自動連鎖。タスク規模で計画要否を自動判定。味覚判断のみ停止、6つの意思決定原則で自動進行 |

### v0.10: セッション回復 & 品質安全弁

| 機能 | スキル/ファイル | 概要 |
|------|----------------|------|
| セッション回復 | `/checkpoint` | Copilot `/memories/` ベース。save/resume/list + セッション開始時の自動回復 |
| Confusion Protocol | `rules/common/confusion-protocol.md` | 高リスク曖昧さでSTOP→選択肢提示。全スキルに常時適用 |

## v1.0.0 仕様

本家gstackがv1.0.0に到達した。gstack-copilot-jpも v1.0.0 として公開準備を完了する。

### v1.0.0 の定義

v1.0.0 = **公開品質**。以下を全て満たした状態:

1. **42スキルが安定動作** — 自分自身の日常開発で検証済み
2. **ドキュメントが完全** — README、getting-started、ETHOS、BROWSER.md が最新
3. **インストールが30秒** — `git clone` + ワークスペース追加のみ
4. **名前とアイデンティティ** — 公開に適したブランディング

### タスク

| # | タスク | 内容 | 工数（人間/AI） |
|---|--------|------|----------------|
| 1 | デザインドキュメント統合 | DESIGN-v2, v3 を DESIGN.md に統合 | 30分 / 15分 |
| 2 | リブランディング検討 | 名前・README・ロゴ・アイデンティティ | 1日 / 30分 |
| 3 | コミュニティ準備 | CONTRIBUTING.md、Issue テンプレート | 1日 / 30分 |
| 4 | ドキュメント最終整備 | README、getting-started の公開向け調整 | 半日 / 20分 |
| 5 | 公開 | GitHub public化、告知 | 半日 |

### 本家gstack v1.0.0 との差異

gstack-copilot-jp は gstack の「移植」ではなく「再設計」。以下が本家との構造的差異:

| 側面 | gstack (本家) | gstack-copilot-jp |
|------|--------------|-------------------|
| 対象ホスト | Claude Code + Codex + Gemini CLI + Cursor + 6その他 | GitHub Copilot (VS Code) 専用 |
| 言語 | 英語 | 日本語ネイティブ |
| インストール | `./setup` スクリプト + シンボリックリンク | ワークスペースフォルダ追加のみ |
| スキル生成 | テンプレート + リゾルバーパイプライン（TypeScript） | 手書きSKILL.md（Markdown直接編集） |
| ブラウザ | Bun + Node.js デュアルランタイム | Playwright + Node.js |
| テスト | 3層E2E（Agent SDK + LLM Judge）| Vitest 単体テスト |
| テレメトリ | Supabase opt-in | なし |
| hookシステム | PreToolUse/PostToolUse | instructions + スキル内ロジック |
| マルチモデル | Codex CLI 連携（外部プロセス） | Copilotネイティブモデル切替 |
| チームモード | SessionStart hook + auto-update | ワークスペース共有（Git経由） |

### 不採用とした本家の概念

| 概念 | 不採用理由 |
|------|-----------|
| SKILL.md Template System | Copilotにビルドステップがない。手書きSKILL.mdで十分 |
| Question Tuning (`/plan-tune`) | preference保存機構がCopilotにない |
| Session Timeline JSONL | `/checkpoint` のMarkdownで十分 |
| Health Check (`/health`) | v1.0の必須ではない |
| Telemetry / Analytics | プライバシー優先。ローカルのみ |
| Builder Profile / Archetypes | Copilotにセッション間の状態永続化がない |
| Declarative Host Config | 単一ホスト（VS Code）なので不要 |
| slop-scan | ESLint + `/clean` スキルで代替 |
| OpenClaw / ClawHub | Claude Code エコシステム固有 |

## アーキテクチャ

### ファイル構成

```
gstack-copilot-jp/
├── .github/
│   ├── copilot-instructions.md    # エントリーポイント。スキルルーティングテーブル
│   ├── skills/                    # 42スキル（各 SKILL.md）
│   │   ├── go/SKILL.md
│   │   ├── autoplan/SKILL.md
│   │   ├── tdd/SKILL.md
│   │   └── ...
│   ├── agents/                    # 7エージェント（サブエージェントdispatch用）
│   │   ├── architect.agent.md
│   │   ├── reviewer.agent.md
│   │   └── ...
│   ├── rules/                     # 常時適用ルール
│   │   ├── common/                # 言語非依存
│   │   ├── typescript/            # TS/JS固有
│   │   └── python/                # Python固有
│   ├── instructions/              # 常時ロード命令
│   │   ├── voice.instructions.md
│   │   ├── ethos.instructions.md
│   │   └── ...
│   └── prompts/                   # ユーザー呼び出しプロンプト
│       ├── setup.prompt.md
│       └── status.prompt.md
├── .gstack/
│   ├── model-routing.yaml         # マルチモデルルーティング設定
│   └── plans/                     # プランファイル保存先
├── browse/                        # ヘッドレスブラウザサブシステム
│   ├── src/
│   │   ├── cli.js
│   │   ├── server.js
│   │   ├── browser-manager.js
│   │   └── commands.js
│   └── test/
├── bin/                           # ブラウザラッパースクリプト
├── docs/
│   └── getting-started.md
├── templates/                     # レビューレポート等のテンプレート
├── BROWSER.md                     # ブラウザ技術仕様
├── DESIGN.md                      # このファイル
├── ETHOS.md                       # ビルダーの哲学（3原則）
├── README.md                      # プロジェクト概要
└── VERSION
```

### 適用メカニズム

VS Code v1.116+ で自動認識:
- `.github/copilot-instructions.md` → ワークスペース内ならCopilotが自動読み込み
- `.github/skills/*/SKILL.md` → スキルとして自動登録
- `.github/agents/*.agent.md` → エージェントとして自動登録
- `.github/instructions/*.instructions.md` → 常時ロード
- `.github/prompts/*.prompt.md` → プロンプトとして登録

セットアップスクリプト不要。`git clone` + ワークスペース追加で全機能が動作。

### 優先順位体系

```
ユーザー主権 > instructions > rules > skills
```

## Copilot固有の制約と対応

| 制約 | gstackでの解決策 | gstack-copilot-jpでの対応 |
|------|-----------------|--------------------------|
| hookシステムなし | PreToolUse/PostToolUse hook | instructions + スキル内ロジック |
| プラグインシステムなし | `.claude-plugin/plugin.json` | `.github/skills/` + `.github/copilot-instructions.md` |
| バックグラウンドエージェントなし | 背景Haiku観察者 | セッション振り返り型（`/learn`） |
| ネイティブ並列エージェントなし | `/multi-execute` | 直列自動実行 → 将来の並列対応待ち |
| ルール自動ロード | `~/.claude/rules/` | `instructions` に統合参照 |
| セッション間状態 | `~/.gstack/` JSONL | Copilot `/memories/` システム |

## ターゲットユーザー

- **一次ユーザー**: 自分自身 — 会社ポリシーでGitHub Copilotのみ使用可能な開発者
- **二次ユーザー（v1.0公開後）**: 日本の開発者 — GitHub Copilotで高い生産性を求める人

## 成功指標

| 指標 | v0.10（現在） | v1.0目標 |
|------|-------------|---------|
| スキル数 | 42 | 42+ |
| ルール数 | 9 | 9+ |
| インストール | ワークスペース追加のみ | ワークスペース追加のみ |
| ドキュメント | 基本的 | 公開品質 |
| 公開状態 | 非公開 | 公開 |
| browseテスト | 5ファイル | 5+ |

## スコープ外

- ECCのhookシステムの再現 — Copilotにhook APIがない
- 183スキル全移植 — 質で勝負。需要が出てから追加
- 有料化 — OSSとして公開
- Cursor / Codex / OpenCode対応 — GitHub Copilot専用に集中
- テレメトリ — プライバシー優先
- Builder Profile / Question Tuning — Copilotにセッション状態永続化がない

## 設計原則

ETHOS.md の3原則に従う:

1. **湖を沸かせ（Boil the Lake）** — 完全版を作れ。70行の差分はAIなら秒で終わる
2. **作る前に探せ（Search Before Building）** — 枯れた技術 → 新しく人気のもの → 第一原理
3. **ユーザー主権（User Sovereignty）** — AIは推奨する。決めるのはユーザー
