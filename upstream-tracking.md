# 上流追跡台帳

本家 [garrytan/gstack](https://github.com/garrytan/gstack) との互換性を管理する。

## 追跡ルール

- **Class A（文言のみ）**: 7日以内に反映
- **Class B（チェックリスト・判定基準・フロー変更）**: 72時間以内
- **Class C（コマンド名・ファイル配置・hook 契約）**: 24時間以内
- 未反映の差分は `diverged` として理由を記録する

## 最終検証

| 項目 | 値 |
|------|-----|
| 本家バージョン | v1.12.1.0 (fix: remove vestigial plan-mode handshake) |
| 最終検証日 | 2026-04-25 |
| gstack-copilot-jp バージョン | 1.0.0-alpha.6 |

## 本家の方向性

v1.0.0以降、本家は**マルチホストプラットフォーム**に進化（10ホスト対応、テンプレート生成パイプライン、Chrome拡張）。gstack-copilot-jpは**Copilot CLI専用**を維持する。マルチホスト基盤（`hosts/`, `model-overlays/`, `scripts/gen-skill-docs.ts`, `extension/`, `conductor.json`）は追跡対象外。方法論・スキル内容の改善のみを取り込む。

v1.4.0.0 以降、本家は**セキュリティ層**（ML Prompt Injection Defense、Tunnel、SSRF防御）と**クロスマシンメモリ**（GBrain Sync）を大幅に拡張。これらはClaude Code固有のインフラに依存するため除外。**方法論の改善**（AskUserQuestion Decision-Brief Format、Ship workspace-aware version）は採用。

## 状態モデル

| 状態 | 意味 |
|------|------|
| `vendored` | upstream スキル固有部分を3層合成パイプラインで取り込み済み |
| `compat-patched` | 互換レイヤー適用 + 動作確認済み |
| `behavior-verified` | 日本語出力品質テスト通過 |
| `adapted` | 意図的な独自改善を含む（upstream base + local patch） |
| `diverged` | gstack-copilot-jp 独自。upstream に対応なし |
| `planned` | 実装予定 |
| `excluded` | 追跡対象外 |

## スキル互換性

<!-- この表は upstream-tracking.json から生成。手動編集しない -->

| スキル | 本家 | gstack-copilot-jp | ステータス | 備考 |
|--------|------|-------------------|-----------|------|
| `/office-hours` | ✓ | ✓ | vendored |  |
| `/plan-ceo-review` | ✓ | ✓ | vendored | mode-posture energy fix (v1.1.2.0) 反映済み |
| `/plan-eng-review` | ✓ | ✓ | vendored |  |
| `/plan-design-review` | ✓ | ✓ | vendored |  |
| `/plan-devex-review` | ✓ | ✓ | vendored |  |
| `/autoplan` | ✓ | ✓ | adapted | 再実行仕様追加。判断監査証跡あり |
| `/gstack-review` | ✓ | ✓ | adapted | architectureチェックリスト追加。Outside Voice + slop検出 |
| `/ship` | ✓ | ✓ | adapted | プラン完了監査追加。VERSION/package.jsonドリフト検出 + workspace-aware version (v1.11.0.0) |
| `/investigate` | ✓ | ✓ | vendored |  |
| `/design-html` | ✓ | ✓ | vendored |  |
| `/design-consultation` | ✓ | ✓ | vendored |  |
| `/design-shotgun` | ✓ | ✓ | vendored | $D バイナリなし。テキストベース |
| `/design-review` | ✓ | ✓ | vendored |  |
| `/devex-review` | ✓ | ✓ | vendored |  |
| `/qa` | ✓ | ✓ | vendored |  |
| `/qa-only` | ✓ | ✓ | vendored |  |
| `/cso` | ✓ | ✓ | adapted | 全14フェーズ展開済み |
| `/benchmark` | ✓ | ✓ | vendored |  |
| `/benchmark-models` | ✓ | ✓ | vendored |  |
| `/health` | ✓ | ✓ | adapted | GBrain次元(v1.12.0.0)除外。typecheck/lint/test/deadcodeの4軸 |
| `/browse` | ✓ | ✓ | vendored | 本家 browse/src/ 全ファイル vendored。Bun + Playwright |
| `/open-gstack-browser` | ✓ | ✓ | vendored |  |
| `/pair-agent` | ✓ | ✓ | vendored |  |
| `/setup-browser-cookies` | ✓ | ✓ | vendored |  |
| `/setup-deploy` | ✓ | ✓ | vendored |  |
| `/careful` | ✓ | ✓ | vendored | preToolUse hook で実装 |
| `/freeze` | ✓ | ✓ | vendored | preToolUse hook で実装 |
| `/guard` | ✓ | ✓ | vendored | careful + freeze 統合 |
| `/unfreeze` | ✓ | ✓ | vendored |  |
| `/context-save` | ✓ | ✓ | vendored |  |
| `/context-restore` | ✓ | ✓ | vendored |  |
| `/gstack-upgrade` | ✓ | ✓ | vendored |  |
| `/learn` | ✓ | ✓ | vendored |  |
| `/retro` | ✓ | ✓ | vendored |  |
| `/document-release` | ✓ | ✓ | vendored |  |
| `/canary` | ✓ | ✓ | vendored |  |
| `/land-and-deploy` | ✓ | ✓ | vendored |  |
| `/make-pdf` | ✓ | ✓ | adapted | browse $B pdf 経由。本家は専用バイナリ（make-pdf/dist/pdf） |
| `/setup-gbrain` | ✓ | — | excluded | GBrain Sync インフラ。store_memory + session_store_sql で代替 |
| `/codex` | ✓ | — | excluded | `/model` + `task` で代替 |
| `/plan-tune` | ✓ | — | excluded | `store_memory` で代替 |

## 追跡対象外（マルチホスト基盤）

本家のマルチホスト対応インフラは gstack-copilot-jp の範囲外として追跡しない:

| 本家ディレクトリ/ファイル | 用途 | 除外理由 |
|---|---|---|
| `hosts/` | 10ホスト設定（Claude, Codex, Cursor, OpenClaw, GBrain, Hermes, Kiro, OpenCode, Slate） | Copilot CLI 一本化 |
| `model-overlays/` | モデル別行動パッチ（claude, gemini, gpt, gpt-5.4, o-series） | Copilot CLI ネイティブモデル切替 |
| `scripts/gen-skill-docs.ts` | テンプレートベース SKILL.md 生成 | 手書き SKILL.md で制御 |
| `extension/` | Chrome拡張（サイドパネル、CSSインスペクタ） | CLI 範囲外 |
| `conductor.json` | 並列セッション設定 | `task` tool で代替 |
| `openclaw/` | OpenClaw ホスト固有設定 | 他ホスト向け |
| `contrib/add-host` | ホスト追加ツール | マルチホスト用 |
| `design/` | Design バイナリ（GPT Image API） | Copilot CLI には別手段 |
| `gbrain/` | GBrain Sync エンジン（8バイナリ、PGLite/Supabase） | インフラ規模大。store_memory で代替 |
| `setup-gbrain/` | GBrain セットアップスキル（6ヘルパー） | gbrain/ と同一理由 |
| ML Prompt Injection Defense | BERT-small/DeBERTa-v3 分類器 + 8層防御 (v1.4.0.0-v1.6.4.0) | サイドバー固有。Copilot CLI はプラットフォームレベルで防御 |
| Tunnel dual-listener / SSRF | トンネル接続のセキュリティ強化 (v1.6.0.0) | Claude Code インフラ固有 |
| Overlay Efficacy Harness | Agent SDK ベースのモデルオーバーレイ計測 (v1.10.1.0) | Anthropic Agent SDK 固有 |
| Plan Mode Handshake | Agent SDK ベースのプランモード制御 (v1.11.1.0, v1.12.1.0) | Copilot CLI はネイティブ plan mode をサポート |

## 廃止済みスキル

| スキル | 廃止理由 | 代替 |
|--------|---------|------|
| `/build-fix` | 通常の対話で代替 | — |
| `/clean` | `/gstack-review` に統合 | `/review` ステップ 3.5 |
| `/loop` | `/fleet` + `--autopilot` | — |
| `/multi-plan` | `/model` + `/fleet` | — |
| `/multi-execute` | `--autopilot` + `/fleet` | — |
| `/second-opinion` | `code-review` + `rubber-duck` | — |
| `/checkpoint` | 分割 | `/context-save` + `/context-restore` |

## bin/ 互換性

| 本家 | gstack-copilot-jp | ステータス |
|------|-------------------|-----------|
| `gstack-slug` | `bin/gstack-slug` | ✓ same |
| `gstack-config` | `bin/gstack-config` | ✓ same |
| `gstack-review-log` | `bin/gstack-review-log` | ✓ same |
| `gstack-learnings-log` | `bin/gstack-learnings-log` | ✓ same |
| `gstack-update-check` | — | Phase 3（sessionStart hook から呼ばれるが未実装。静かにスキップ） |
| `gstack-diff-scope` | `bin/gstack-diff-scope` | ✓ same |
| `gstack-timeline-log` | `bin/gstack-timeline-log` | ✓ same |
| `gstack-analytics` | `bin/gstack-analytics` | ✓ same |
| `gstack-uninstall` | — | Phase 3 |
| `gstack-session-track` | `bin/gstack-session-track` | ✓ same |
| `gstack-repo-mode` | — | 未実装（スキル内で直接検出） |
| `gstack-codex-probe` | — | 不要（Copilot CLI は `/model` でモデル切替） |

## JSONL スキーマ

| ファイル | 必須フィールド | ステータス |
|---------|--------------|-----------|
| `learnings.jsonl` | `ts`, `type`, `confidence`, `source`, `text`, `project` | ✓ 互換 |
| `*-reviews.jsonl` | `ts`, `skill`, `branch`, `verdict`, `findings_count` | ✓ 互換 |
| `skill-usage.jsonl` | `ts`, `skill`, `duration_ms`, `success`, `version` | ✓ 互換 |
| `health-history.jsonl` | `ts`, `branch`, `score`, `typecheck`, `lint`, `test`, `deadcode`, `shell`, `duration_s` | ✓ 互換 |

## hook 互換性

| 本家イベント | Copilot CLI | ステータス |
|------------|-------------|-----------|
| `SessionStart` | `sessionStart` | ✓ 互換 |
| `SessionEnd` | `sessionEnd` | ✓ 互換 |
| `PreToolUse` | `preToolUse` | ✓ 互換 |
| `PostToolUse` | `postToolUse` | ✓ 互換（スタブ実装。Phase 3 で timeline-log 連携） |

## 方法論の差分

| 本家の変更 | バージョン | gstack-copilot-jp | ステータス |
|---|---|---|---|
| V1 Writing Style（専門用語グロス、結果ベースの質問） | v1.0.0.0 | copilot-instructions.md のボイスセクションに適応 | ✓ 反映済み |
| Checkpoint modes（explicit/continuous） | v1.0.0.0 | — | 見送り（Copilot CLIのセッション管理と仕組みが異なる） |
| preamble-tier システム | v1.0.0.0 | — | 不要（テンプレート生成不使用） |
| ETHOS.md Three Layers of Knowledge | v1.0.0.0 | ETHOS.md に反映 | ✓ 反映済み |
| slop-scan 統合 | v0.16.3.0 | /gstack-review のスロップ検出で代替 | adapted |
| AskUserQuestion Decision-Brief Format | v1.10.0.0 | copilot-instructions.md に反映 | ✓ 反映済み |
| Ship workspace-aware version allocation | v1.11.0.0 | /ship SKILL.md に反映 | ✓ 反映済み |
| ML Prompt Injection Defense (8層) | v1.4.0.0-v1.6.4.0 | — | 除外（サイドバー固有） |
| GBrain Sync（クロスマシンメモリ） | v1.9.0.0 | — | 除外（store_memory で代替） |
| Model Overlays / Opus 4.7 | v1.5.2.0 | — | 除外（/model でネイティブ切替） |
| Plan Mode Handshake | v1.11.1.0-v1.12.1.0 | — | 除外（Copilot CLI ネイティブ plan mode） |
| /health GBrain 次元 | v1.12.0.0 | — | 除外（GBrain 不使用） |
