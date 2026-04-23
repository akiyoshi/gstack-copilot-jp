# Upstream Fidelity Recovery デザインドキュメント

## 概要

本家 gstack の SKILL.md をベースとして採用し、最小限の適応のみ施す方針に転換する。AI生成による全文書き換えを廃止し、upstream との差分を明確・検証可能にする。

## 問題

現在の gstack-copilot-jp は、本家スキルを AI に「Copilot CLI 向けに適応して」と生成させている。結果：

1. **差分が不透明** — 本家と同じ品質で動いているか検証できない
2. **情報の欠落** — upstream office-hours のスキル固有部分は 1251行、local は 183行。7分の1に圧縮されている
3. **追随コストが高い** — 本家更新のたびに差分判断 → AI再生成 → 検証のサイクルが必要
4. **upstream-tracking の形骸化** — `.md` は `same` と記載、`.json` は `unaudited` が33スキル。実態と乖離

## ターゲットユーザー

gstack-copilot-jp のメンテナー（自分自身）。二次的にエンドユーザー（スキルの品質向上）。

## 提案するアプローチ

### 原則: 3層分離モデル

```
┌─────────────────────────────────┐
│  Layer 1: upstream skill body   │ ← 本家 SKILL.md のスキル固有部分（英語）
│  （そのまま採用、差分ゼロが目標）    │
├─────────────────────────────────┤
│  Layer 2: compatibility layer   │ ← Claude Code → Copilot CLI の互換レイヤー
│  （文書化された変換ルールで適用）    │
├─────────────────────────────────┤
│  Layer 3: localization overlay  │ ← 日本語化層
│  （frontmatter + instructions） │
└─────────────────────────────────┘
```

**upstream snapshot のピン留め**: `upstream-tracking.json` に `upstream_commit` を記録し、特定の commit SHA から取得する。再現性を保証。

### Layer 1: Upstream Skill Body の採用

本家 SKILL.md は2部構成：

| 部分 | 行数（office-hours例） | 内容 | 対応方針 |
|------|----------------------|------|---------|
| 共有ボイラープレート | ~870行 | preamble bash, routing, voice, model patches, telemetry 等 | **採用しない**。`copilot-instructions.md` + hooks で代替済み |
| スキル固有コンテンツ | ~1251行 | フェーズ定義、質問、判定基準、出力テンプレート等 | **そのまま採用**（英語） |

共有ボイラープレートは `SKILL.md.tmpl` → `gen-skill-docs` で自動生成される部分。gstack-copilot-jp では `copilot-instructions.md` と hooks が同等の役割を果たす。

#### Preamble Parity Matrix

upstream の共有ボイラープレートと local の対応関係：

| upstream セクション | local での対応 | 状態 |
|---|---|---|
| Preamble bash (update check, sessions, config) | hooks: `sessionStart` / `sessionEnd` | 実装済み（簡略版） |
| Skill routing table | `copilot-instructions.md` スキルルーティング | 実装済み |
| Model-Specific Behavioral Patch | なし（Copilot CLI がモデル差を吸収） | 意図的除外 |
| Voice | `copilot-instructions.md` ボイス | 実装済み |
| Context Recovery | `context-restore` スキル | 実装済み |
| AskUserQuestion Format | `ask_user` tool（Copilot CLI ネイティブ） | 互換 |
| Writing Style (V1) | `copilot-instructions.md` 書き方スタイル | 実装済み |
| Completeness Principle | `copilot-instructions.md` 湖を沸かせ | 実装済み |
| Confusion Protocol | `copilot-instructions.md` Confusion Protocol | 実装済み |
| Continuous Checkpoint Mode | なし | 意図的除外（Copilot CLI にはセッション自動保存がある） |
| Context Health | なし | 未実装（要検討） |
| Question Tuning | なし | 未実装（本家もV1で観察のみ） |
| Repo Ownership | なし | 未実装（要検討） |
| Search Before Building | `copilot-instructions.md` 作る前に探せ | 実装済み |
| Completion Status Protocol | なし | 未実装（要検討） |
| Operational Self-Improvement | `learn` スキル | 実装済み |
| Telemetry | なし | 意図的除外 |
| Plan Mode operations | なし（Copilot CLI に Plan Mode なし） | 意図的除外 |
| Browse SETUP | `bin/gstack-env` + `browse/` | 実装済み（別方式） |

### Layer 2: Compatibility Layer（Claude Code → Copilot CLI 互換ルール）

スキル固有コンテンツに含まれる Claude Code 依存部分の変換ルール。「最小適応」ではなく「互換レイヤー」として設計する:

#### ツール・コマンド変換

