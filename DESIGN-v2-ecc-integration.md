# gstack-copilot-jp v1.0 — ECC知見統合 & Copilot CLIデザインドキュメント

## 概要

everything-claude-code (ECC) の戦場で磨かれたパターンを、GitHub Copilot（VS Code + CLI）向けに再設計して取り込む。ECCのコードではなく概念を移植し、Copilotのマルチモデル対応と日本語ネイティブという独自の優位性を活かして「GitHub Copilot唯一の本格エージェントハーネス最適化システム」を構築する。

## 問題

gstack-copilot-jpは34スキル・7エージェントでスプリントプロセスの全フェーズをカバーしているが、以下が欠けている：

1. **TDDワークフローがない** — テストファーストを強制する仕組みがなく、テストは後付けになりがち
2. **ビルドエラーの自動修復がない** — エラーが出たら手動で1つずつ対処
3. **並列実行ができない** — `/review` のサブエージェントdispatchはあるが、実装レベルの並列化はない
4. **学習が手動** — `/learn` は手動記録のみ。セッション終了時の自動パターン抽出がない
5. **ルール体系がない** — スキルは呼ばなければ発動しない。常時適用のガイドラインがない
6. **コンテキスト管理がない** — 長いセッションでの情報劣化に対する戦略がない

## ターゲットユーザー

- **一次ユーザー**: 自分自身 — 会社ポリシーでGitHub Copilotのみ使用可能な開発者
- **二次ユーザー（v1.0公開後）**: 日本の開発者 — GitHub Copilotで高い生産性を求める人

## 提案するアプローチ

### アプローチB: 実用版（段階的強化）

ECCの183スキルを全移植するのではなく、**最もインパクトの高い概念を選別し、Copilot環境に最適化して再設計する**。

---

## ロードマップ

### v0.5: ECC概念統合（最小の楔）

| # | 機能 | ECCの参照元 | gstackでの形 | 工数（人間/AI） |
|---|------|-----------|-------------|----------------|
| 1 | TDDワークフロー | `skills/tdd-workflow/` | `/tdd` スキル | 1日 / 30分 |
| 2 | ビルドエラー自動修復 | `commands/build-fix.md` | `/build-fix` スキル | 1日 / 30分 |
| 3 | ルール体系 | `rules/common/` + `rules/typescript/` | `.github/rules/` ディレクトリ | 2日 / 1時間 |
| 4 | 自動学習ループ | `skills/continuous-learning-v2/` | `/learn` 強化 + メモリ自動抽出 | 1日 / 45分 |
| 5 | De-Sloppifyパターン | `skills/autonomous-loops/` §5 | `/clean` スキル | 半日 / 20分 |

### v0.6: マルチモデル活用（独自優位性）

| # | 機能 | ECCの参照元 | gstackでの形 | 工数（人間/AI） |
|---|------|-----------|-------------|----------------|
| 6 | マルチモデルルーティング | `commands/multi-plan.md` | `/multi-plan` スキル | 3日 / 1時間 |
| 7 | 並列実行 | `commands/multi-execute.md` | `/multi-execute` スキル | 2.5日 / 1.5時間 |
| 8 | クロスモデルレビュー強化 | `/second-opinion` 拡張 | `/second-opinion` 改修 | 1.5日 / 30分 |

### v0.7: セッション管理 & コンテキスト最適化

| # | 機能 | ECCの参照元 | gstackでの形 | 工数（人間/AI） |
|---|------|-----------|-------------|----------------|
| 9 | セッション管理 | `commands/sessions.md` | メモリシステム活用 | 1日 / 30分 |
| 10 | 戦略的コンパクション | `skills/strategic-compact/` | instructions追加 | 半日 / 20分 |
| 11 | 自律ループ基盤 | `skills/autonomous-loops/` §1-2 | `/loop` スキル | 2日 / 1時間 |

### v0.8: 安定化 & インストール体験改善

