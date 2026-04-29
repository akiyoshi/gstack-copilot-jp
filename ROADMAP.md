# ROADMAP — 未実装項目と将来計画

**現在のリリース:** v1.0.1.0（2026-04-29）
**追跡 upstream:** garrytan/gstack v1.20.0.0
**完了済みリリース履歴:** [CHANGELOG.md](CHANGELOG.md)

このファイルは **未着手 / 進行中** の作業を管理する。
本家追従ギャップの全体像と取込方針は [docs/upstream-gap-plan.md](docs/upstream-gap-plan.md) を参照。

---

## 進行中

なし（Phase A 完了。次リリースは v1.0.2 として出荷可能）。

---

## v1.0.2 — Phase A: 配管修理（致命度 P0）— **完了**

upstream 追従の前提となるツールチェーンを修理。これを先に直さないと、以降の追従作業が信頼できない。

### A-1: `bin/upstream-diff.sh` の堅牢化 ✓

- [x] 浅いクローン（`--depth 50`）を廃止し、完全クローンに変更
- [x] 既存の浅い repo は `git fetch --unshallow` で履歴補完
- [x] `git pull --ff-only` の失敗を exit code 1 で表面化（旧: サイレント失敗）
- [x] VERSION 不一致（pinned commit と HEAD のバージョン差）を `Lag: N commits behind upstream` として表示
- [x] `--sync` は既存 upstream で動作（pull は `--update` 専用に分離）→ オフラインでも sync 可能

### A-2: `bin/browse.ps1` の修正 ✓

- [x] **方針**: `cli.ts` + Bun 直接実行に修正、Bun 未インストール時は Node.js + `tsx` フォールバック（upstream の Bun#4253 回避策に倣う）
- [x] Linux ELF バイナリは Windows で実行不可なので、`.exe` 拡張子付きのみ受け入れ
- [x] 動作確認済み（`bin\browse.ps1 help` が成功）

### A-3: `upstream-tracking.json/md` の実態反映 + 一括 sync ✓

- [x] `upstream_version` を `1.20.0.0` に更新、`upstream_commit` を `e8893a18...` に更新
- [x] **adapter バグを発見・修正**: `bin/adapt-upstream-skill.sh` の awk アンカー `^# [A-Z]` が upstream の `# /skill-name` 形式 h1 にマッチせず、ファイル全体コピーへフォールバックする問題。`^# (\/|[A-Z])` に変更
- [x] フォールバックを fail-fast に変更（exit 2）
- [x] コードフェンス balance バリデーションを追加（再発防止）
- [x] 29 SKILL.md 同期（+5813/-3805 行）
- [x] 取込予定スキルに `status: "planned"` を追加: `landing-report`, `claude` (gstack-claude), `scrape`, `skillify`
- [x] `tracking.test.js` に `planned` ステータスサポートを追加

### A-4: `bin/gstack-platform-detect` 移植 ✓

- [x] copilot CLI / VS Code / claude CLI / codex CLI / cursor CLI の存在検出
- [x] gstack-copilot-jp のインストール状態（manifest 確認、user-link / user-dir / self）
- [x] `--json` フラグ対応
- [x] Bun 非依存（bash + ハードコード解決）

### A-5: `bin/gstack-update-check` の実装 ✓

- [x] `git fetch` + `rev-list --count` で本家追従ラグを測定
- [x] 24h キャッシュで sessionStart hook を遮らない（`--force` で即時チェック）
- [x] Severity 階段: `none` (lag=0) / `info` (1-9) / `warn` (10+)
- [x] `--json` 出力対応
- [x] `bin/gstack-session-start.sh` から呼び出すように更新

---

## v1.1 — Phase B: スキル追従 + Phase E: Windows 再対応

### B-1: `/landing-report` + `bin/gstack-next-version`

- [ ] upstream `bin/gstack-next-version` を vendor（`gh pr list` で VERSION 衝突検出）
- [ ] `landing-report/SKILL.md` を `.github/skills/` に追加
- [ ] `/ship` の workspace-aware 版番割当を実コード化（現在ロジックは記述のみ）

### B-2: `/gstack-claude` 追加

非-Claude ホスト（Copilot CLI）から claude CLI を Outside Voice として呼ぶ。
- [ ] `.github/skills/gstack-claude/SKILL.md` 追加（review/challenge/consult 三モード）
- [ ] claude CLI 不在時に `task` tool フォールバック
- [ ] 既存の Outside Voice ルーティングと衝突しないよう `copilot-instructions.md` を更新

### B-3: 既存スキルの本家追従パッチ一括反映