| upstream (Claude Code) | local (Copilot CLI) | 備考 |
|---|---|---|
| `Agent` tool | `task` tool | サブエージェント起動 |
| `AskUserQuestion` | `ask_user` tool | 対話 |
| `WebSearch` | `web_search` tool | Web検索 |
| `Read` / `Write` / `Edit` | `view` / `create` / `edit` | ファイル操作 |
| `Bash` | `bash` | 同一 |
| `Grep` / `Glob` | `grep` / `glob` | 同一 |
| `codex exec "..."` | `task` tool（model override） | セカンドオピニオン |
| `codex review` | `task` tool（code-review agent） | コードレビュー |
| `$D` (design binary) | 削除（GPT Image API は Copilot CLI 非対応） | |
| `$B` (browse) | `$B`（gstack-copilot-jp 版 browse） | パス異なる |

#### パス変換

| upstream | local | 備考 |
|---|---|---|
| `~/.claude/skills/gstack/` | `.github/skills/` (プロジェクトローカル) | |
| `~/.gstack/` | `~/.gstack/`（維持） | 既存 hooks/learnings/session が依存。変更しない |
| `~/.gstack/sessions/` | `~/.gstack/sessions/`（維持） | |
| `~/.gstack/projects/$SLUG/` | プロジェクトルート | デザインドキュメント保存先 |
| `~/.gstack/analytics/` | 削除（テレメトリ除外） | |
| `~/.gstack/learnings/` | `store_memory` + `~/.gstack/learnings/`（デュアル） | |

#### Placeholder 変換

upstream の `SKILL.md.tmpl` には以下の placeholder がある。`gen-skill-docs` が解決するもの：

| placeholder | 内容 | 対応 |
|---|---|---|
| `{{PREAMBLE}}` | 共有 preamble bash | 削除（Layer 1 で除外済み） |
| `{{BROWSE_SETUP}}` | browse 初期化 | 削除 or bin/gstack-env に置換 |
| `{{ETHOS}}` | 共有ボイス・原則 | 削除（copilot-instructions.md に存在） |
| `{{GBRAIN_CONTEXT_LOAD}}` | コンテキスト読み込み | 削除 or 簡略版に置換 |
| `{{LEARNINGS_SEARCH}}` | 学習記録検索 | `store_memory` / `session_store_sql` に置換 |
| `{{BASE_BRANCH_DETECT}}` | ベースブランチ検出 | `git` コマンドに置換 |
| `{{BENEFITS_FROM}}` | スキル間依存 | 削除（情報のみ） |

**注意**: 生成済み SKILL.md を追跡対象とする。`.tmpl` は参照のみ。

#### 補助ファイル

一部のスキルは SKILL.md 以外のファイルを参照する：

| スキル | 補助ファイル | 対応 |
|---|---|---|
| `review` | `checklist.md`, `greptile-triage.md` | 要調査。必要なら移植 |
| `ship` | 参照ファイルあるか要調査 | 要調査 |
| その他 | パイロットで発見次第対応 | |

### Layer 3: Localization Overlay（日本語化層）

#### 日本語化の境界