| # | 機能 | 内容 | 工数（人間/AI） |
|---|------|------|----------------|
| 12 | バグフィックス | 実使用で発見された問題修正 | 継続的 |
| 13 | リファクタリング | スキル間の一貫性、テンプレート統一 | 2日 / 1時間 |
| 14 | ドキュメント整備 | ガイド・チュートリアル | 2日 / 1時間 |

### v1.0: リブランディング & 公開

| # | 機能 | 内容 | 工数（人間/AI） |
|---|------|------|----------------|
| 15 | リブランディング | 名前・README・ロゴ・アイデンティティ | 1日 / 30分 |
| 16 | コミュニティ準備 | CONTRIBUTING.md、Issue テンプレート | 1日 / 30分 |
| 17 | 公開 | GitHub public化、告知 | 半日 |

---

## 各機能の設計詳細

### 1. TDDワークフロー (`/tdd`)

**ECCの概念**: RED → GREEN → REFACTOR の厳格なサイクル。80%+ カバレッジ必須。

**Copilot向け再設計**:

```
フェーズ1: RED（失敗するテストを書く）
  - テストファイル作成
  - テスト実行 → 失敗を確認
  - git commit "test: RED - [テスト名]"

フェーズ2: GREEN（最小限の実装で通す）
  - テストが通る最小のコードを書く
  - テスト実行 → 全テスト通過を確認
  - git commit "feat: GREEN - [機能名]"

フェーズ3: REFACTOR（品質を上げる）
  - リファクタリング（テストは変更しない）
  - テスト実行 → 全テスト通過を確認
  - git commit "refactor: [改善内容]"
```

**ECCとの差異**:
- ECC: bash hookでチェックポイントを自動化 → gstack: VS Codeのテストランナー統合で視覚的に
- ECC: Claude Code固有の `run_in_background` → gstack: ターミナルで直接実行
- 追加: カバレッジ目標をプロジェクト設定（`.vscode/settings.json`）から読み取る

### 2. ビルドエラー自動修復 (`/build-fix`)

**ECCの概念**: ビルドシステム自動検出 → エラー解析 → 依存順でインクリメンタル修正。

**Copilot向け再設計**:

```
ステップ1: ビルドシステム検出
  - package.json → npm/pnpm/yarn/bun
  - Cargo.toml → cargo
  - go.mod → go
  - pyproject.toml → python
  - pom.xml/build.gradle → java

ステップ2: ビルド実行 & エラー収集
  - VS Code Problemsパネルのエラーも活用
  - TypeScript Language Serverの診断情報を優先使用

ステップ3: エラーのグルーピング & 優先順位付け
  - インポート/型エラー → ロジックエラー の順で修正
  - ファイル単位でグルーピング

ステップ4: インクリメンタル修正ループ
  - 1エラーずつ修正 → 再ビルド → 確認
  - 停止条件: 同一エラーが3回連続、または修正で新エラー増加
```

**ECCとの差異**:
- ECC: shell実行で `npm run build` → gstack: `get_errors` ツール + ターミナル実行の両方
- 追加: VS Code Problems パネルとの連携

### 3. ルール体系

**ECCの概念**: `rules/common/`（普遍）+ `rules/typescript/`（言語固有）の階層構造。ルールはスキルと異なり**常時適用**。

**Copilot向け再設計**:

```
.github/
  rules/                          # ← 新規追加
    common/
      coding-style.md             # 不変性、ファイル構成、命名規則
      git-workflow.md             # コミットメッセージ、ブランチ戦略
      testing.md                  # テスト規約、カバレッジ要件
      security.md                 # セキュリティチェックリスト
    typescript/
      coding-style.md             # TS固有のパターン
      testing.md                  # Jest/Vitest/Playwright規約
    python/
      coding-style.md             # Python固有のパターン
      testing.md                  # pytest規約
```

**適用メカニズム**:
- `copilot-instructions.md` からルールディレクトリを参照
- ルールは `instructions/*.instructions.md` と同様に常時ロードされる
- スキルとの違い: スキルは呼び出し時のみ発動、ルールは常時適用

