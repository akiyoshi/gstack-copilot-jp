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
| 本家バージョン | v1.1.3 (fix: /checkpoint rename) |
| 最終検証日 | 2026-04-20 |
| gstack-copilot-jp バージョン | 1.0.0-alpha.3 |

## スキル互換性

| スキル | 本家 | gstack-copilot-jp | ステータス | 分類 | 備考 |
|--------|------|-------------------|-----------|------|------|
| `/office-hours` | ✓ | ✓ | same | — | |
| `/plan-ceo-review` | ✓ | ✓ | same | — | |
| `/plan-eng-review` | ✓ | ✓ | same | — | |
| `/plan-design-review` | ✓ | ✓ | same | — | |
| `/plan-devex-review` | ✓ | ✓ | same | — | |
| `/autoplan` | ✓ | ✓ | same | — | |
| `/review` | ✓ | ✓ | adapted | — | Outside Voice (`code-review` + `rubber-duck` + fallback) + slop検出統合 |
| `/ship` | ✓ | ✓ | adapted | — | Outside Voice + CHANGELOG不要。MCP対応 |
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
| `/health` | ✓ | ✓ | same | — | v1.1.x。typecheck/lint/test/deadcode 4軸スコアリング |
| `/browse` | ✓ | △ | adapted | — | Bun移行は Phase 3 |
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
| `/learn` | ✓ | ✓ | adapted | — | JSONL + Copilot memory デュアル書き込み |
| `/retro` | ✓ | ✓ | same | — | |
| `/document-release` | ✓ | ✓ | same | — | |
| `/canary` | ✓ | ✓ | same | — | |
| `/land-and-deploy` | ✓ | ✓ | same | — | |
| `/tdd` | — | ✓ | diverged | 独自 | 本家に実装されたら統合 |
| `/go` | — | ✓ | diverged | 独自 | スプリントオーケストレーター |
| `/codex` | ✓ | — | adapted | — | `/model` 切替 + `task` で再現 |
| `/plan-tune` | ✓ | — | compatible | — | `store_memory` で簡易実装予定 |

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
