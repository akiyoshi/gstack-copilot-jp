# DESIGN.md — 設計判断の記録

> **読み手向け:**
> - **アーキテクチャの全体像** → `ARCHITECTURE.md`
> - **インストール/利用方法** → `README.md`, `INSTALL.md`
> - **未実装項目・ロードマップ** → `ROADMAP.md`
> - **過去の設計探索の記録** → `docs/archive/`
>
> このファイルは、**なぜ現在の構成にしたか** を記録する判断ログ。
> 「これからこうする」ではなく、「こうした、理由はこうだ」を書く。

## ポジショニング

```
gstack（本家）= 方法論 + 10ホスト対応のスキル生成パイプライン（Claude Code中心）
gstack-copilot-jp = gstackの方法論を GitHub Copilot（CLI + VS Code Chat）+ 日本語 で使う最速の方法
```

独自の価値:

- **日本語ネイティブ** — スキル出力・ドキュメント・ボイスが全て日本語
- **マルチホスト** — Copilot CLI と VS Code Copilot Chat の両方で動作（Tier A/B/C 分類）
- **Linux 統一** — macOS / Linux ネイティブ、Windows は WSL (Ubuntu)。PowerShell 対応なし

## 設計原則

1. **上流追跡** — 本家 gstack の方法論を追随し、自分は再発明しない
2. **適応、再発明しない** — 本家 SKILL.md を vendoring し、Claude Code → Copilot CLI の互換変換のみ施す
3. **差分最小化** — Copilot CLI 固有の差異への対応のみを独自実装する
4. **日本語は翻訳ではなく適応** — frontmatter とユーザー出力は日本語、本文は upstream 忠実に保つ
5. **Linux 前提** — bash スクリプト、POSIX パスを前提

## 主要な設計判断

### 1. SKILL.md は本家を vendoring する（AI 再生成しない）

**判断:** 本家 `SKILL.md` のスキル固有部分をそのまま採用し、3層分離モデルで処理する:

```
Layer 1: upstream skill body  ← 本家 SKILL.md（英語、そのまま採用）
Layer 2: compatibility layer  ← 103 の sed 変換ルール（Claude Code → Copilot CLI）
Layer 3: localization overlay ← 日本語 frontmatter
```

**理由:** 過去に AI 全文書き換えを試みたが、情報欠落（1251行 → 183行）、差分不透明、追随コスト爆発の問題が発生した。詳細は [`docs/archive/2026-04-upstream-fidelity-migration.md`](docs/archive/2026-04-upstream-fidelity-migration.md) 参照。

**運用:**

```bash
bin/upstream-diff.sh --sync   # 本家差分検出 + 自動変換
npm test                       # テスト
```

### 2. マルチホスト（Copilot CLI + VS Code Chat）

**判断:** `.github/skills/`, `.github/hooks/` は両ホストで共有し、ホスト固有の挙動は `bin/gstack-detect-host.sh` で分岐する。スキル互換性は Tier A（完全互換）/ B（制限付き）/ C（CLI 専用）に分類。

**Tier C 例:** `/browse`, `/canary`, `/benchmark`（ヘッドレス Chromium 依存）

**理由:** VS Code Copilot Chat (Agent Mode) は Copilot CLI と同じ `.github/skills/`, `.github/hooks/` を読む。配布パッケージ 1 つで両ホストをカバーできる。

### 3. hooks: PascalCase 単一ファイル形式

**判断:** `.github/hooks/lifecycle.json` 1 ファイルに `SessionStart`, `Stop`, `PreToolUse`, `PostToolUse` をまとめる。コマンドキーは `"command"`（VS Code 互換形式）。

**理由:** Copilot CLI と VS Code Chat の両方で動作する形式。本家 Claude Code は同じイベント名を使う（互換）。

### 4. browse: 本家と同一の Bun コンパイル方式

**判断:** 本家 `browse/src/` を vendoring し、`bun build --compile` で単一バイナリ生成。`$B` エイリアスで呼び出す。