**ECCとの差異**:
- ECC: `~/.claude/rules/` にコピー → gstack: `.github/rules/` にプロジェクト同梱
- ECC: 12言語対応 → gstack: まずcommon + typescript + pythonの3つ
- 追加: 各ルールに `applyTo` グロブパターンでファイル種別制限

### 4. 自動学習ループ（`/learn` 強化）

**ECCの概念**: PreToolUse/PostToolUse hookで全ツール呼び出しを観察 → instinct（本能）として自動抽出 → 信頼度スコア付き → 2+プロジェクトで見たら昇格。

**Copilot向け再設計**:

ECCのhookシステムはCopilotにないため、**セッション終了時の振り返り型**に再設計：

```
現行の /learn:
  手動で「これを記録して」→ メモリに保存

強化版の /learn:
  1. セッション中の重要な決定・修正を自動トラッキング
     - ファイル変更のサマリー
     - エラー→修正のパターン
     - ユーザーが却下した提案（sovereignty記録）
  2. セッション終了前に自動振り返り提案
     - 「今日のセッションからN個のパターンを検出しました」
     - 各パターンに信頼度（0.3-0.9）付与
  3. ユーザー承認後にメモリに保存
     - project-scoped: /memories/repo/ に
     - global: /memories/ に
```

**instinct フォーマット**:
```yaml
type: pitfall | pattern | preference | architecture | operational
key: unique-identifier
insight: 1文の本質
confidence: 0.3-0.9
source: observed | user-stated | inferred
projects: [project-hash-1, project-hash-2]  # 2+で昇格候補
```

**ECCとの差異**:
- ECC: hookベースのリアルタイム観察 → gstack: セッション振り返り型
- ECC: 背景エージェント（Haiku）が常時分析 → gstack: `/learn` 呼び出し時に分析
- 追加: ユーザー主権の記録（AIの提案をユーザーが却下 → 好みとして学習）

### 5. De-Sloppifyパターン (`/clean`)

**ECCの概念**: 実装パスとクリーンアップパスを分離。「ネガティブ指示を出さない代わりに、別のパスで掃除する」。

**Copilot向け再設計**:

```
/clean 実行:
  1. 直前の実装の差分を取得
  2. 以下をスキャン:
     - console.log / print 文（デバッグ残骸）
     - TODO / FIXME / HACK コメント
     - 未使用のインポート・変数
     - any 型の使用（TypeScript）
     - ハードコードされた値（マジックナンバー）
     - テストのスキップ（.skip, @pytest.mark.skip）
  3. 各項目を分類: 自動修正可 / 要確認
  4. 自動修正を適用、要確認をリストで提示
```

**ECCとの差異**:
- ECC: `claude -p` の2パス実行（生成→クリーン） → gstack: 単一スキルとして呼び出し
- 追加: プロジェクトの lint 設定（ESLint, Ruff 等）と連携

### 6. マルチモデルルーティング (`/multi-plan`)

**ECCの概念**: Codex（バックエンド権威）+ Gemini（フロントエンド権威）に並列で分析させ、Claude が統合。

**Copilot向け再設計（独自優位性）**:

GitHub Copilotのマルチモデル対応を活かす。ECCは外部API呼び出しが必要だが、**Copilotなら設定だけでモデルを切り替えられる**。

```
/multi-plan 実行:
  ステップ1: コンテキスト収集
    - プロジェクト構造、既存コード、要件をまとめる

  ステップ2: 複数モデルによる並列分析
    - モデルA（例: Claude）に「バックエンド設計」を依頼
    - モデルB（例: GPT-4o）に「フロントエンド設計」を依頼
    - モデルC（例: Gemini）に「テスト戦略」を依頼

  ステップ3: 統合
    - 各モデルの出力を比較
    - 合意点 → 高信頼度で採用
    - 相違点 → ユーザーに選択肢として提示
    - 統合プランを .gstack/plans/[feature].md に保存

  ステップ4: ハンドオフ
    - /multi-execute に渡す、または手動実装
```