Phase A-3 で v1.13-v1.20 の SKILL.md 変更は既に取り込み済み。残課題:

- [ ] `gstack-review` の追従（upstream `review/` → ローカル `gstack-review/` 名前マッピング問題で未同期）
- [ ] adapt-upstream-skill.sh に「ローカル名 ≠ upstream 名」ケースのサポートを追加

### B-4: `copilot-instructions.md` の追従

- [ ] upstream `CLAUDE.md` (v1.20.0.0) に対する diff を取り、適応
- [ ] ルーティングテーブルに新スキルを追加
- [ ] スキル数表示を整合（現在 38 → 取込後の数へ）

### E-1〜E-4: Windows 再対応

upstream は v1.0 から Windows 11（Git Bash / WSL）を公式サポート。我々の v2.0 方針メモ「Linux 統一」を撤回。

- [x] `bin/browse.ps1` の修正（Phase A-2 で完了）
- [ ] README に Windows セクション追加（Bun + Node.js 必須、Git Bash か WSL を選択）
- [ ] `setup` を Git Bash で動作確認、改行コード等の調整
- [ ] hook の `windows` キー（VS Code Copilot Chat 互換）の必要性を再評価
- [ ] `bin/gstack-open-url` を vendor（クロス OS URL オープナー）

---

## v1.2 — Phase C: テスト基盤 + Phase D: Browser-Skills（評価次第）

### C-1: テストランナー方針

- [ ] vitest 維持か bun:test 移行かを決定
  - 維持: 学習コストゼロ、`bin/upstream-diff.sh` の sync で SKILL.md は追従可能
  - 移行: upstream とテストコードも diff 可能、bun:test は `Bun.spawn({terminal:})` で PTY を扱える

### C-2: `test/hook-scripts.test.ts` 新設

- [ ] `.github/hooks/lifecycle.json` の各 hook command が指すスクリプト存在検証
- [ ] スクリプトに実行権限（chmod +x）が立っているかチェック
- [ ] 構文チェック（`bash -n`）
- [ ] Windows 環境では bash チェックをスキップする条件分岐（既存の phase4 テストが PowerShell から実行不可の問題を解消）

### C-3: `test/skill-validation.test.ts` の契約強化

upstream の `test/skill-validation.test.ts` を翻案:
- [ ] フロントマター必須フィールドの厳格検証（host, triggers, args, allowed-tools）
- [ ] description 長さ制限（Codex 1024 文字相当）
- [ ] triggers が string[] であること
- [ ] allowed-tools の値が既知ツールセットに含まれること

### C-4: real-PTY E2E harness の試作

upstream `test/helpers/claude-pty-runner.ts`（654 行）を `copilot -p` 用に翻案。
- [ ] `test/helpers/copilot-pty-runner.ts` 新設
- [ ] `runPlanSkillObservation()` 相当の API
- [ ] 最小デモ: `/office-hours` を起動してフォーマット適合を検証

### C-5: AskUserQuestion フォーマット適合テスト

- [ ] スキル本文の AskUserQuestion ブロックを抽出
- [ ] ELI10 / Recommendation / Pros (✅) / Cons (❌) / Net / `(recommended)` ラベルの有無を検証

### D: Browser-Skills runtime 取込（**判断保留**）

upstream v1.20 の `/scrape` + `/skillify` + 三層ストレージ + 155 unit テスト。
- 取込量が大きい（5 モジュール、`$B skill` サブコマンド 5 つ、`browser-skill-write.ts` の atomic-write contract）
- 本家 `/automate` 出荷（v1.21+ 予定）を待ってまとめて取り込む案も
- [ ] **v1.1 出荷後に再評価**して取込判断

---

## 長期（v2.0 候補）

- Builder Profile / Archetypes（`store_memory` ベース、upstream の builder-profile に追従）
- tool-budget 退行検知テスト（upstream v1.15）
- `slop-scan` の CI 連携
- `/automate` 取込（upstream 出荷待ち）

---

## 非目標（追跡対象外、再評価不要）

詳細は [upstream-tracking.md](upstream-tracking.md#追跡対象外マルチホスト基盤) に記載。

- マルチホスト基盤（hosts/, model-overlays/, gen-skill-docs.ts, extension/, conductor.json）
- GBrain Sync 一式（v1.17）
- Sidebar Terminal REPL（v1.14）
- Tunnel dual-listener（v1.16）
- Plan Mode Handshake（v1.12.1）
- ML Prompt Injection Defense（v1.4-v1.6.4）
- Model Overlays（v1.5.2）

---

> v1.0 リリース基準のチェックリストや過去の出荷履歴は [CHANGELOG.md](CHANGELOG.md) を参照。
