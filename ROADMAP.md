# ROADMAP — 未実装項目と将来計画

**現在のリリース:** v1.0.3.0（2026-04-29）
**追跡 upstream:** garrytan/gstack v1.20.0.0
**完了済みリリース履歴:** [CHANGELOG.md](CHANGELOG.md)

このファイルは **未着手 / 進行中** の作業を管理する。
本家追従ギャップの全体像と取込方針は [docs/upstream-gap-plan.md](docs/upstream-gap-plan.md) を参照。

## リリースポリシー

SemVer に準拠（上流 gstack の 4 桁形式 `MAJOR.MINOR.PATCH.BUILD` に拡張）。

- **PATCH** (`x.y.Z`): バグ修正、ドキュメント修正、全た後方互換の内部改修。スキル設計・コマンド名・フロントマター契約を変えない
- **MINOR** (`x.Y.0`): 新スキル追加、新しい hook、追加的なオプション。既存スキルの動作を変えない
- **MAJOR** (`X.0.0`): スキル rename / 削除、フロントマター契約変更、host サポート取り下げ等の破壊的変更

参考: v1.0.3 は `bin/upstream-diff.sh` ・`bin/adapt-upstream-skill.sh` の内部改修と `plugin.json` のバージョン修正のみを含むため PATCH。スキル設計・公開インターフェースは変えない。

---

## 進行中

なし（v1.0.3 出荷済み、次リリースは v1.1.0.0）。

---

## v1.0.3 — Phase A++：B-3 先行パッチ — **完了**

v1.1 の前提として、認識問題と追従パイプを追加修正したパッチリリース。スコープ詳細は [docs/v1.1-implementation-plan.md](docs/v1.1-implementation-plan.md) 参照。

- [x] `plugin.json` の version を VERSION ファイルと一致させる（乗り越しで 1.0.0 のままだった）
- [x] 3 ファイル（VERSION / package.json / plugin.json）バージョン一致テストを `quality-gate.test.js` に追加
- [x] `bin/upstream-diff.sh` の堅牢化:
  - dirty tree ガード追加（`--sync` 実行前に uncommitted changes を検出して fail-fast）
  - サブシェルでカウンタが親シェルに伝播しないバグを修正（`while read` のパイプ → `< <(...)` に変更）
  - `--sync` 実行前に自動プレシャップショット commit（ロールバック可能性の確保）
  - `--sync --interactive` モード追加（diff プレビューと確認プロンプト）
- [x] `bin/adapt-upstream-skill.sh` の設計見直し：`upstream-tracking.json` の `upstream` フィールドをローカル名 ≠ upstream 名マッピングの単一情報源として使用（第 2 引数追加は不採用、既存 `--dry-run`/`--validate` インターフェースを保護）
- [x] `test/skill-contracts.test.js` 拡張:
  - `name` フィールドがディレクトリ名と一致（認識不能のサイレントスキップを防ぐ）
  - `allowed-tools` の値が既知ツール ID 集合に含まれる
  - `description` が 1024 文字以下（VS Code Copilot Chat と Codex 両方の上限に適合）
  - サイレントスキップの再発防止のため fail-fast 型
- [x] `INSTALL.md` にアップグレードガイドセクション追加：v1.0.2 → v1.0.3 の手順、ロールバック手順、`/gstack-review` 認識不能時のトラブルシュート
- [x] ROADMAP.md にリリースポリシーセクション追加、現在のリリース表記を v1.0.3.0 に修正

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

> **Premise Gate（2026-04-29）決定**: B-2 (`/gstack-claude`) は v1.1 スコープから除外（task tool 経由 Outside Voice と機能重複）。B-3 は v1.0.3 で先行出荷済み。Phase D は v1.2 維持。詳細は [docs/v1.1-implementation-plan.md](docs/v1.1-implementation-plan.md)。

### B-1: `/landing-report` + `bin/gstack-next-version`

- [ ] upstream `bin/gstack-next-version` を vendor（`gh pr list` で VERSION 衝突検出、3 ファイルアトミック更新）
- [ ] `landing-report/SKILL.md` を `.github/skills/` に追加
- [ ] `/landing-report` の smoke テスト追加（`gh` モック）
- [ ] `/landing-report` SKILL.md に gh 未認証時の親切メッセージを埋め込み
- [ ] README/INSTALL.md の前提条件に `gh` CLI 追加
- [ ] `/ship` の workspace-aware 版番割当を実コード化（現在ロジックは記述のみ）
- [ ] `/ship` SKILL.md に「VERSION ファイル不在時は自動スキップ」を明記（escape hatch）

### B-2: `/gstack-claude` 追加 — **v1.1 スコープ除外（v1.2 で再評価）**

`task` tool 経由のマルチモデル Outside Voice と機能重複のため、v1.1 では取込まない。Outside Voice 設計の見直しと同時に v1.2 以降で再検討する。

### B-3: `/gstack-review` 認識問題 + 既存スキル同期 — **v1.0.3 で完了**

→ ROADMAP の v1.0.3 セクション参照。

### B-4: `copilot-instructions.md` の追従

- [ ] upstream `CLAUDE.md` (v1.20.0.0) に対する diff を取り、適応
- [ ] ルーティングテーブルに新スキル `/landing-report` を追加
- [ ] **全ドキュメント**（README, INSTALL.md, getting-started.md, copilot-instructions.md, CHANGELOG.md）のスキル数表記を実態と一致

### E-1〜E-4: Windows 再対応

upstream は v1.0 から Windows 11（Git Bash / WSL）を公式サポート。dogfooding 目的（実ユーザー需要は作者のみ）を README で誠実に開示する。

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