**モデルルーティング表**（ユーザーがカスタマイズ可能）:

```yaml
# .gstack/model-routing.yaml
routing:
  backend:
    model: claude-sonnet-4
    strength: "アーキテクチャ、型安全性、エラーハンドリング"
  frontend:
    model: gpt-4o
    strength: "UI/UX、アクセシビリティ、レスポンシブ"
  testing:
    model: gemini-2.5-pro
    strength: "エッジケース発見、テスト生成"
  review:
    model: claude-opus-4
    strength: "深い推論、セキュリティ、アーキテクチャ"
  quick:
    model: gpt-4o-mini
    strength: "高速な定型作業、フォーマッティング"
```

**ECCとの差異**:
- ECC: `codeagent-wrapper` で外部API呼び出し → gstack: Copilotのネイティブモデル切替
- ECC: ファイルシステムアクセスを禁止（Unified Diff Patch返却） → gstack: モデル間で直接ファイル編集可能
- ECC: Claude固定のオーケストレーター → gstack: ユーザーが選んだモデルがオーケストレーター
- 追加: モデルルーティング設定ファイル（`.gstack/model-routing.yaml`）

### 7. 並列実行 (`/multi-execute`)

**ECCの概念**: multi-planで作成した計画を、複数モデルが並列で実装 → オーケストレーターが統合。

**Copilot向け再設計**:

VS Code Copilotの制約: 現時点では**1つのChatセッションで1つのモデルが1つのタスクを処理**する（真の並列ではない）。

**実現可能なアプローチ**:

```
/multi-execute 実行:

  アプローチ1: 直列だが高速（現実的）
    - /multi-plan の結果を読み込む
    - タスクを依存関係順にソート
    - 各タスクを最適モデルで順次実行
    - 各ステップ後にテスト実行

  アプローチ2: サブエージェント並列（VS Code対応時）
    - VS Code の Agent mode が複数サブエージェントをサポートした場合
    - 各サブエージェントに異なるモデルを割り当て
    - ファイルレベルの排他制御（同一ファイルは1エージェントのみ）

  アプローチ3: ワークスペース分割（上級者向け）
    - git worktreeで作業ディレクトリを分割
    - 各worktreeで別のCopilotセッション
    - 完了後にマージ
```

**現時点の推奨: アプローチ1**（直列だが自動実行）

真の並列実行はVS Codeの機能進化を待つ必要がある。だがアプローチ1でも、**手動で1つずつ指示する現状と比べて大幅な改善**になる。

### 8. クロスモデルレビュー強化 (`/second-opinion` 改修)

**現状**: `/second-opinion` は別モデルによるレビューを提供。

**強化内容**:

```
現行:
  1つの別モデルにレビューを依頼

強化版:
  1. /review の結果を入力として受け取る
  2. 別モデルに同じdiffをレビューさせる
  3. クロスモデル分析:
     - 両方が指摘 → 高信頼度の問題
     - 片方だけが指摘 → 追加検証が必要
     - 両方がスルー → 問題なし（ただし保証はない）
  4. 信頼度マトリクスとして出力
```

### 9-11. セッション管理、戦略的コンパクション、自律ループ

**セッション管理**:
- メモリシステム（`/memories/session/`）を活用
- セッション開始時にコンテキスト自動ロード
- セッション終了時に `/learn` 自動提案

**戦略的コンパクション**:
- `.github/instructions/` に `context-management.instructions.md` 追加
- タスク境界（調査→実装、実装→テスト）でのコンテキスト整理ガイドライン

**自律ループ (`/loop`)**:
- ECCの Sequential Pipeline パターンを移植
- 計画ファイル（`.gstack/plans/*.md`）を読み込み → ステップ順に自動実行
- 各ステップ後にテスト実行 → 失敗なら停止
- 最大実行回数・最大時間の安全弁

### 12-14. インストール体験 & リブランディング（v0.8-v1.0）

**インストール方式: ワークスペースフォルダ追加**

