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
| 本家バージョン | v1.4.0.0 (feat: /make-pdf, /benchmark-models, open agents learnings) |
| 最終検証日 | 2026-04-20 |
| gstack-copilot-jp バージョン | 1.0.0-alpha.5 |

## 本家の方向性

v1.0.0以降、本家は**マルチホストプラットフォーム**に進化（10ホスト対応、テンプレート生成パイプライン、Chrome拡張）。gstack-copilot-jpは**Copilot CLI専用**を維持する。マルチホスト基盤（`hosts/`, `model-overlays/`, `scripts/gen-skill-docs.ts`, `extension/`, `conductor.json`）は追跡対象外。方法論・スキル内容の改善のみを取り込む。

## スキル互換性

| スキル | 本家 | gstack-copilot-jp | ステータス | 分類 | 備考 |
|--------|------|-------------------|-----------|------|------|
| `/office-hours` | ✓ | ✓ | same | — | |
| `/plan-ceo-review` | ✓ | ✓ | adapted | — | mode-posture energy fix (v1.1.2.0) 反映済み |
| `/plan-eng-review` | ✓ | ✓ | same | — | |
| `/plan-design-review` | ✓ | ✓ | same | — | |
| `/plan-devex-review` | ✓ | ✓ | same | — | |
| `/autoplan` | ✓ | ✓ | same | — | |
| `/review` | ✓ | ✓ | adapted | — | Outside Voice + slop検出 + doc staleness check |
| `/ship` | ✓ | ✓ | adapted | — | Outside Voice + CHANGELOG不要 + VERSION/package.json ドリフト検出 |
| `/investigate` | ✓ | ✓ | same | — | |
| `/design-html` | ✓ | ✓ | same | — | |
| `/design-consultation` | ✓ | ✓ | same | — | |
| `/design-shotgun` | ✓ | ✓ | adapted | — | $D なし。テキストベース |
| `/design-review` | ✓ | ✓ | same | — | |
| `/devex-review` | ✓ | ✓ | same | — | |
| `/qa` | ✓ | ✓ | same | — | |
| `/qa-only` | ✓ | ✓ | same | — | |
| `/cso` | ✓ | ✓ | same | — | |
| `/benchmark` | ✓ | ✓ | same | — | |
| `/benchmark-models` | ✓ | ✓ | adapted | — | Copilot CLI マルチモデル環境向けに適応 |
| `/health` | ✓ | ✓ | same | — | v1.1.x。typecheck/lint/test/deadcode 4軸スコアリング |
| `/browse` | ✓ | ✓ | adapted | — | Bun コンパイル + Playwright。Puppeteer parity (load-html, --selector, --scale, file://) は次スプリント |
| `/open-gstack-browser` | ✓ | ✓ | same | — | 旧 `/open-browser` からリネーム |
| `/pair-agent` | ✓ | ✓ | same | — | |
| `/setup-browser-cookies` | ✓ | ✓ | same | — | |
| `/setup-deploy` | ✓ | ✓ | same | — | |
| `/careful` | ✓ | ✓ | same | — | preToolUse hook で実装 |
| `/freeze` | ✓ | ✓ | same | — | preToolUse hook で実装 |
| `/guard` | ✓ | ✓ | same | — | careful + freeze 統合 |
| `/unfreeze` | ✓ | ✓ | same | — | |
| `/context-save` | ✓ | ✓ | same | — | 旧 `/checkpoint save` |
| `/context-restore` | ✓ | ✓ | same | — | 旧 `/checkpoint resume` |
| `/gstack-upgrade` | ✓ | ✓ | adapted | — | plugin update で実現 |
| `/learn` | ✓ | ✓ | adapted | — | JSONL + Copilot memory デュアル書き込み + open agents learnings コンセプト |
| `/retro` | ✓ | ✓ | same | — | |
| `/document-release` | ✓ | ✓ | same | — | |
| `/canary` | ✓ | ✓ | same | — | |
| `/land-and-deploy` | ✓ | ✓ | same | — | |
| `/make-pdf` | ✓ | — | planned | — | browse $B pdf 対応後に実装（次スプリント） |
| `/tdd` | — | ✓ | diverged | 独自 | 本家に実装されたら統合 |
| `/sprint` | — | ✓ | diverged | 独自 | スプリントオーケストレーター |
| `/status` | — | ✓ | diverged | 独自 | gstack-copilot-jp 状態確認 |
| `/codex` | ✓ | — | adapted | — | `/model` 切替 + `task` で再現 |
| `/plan-tune` | ✓ | — | compatible | — | `store_memory` で簡易実装予定 |

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

## 廃止済みスキル

| スキル | 廃止理由 | 代替 |
|--------|---------|------|
| `/build-fix` | 通常の対話で代替 | — |
| `/clean` | `/review` に統合 | `/review` ステップ 3.5 |
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
| slop-scan 統合 | v0.16.3.0 | /review のスロップ検出で代替 | adapted |