先行事例（[note.com/makyua3](https://note.com/makyua3/n/nb213f3bbbd84)）に基づき、日本語化は最小限に：

| 対象 | 日本語化 | 方法 |
|---|---|---|
| SKILL.md frontmatter `description` | **する** | 日本語で記述 |
| SKILL.md frontmatter `argument-hint` | **する** | 日本語で記述 |
| SKILL.md frontmatter `triggers` | **する**（日本語トリガー追加） | upstream triggers + 日本語 triggers |
| SKILL.md 本体（指示・フロー） | **しない** | 英語のまま |
| ユーザー向け質問文・出力テンプレート | **要検証** | パイロットで実測 |
| `copilot-instructions.md` | **する** | 日本語 I/O 指示を追加 |
| `copilot-plugin.json` routing descriptions | **する** | 日本語で記述 |

#### copilot-instructions.md への追加

```markdown
## 言語

このプロジェクトは日本語ファーストで進める。

- ユーザーへの応答は常に日本語で行う
- スキル、ツール、プロンプト、外部ドキュメントが英語で書かれていても、
  作業の結論とユーザー向け出力は日本語にする
- スキルのデフォルト言語がこのルールを上書きしないこと
```

#### 要検証: ユーザー向けテキストの言語

upstream スキルにはユーザーにそのまま見せる英語テキストがある（質問文、レポートヘッダー、verdict ラベル等）。`copilot-instructions.md` の日本語指示でLLMがこれらを自動翻訳するか、パイロットで実測する。

**判定基準**: パイロット3スキルで、ユーザー向け出力の95%以上が自然な日本語であればOK。混在する場合は、user-facing strings の日本語 overlay を追加する。

## 移行戦略

### Phase 0: 言語実験（移行判断の前提条件）

目的: 英語スキル + copilot-instructions.md の日本語指示で、ユーザー向け出力が自然な日本語になるか実証する。

手順:
1. office-hours の upstream スキル固有部分を `adapt-upstream-skill.sh` で変換し SKILL.md に配置
2. copilot-instructions.md に言語セクションを追加
3. 実際に日本語で対話し、出力を確認
4. 判定: 自然な日本語 → GO、英語混在が多い → user-facing strings の overlay 要設計

工数: 人間30分 / AI15分

**この実験が失敗したら、以降の Phase は全て中止。**

### Phase 1: パイロット（3スキル）

対象:
- `office-hours` — 対話・出力が重い。日本語品質の検証に最適
- `plan-eng-review` — 構造が複雑。適応ルールの網羅性を検証
- `careful` — ランタイム契約（hook連携）の検証

#### Step 0: 前提検証（Phase 1 の最初に実施）

1. **frontmatter 互換性スパイク**: upstream の frontmatter フィールド（`preamble-tier`, `version`, `allowed-tools`, `triggers`）が Copilot CLI の `copilot-plugin.json` と干渉しないか検証。最小再現スキルで確認
2. **upstream snapshot の固定**: 本家 v1.4.0.0 の SKILL.md を `test/fixtures/upstream/` に保存。以降の diff はこの snapshot 基準
3. **抽出ルールの定義**: 各 SKILL.md のスキル固有部分の開始位置を特定するアンカーパターンを文書化（例: `# YC Office Hours` 以降がスキル固有）

#### Step 1-4: 移行実行

1. upstream SKILL.md からスキル固有部分を抽出（Step 0 で定義したアンカーで切り出し）
2. Layer 2 の変換ルールを適用
3. Layer 3 の frontmatter 日本語化を適用
4. `copilot-instructions.md` に言語指示を追加

#### Step 5: 検証

5. 実際に使って日本語出力品質を検証（ユーザー向け出力が自然な日本語か目視確認）
6. 既存テスト（`test/skill-contracts.test.js`）の通過を確認
7. 補助ファイルの依存有無を調査し、Phase 2 向けにスキル分類（依存あり/なし）を作成

### Phase 2: unaudited スキル一括移行

Phase 1 の検証結果を踏まえ、残り30スキルに同じ手順を適用。

- 変換ルールが確定していれば、スクリプトで半自動化可能
- `upstream-tracking.json` を `unaudited` → `vendored` → `compat-patched` → `behavior-verified` に更新（機械検証後のみ）
- `upstream-tracking.md` は `.json` から生成する形に変更

### upstream-tracking.json 状態モデル

```
status: "unaudited" | "vendored" | "compat-patched" | "behavior-verified" | "adapted" | "excluded"

unaudited:         未監査（初期状態）
vendored:          upstream スキル固有部分を取り込み済み
compat-patched:    互換レイヤーを適用済み
behavior-verified: 日本語動作テストに通過
adapted:           意図的な独自改善を含む（upstream base + local patch）
excluded:          追跡対象外（独自スキル）
```

「same」は廃止。テキスト一致ではなく動作検証で状態を進める。

### Phase 3: adapted スキルのoverlay化（次スプリント）

今スプリントのスコープ外。方針のみ記載：

- upstream base + local patch を明示的に分離
- 意図的な改善点は `upstream-tracking.json` の `exclusions` に記録済み
- overlay model: upstream 更新時、base を差し替え → patch を再適用

### diverged スキルの扱い

`/tdd`, `/sprint`, `/status` は gstack-copilot-jp 独自。将来的に：
- 本家に同等機能が実装されたら → upstream base に移行
- 本家に実装されなかったら → 廃止を検討
- 今スプリントでは変更しない

## 成功指標

1. **忠実度**: パイロット3スキルについて、upstream スキル固有部分との diff が Layer 2 の変換ルール部分のみ
2. **日本語品質**: ユーザー向け出力の95%以上が自然な日本語
3. **テスト通過**: 既存テスト suite が全パス
4. **追随コスト**: 本家更新の取り込みが「diff確認 → 変換ルール適用」の機械的作業になること

## スコープ外

- adapted スキル（autoplan, review, ship, cso）の移行 → Phase 3
- diverged スキル（tdd, sprint, status）→ 将来検討
- upstream 共有ボイラープレートの完全再現 → 意図的除外（parity matrix で管理）
- テレメトリ、Plan Mode、Model Patches → Copilot CLI で不要/代替あり

## 工数見積もり

| フェーズ | 人間 | AI | 圧縮率 |
|---------|------|-----|--------|
| Phase 1: パイロット3スキル | 2時間 | 30分 | ~4x |
| Phase 2: 残り30スキル | 4時間 | 2時間 | ~2x |
| copilot-instructions.md 改修 | 30分 | 10分 | ~3x |
| テスト修正 | 1時間 | 20分 | ~3x |
| **合計** | **7.5時間** | **3時間** | **~2.5x** |

## 未解決の懸念

1. **ユーザー向けテキストの言語**: パイロットで実測するまで判断保留。英語スキル内の質問文をLLMが自動翻訳するかは未検証。判定基準: パイロット3スキルを実際に実行し、出力サンプル5件以上で日本語率を目視確認
2. **補助ファイルの棚卸し**: `review` の `checklist.md` 等、スキル固有の依存ファイルの全量は Phase 1 Step 7 で調査
3. **frontmatter スキーマの差異**: upstream は `preamble-tier`, `version`, `allowed-tools` 等のフィールドを持つ。Phase 1 Step 0 の互換性スパイクで検証
