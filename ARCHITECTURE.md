# ARCHITECTURE.md

gstack-copilot-jp のアーキテクチャと設計判断の記録。

## 構成

```
gstack-copilot-jp/
├── .github/
│   ├── copilot-instructions.md   # スキルルーティング + ボイス + ethos
│   ├── skills/ (38)              # SKILL.md — スキル定義
│   ├── agents/ (5)               # *.agent.md — サブエージェント
│   ├── hooks/lifecycle.json      # sessionStart/End, preToolUse, postToolUse
│   └── copilot/settings.json     # Copilot CLI リポジトリ設定
├── browse/                       # ヘッドレスブラウザ (Bun + Playwright)
│   ├── src/*.ts                  # TypeScript ソース
│   ├── dist/browse               # コンパイル済みバイナリ (gitignore)
│   └── test/                     # Vitest テスト
├── bin/                          # bash ユーティリティ (19スクリプト)
├── test/                         # ルートテスト (Vitest)
├── plugin.json                   # プラグインマニフェスト
├── setup                         # セットアップスクリプト
├── TODO.md                       # ロードマップと未実装項目
├── DESIGN.md                     # 詳細設計ドキュメント
├── ETHOS.md                      # 3つの原則
└── VERSION                       # セマンティックバージョニング
```

## データフロー

```
ユーザー
  │
  ▼
copilot-instructions.md (ルーティング)
  │
  ▼
SKILL.md (スキル実行)
  │
  ├──→ task tool (サブエージェント)
  │      ├── code-review (ビルトイン)
  │      ├── rubber-duck (ビルトイン)
  │      ├── architect.agent.md
  │      ├── security.agent.md
  │      └── testing.agent.md
  │
  ├──→ bin/gstack-* (JSONL書き込み)
  │      └──→ ~/.gstack/projects/{slug}/*.jsonl
  │
  └──→ $B (browse CLI)
         └──→ browse/dist/browse → Bun.serve → Playwright → Chromium
```

## 設計判断

### 1. マルチホスト（Copilot CLI + VS Code Chat）

Copilot CLI と VS Code Copilot Chat (Agent Mode) の両方をサポートする。
`.github/skills/`, `.github/agents/`, `.github/hooks/` は両ホストで共有。
スキルは Tier A（完全互換）/ B（制限付き互換）/ C（CLI専用）に分類。
Claude Code、Cursor、Gemini CLI は対象外。

### 2. 本家 gstack 追随

独自発明を最小化し、本家の方法論・スキル判定基準を追随する。
差分は `upstream-tracking.md` で管理。`bin/upstream-diff.sh` で検出。

### 3. SKILL.md 形式の互換性

本家と同一のフロントマター形式。ツール名のみ変換（Bash→bash, Agent→task 等）。
これにより `bin/adapt-upstream-skill.sh` で軽量変換が可能。

### 4. browse: Bun コンパイル

本家と同一アーキテクチャ。`bun build --compile` で単一バイナリを生成。
CLI → HTTP → Bun.serve → Playwright → Chromium の4層。
`$B` エイリアスで呼び出し。コンパイル済みバイナリ → browse.sh の順で解決。

### 5. ~/.gstack/ の共有

本家と同一ディレクトリ構造。Claude Code と Copilot CLI の併用時にデータ共有。
Copilot 固有の state は `hosts/copilot-cli/` に分離。

### 6. Outside Voice

`/review` と `/ship` に独立レビュー経路を持つ。
優先: code-review ビルトイン → rubber-duck ビルトイン → task + 汎用プロンプト。
