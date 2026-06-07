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
| 本家バージョン | **v1.56.0.0** (cab774cc) — Token-reduction Phase B + AUQ paranoid safety net |
| 本家 HEAD（最終監査時点） | v1.56.0.0 (2026-06-07 同期完了) |
| 取込ラグ | 0 commits（v1.20.0.0→v1.56.0.0 の 58 commits を一括同期。34 vendored スキルを再生成し token-reduction を反映） |
| 最終検証日 | 2026-06-07 |
| gstack-copilot-jp バージョン | 1.3.0.0 |

**v1.20→v1.56 同期サマリ（2026-06-07）**:

- 34 vendored スキルを `bin/adapt-upstream-skill.sh` で再生成。upstream の token-reduction（v1.46 catalog tokens -56%、v1.54 ship skeleton 化）を反映。plan-* / office-hours は -70% 前後の圧縮。
- **adapter 強化**: 新 upstream パターンに対応するため `bin/adapt-upstream-skill.sh` の Layer 2 を拡張:
  - gbrain `## Brain Context (preflight)` ブロック + `gstack-brain-cache` 呼び出しを除去（gbrain 除外方針）
  - `eval "$(...gstack-slug...)"` の括弧崩れ（`eval "$(true"` 構文エラー）を早期削除で解消
  - 小文字 `codex` イディオム（`codex-unavailable`/`codex_timeout`/`command -v codex` 等）を Outside Voice 表記へ変換。シム名 `gstack-codex-probe` / `_gstack_codex_*` はマスクで保護
  - `allowed-tools` 生成で frontmatter 終端 `---` の誤取込（`- --`）を解消し、既知ツール ID のみに whitelist
- **ローカル分岐の再付与**: upstream が削除した `## Next Steps — Review Chaining`（plan-eng/design/devex）と office-hours `## Spec Review Loop` を再生成後に手動で復元（gstack-copilot-jp の skill-chaining / 品質ゲート契約として保持）。
- **新規 upstream スキルの分類**: iOS device-farm 5スキル（`ios-clean/design-review/fix/qa/sync`）と `sync-gbrain` を excluded、`spec` / `document-generate` を planned（将来採用候補）として追跡台帳に追加。
- **adapted スキルは温存**: `gstack-review` `ship` `health` `make-pdf` `landing-report` は手動調整済みのため自動再生成せず（adapter が status=adapted を自動スキップ）。upstream 改善の個別取込は次フェーズ。
- 既知の制約: `browse` は upstream SKILL.md が h1 を持たない構造（binary-backed）のため自動抽出対象外。ローカル SKILL.md を維持。

