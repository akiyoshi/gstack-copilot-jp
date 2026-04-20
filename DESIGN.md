# gstack-copilot-jp — デザインドキュメント

## 概要

[gstack](https://github.com/garrytan/gstack)（Garry Tan作）のスキル・方法論を、**GitHub Copilot CLI + 日本語で提供する適応レイヤー**。

本家gstackの進化速度（v0.0.1→v1.1.3 を39日で到達、1000+ PR、48コントリビューター）に個人で独自開発として追随するのは不可能。v1.0.0までは「再設計」として独自実装してきたが、v2.0からは**本家gstackを上流として追跡し、Copilot CLI向けに適応する**方針に転換する。

### GitHub Copilot CLI は主要プリミティブを持つ

調査の結果、**GitHub Copilot CLI は Claude Code とほぼ同等のエージェント基盤**を持つことが判明した（2026年4月時点）。ホストターゲットを Copilot CLI に一本化する。

以後の表記は次の4段階で揃える。

- **同一** — 形式と運用がほぼそのまま通る
- **互換** — 同じ役割を果たすが、実装差がある
- **適応** — 役割は満たすが、設計変換または運用補助が必要
- **Copilot独自** — 上流にはないが利用価値がある

| 機能 | Claude Code | Copilot CLI | 状態 |
|------|------------|-------------|------|
| スキルシステム | `SKILL.md` | `.github/skills/*/SKILL.md` (同一形式) | 同一 |
| カスタムエージェント | `.claude/agents/` | `.github/agents/` (同一形式) | 同一 |
| hookシステム | `PreToolUse/PostToolUse` | `.github/hooks/*.json` (同一イベント) | 互換 |
| セッション永続化 | `~/.gstack/` JSONL | `store_memory` tool + `/resume` | 適応 |
| プログラマティック実行 | `claude -p` | `copilot -p` | 同一 |
| 自律実行 | 対話型 | `--autopilot` / `--mode autopilot` | 互換 |
| サブエージェント | `Agent` tool | `task` tool + `/fleet` (並列) | 適応 |
| MCP servers | 外部設定 | ビルトイン (Playwright, GitHub, fetch) | 互換 |
| カスタム指示 | `CLAUDE.md` | `.github/copilot-instructions.md` | 同一 |
| 構成ファイル | `~/.claude/` | `~/.copilot/` + `.github/copilot/` | 互換 |
| モデル選択 | 固定 + Codex連携 | `/model` (マルチモデルネイティブ) | 適応 |
| ACP (Agent Client Protocol) | ― | `--acp` (オープン標準) | Copilot独自 |
| ビルトインエージェント | ― | `code-review`, `explore`, `research`, `task` | Copilot独自 |
| VS Code 連携 | ― | `/ide` コマンド | Copilot独自 |

### ポジショニング

```
gstack（本家）= 方法論 + 10ホスト対応のスキル生成パイプライン（Claude Code中心）
gstack-copilot-jp = gstackの方法論を GitHub Copilot CLI + 日本語 で使う最速の方法
```

独自の価値:
- **日本語ネイティブ** — スキル出力・ドキュメント・ボイスが全て日本語
- **Copilot CLI 専用** — Claude Code 相当の全機能（hook、セッション永続化、自律実行）を活用
- **Linux 統一** — macOS / Linux ネイティブ、Windows は WSL (Ubuntu)

## アーキテクチャ

### 設計原則

1. **上流追跡** — gstackの新スキル・方法論の改善を定期的に取り込む
2. **適応、再発明しない** — 本家のスキル内容を理解し、Copilot CLIの仕組みに適応する
3. **差分最小化** — Copilot CLI固有の差異への対応のみを独自実装する
4. **日本語は翻訳ではなく適応** — 直訳ではなく、日本語話者にとって自然な表現に再構成する
5. **Linux前提** — bash スクリプト、POSIX パスを前提。PowerShell対応は不要

### ファイル構成

```
gstack-copilot-jp/
├── .github/
│   ├── copilot-instructions.md    # エントリーポイント（スキルルーティング + プリアンブル）
│   ├── copilot/
│   │   └── settings.json         # Copilot CLI リポジトリ設定
│   ├── skills/                    # スキル（SKILL.md — 本家と同一形式）
│   │   ├── go/SKILL.md
│   │   ├── autoplan/SKILL.md
│   │   └── ...
│   ├── agents/                    # カスタムエージェント（本家と同一形式）
│   │   ├── architect.agent.md
│   │   ├── security.agent.md
│   │   └── ...
│   └── hooks/                     # ライフサイクルフック（本家と同一イベント）
│       ├── session-start.json
│       └── pre-tool-use.json
├── .gstack/
│   ├── model-routing.yaml
│   └── plans/
├── browse/                        # ヘッドレスブラウザ（Bun — 本家と同一アーキテクチャ）
│   ├── src/
│   │   ├── cli.ts
│   │   ├── server.ts
│   │   ├── browser-manager.ts
│   │   └── commands.ts
│   ├── dist/                      # コンパイル済みバイナリ（gitignore）
│   └── test/
├── bin/                           # ユーティリティスクリプト（bash）
├── setup                          # セットアップスクリプト（bash）
├── docs/
│   └── getting-started.md
├── templates/
├── upstream-tracking.md
├── ARCHITECTURE.md               # 設計判断の記録（本家と同一ファイル名）
├── BROWSER.md
├── DESIGN.md
├── ETHOS.md
├── README.md
├── SKILL.md                       # ルートスキル（メタ: /status, /skills 一覧）
└── VERSION
```

### 適応マッピング

gstack は Claude Code 向けに書かれている。Copilot CLI への変換は最小差分で済む:

| gstack (Claude Code) | gstack-copilot-jp (Copilot CLI) |
|---|---|
| `SKILL.md` | `.github/skills/*/SKILL.md` — **同一形式** |
| `allowed-tools: Bash, Read, Write` | SKILL.md フロントマターで同一指定 |
| `AskUserQuestion` | `ask_user` tool |
| `Agent` tool (subagent) | `task` tool / `/fleet` (並列) |
| `Bash` tool | `bash` tool |
| `Read` / `Write` tool | `view` / `edit` / `create` tool |
| `PreToolUse` / `PostToolUse` hook | `.github/hooks/*.json` — **完全互換** |
| `SessionStart` hook | `.github/hooks/session-start.json` |
| `CLAUDE.md` | `.github/copilot-instructions.md` |
| `~/.claude/` | `~/.copilot/` |
| `~/.gstack/` 状態 | `store_memory` + `~/.copilot/` + `.gstack/` |
| `claude -p` (E2Eテスト) | `copilot -p` |
| `conductor.json` (並列セッション) | `/fleet` (並列サブエージェント) |
| Codex CLI 連携 | Copilot `/model` ネイティブ切替 |

### hookシステム

Copilot CLI は gstack と互換の hookイベントをサポートする。`.github/hooks/*.json` に配置:

```json
{
  "version": 1,
  "hooks": {
    "sessionStart": [{
      "type": "prompt",
      "prompt": "/status"
    }],
    "preToolUse": [{
      "type": "command",
      "bash": "bin/pre-tool-guard.sh"
    }]
  }
}
```

利用可能なイベント:
- `sessionStart` — セッション開始時。自動更新チェック、状態回復
- `sessionEnd` — セッション終了時。学習記録の保存
- `preToolUse` — ツール実行前。`/careful`, `/freeze` のガード実装
- `postToolUse` — ツール実行後。成果物記録
- `agentStop` — エージェント完了時。後処理フック

### インストール

**推奨: プラグインインストール（複数端末で共有可能）**

```bash
copilot plugin install github:username/gstack-copilot-jp
```

これだけで skills + agents + hooks + browse がすべてのセッションで有効になる。更新も一発:

```bash
/plugin update gstack-copilot-jp
```

**開発/フォールバック: setup スクリプト**

```bash
git clone https://github.com/.../gstack-copilot-jp.git
cd gstack-copilot-jp && ./setup
```

`setup` スクリプトの処理:
1. **既定は project-local モード** — 依存確認、browse のビルド、環境スニペット生成。`~/.copilot/` は変更しない
2. **互換モード (`--mode user-link`)** — `~/.copilot/skills/gstack-copilot-jp` にシンボリックリンクを作成し、インストール manifest を `~/.gstack/hosts/copilot-cli/installations/gstack-copilot-jp.json` に記録
3. **ロールバック (`--uninstall`)** — manifest を読んで作成物だけを削除
4. Playwright ブラウザのインストール確認
5. Bun が未インストールなら案内表示

setup は **plugin システムが使えない場合のフォールバック**、および開発者向けのローカルビルド手段として維持する。

### ブラウザサブシステム

本家gstackと同一アーキテクチャ。Bun でコンパイルした単一バイナリがデーモンとして動作し、HTTP API 経由でコマンドを受け付ける。

```
Copilot CLI                     gstack-copilot-jp
───────────                    ──────────────────
                               ┌──────────────────────┐
  Tool call: $B snapshot -i    │  CLI (Bun compiled)   │
  ─────────────────────────→   │  • reads state file   │
                               │  • POST /command      │
                               └──────────┬───────────┘
                                          │ HTTP
                               ┌──────────▼───────────┐
                               │  Server (Bun.serve)   │
                               │  • dispatches command  │
                               │  • talks to Chromium   │
                               └──────────┬───────────┘
                                          │ CDP
                               ┌──────────▼───────────┐
                               │  Chromium (headless)   │
                               │  • persistent tabs     │
                               │  • cookies carry over  │
                               └───────────────────────┘
```

**Bun を採用する理由（本家と同一）:**
- コンパイル済みバイナリ（`bun build --compile`）— `node_modules` 不要
- ネイティブ SQLite — Cookie デクリプション用
- ネイティブ TypeScript — ビルドステップなし
- 組み込み HTTP サーバー — フレームワーク不要

**Copilot CLI ビルトイン Playwright MCP との使い分け:**
- Copilot CLI はビルトイン Playwright MCP サーバーを持つ（基本的なブラウザ操作）
- gstack browse はそれより高機能（refシステム、差分検出、レスポンシブテスト、Cookie インポート等）
- 軽量なブラウジングはビルトインMCP、QAテストは gstack browse と使い分け

### プラットフォーム

| 環境 | Copilot CLI | browse | hook スクリプト |
|------|-------------|--------|----------------|
| **macOS** | ✅ ネイティブ | ✅ Bun コンパイル | bash |
| **Linux** | ✅ ネイティブ | ✅ Bun コンパイル | bash |
| **Windows (WSL/Ubuntu)** | ✅ ネイティブ | ✅ Bun コンパイル | bash |

Windows ユーザーは WSL (Ubuntu) を使用する。PowerShell ネイティブ対応は行わない。

**前提条件:**
- Copilot CLI (`copilot` コマンド)
- Bun v1.0+
- Git
- Node.js（Playwright 実行用）

### 取り込み対象・非対象

#### 取り込む

| カテゴリ | 内容 | 備考 |
|---------|------|------|
| スプリントプロセス | Think → Plan → Build → Review → Test → Ship → Reflect | 同一 |
| スキル方法論 | 各スキルの判定基準、チェックリスト、ワークフロー | 同一 |
| ETHOS | Boil the Lake, Search Before Building, User Sovereignty | 同一 |
| hookシステム | `preToolUse` / `postToolUse` / `sessionStart` | Copilot CLI で実現 |
| セッション永続化 | `store_memory` tool + `/resume` | Copilot CLI で実現 |
| プログラマティックE2E | `copilot -p` でスキルテスト | Copilot CLI で実現 |
| 並列サブエージェント | `/fleet` コマンド | Copilot CLI で実現 |
| ブラウザ（Bun実装） | refシステム、差分検出、Cookieインポート等 | 本家と同一 |
| setupスクリプト | project-local / user-link / uninstall + Bun ビルド | bash のみ |
| Confusion Protocol | 高リスク曖昧さでの停止・質問 | 同一 |
| `~/.gstack/` 状態ディレクトリ | learnings, plans, projects, analytics | **本家と同一 root を共有。host 固有 state は分離** |
| Co-authored-by トレイラー | git commit への共同著者記録 | Copilot CLI `includeCoAuthoredBy` 設定 |

#### 取り込まない

| カテゴリ | 理由 |
|---------|------|
| `hosts/*.ts` 宣言的ホスト設定 | 単一ホスト（Copilot CLI） |
| `gen-skill-docs.ts` リゾルバーパイプライン | 軽量適応スクリプトで代替（後述） |
| OpenClaw / ClawHub | Claude Code エコシステム固有 |
| Supabase テレメトリ | プライバシー優先 |
| Chrome拡張 / サイドバーエージェント | Copilot CLI の `/ide` で VS Code 連携可能 |
| PowerShell 対応 | WSL (Ubuntu) に統一 |
| Builder Profile / Archetypes | v1.0 範囲外。`store_memory` で将来的に実装可能 |

### 追随性を高める追加設計

#### 1. SKILL.md フロントマターの互換性

本家とCopilot CLIのフロントマターフィールドは高い互換性がある。以下の方針で統一する:

| 本家フィールド | Copilot CLI | 方針 |
|--------------|-------------|------|
| `name` | `name` | **同一。そのまま使用** |
| `description` | `description` | **同一。日本語に適応** |
| `allowed-tools` | `allowed-tools` | **同一形式。ツール名のみ変換** |
| `preamble-tier` | ― | 削除。Copilot CLIでは不要 |
| `version` | ― | 削除。Copilot CLIでは不要 |
| `triggers` | ― | `description` に含める |
| `user-invocable` | `user-invocable` | 同一 |
| `disable-model-invocation` | `disable-model-invocation` | 同一 |

`allowed-tools` のツール名変換:

| 本家 (Claude Code) | Copilot CLI |
|---|---|
| `Bash` | `bash` |
| `Read` | `view` |
| `Write` | `edit`, `create` |
| `Edit` | `edit` |
| `Grep` | `grep` |
| `Glob` | `glob` |
| `AskUserQuestion` | `ask_user` |
| `Agent` | `task` |
| `WebSearch` | `web_fetch` |

#### 2. `~/.gstack/` ディレクトリの共有

本家gstackと同一のパス構造を使用する。将来的にClaude CodeとCopilot CLIを同一マシンで併用する場合に、学習記録やプロジェクト状態を共有できる。

```
~/.gstack/
├── config.yaml                # 設定（プレフィックス、テレメトリ等）
├── repos/
│   └── gstack/                # 本家のローカルクローン（参照専用。gitignore）
├── projects/
│   └── {slug}/
│       ├── learnings.jsonl    # 学習記録（/learn）
│       ├── *-design-*.md      # デザインドキュメント（/office-hours）
│       └── *-reviews.jsonl    # レビューログ（/review, /ship）
├── plans/                     # プランファイル
├── analytics/                 # ローカル分析
│   └── skill-usage.jsonl
├── hosts/
│   └── copilot-cli/
│       ├── installations/
│       │   └── gstack-copilot-jp.json
│       ├── capabilities.json  # 利用可能な built-in agent / MCP の検出結果
│       └── env/               # シェル有効化用スニペット
├── upstream-last-check        # 前回の上流チェック時バージョン
└── builder-profile.jsonl      # ビルダープロファイル
```

共有するのは **ホスト非依存の成果物だけ** に限定する。

- `projects/`, `plans/`, `analytics/` は共有
- Copilot CLI 固有の state は `hosts/copilot-cli/` 配下に隔離
- 共有ファイルに Copilot 専用キーを書き込まない
- 本家と schema が衝突したら共有ファイルを汚さず `hosts/copilot-cli/` 側で吸収する

#### 3. 「外部の目」(Outside Voice) の実現

本家で `⚠️ Codex連携なし` としていた `/review` と `/ship` の外部レビュー機能は、以下で代替する:

| 本家の方法 | Copilot CLI での代替 |
|-----------|---------------------|
| `codex exec` (Codexによる独立レビュー) | Copilot CLI `/model` でモデル切替 + `task` tool でサブエージェント実行 |
| `codex review` (Codexによるコードレビュー) | Copilot CLI ビルトイン `code-review` エージェント |
| Claude adversarial subagent | Copilot CLI ビルトイン `rubber-duck` エージェント (experimental) |

これにより `/review` と `/ship` は「適応」として扱える。上流の役割を保ちながら、Copilot CLI 側の差分は fallback で吸収する。

#### 4. GitHub MCP サーバーの活用

Copilot CLI はビルトインの GitHub MCP サーバーを持つ（issues, pull requests, commits, code search, Actions）。本家が `gh` CLI で行っている GitHub 操作の一部を、MCP ツール経由で実行できる:

- `/ship` の PR 作成 → GitHub MCP `create_pull_request`
- `/land-and-deploy` の PR マージ → GitHub MCP `merge_pull_request`
- `/retro` のコミット統計 → GitHub MCP `list_commits`
- `/investigate` の Issue 作成 → GitHub MCP `create_issue`

ただし `gh` CLI の方が柔軟な場面もあるため、スキルごとに最適な方法を選択する。

#### 5. 上流リポジトリのローカル参照

本家 gstack をローカルにクローンし、追跡・適応スクリプトの参照元として使用する。

```
~/.gstack/
├── repos/
│   └── gstack/              # git clone --single-branch --depth 50
│       ├── CHANGELOG.md     # 差分検出の参照元
│       ├── ETHOS.md         # ETHOS 同期の参照元
│       ├── */SKILL.md.tmpl  # スキル適応の参照元
│       └── ...
└── upstream-last-check      # 前回チェック時のバージョン
```

**セットアップ:**
```bash
# setup スクリプトが自動実行（初回のみ）
git clone --single-branch --depth 50 \
  https://github.com/garrytan/gstack.git \
  ~/.gstack/repos/gstack
```

**更新（sessionStart hook で定期実行）:**
```bash
cd ~/.gstack/repos/gstack && git pull --ff-only
```

**二重配布の防止:**
gstack-copilot-jp リポジトリには本家のファイルを一切コミットしない。

- `~/.gstack/repos/gstack/` は **ランタイム参照のみ**。gitignore 対象
- 適応スクリプトは本家ファイルを「読み取り → 変換 → 出力」するが、入力ファイル自体は gstack-copilot-jp リポジトリに含めない
- SKILL.md は本家 SKILL.md.tmpl の「翻案」であり、コピーではない。プレースホルダー展開・ツール名変換・日本語適応を経て別の著作物として作成する
- ETHOS.md, BROWSER.md 等のドキュメントも翻訳ではなく再構成（本家の思想を独自に表現）
- README に本家へのリンクとライセンス情報を明記し、派生元であることを明示する

#### 6. SKILL.md.tmpl からの軽量適応

本家の `SKILL.md.tmpl` をローカルクローンから読み込み、Copilot CLI 向けに軽量変換するスクリプト:

```bash
# bin/adapt-upstream-skill.sh <skill-name>
UPSTREAM="$HOME/.gstack/repos/gstack"
SKILL_DIR=".github/skills/$1"

# 1. 本家の SKILL.md.tmpl を読み込み（ローカルクローンから）
TMPL="$UPSTREAM/$1/SKILL.md.tmpl"

# 2. {{PREAMBLE}}, {{BROWSE_SETUP}} 等のプレースホルダーを除去
# 3. ツール名を変換 (Bash→bash, Read→view 等)
# 4. フロントマターを Copilot CLI 形式に変換
# 5. 日本語の翻訳ヒントをコメントとして挿入（要手動編集）
# 6. $SKILL_DIR/SKILL.md.draft に出力（.draft は gitignore）

# ※ .draft ファイルは参考資料。最終的な SKILL.md は人間が日本語で作成する
```

**ワークフロー:**
1. `bin/upstream-diff.sh` が新バージョンを検出
2. 変更されたスキルに対して `bin/adapt-upstream-skill.sh` を実行
3. `.draft` ファイルと既存の SKILL.md を比較し、方法論の変更点を特定
4. 人間が日本語で SKILL.md を更新
5. `.draft` ファイルは gitignore されており、リポジトリにはコミットされない

#### 6.1 上流追跡の運用ルール

追随性を維持するため、`upstream-tracking.md` を単なるメモではなく **互換性台帳** として運用する。

記録する項目:

- 本家 tag / commit
- 最終検証日
- 互換性ステータス（`same` / `compatible` / `adapted` / `diverged`）
- 影響範囲（skill / hook / bin / docs / browse）
- 対応期限

変更分類と目標反映時間:

- **Class A: 文言・説明のみ** — 7日以内
- **Class B: チェックリスト・判定基準・フロー変更** — 72時間以内
- **Class C: コマンド名・ファイル配置・hook 契約の変更** — 24時間以内

未反映の差分は黙って放置しない。`upstream-tracking.md` に `diverged` と理由を書き、意図的な差分として見える化する。

```gitignore
# .gitignore
.github/skills/*/*.draft
~/.gstack/repos/
```

#### 7. Copilot CLI `/init` との統合

Copilot CLI の `/init` は `copilot-instructions.md` を自動生成する。gstack-copilot-jp の `copilot-instructions.md` と衝突する可能性がある。

方針: `setup` スクリプトで、ユーザープロジェクトの `copilot-instructions.md` に gstack セクションを追記する（本家が `CLAUDE.md` にセクションを追加するのと同じ方式）:

```markdown
## gstack-copilot-jp

gstack-copilot-jp のスキルを使用する。ブラウジングには /browse を使用し、
ビルトイン Playwright MCP は使用しない。
利用可能なスキル: /office-hours, /plan-ceo-review, ...
```

#### 8. スキル配置パスの互換性

Copilot CLI は本家 Claude Code と同じパスからスキルを読み込む:

| パス | 用途 | 本家 | Copilot CLI |
|------|------|------|-------------|
| `.github/skills/` | プロジェクトスキル | ✅ | ✅ |
| `.claude/skills/` | プロジェクトスキル（Claude互換） | ✅ | ✅ |
| `.agents/skills/` | プロジェクトスキル（エージェント標準） | ✅ | ✅ |
| `~/.copilot/skills/` | 個人スキル | ― | ✅ |
| `~/.claude/skills/` | 個人スキル（Claude互換） | ✅ | ✅ |
| `~/.agents/skills/` | 個人スキル | ― | ✅ |

**方針:** 既定は project-local。`setup --mode user-link` を選んだ場合だけ `~/.copilot/skills/gstack-copilot-jp` にシンボリックリンクを作成する。`~/.claude/skills/` へのリンクは maintainer 向けの互換検証用であり、v1.0 の既定動作には含めない。

#### 9. プラグインとしてのパッケージング（v1.0 配布方式）

Copilot CLI は `plugin` システムを持ち、skills + agents + hooks + MCP をバンドルして `/plugin install` で配布できる。gstack-copilot-jp の **主要配布方式** としてプラグインを採用する:

- `copilot plugin install github:username/gstack-copilot-jp` で一発インストール
- `/plugin update gstack-copilot-jp` で自動更新
- 複数端末で同一手順。git clone も setup も不要

プラグインに含めるもの:

| 種別 | 内容 |
|------|------|
| skills | `.github/skills/*/SKILL.md` 全スキル |
| agents | `.github/agents/*.agent.md` 全エージェント |
| hooks | `.github/hooks/*.json` 全フック |
| bin | `bin/gstack-*` ユーティリティ + `bin/gstack-env` |
| browse | `browse/dist/` コンパイル済みバイナリ |

setup スクリプトは **開発者向けローカルビルドと、plugin が使えない環境のフォールバック** として維持する。

#### 10. `AGENTS.md` の活用

Copilot CLI は `AGENTS.md` を custom instructions として読み込む（本家と同一）。本家gstackが `AGENTS.md` にスキルルーティングやチームルールを書くのと同じ方式を採用できる。

`copilot-instructions.md` に収まらない大規模なルーティングテーブルやチームルールは `AGENTS.md` に分離する。

#### 11. browse バイナリの `$B` エイリアス互換

本家では `$B` エイリアスでブラウザコマンドを実行する（例: `$B snapshot -i`）。Copilot CLI でも同じエイリアスを使えるようにする:

- `bin/gstack-env` が `export B=...` と `PATH=...` を出力し、アクティブなシェルだけに適用する
- `setup --mode user-link` は `~/.gstack/hosts/copilot-cli/env/gstack-copilot-jp.sh` を生成するが、自動で `.bashrc` を書き換えない
- SKILL.md 内のコマンド例も `$B` を使用（本家と同一）
- sessionStart hook で `$B` が未設定なら、修正コマンドだけを表示する

`$B` は **グローバル恒久設定ではなく、現在のシェルを有効化したときだけ定義** する。これで本家gstackとの共存時も衝突しない。

#### 12. `bin/` ユーティリティの本家互換

本家は以下のユーティリティバイナリを `bin/` に持つ。同名のスクリプトを gstack-copilot-jp にも配置し、互換性を保つ:

| 本家バイナリ | gstack-copilot-jp | 用途 |
|------------|-------------------|------|
| `gstack-slug` | `bin/gstack-slug` | プロジェクトの slug + branch 計算 |
| `gstack-review-log` | `bin/gstack-review-log` | レビュー結果のJSONL書き込み |
| `gstack-review-read` | `bin/gstack-review-read` | レビュー結果の読み取り |
| `gstack-config` | `bin/gstack-config` | `~/.gstack/config.yaml` の get/set |
| `gstack-update-check` | `bin/gstack-update-check` | 上流バージョンチェック |
| `gstack-diff-scope` | `bin/gstack-diff-scope` | 差分スコープ分析（frontend/backend/tests等） |
| `gstack-learnings-log` | `bin/gstack-learnings-log` | 学習記録のJSONL書き込み |
| `gstack-timeline-log` | `bin/gstack-timeline-log` | スキル使用のタイムラインJSONL書き込み |
| `gstack-uninstall` | `bin/gstack-uninstall` | アンインストール（symlink, state, browse daemon 削除） |
| `gstack-analytics` | `bin/gstack-analytics` | ローカル analytics ダッシュボード表示 |
| `gstack-team-init` | ― | 不要。plugin install + `copilot-instructions.md` で代替 |
| `gstack-session-track` | `bin/gstack-session-track` | セッション追跡（ELI16 判定用） |

これにより SKILL.md 内のコマンド参照が本家と同一形式になり、適応スクリプトの変換差分が減る。

同名互換は維持するが、`bin/` をグローバル PATH に常駐させない。`bin/gstack-env` で選択した環境だけ PATH 先頭に追加し、複数の gstack 派生物が同居しても衝突しないようにする。

#### 13. テストの3層構造の採用

本家の3層テスト体系を Copilot CLI 向けに再実装する:

| 層 | 本家 | gstack-copilot-jp | コスト |
|----|------|-------------------|--------|
| Tier 1: 静的検証 | `bun test` — コマンド検証、フラグ検証 | `bun test` — SKILL.md パース、フロントマター検証、upstream 変換 golden test | 無料 |
| Tier 2: E2E | `claude -p` — 実スキル実行 | `copilot -p` — 実スキル実行、setup mode / coexistence テスト | ~$3-4/回 |
| Tier 3: LLM Judge | Sonnet による品質スコアリング | Copilot `/model` 切替で品質スコアリング | ~$0.15/回 |

Tier 1 は `bun test` で即座に実装可能。Tier 2 は `copilot -p --output-format json` で構造化出力をパースする。Tier 3 のスコアは **本家 Sonnet スコアとの絶対比較ではなく、このリポジトリ内の回帰監視** に使う。

#### 14. Preamble 相当の振る舞い

本家は `{{PREAMBLE}}` プレースホルダーで全スキルに共通ブートストラップを注入する。gstack-copilot-jp はテンプレート生成を行わないが、**同じ振る舞いを hook + ルートスキルで再現**する:

| 本家 PREAMBLE 機能 | gstack-copilot-jp での実現 |
|---|---|
| 自動更新チェック (`gstack-update-check`) | `sessionStart` hook で `/plugin update --check` or `gstack-update-check` 実行 |
| セッション追跡 (`~/.gstack/sessions/$PPID`) | `sessionStart` hook で `bin/gstack-session-track` 実行 |
| ELI16 モード（3+ 並列セッション時に質問を簡素化） | hook がセッション数を数え、3 以上なら環境変数 `GSTACK_ELI16=1` を設定。スキルが参照 |
| 運用自己改善（セッション終了時に振り返り） | `sessionEnd` hook で学習抽出を提案（`/learn 振り返り` に繋ぐ） |
| AskUserQuestion フォーマット | `copilot-instructions.md` に常時指示として記載（ask-format と同一） |
| Search Before Building | `copilot-instructions.md` に常時指示として記載（ethos と同一） |

これにより、テンプレート生成なしで本家と同等のセッション体験を再現できる。

#### 15. JSONL スキーマの互換性

`~/.gstack/` に書き込む JSONL ファイルのスキーマは、本家と同一フィールド・同一フォーマットを使う。Claude Code と Copilot CLI を同一マシンで併用した場合にデータを共有するため。

| ファイル | 必須フィールド | 備考 |
|---------|--------------|------|
| `learnings.jsonl` | `ts`, `type`, `confidence`, `source`, `text`, `project` | `/learn` が書き込み |
| `*-reviews.jsonl` | `ts`, `skill`, `branch`, `verdict`, `findings_count` | `/review`, `/ship` が書き込み |
| `skill-usage.jsonl` | `ts`, `skill`, `duration_ms`, `success`, `version` | `sessionEnd` hook が書き込み |
| `health-history.jsonl` | `ts`, `branch`, `score`, `typecheck`, `lint`, `test`, `deadcode`, `shell`, `duration_s` | `/health` が書き込み |

Copilot 固有のフィールド（モデル名等）を追加する場合は、本家にないキーを使い、既存フィールドを変更しない。

#### 16. Team Mode の Copilot 版

本家は `./setup --team` + `bin/gstack-team-init` で共有リポジトリに gstack を組み込む。Copilot 版では **plugin + プロジェクト `copilot-instructions.md`** で同等の体験を提供する:

```bash
# チームメイトへの案内（README や CONTRIBUTING.md に記載）
copilot plugin install github:username/gstack-copilot-jp
```

プロジェクトの `.github/copilot-instructions.md` に gstack セクションを追記すれば、チーム全員のセッションで自動的にスキルが利用可能になる。本家の「vendored files なし、version drift なし」と同一の利点を plugin が提供する。

#### 17. スキル名プレフィックス制御

本家は `./setup --prefix` / `--no-prefix` で `/qa` ↔ `/gstack-qa` を切り替える。plugin ではスキル名の衝突が起こりやすいため、この制御を plugin manifest に組み込む:

- 既定は **プレフィックスなし** (`/qa`, `/review` 等) — 本家と同一
- 他のスキルパックと併用する場合は `copilot-plugin.json` の `prefix: "gstack-"` で名前空間を分離
- `copilot-instructions.md` のルーティングテーブルはプレフィックスに応じて自動生成

#### 18. browse バイナリのバージョン自動再起動

本家は `browse/dist/.version` にビルドハッシュを書き込み、CLI 実行時にサーバーのバージョンと比較する。不一致なら自動再起動。同じ仕組みを採用する:

```
bun build → browse/dist/.version に git rev-parse HEAD を書き込み
CLI 実行 → .gstack/browse.json の binaryVersion と比較
不一致 → 旧サーバーを kill → 新サーバーを起動
```

これで plugin 更新後に browse デーモンの再起動を手動で行う必要がなくなる。

#### 19. Copilot CLI 依存機能のフォールバック

Copilot CLI 側の API や built-in agent が変わっても即死しないよう、依存関係ごとにフォールバックを持つ。

| 依存機能 | 優先 | フォールバック | 記録先 |
|---------|------|---------------|--------|
| `code-review` built-in | `code-review` エージェント | 一般 `task` で構造化レビュー | `upstream-tracking.md` |
| `rubber-duck` built-in | `rubber-duck` エージェント | 一般 `task` + 敵対レビュー用プロンプト | `upstream-tracking.md` |
| GitHub MCP | MCP ツール | `gh` CLI | `upstream-tracking.md` |
| `/fleet` | 並列サブエージェント | 逐次 `task` 実行 | `upstream-tracking.md` |
| plugin 配布 | `/plugin install`（v1.0 主要方式） | `./setup --mode user-link` | `upstream-tracking.md` |

「本家と同じ役割を果たす」ことを優先し、Copilot CLI の特定実装にロックインしすぎない。

## スプリントプロセス

```
考える → 計画する → 作る → レビューする → テストする → 出荷する → 振り返る
```

各スキルは前のスキルの成果物を読み、次のスキルが使える成果物を残す。

| フェーズ | スキル | 本家対応 |
|---------|--------|---------|
| 考える | `/office-hours` | 同一 |
| 計画する | `/plan-ceo-review` | 同一 |
| | `/plan-eng-review` | 同一 |
| | `/plan-design-review` | 同一 |
| | `/plan-devex-review` | 同一 |
| | `/autoplan` | 同一 |
| 作る | `/tdd` | 独自（維持。本家に実装されたら統合） |
| | `/design-html` | 同一 |
| | `/investigate` | 同一 |
| | `/go` | 独自（維持。スプリントオーケストレーター） |
| レビュー | `/review` | 適応（`code-review` + `/model` 切替 + fallback） |
| | `/design-review` | 同一 |
| | `/devex-review` | 同一 |
| テスト | `/qa` | 同一 |
| | `/qa-only` | 同一 |
| | `/cso` | 同一 |
| | `/benchmark` | 同一 |
| | `/health` | 同一（本家 v1.1.x で追加。コード品質ダッシュボード） |
| 出荷する | `/ship` | 適応（`code-review` + `rubber-duck` + fallback） |
| | `/land-and-deploy` | 同一 |
| | `/canary` | 同一 |
| 振り返る | `/retro` | 同一 |
| | `/document-release` | 同一 |
| | `/learn` | 同一 |

パワーツール:

| スキル | 本家対応 | 備考 |
|--------|---------|------|
| ~~`/multi-plan`~~ | 廃止 | Copilot CLI `/model` + `/fleet` で代替 |
| ~~`/multi-execute`~~ | 廃止 | Copilot CLI `--autopilot` + `/fleet` で代替 |
| ~~`/second-opinion`~~ | 廃止 | 本家 `/codex` 相当。Copilot CLI `/model` 切替 + `task` で再現 |
| `/design-consultation` | 同一 | |
| `/design-shotgun` | 同一 | $D バイナリなし → テキストベース |
| `/browse` | 同一 | Bun + Playwright（本家と同一） |
| `/open-browser` | 同一 | |
| `/pair-agent` | 同一 | |
| `/setup-browser-cookies` | 同一 | |
| `/setup-deploy` | 同一 | |
| `/health` | 同一 | typecheck/lint/test/deadcode を wrap して 0-10 スコア |
| `/careful` | 同一 | |
| `/freeze` | 同一 | |
| `/guard` | 同一 | |
| `/unfreeze` | 同一 | |
| `/checkpoint` → `/context-save` + `/context-restore` | 同一 | 本家 v1.1.3 に合わせて分割・リネーム |
| `/upgrade` → `/gstack-upgrade` | 同一 | 本家に合わせてリネーム |
| `/open-browser` → `/open-gstack-browser` | 同一 | 本家に合わせてリネーム |
| ~~`/build-fix`~~ | 廃止 | 通常の対話で代替可能 |
| ~~`/clean`~~ | 廃止 | `/review` に統合（スロップ検出パス） |
| ~~`/loop`~~ | 廃止 | `/fleet` + `--autopilot` で代替 |

### 本家 v1.0〜v1.1 で追加された注目機能

以下は追跡対象として優先的に取り込む:

| 機能 | 本家バージョン | 取り込み方針 |
|------|--------------|-------------|
| v1 prompts（平易な説明） | v1.0.0 | ボイス指針に反映 |
| `/context-save` + `/context-restore` | v1.1.3 | `/checkpoint` を分割。v1.0 で対応 |
| `/plan-tune` (質問チューニング) | v0.19 | `store_memory` + `copilot-instructions.md` で実装 |
| Confusion Protocol | v0.18 | ✅ 取り込み済み |
| UX behavioral foundations | v0.17 | デザインスキルに反映 |
| Content security (4層防御) | v0.15.12 | browse スキルに反映。`lib/` 相当の共有ロジックは `bin/` に統合 |
| Review Army (並列専門家) | v0.14.4 | `/fleet` でサブエージェント並列 dispatch |
| `load-html` / `file://` ナビ | v1.1.0 | browse に取り込み |
| `/health` (コード品質ダッシュボード) | v1.1.x | **新規追跡**。tsc/lint/test/deadcode を wrap して 0-10 スコアリング |
| `/codex` (クロスモデル第二意見) | v0.14 | Copilot CLI `/model` 切替 + `task` で再現。`/second-opinion` 廃止後の後継 |
| ELI16 モード (並列セッション簡素化) | v1.0.0 | `sessionStart` hook でセッション数検出。3+ で簡素化フラグ |
| 運用自己改善 (end-of-session reflection) | v1.0.0 | `sessionEnd` hook → `/learn 振り返り` 提案 |
| Review Readiness Dashboard | v1.0.0 | `/ship` のプレフライトチェックとして実装 |
| Proactive skill suggestions | v1.0.0 | `copilot-instructions.md` にステージ検知ロジックを記載 |
| Voice-friendly triggers | v1.0.0 | SKILL.md の `description` に自然言語トリガーを含める（既存方式で対応可） |
| `$D` (design binary) | v0.12 | v1.0 スコープ外。テキストベースで代替（`/design-shotgun` は GPT Image なし） |

## 現在の実装状態

**VERSION: 1.0.0-alpha.5**（Phase 0-4 実装済み。v1.0 リリース準備完了）

| カテゴリ | 数量 | 内容 |
|---------|------|------|
| スキル | 39 | Phase 2 で 7 廃止、1 新規（health）。38 + health = 39 |
| エージェント | 5 | architect, design-critic, dx-tester, security, testing |
| ブラウザ | 1 | Bun コンパイル + Playwright（本家互換） |
| hookシステム | 4 | sessionStart, sessionEnd, preToolUse, postToolUse |

## v1.0 仕様: Copilot CLI 専用 + 追随モデル

### v1.0 の定義

v1.0 = **Copilot CLI をホストターゲットとし、本家gstack追随モデルを確立する**。

1. **Copilot CLI 専用** — hook、セッション永続化、自律実行をフル活用
2. **Linux統一** — macOS / Linux ネイティブ、Windows は WSL (Ubuntu)
3. **Bun browse** — 本家と同一のブラウザサブシステム
4. **プラグイン配布** — `copilot plugin install` で一発導入。複数端末で共有可能
5. **本家 v1.1 の方法論を反映** — 各スキルの判定基準・ワークフローが本家と同等

### タスク

| # | タスク | 内容 | 工数（人間/AI） |
|---|--------|------|----------------|
| 1 | プラグインパッケージング | `copilot-plugin.json` マニフェスト作成。skills + agents + hooks + bin + browse をバンドル。CI で自動ビルド・公開 | 2日 / 1時間 |
| 1b | setup スクリプト (フォールバック) | `setup` (bash)。project-local / user-link / uninstall の3モード、Bun ビルド、Playwright 確認。plugin 非対応環境向け | 1日 / 30分 |
| 2 | browse Bun移行 | `browse/src/` を TypeScript 化。`bun build --compile`。本家のコマンド体系を適応 | 1週間 / 2時間 |
| 3 | hookシステム | `.github/hooks/` に sessionStart, preToolUse, postToolUse を実装 | 2日 / 1時間 |
| 4 | Copilot CLI 設定 | `.github/copilot/settings.json` 作成。スキルのフロントマターを Copilot CLI 互換形式に統一 | 1日 / 30分 |
| 5 | 独自資産の整理 | 廃止: `build-fix`, `clean`, `loop`, `multi-plan`, `multi-execute`, `second-opinion`。リネーム: `checkpoint`→2分割, `open-browser`, `upgrade`。`reviewer`/`adversarial`エージェント廃止。`/clean` のスロップ検出を `/review` に統合 | 3日 / 1時間 |
| 6 | VS Code Chat 資産の整理 | `.github/rules/`, `.github/instructions/`, `.github/prompts/` を `copilot-instructions.md` + スキルに統合・廃止 | 2日 / 1時間 |
| 7 | 外部の目（Outside Voice）実装 | `/review` と `/ship` にビルトイン `code-review` + `rubber-duck` + `/model` 切替による独立レビューを組み込む | 2日 / 1時間 |
| 8 | `~/.gstack/` 互換 | 本家と同一 root を共有しつつ、Copilot 固有 state を `hosts/copilot-cli/` に隔離 | 1日 / 30分 |
| 9 | 上流追跡ツール | `bin/upstream-diff.sh` + `bin/adapt-upstream-skill.sh` + compatibility 台帳運用 | 1日 / 30分 |
| 10 | `bin/` ユーティリティ互換 | `gstack-slug`, `gstack-review-log`, `gstack-config` 等の本家互換スクリプト作成。PATH は activation 時のみ切り替え | 2日 / 1時間 |
| 11 | `$B` エイリアス設定 | browse バイナリへの `$B`。`bin/gstack-env` と env スニペットで有効化し、グローバル恒久設定はしない | 半日 / 15分 |
| 12 | E2E テスト | `copilot -p` によるスキル動作テスト。3層テスト体系の Tier 1 + Tier 2 + coexistence テスト | 3日 / 1時間 |
| 13 | ドキュメント | README、getting-started を Copilot CLI + WSL 前提に改訂。ARCHITECTURE.md 作成 | 半日 / 30分 |
| 14 | 追跡基盤 | `upstream-tracking.md` 作成。本家バージョンとの対応表、compatibility status、反映期限 | 2時間 / 20分 |
| 15 | Copilot fallback 実装 | built-in agent / MCP / plugin 不在時の代替経路を各スキルに実装 | 1日 / 45分 |
| 16 | Preamble 相当 hook | sessionStart/End hook で更新チェック、セッション追跡、ELI16、自己改善を実装 | 1日 / 30分 |
| 17 | `/health` スキル | 本家 `/health` の Copilot 版。typecheck/lint/test/deadcode を wrap して 0-10 スコア | 1日 / 30分 |
| 18 | JSONL スキーマ互換 | learnings/reviews/usage/health の JSONL を本家と同一フィールドで出力 | 半日 / 20分 |
| 19 | ルートスキル (`SKILL.md`) | `/status` + スキル一覧 + version 表示。本家ルート SKILL.md に対応 | 半日 / 15分 |

### 実装ロードマップ

**原則: gstack-copilot-jp 自身を使って gstack-copilot-jp を作る（セルフホスト）。**

Phase 0 で最低限のスプリントループを回せる状態にし、Phase 1 以降はそのループを使って開発する。長期セッションの継続性（セッション保存・復帰・学習蓄積）を最優先とする。

#### Phase 0: ブートストラップ（Day 1-2）

目的: **Copilot CLI 上で最初のスプリントが回る状態を作る。**

| 順 | タスク# | 内容 | 依存 | 完了条件 |
|----|---------|------|------|---------|
| 0-1 | 4 | `copilot-instructions.md` 作成。スキルルーティング、ボイス、ethos、ask-format、Confusion Protocol を統合 | なし | `copilot` を起動してスキルが認識される |
| 0-2 | 6 | `.github/rules/`, `.github/instructions/` の内容を `copilot-instructions.md` に統合 | 0-1 | rules/instructions ディレクトリ削除可能 |
| 0-3 | 19 | ルートスキル `SKILL.md` 作成。`/status` で version + スキル一覧表示 | 0-1 | `/status` が動く |
| 0-4 | 5a | `/context-save` + `/context-restore` 作成（`/checkpoint` をリネーム・分割） | 0-1 | セッション中断→再開が動く |
| 0-5 | 5b | `/go` を Copilot CLI 向けに適応（ツール名変換、サブエージェント→`task`） | 0-1 | `/go` でスプリントが起動する |
| 0-6 | 5c | `/review` を Copilot CLI 向けに適応 + `/clean` スロップ検出を統合 | 0-1 | `/review` が diff を読んでレビューできる |
| 0-7 | 5d | `/ship` を Copilot CLI 向けに適応 | 0-6 | `/ship` で PR が作成できる |
| 0-8 | 5e | `/learn` を Copilot CLI 向けに適応 | 0-1 | 学習記録が `~/.gstack/` に書き込まれる |

**Phase 0 完了 = `/go` で `/review` → `/ship` → `/learn` が回る。以降はこのループで開発する。**

#### Phase 1: セッション継続基盤（Day 3-5）

目的: **長時間・複数セッションにまたがる作業を安全に続けられる。**

| 順 | タスク# | 内容 | 依存 | 完了条件 |
|----|---------|------|------|---------|
| 1-1 | 3 | hook システム実装。`sessionStart`（更新チェック、状態復帰）、`sessionEnd`（学習提案） | P0 | hook がセッション開始/終了時に発火 |
| 1-2 | 16 | Preamble 相当 hook。セッション追跡、ELI16 判定、自己改善 | 1-1 | 並列3+セッションで ELI16 フラグが立つ |
| 1-3 | 8 | `~/.gstack/` ディレクトリ構造作成。`hosts/copilot-cli/` 分離 | P0 | learnings/reviews/usage が正しいパスに書き込まれる |
| 1-4 | 18 | JSONL スキーマ互換。全 JSONL 出力を本家フィールドに統一 | 1-3 | Tier 1 テストで schema 検証 pass |
| 1-5 | 10a | `gstack-slug`, `gstack-config`, `gstack-session-track` 実装 | 1-3 | hook と learn がこれらを呼び出せる |
| 1-6 | 14 | `upstream-tracking.md` 作成。互換性台帳の初期版 | P0 | 本家 v1.1.x との差分が一覧できる |

**Phase 1 完了 = セッションを中断しても `/context-restore` で復帰し、`/learn` の蓄積が次のセッションに引き継がれる。**

#### Phase 2: スプリント完全化（Day 6-10）

目的: **考える→出荷する→振り返るの全フェーズが動く。残りのコアスキルを適応。**

| 順 | タスク# | 内容 | 依存 | 完了条件 |
|----|---------|------|------|---------|
| 2-1 | 5f | 残りの廃止（`build-fix`, `loop`, `multi-plan`, `multi-execute`, `second-opinion`）、リネーム（`open-browser`, `upgrade`）、エージェント廃止（`reviewer`, `adversarial`） | P1 | 廃止スキルのディレクトリが削除済み |
| 2-2 | 7 | `/review` + `/ship` に Outside Voice 実装（`code-review` + `rubber-duck` + `/model`） | 2-1 | `/review` がモデル切替で独立レビューを実行 |
| 2-3 | — | `/tdd`, `/investigate`, `/office-hours`, `/autoplan`, `/plan-*` を Copilot CLI 向けに適応 | P1 | 各スキルが単体で動作 |
| 2-4 | — | `/qa`, `/qa-only`, `/cso`, `/benchmark` を適応 | P1 | `/qa` が browse なしで基本テストを実行 |
| 2-5 | 17 | `/health` スキル新規作成 | 1-3 | `/health` が 0-10 スコアを出力 |
| 2-6 | — | `/retro`, `/document-release`, `/canary`, `/land-and-deploy` を適応 | 2-1 | `/retro` が JSONL からコミット統計を集計 |
| 2-7 | 15 | Copilot fallback 実装。built-in agent/MCP 不在時の代替経路 | 2-2 | fallback 経路が各スキルに組み込まれている |
| 2-8 | 10b | 残りの `bin/` ユーティリティ（`gstack-review-log`, `gstack-learnings-log`, `gstack-timeline-log`, `gstack-analytics`, `gstack-uninstall`） | 1-5 | `/review`, `/learn` が bin を呼び出して JSONL 書き込み |

**Phase 2 完了 = 35+ スキルが全て Copilot CLI で動作。browse 以外のスプリント全体が回る。**

#### Phase 3: ブラウザ & 配布（Day 11-17）

目的: **browse を本家互換で動かし、plugin で配布できる状態にする。**

| 順 | タスク# | 内容 | 依存 | 完了条件 |
|----|---------|------|------|---------|
| 3-1 | 2 | browse Bun 移行。`browse/src/` TypeScript 化、`bun build --compile`、コマンド体系を本家互換に | P2 | `$B snapshot -i` が動く |
| 3-2 | 11 | `$B` エイリアス + `bin/gstack-env` 実装 | 3-1 | `eval $(bin/gstack-env)` で `$B` が定義される |
| 3-3 | — | `/browse`, `/open-gstack-browser`, `/setup-browser-cookies`, `/pair-agent` を適応 | 3-1 | `/browse` で snapshot → click → fill のフローが動く |
| 3-4 | 1 | plugin パッケージング。`copilot-plugin.json` + CI 自動ビルド | 3-1 | `copilot plugin install` でインストール成功 |
| 3-5 | 1b | setup スクリプト（フォールバック） | 3-1 | `./setup` → `./setup --uninstall` のラウンドトリップ |
| 3-6 | 9 | `bin/upstream-diff.sh` + `bin/adapt-upstream-skill.sh` | P2 | 本家の新バージョン検出→draft 出力が動く |

**Phase 3 完了 = `copilot plugin install` で全機能が入る。browse QA テストが動く。**

#### Phase 4: 品質 & ドキュメント（Day 18-21）

目的: **テスト・ドキュメントを揃えて v1.0 リリース可能な状態にする。**

| 順 | タスク# | 内容 | 依存 | 完了条件 |
|----|---------|------|------|---------|
| 4-1 | 12 | E2E テスト。Tier 1（`bun test`）+ Tier 2（`copilot -p`）+ coexistence テスト | P3 | Tier 1 全 pass。Tier 2 でコアスキル 5+ が pass |
| 4-2 | 13 | README、getting-started を Copilot CLI 前提に改訂。ARCHITECTURE.md 作成 | P3 | 新規ユーザーが README だけで install→`/office-hours` 実行可能 |
| 4-3 | — | 全スキルの description に voice-friendly trigger を追加 | P2 | 「セキュリティチェック」で `/cso` が起動 |
| 4-4 | — | `copilot-instructions.md` に proactive skill suggestion ロジック追加 | P2 | ブランチに diff がある状態で `/review` が提案される |
| 4-5 | — | v1.0 リリース。VERSION 更新、タグ付け、plugin 公開 | 4-1, 4-2 | `copilot plugin install` で v1.0 が入る |

### フェーズ間の依存グラフ

```
Phase 0: ブートストラップ
  copilot-instructions.md ─→ ルートSKILL.md
            │                      │
            ├─→ /context-save      │
            ├─→ /go ───→ /review ──→ /ship
            └─→ /learn
            ▼
Phase 1: セッション継続基盤
  hooks ──→ preamble hooks ──→ ~/.gstack/ ──→ JSONL互換
    │                              │
    └─→ bin/gstack-slug,config     └─→ upstream-tracking.md
            ▼
Phase 2: スプリント完全化
  資産整理 ──→ Outside Voice ──→ 残りスキル全適応
    │                              │
    └─→ /health ──→ fallback ──→ 残りbin/
            ▼
Phase 3: ブラウザ & 配布
  browse Bun ──→ $B alias ──→ browse スキル群
    │                          │
    └─→ plugin ──→ setup ──→ upstream ツール
            ▼
Phase 4: 品質 & ドキュメント
  E2E テスト ──→ ドキュメント ──→ v1.0 リリース
```

### セルフホスト戦略

| Phase | 使えるスキル | 開発スタイル |
|-------|-------------|-------------|
| Phase 0 実行中 | なし（手動で Copilot CLI に指示） | Copilot CLI 素の対話 |
| Phase 1 実行中 | `/go`, `/review`, `/ship`, `/learn`, `/context-save` | **最低限のスプリントが回る** |
| Phase 2 実行中 | + `/tdd`, `/investigate`, `/office-hours`, `/autoplan` | **計画→実装→テストの全体が回る** |
| Phase 3 実行中 | + `/browse`, `/qa`, `/health` | **QA付きの完全スプリント** |
| Phase 4 実行中 | 全スキル | **本番運用と同等** |

Phase 0 だけは Copilot CLI の素の対話で進める。Phase 0 の完了条件（`/go` が回る）を達成した瞬間から、残りの全作業は gstack-copilot-jp 自身のスキルで駆動する。

### Copilot CLI のフィーチャーフラグ活用

| フラグ | 機能 | 活用方針 |
|--------|------|---------|
| `copilot-feature-agentic-memory` | セッション間永続メモリ | ✅ ON（デフォルト）。`/learn` と統合 |
| `SESSION_STORE` | SQLiteベースのセッション履歴 | 安定化待ち。`/retro` と統合可能 |
| `BACKGROUND_SESSIONS` | バックグラウンド並列セッション | 安定化待ち。`/multi-execute` と統合可能 |
| `MULTI_TURN_AGENTS` | サブエージェントとの対話継続 | 安定化待ち。`/review` の専門家dispatch改善 |
| `PERSISTED_PERMISSIONS` | セッション間のツール許可永続化 | 安定化待ち。セットアップ体験改善 |

## 本家gstackとの構造的差異（v1.0 想定）

| 側面 | gstack (本家) | gstack-copilot-jp v1.0 |
|------|--------------|------------------------|
| 位置づけ | 方法論の源泉 + 10ホスト対応インフラ | Copilot CLI + 日本語の適応レイヤー |
| 対象ホスト | Claude Code + Codex + Gemini + Cursor + 6その他 | Copilot CLI 専用 |
| 言語 | 英語 | 日本語ネイティブ |
| プラットフォーム | macOS中心 + Windows/Linux | Linux統一（macOS / Linux / WSL） |
| インストール | `./setup` + シンボリックリンク | `./setup` は同一。既定は project-local、user-link は opt-in |
| スキル形式 | `SKILL.md` (テンプレート生成) | `SKILL.md` (手書き。同一フロントマター形式) |
| ブラウザ | Bun コンパイル + Node.js フォールバック | Bun コンパイル（**同一**。バージョン自動再起動も同一） |
| hookシステム | `PreToolUse/PostToolUse` | `.github/hooks/*.json`（**互換**） |
| 外部の目 | Codex CLI + Claude adversarial | `code-review` + `rubber-duck` + `/model` 切替 + fallback |
| 状態ディレクトリ | `~/.gstack/` | `~/.gstack/` root 共有 + `hosts/copilot-cli/` 分離 |
| テスト | 3層E2E（`claude -p` + LLM Judge + Static） | `copilot -p` + Vitest + coexistence test + JSONL schema 互換テスト |
| テレメトリ | Supabase opt-in + ローカル JSONL | ローカル JSONL のみ |
| マルチモデル | Codex CLI 外部プロセス連携 | Copilot `/model` ネイティブ切替 |
| 並列実行 | Conductor (10-15並列) | Copilot CLI `/fleet` |
| セッション永続化 | `~/.gstack/` JSONL + config | `store_memory` + `~/.gstack/` + Copilot Memory |
| 更新方式 | `SessionStart` hook + auto-update | `sessionStart` hook + auto-update（**同一方式**） |
| GitHub操作 | `gh` CLI | `gh` CLI + GitHub MCP サーバー（ハイブリッド） |
| 上流追跡 | ― (本家自身) | `bin/upstream-diff.sh` + `bin/adapt-upstream-skill.sh` + compatibility 台帳 |
| `bin/` ユーティリティ | `bin/gstack-*` (Bun compiled) | `bin/gstack-*` (bash。同名・同インターフェース、activation で切替) |
| スキル配置 | `~/.claude/skills/gstack/` | `.github/skills/` + optional `~/.copilot/skills/` user-link |
| browse エイリアス | `$B` | `$B`（同名。アクティブなシェルのみ定義） |
| 配布方式 | ― | Copilot CLI プラグイン（v1.0 主要方式） + setup フォールバック |

## 優先順位体系

```
ユーザー主権 > copilot-instructions.md > skills > hooks
```

## ターゲットユーザー

- GitHub Copilot CLI を使う日本語話者の開発者
- macOS / Linux / WSL (Ubuntu) 環境

## スコープ外

- VS Code Chat 単体対応 — Copilot CLI に統一
- Windows PowerShell ネイティブ対応 — WSL (Ubuntu) に統一
- Cursor / Codex / Gemini CLI / その他ホスト対応 — Copilot CLI に集中
- テレメトリ / アナリティクス — プライバシー優先
- テンプレートビルドシステム — 手書きで十分
- 有料化 — OSSとして公開

## v1.0 での資産整理

### 廃止するスキル

| スキル | 理由 | 代替 |
|--------|------|------|
| `/build-fix` | 通常の対話で代替可能 | `copilot` で直接「ビルド直して」 |
| `/clean` | `/review` に統合 | `/review` のスロップ検出パスとして組み込み |
| `/loop` | Copilot CLI 機能で代替 | `/fleet` + `--autopilot` |
| `/multi-plan` | Copilot CLI 機能で代替 | `/model` 切替 + `/fleet` |
| `/multi-execute` | Copilot CLI 機能で代替 | `--autopilot` + `/fleet` |
| `/second-opinion` | Copilot CLI ビルトインで代替 | `code-review` + `rubber-duck` エージェント |

### リネームするスキル

| 現在 | 変更後 | 理由 |
|------|--------|------|
| `/checkpoint` | `/context-save` + `/context-restore` | 本家 v1.1.3 に合わせて分割 |
| `/open-browser` | `/open-gstack-browser` | 本家スキル名に統一 |
| `/upgrade` | `/gstack-upgrade` | 本家スキル名に統一 |

### 廃止するエージェント

| エージェント | 理由 | 代替 |
|-------------|------|------|
| `reviewer.agent.md` | Copilot CLI ビルトイン `code-review` と重複 | ビルトイン利用 |
| `adversarial.agent.md` | Copilot CLI ビルトイン `rubber-duck` と重複 | ビルトイン利用 |

### `/clean` → `/review` 統合方針

本家の `/review` は v0.16.3 で `slop:diff` を導入し、スロップ検出をレビューの一部として実行する。gstack-copilot-jp もこれに従い、`/clean` の内容を `/review` に統合する:

- `/review` ステップ2（チェックリスト）にスロップ検出カテゴリを追加
  - デバッグ残骸（`console.log`, `debugger`, コメントアウトされたコード）
  - 型の怠慢（`any` 型、`type: ignore` 濫用）
  - 未使用コード（インポート、変数、到達不能コード）
  - AIスロップパターン（TODO放置、冗長コメント、繰り返しロジック）
- Fix-First 原則は `/review` と共通（自動修正 vs 要確認の分類）
- `/clean` スキルディレクトリは削除

### 廃止する VS Code Chat 専用資産

| 資産 | 理由 | 統合先 |
|------|------|--------|
| `.github/instructions/` (9ファイル) | Copilot CLI に自動ロード機構なし | `copilot-instructions.md` + 各スキル |
| `.github/rules/` (8ファイル) | 同上 | `copilot-instructions.md` |
| `.github/prompts/` (2ファイル) | `setup` + `sessionStart` hook で代替 | 削除 |

### 維持する独自スキル

| スキル | 理由 |
|--------|------|
| `/tdd` | TDDプロセス自体を強制する独自価値。将来的に本家に実装されたら統合 |
| `/go` | autoplan→tdd→review→ship→retro の一気通貫オーケストレーション。本家にない独自価値 |
| `/health` | 本家 v1.1.x で追加されたコード品質ダッシュボード。`/qa` と補完関係にある独立スキル |

## 設計原則

ETHOS.md の3原則に従う:

1. **湖を沸かせ（Boil the Lake）** — 完全版を作れ。70行の差分はAIなら秒で終わる
2. **作る前に探せ（Search Before Building）** — 枯れた技術 → 新しく人気のもの → 第一原理
3. **ユーザー主権（User Sovereignty）** — AIは推奨する。決めるのはユーザー