**Copilot CLI ビルトイン Playwright MCP との使い分け:**

- 軽量ブラウジング → ビルトイン MCP
- QA テスト（refシステム、差分、レスポンシブ、Cookieインポート） → `/browse`

### 5. `~/.gstack/` ディレクトリの共有 + ホスト分離

**判断:** ホスト非依存の成果物（`projects/`, `plans/`, `analytics/`）は本家と同じパスで共有。Copilot CLI 固有の state は `hosts/copilot-cli/` に隔離。

```
~/.gstack/
├── projects/{slug}/               # 共有（learnings.jsonl 等）
├── plans/                         # 共有
├── analytics/                     # 共有
├── hosts/copilot-cli/             # Copilot CLI 固有
│   ├── installations/
│   ├── capabilities.json
│   └── env/
└── repos/gstack/                  # 上流ローカルクローン（gitignore）
```

**理由:** Claude Code と Copilot CLI を同一マシンで併用するユーザーが、学習記録を共有できる。

### 6. Outside Voice（外部の目）

**判断:** `/gstack-review` と `/ship` の外部レビューは、優先度付きで以下を試行:

1. Copilot CLI ビルトイン `code-review` エージェント
2. Copilot CLI ビルトイン `rubber-duck` エージェント
3. 一般 `task` tool + 敵対レビュー用プロンプト

**理由:** 本家は外部 CLI を使うが、Copilot CLI には外部 CLI 連携はなく `/model` ネイティブ切替がある。fallback でロックインを回避。

### 6.5. マルチモデル Outside Voice（v1.2 で確定）

**判断:** Outside Voice は VS Code Copilot Chat / Copilot CLI のマルチモデル機能で実装する。本家 gstack の `codex exec` を直接呼ぶことはしない。

**仕組み:**

| 役割 | 実装 |
|------|------|
| **プライマリ voice** | ユーザーが選択中のモデル（例: Claude Sonnet 4.6） |
| **Outside voice** | 異なるモデルファミリー（例: GPT-5.4 / Gemini 3.1 Pro） |
| **選択戦略** | `.gstack/model-routing.yaml` + `bin/gstack-codex-probe`（v1.4 で `gstack-outside-voice` rename 予定）が決定。primary が Claude 系なら GPT を、GPT 系なら Claude を自動選択 |
| **起動方法** | `runSubagent({ model: "$GSTACK_OUTSIDE_MODEL", ... })` または task tool の model パラメータ |

**理由（撤廃）:**

- 外部 CLI 不要（Copilot サブスクリプションだけで完結）
- モデル多様性は Copilot がサポートするモデル分だけ確保される
- ユーザーが GPT 単独契約でも Claude を呼べる（Copilot 経由なら）
- 本家の `codex exec` 起動コードをそのまま引き継ぐと「外部 CLI 必須」の誤読を生むため、SKILL.md は `Outside Voice` 表記に統一する

**互換シム名 `gstack-codex-probe` の維持:** 関数名 `_gstack_codex_*`（auth_probe / version_check / log_event / log_hang / available）は本家との API 互換のため保持する。これは Codex CLI への依存ではなく、本家 sync の摩擦低減のための名前空間契約。v1.4 で `gstack-outside-voice` への rename を予定（thin wrapper を残置）。

### 7. インストール: 3 方式

| 方式 | 用途 | コマンド |
|------|------|---------|
| **A: Plugin From Source** | VS Code 中心（推奨） | コマンドパレット → `Chat: Install Plugin From Source` |
| **B: chat.pluginLocations** | スキルを編集しながら使う | `git clone` + settings.json |
| **C: setup --mode user-link** | Copilot CLI 中心 | `git clone && ./setup --mode user-link` |

詳細は [INSTALL.md](INSTALL.md) 参照。

**理由:** プラグインシステムは公式仕様だが、編集や CLI 利用には別ルートが必要。

### 8. テスト: Tier 1 完備、Tier 2/3 は将来