**Phase A-1 修正**: `bin/upstream-diff.sh` の浅いクローン + サイレント `pull` 失敗を解消。完全履歴クローン化 + 失敗時 exit 1。lag コミット数の可視化を追加。詳細は [docs/archive/2026-04-upstream-gap-plan.md](docs/archive/2026-04-upstream-gap-plan.md) を参照。

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
| `/landing-report` | ✓ | — | **planned (v1.1)** | 並行 Conductor の VERSION 衝突ダッシュボード。Phase B-1 |
| `/gstack-claude` | ✓ | — | **planned (v1.1)** | 非-Claude ホスト向け Outside Voice。Phase B-2 |
| `/scrape` | ✓ | — | **planned (v1.2、判断保留)** | Browser-Skills runtime (v1.20.0.0)。Phase D |
| `/skillify` | ✓ | — | **planned (v1.2、判断保留)** | $B プロトタイプの codify。Phase D |
| `/spec` | ✓ | — | **planned** | backlog-ready spec を5フェーズで作成 (v1.47.0.0)。将来採用候補 |
| `/document-generate` | ✓ | — | **planned** | Diataxis カバレッジマップ付きドキュメント生成 (v1.35.0.0)。将来採用候補 |
| `/ios-clean` | ✓ | — | excluded | iOS device-farm (v1.43.0.0、Mac daemon + Tailscale)。Copilot CLI 範囲外 |
| `/ios-design-review` | ✓ | — | excluded | iOS device-farm。同上 |
| `/ios-fix` | ✓ | — | excluded | iOS device-farm。同上 |
| `/ios-qa` | ✓ | — | excluded | iOS device-farm。同上 |
| `/ios-sync` | ✓ | — | excluded | iOS device-farm。同上 |
| `/sync-gbrain` | ✓ | — | excluded | GBrain クロスマシンメモリ同期。store_memory + session_store_sql で代替 |

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
| `gstack-next-version` | — | **planned (Phase B-1)** — `/ship` workspace-aware 版番割当に必須 |
| `gstack-platform-detect` | — | **planned (Phase A-4)** — エージェント検出（Bun 非依存版） |
| `gstack-open-url` | — | **planned (Phase E)** — クロス OS URL オープナー（Darwin/Linux/MINGW） |
| `gstack-update-check` (実装) | — | **planned (Phase A-5)** — 上記 Phase 3 を A-5 で実装 |
| `gstack-developer-profile` | `bin/gstack-developer-profile` | ✓ vendored (v1.2.6.0、最小実装: --read/--profile/--migrate/--append-session) |
| `gstack-builder-profile` | `.github/skills/bin/gstack-builder-profile` | ✓ legacy shim (--read を委譲) |

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
| `/gstack-claude`（非-Claude 向け Outside Voice） | v1.13.0.0 | — | **planned**（Phase B-2、v1.1） |
| Sidebar Terminal REPL（xterm.js + WebSocket PTY） | v1.14.0.0 | — | 除外（Claude Code サイドパネル固有） |
| preamble 削減 + real-PTY E2E harness | v1.15.0.0 | — | **planned**（Phase B-3 で SKILL.md 追従、Phase C-4 で harness 翻案） |
| Tunnel allowlist 26-command | v1.16.0.0 | — | 除外（pair-agent ngrok トンネル固有） |
| /setup-gbrain federation source wireup | v1.17.0.0 | — | 除外（GBrain 不使用） |
| Browser-Skills runtime（`$B skill`、/scrape、/skillify） | v1.20.0.0 | — | **planned**（Phase D、v1.2 判断保留） |
| always prefix PR titles with v\<VERSION\> | v1.23.0.0 | /ship 再生成で反映 | ✓ 反映済み |
| cross-platform hardening（Windows lane + Bun.which） | v1.24.0.0 | browse/bin 側で対応済み | adapted |
| V1 transcript ingest + per-skill gbrain manifests | v1.26.0.0 | — | 除外（GBrain 不使用） |
| iOS device-farm（5スキル、Mac daemon、Tailscale） | v1.43.0.0 | — | 除外（Copilot CLI 範囲外） |
| `/spec`（backlog-ready spec を5フェーズで作成） | v1.47.0.0 | — | **planned**（将来採用候補） |
| `/document-generate`（Diataxis カバレッジマップ） | v1.35.0.0 | — | **planned**（将来採用候補） |
| gstack v2 foundation（catalog tokens -56%、eval-first floor） | v1.46.0.0 | 34 vendored スキル再生成で token-reduction 反映 | ✓ 反映済み |
| /ship を skeleton + on-demand sections へ分割（always-loaded -59%） | v1.54.0.0 | — | 見送り（ship は adapted。次フェーズで個別取込） |
| PII/secrets/legal redaction guard（/spec, /ship, /cso, /document-*） | v1.53.0.0 | — | 部分（vendored cso/document-release は再生成で反映、ship は adapted で未取込） |
| brain-aware planning（5スキルが gbrain context を先読み） | v1.52.1.0 | — | 除外（gbrain。adapter で Brain Context ブロックを strip） |
| AskUserQuestion split rule + AUTO_DECIDE carve-out | v1.48.0.0 | vendored スキル再生成で反映 | ✓ 反映済み |
