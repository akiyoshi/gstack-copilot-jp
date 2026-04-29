# Upstream Fidelity Recovery デザインドキュメント

## 概要

本家 gstack の SKILL.md をベースとして採用し、Claude Code → Copilot CLI の互換変換のみ施す。AI生成による全文書き換えを廃止し、upstream との差分を明確・検証可能にした。

## 背景

gstack-copilot-jp は本家スキルを AI に「Copilot CLI 向けに適応して」と生成させていた。結果:

1. **情報の欠落** — upstream office-hours のスキル固有部分は 1251行、local は 183行。7分の1に圧縮
2. **差分が不透明** — 本家と同じ品質で動いているか検証不能
3. **追随コストが高い** — 本家更新のたびに AI 再生成 → 検証のサイクル
4. **Claude Code 固有参照の残留** — `CLAUDE.md`, `.claude/`, `codex exec`, `ExitPlanMode` 等が約2,600箇所

## 実装済みアプローチ

### 3層分離モデル

```
┌─────────────────────────────────┐
│  Layer 1: upstream skill body   │ ← 本家 SKILL.md のスキル固有部分（英語）
│  （そのまま採用、差分ゼロが目標）    │
├─────────────────────────────────┤
│  Layer 2: compatibility layer   │ ← Claude Code → Copilot CLI 互換レイヤー
│  （103の sed 変換ルールで適用）     │
├─────────────────────────────────┤
│  Layer 3: localization overlay  │ ← 日本語化層
│  （frontmatter + instructions） │
└─────────────────────────────────┘
```

### Layer 1: upstream スキル固有部分の抽出

本家 SKILL.md は2部構成。awk でコードブロックを追跡し、最初の h1（`# [A-Z]`）以降をスキル固有部分として抽出する。

| 部分 | 行数（office-hours例） | 対応 |
|------|----------------------|------|
| 共有ボイラープレート | ~870行 | **除去** — `copilot-instructions.md` + hooks で代替 |
| スキル固有コンテンツ | ~1251行 | **そのまま採用**（英語） |

**upstream snapshot のピン留め**: `upstream-tracking.json` の `upstream_commit` で commit SHA を記録。再現性を保証。

### Layer 2: 互換レイヤー（103変換ルール）

`bin/adapt-upstream-skill.sh` が一気通貫で適用する。主要カテゴリ:

| カテゴリ | 変換例 | ルール数 |
|---------|--------|---------|
| ツール名 | `Agent` → `task`, `AskUserQuestion` → `ask_user`, `WebSearch` → `web_search` | 9 |
| パス | `~/.claude/skills/gstack/` → `.github/skills/`, `CLAUDE.md` → `copilot-instructions.md` | 8 |
| placeholder | `{{PREAMBLE}}`, `{{ETHOS}}`, `{{GBRAIN_CONTEXT_LOAD}}` 等を削除 | 7 |
| 本家固有バイナリ | `gstack-config`, `gstack-timeline-log`, `gstack-telemetry-log` 等を削除 | 8 |
| Plan Mode | `ExitPlanMode`, Plan Mode セクション全体を削除 | 5 |
| Preamble config | `EXPLAIN_LEVEL`, `PROACTIVE`, `CHECKPOINT_MODE` 等を削除 | 14 |
| codex CLI | `codex exec`, `codex review`, `CODEX_PROMPT_FILE` 等のコマンド行を削除 | 9 |
| `$D` design binary | `$D generate`, `$D check` 等のコマンドを削除、テキスト言及を置換 | 12 |
| テレメトリ | `skill-usage.jsonl`, analytics 関連を削除 | 3 |
| `$_REPO_ROOT` / `$SLUG` | `git rev-parse` に置換、プロジェクトパスを正規化 | 5 |
| vendoring | `.claude/skills/gstack` vendoring deprecation セクションを削除 | 5 |
| スキル名リネーム | `/review` → `/gstack-review`, パス参照も連動 | 3 |
| 整形 | 連続空行の圧縮、AUTO-GENERATED コメント削除 | 2 |

### Layer 2.5: バリデーション

変換後に8項目を自動チェック:

1. 未解決 placeholder（`{{...}}`）
2. Claude Code 固有パス（`~/.claude/`）
3. `CLAUDE.md` 参照
4. `ExitPlanMode` / Plan Mode 参照
5. 本家固有 bin ユーティリティ
6. `$D` design binary コマンド
7. Preamble config flags
8. `codex` コマンド（テキスト言及は警告、コマンドはエラー）

`--validate` オプションで変換なしにバリデーションのみ実行可能。

### Layer 3: 日本語化

| 対象 | 方法 |
|------|------|
| SKILL.md frontmatter `description` | 日本語で記述（既存の日本語 description を維持） |
| SKILL.md frontmatter `argument-hint` | 日本語で記述 |
| SKILL.md 本体 | 英語のまま（upstream 忠実） |
| `copilot-instructions.md` | `## 言語` セクションで「日本語ファースト」を指示 |