VS Code v1.116+ と GitHub Copilot が前提。セットアップスクリプト不要。

```
1. git clone https://github.com/[user]/gstack-copilot-jp.git
2. VS Code でマルチルートワークスペースにフォルダ追加
3. 完了。スキル・エージェント・ルールが自動認識される
```

**なぜこれで動くのか**:
- `.github/copilot-instructions.md` → ワークスペース内ならCopilotが自動読み込み
- `.github/skills/*/SKILL.md` → ワークスペース内なら自動認識
- `.github/agents/*.agent.md` → 同上
- `.github/instructions/*.instructions.md` → 同上
- `.github/prompts/*.prompt.md` → 同上

**メリット**:
- セットアップスクリプト完全不要
- シンボリックリンク / ジャンクション / 管理者権限の問題が消滅
- `git pull` で即座に最新版
- Windows / macOS / Linux 完全クロスプラットフォーム
- スキル追加時の再セットアップ不要

**リブランディング候補**:
- 現在の `gstack-copilot-jp` は「gstack（Garry Tan作）の移植」という印象
- v1.0で独自の名前・アイデンティティを持つ
- 候補名は後日のオフィスアワーで検討

---

## 技術的考慮事項

### Copilot固有の制約

| 制約 | ECCでの解決策 | gstackでの対応 |
|------|-------------|---------------|
| hookシステムなし | PreToolUse/PostToolUse hook | instructions + スキル内ロジック |
| プラグインシステムなし | `.claude-plugin/plugin.json` | `.github/skills/` + `.github/copilot-instructions.md` |
| バックグラウンドエージェントなし | 背景Haiku観察者 | セッション振り返り型 |
| ネイティブ並列エージェントなし | `/multi-execute` | 直列自動実行 → 将来の並列対応待ち |
| ルール自動ロード機能なし | `~/.claude/rules/` | `instructions` に統合参照 |

### ファイル構成の変更

```
.github/
  rules/                    # ← v0.5で新規追加
    common/
    typescript/
    python/
  skills/
    tdd/SKILL.md            # ← v0.5で新規追加
    build-fix/SKILL.md      # ← v0.5で新規追加
    clean/SKILL.md          # ← v0.5で新規追加
    multi-plan/SKILL.md     # ← v0.6で新規追加
    multi-execute/SKILL.md  # ← v0.6で新規追加
    loop/SKILL.md           # ← v0.7で新規追加
  instructions/
    context-management.instructions.md  # ← v0.7で新規追加

.gstack/
  model-routing.yaml        # ← v0.6で新規追加
  plans/                    # ← v0.6で新規追加
```

---

## 成功指標

| 指標 | 現在値 | v0.5目標 | v0.8目標 | v1.0目標 | 計測方法 |
|------|--------|---------|---------|---------|---------|   
| スキル数 | 34 | 39 (+5) | 42 (+8) | 42+ | `ls .github/skills/` |
| ルール数 | 0 | 10+ | 15+ | 15+ | `ls .github/rules/**/*.md` |
| TDD採用率 | 0% | 自分の新機能で100% | — | — | 主観評価 |
| ビルドエラー手動対処 | 100% | 20%以下 | 10%以下 | 10%以下 | `/build-fix` 使用率 |
| セッションあたりの手動指示数 | 多い | 半減 | 1/3以下 | 1/3以下 | 主観評価 |
| インストール | setup.ps1必要 | setup.ps1必要 | ワークスペース追加のみ | ワークスペース追加のみ | 手順数 |
| 公開 | 非公開 | 非公開 | 非公開 | 公開 | v1.0で公開 |

---

## スコープ外

- **ECCのhookシステムの再現** — Copilotにhook APIがないため不可能。instruction + スキルで代替
- **ECCのプラグインマーケットプレース** — Copilot拡張マーケットプレースは別の仕組み
- **183スキル全移植** — 質で勝負。ECCのドメイン固有スキル（Django, Laravel, Spring Boot等）は需要が出てから
- **有料化** — OSSとして公開。将来の判断はv1.0以降
- **Cursor / Codex / OpenCode対応** — GitHub Copilot専用に集中
- **GitHub Copilot CLI対応** — VS Code + GitHub Copilotに特化。CLIは将来のVS Code進化で再評価