| 層 | 内容 | コスト | 状態 |
|----|------|-------|------|
| **Tier 1: 静的検証** | Vitest（SKILL.md パース、frontmatter、変換 golden） | 無料 | ✅ 444 テスト |
| **Tier 2: E2E** | `copilot -p` で実スキル実行 | ~$3-4/回 | 🔲 未実装 |
| **Tier 3: LLM Judge** | `/model` 切替で品質スコアリング | ~$0.15/回 | 🔲 未実装 |

### 9. JSONL スキーマの本家互換

`learnings.jsonl`, `*-reviews.jsonl`, `skill-usage.jsonl`, `health-history.jsonl` は本家と同一フィールド・同一フォーマット。Copilot 固有キーを追加する場合は本家にないキーを使い、既存フィールドは変更しない。

### 10. `bin/` ユーティリティの本家互換

本家と同名・同インターフェースのスクリプトを `bin/` に配置。本家 `gstack-config`, `gstack-slug`, `gstack-review-log` 等と同名で使えるため、SKILL.md のコマンド参照変換が最小化される。詳細は `upstream-tracking.md` の「bin/ 互換性」表参照。

## 取り込み対象外（意図的除外）

| カテゴリ | 理由 |
|---------|------|
| `hosts/*.ts` 宣言的ホスト設定（10 ホスト） | Copilot CLI + VS Code Chat に集中 |
| `gen-skill-docs.ts` パイプライン | 軽量 sed 変換で十分（`bin/adapt-upstream-skill.sh`） |
| OpenClaw / ClawHub | Claude Code エコシステム固有 |
| Supabase テレメトリ | プライバシー優先 |
| Chrome 拡張 / サイドバー | Copilot CLI の `/ide` で代替 |
| PowerShell ネイティブ対応 | WSL (Ubuntu) に統一 |
| GBrain Sync（クロスマシンメモリ） | `store_memory` + `session_store_sql` で代替 |
| ML Prompt Injection Defense（BERT 分類器） | サイドバー固有。プラットフォーム側で防御 |
| Model Overlays | Copilot CLI `/model` でネイティブ切替 |

## 優先順位体系

```
ユーザー主権 > copilot-instructions.md > skills > hooks
```

`ETHOS.md` の 3 原則（湖を沸かせ／作る前に探せ／ユーザー主権）に従う。

## 上流追跡の運用ルール

`upstream-tracking.md` を **互換性台帳** として運用する:

- 本家 tag / commit
- 最終検証日
- 互換性ステータス（`vendored` / `compat-patched` / `behavior-verified` / `adapted` / `diverged` / `excluded`）
- 影響範囲（skill / hook / bin / docs / browse）

変更分類と目標反映時間:

- **Class A: 文言・説明のみ** — 7 日以内
- **Class B: チェックリスト・判定基準・フロー変更** — 72 時間以内
- **Class C: コマンド名・ファイル配置・hook 契約の変更** — 24 時間以内

未反映の差分は黙って放置せず、`upstream-tracking.md` に `diverged` と理由を書いて見える化する。

## 配布の二重化防止

`gstack-copilot-jp` リポジトリには本家のファイルを一切コミットしない。

- `~/.gstack/repos/gstack/` は **ランタイム参照のみ**（gitignore 対象）
- 適応スクリプトは本家ファイルを「読み取り → 変換 → 出力」する
- SKILL.md は本家 SKILL.md の翻案（コピーではない）。プレースホルダー展開・ツール名変換・日本語適応を経て別の著作物として作成
- README に本家へのリンクとライセンス情報を明記し、派生元であることを明示

## ターゲットユーザー

- GitHub Copilot（CLI + VS Code Chat）を使う日本語話者の開発者
- macOS / Linux / WSL (Ubuntu) 環境

## スコープ外

- Cursor / Codex / Gemini CLI / その他ホスト対応
- Windows PowerShell ネイティブ対応
- テレメトリ / アナリティクス（プライバシー優先）
- テンプレートビルドシステム（手書き + sed 変換で十分）
- 有料化（OSS として公開）