日本語出力は `copilot-instructions.md` の以下の指示で制御:

```markdown
## 言語
- ユーザーへの応答は常に日本語で行う
- スキル、ツール、プロンプト、外部ドキュメントが英語で書かれていても、
  作業の結論とユーザー向け出力は日本語にする
- スキルのデフォルト言語がこのルールを上書きしないこと
```

先行事例: [note.com/makyua3](https://note.com/makyua3/n/nb213f3bbbd84)（Claude Code + `CLAUDE.md` 5行で同等の効果を実証）

## Copilot CLI ビルトイン衝突回避

| 旧名 | 新名 | 衝突相手 |
|------|------|---------|
| `/review` | `/gstack-review` | Copilot CLI ビルトイン `code-review` エージェント |

新スキル追加時は、Copilot CLI のビルトインコマンド（`/help`, `/clear`, `/model`, `/compact`, `/status`）およびエージェント名（`explore`, `task`, `code-review`, `rubber-duck`, `general-purpose`）との重複を確認する。

## upstream-tracking 状態モデル

```
unaudited → vendored → compat-patched → behavior-verified
```

| 状態 | 意味 | 現在の件数 |
|------|------|-----------|
| `vendored` | 3層パイプラインで取り込み済み | 37 |
| `compat-patched` | 互換レイヤー適用 + 動作確認済み | 0（次フェーズ） |
| `behavior-verified` | 日本語出力品質テスト通過 | 0（次フェーズ） |
| `diverged` | gstack-copilot-jp 独自 | 0 |

旧状態 `same` / `adapted` / `unaudited` は廃止。`upstream-tracking.json` に `upstream_commit` フィールドで commit SHA をピン留め。

## upstream 同期ワークフロー

本家更新時の手順:

```bash
# 1. 差分検出 + 自動変換
bin/upstream-diff.sh --sync

# 2. テスト実行
npm test

# 3. コミット
git add -A && git commit -m "feat(skills): upstream sync vX.Y.Z"
```

`bin/upstream-diff.sh --sync` は:
1. upstream の最新を pull
2. ピン留め commit との diff から変更スキルを検出
3. 各スキルに `adapt-upstream-skill.sh` を実行（diverged/excluded はスキップ）
4. `upstream-tracking.json` の commit SHA を更新

## Preamble Parity Matrix

upstream の共有ボイラープレートと local の対応:

| upstream セクション | local での対応 | 状態 |
|---|---|---|
| Preamble bash | hooks: `sessionStart` / `sessionEnd` | 実装済み（簡略版） |
| Skill routing table | `copilot-instructions.md` スキルルーティング | 実装済み |
| Model-Specific Behavioral Patch | なし（Copilot CLI がモデル差を吸収） | 意図的除外 |
| Voice | `copilot-instructions.md` ボイス | 実装済み |
| Context Recovery | `context-restore` スキル | 実装済み |
| AskUserQuestion Format | `ask_user` tool（Copilot CLI ネイティブ） | 互換 |
| Writing Style (V1) | `copilot-instructions.md` 書き方スタイル | 実装済み |
| Completeness Principle | `copilot-instructions.md` 湖を沸かせ | 実装済み |
| Confusion Protocol | `copilot-instructions.md` Confusion Protocol | 実装済み |
| Search Before Building | `copilot-instructions.md` 作る前に探せ | 実装済み |
| Operational Self-Improvement | `learn` スキル | 実装済み |
| Browse SETUP | `bin/gstack-env` + `browse/` | 実装済み（別方式） |
| Continuous Checkpoint Mode | なし | 意図的除外 |
| Context Health | なし | 意図的除外 |
| Question Tuning | なし | 意図的除外（本家もV1で観察のみ） |
| Telemetry | なし | 意図的除外 |
| Plan Mode | なし（Copilot CLI に Plan Mode なし） | 意図的除外 |

## 実装結果

| 指標 | Before | After |
|------|--------|-------|
| スキル平均行数 | ~130行 | ~950行 |
| upstream 忠実度 | 不明（AI生成） | Layer 2 変換ルールのみが差分 |
| Claude Code 固有参照 | ~2,600箇所 | 1箇所（pair-agent のテキスト言及） |
| 状態が `unaudited` のスキル | 33 | 0 |
| 状態が `vendored` のスキル | 0 | 37 |
| 追随コスト | AI再生成+検証 | `bin/upstream-diff.sh --sync` |

## 今後の作業

1. **状態を `compat-patched` → `behavior-verified` に進める** — 各スキルを実際に日本語で実行し、出力品質を確認
2. **`/gstack-upgrade` スキルに upstream sync を統合** — ユーザーが `/gstack-upgrade` で本家更新を取り込めるようにする
3. **browse/ の本家版 vendoring** — 現在の独自 Bun+TS 実装を本家 browse に置き換え