---

## 工数見積もり（全体）

| マイルストーン | 人間工数 | AI工数 | 圧縮率 |
|-------------|---------|--------|-------|
| v0.5: ECC概念統合 | 5日 | 3時間 | ~13x |
| v0.6: マルチモデル | 7日 | 3時間 | ~19x |
| v0.7: セッション管理 | 3.5日 | 2時間 | ~14x |
| v0.8: 安定化 + DX改善 | 4日 | 2時間 | ~16x |
| v1.0: リブランド + 公開 | 2.5日 | 1時間 | ~20x |
| **合計** | **22日** | **11時間** | **~16x** |

---

## 優先順位の根拠

### なぜv0.5のスコープがこれなのか

1. **TDD** — テストファーストは全てのスキルの品質を底上げする基盤
2. **build-fix** — 即座に体感できる生産性向上（エラー修正が自動化される）
3. **ルール体系** — 常時適用のガイドラインがあれば、各スキルの出力品質が均一化
4. **自動学習** — 使えば使うほど賢くなる → 長期的なレバレッジ
5. **De-Sloppify** — 「AIが書いたコードのAI臭さ」を自動除去 → 品質の最後の砦

### なぜマルチモデルがv0.6なのか

- Copilot固有の独自優位性だが、先にTDD/rules/learnの基盤がないとマルチモデルの恩恵が薄い
- 基盤が整ってからモデル間ルーティングを載せる方が、品質が高い

### なぜCLIはスコープ外なのか

- VS Code v1.116+ と GitHub Copilot が前提。この環境ではワークスペースフォルダ追加だけで全スキルが動く
- CLI対応は複雑性を増す割に価値が不明確
- 将来VS CodeのCLI統合が進化すれば再評価

### なぜv1.0で公開なのか

- v1.0 = 公開品質。0.x系は自分自身で検証する期間
- リブランディングと公開を同時に行うことで、新しい名前での初印象を最適化

---

## レビュー結果（2026-04-18 autoplan）

### 判断記録

| 判断 | 選択 | 理由 |
|------|------|------|
| ルール適用方式 | B: rulesディレクトリ分離 | 構造が綺麗。Copilotの参照はv0.5初期で実測 |
| 初回体験スキル | A: `/status` | 1秒で価値が分かる。ファーストタッチに最適 |
| 先行公開 | しない | まず自分で試す。v1.0で公開 |
| v0.6工数 | 5日→7日に修正 | マルチモデル検証に追加時間 |
| v0.8工数 | 安定化+DX改善に統合 | CLI削除でスコープ縮小 |

### レビューサマリー

| フェーズ | 結果 |
|---------|------|
| CEOレビュー | GO（選択拡大） |
| デザインレビュー | スキップ（UIなし） |
| Engレビュー | APPROVE（条件付き） |
| DXレビュー | 5/10（改善必要） |

### Eng条件
1. ルール体系のトークン影響をv0.5初期で実測
2. copilot-instructions.md の自動生成メカニズム検討
3. SKILL.mdサイズ上限を文書化（300行以下推奨）

### DX最優先改善
1. `/status` をファーストタッチに設定
2. TROUBLESHOOTING.md 作成
3. **ワークスペースフォルダ追加方式へ移行** — setup.ps1/setup.shを廃止し、`git clone` + VS Codeワークスペース追加のみで動作するように変更。シンボリックリンク・管理者権限・スクリプト再実行の問題が全て消滅する

## 次のステップ

- **v0.5 実装完了** — TDDスキル、build-fix、ルール体系、learn強化、clean ✅
- **v0.6 実装完了** — multi-plan、multi-execute、second-opinion強化 ✅
- **次: v0.7** — セッション管理、コンテキスト最適化、自律ループ
