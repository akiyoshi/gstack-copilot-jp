# ROADMAP — 未実装項目と将来計画

**現在のリリース:** v1.2.0.0（2026-04-29）
**次のリリース:** v1.2.1.0 — user-skills sync 統合
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

### v1.2.1.0 — user-skills sync 統合

`~/.copilot/skills/` への per-skill リンク管理を `setup` に統合。VS Code Copilot
Chat と Copilot CLI からスキルが認識されるよう保証し、VS Code 組み込みコマンド
名（`/review` `/explain` 等）との衝突を fail-fast で検出する。

**スコープ**:
- `bin/gstack-sync-user-skills`（bash 248 行） + `.ps1`（PowerShell 187 行、Windows native）
- `test/reserved-names.js` を single source of truth として 14 個の VS Code 予約名を管理
- `setup` の `do_user_link` / `do_uninstall` に sync 統合（per-skill link → repo root link の順で削除）
- `test/quality-gate.test.js` に 3 契約追加（重複 frontmatter 検出 / 予約名衝突検出 / dir-name 一致）
- v1.2.1 review で発見された 2 契約追加（name regex 統一 / bash・ps1・JS の予約名リスト同期）
- `browse/SKILL.md` の重複フロントマターブロック解消（v1.1.2 で残った事故の根因対応）
- `INSTALL.md` トラブルシュートセクション追加（コマンド embeddings キャッシュ削除手順、dangling link 復旧）

**前提**: v1.2.0.0（Outside Voice 刷新）が landed 済み。

---

## 完了済み

### v1.2.0.0 — Outside Voice 刷新（Codex CLI 依存撤廃）— **完了** ([PR #18](https://github.com/akiyoshi/gstack-copilot-jp/pull/18))

設計判断（マルチホスト + マルチモデル）と SKILL.md 表面の乖離を解消した。
詳細は [docs/v1.2-outside-voice-redesign.md](docs/v1.2-outside-voice-redesign.md) 参照。

- [x] 17 スキルから `Codex` 言及を `Outside Voice` 表記へ刷新（互換シム名は保持）
- [x] autoplan の `command -v codex` ガード撤去 → `gstack-codex-probe` シム経由に統一
- [x] 契約テストで `Codex` 文字列再混入を fail-fast 検出（`test/skill-contracts.test.js`）
- [x] adapter 翻案ルール追加（本家 sync で再混入しない、`bin/adapt-upstream-skill.sh` Layer 2）
- [x] DESIGN.md §6.5「マルチモデル Outside Voice」追加、README + ROADMAP 整合
- [x] `bin/decodex-skills.sh` 新規（一括置換ツール、互換シム名 protect）
- [ ] `gstack-codex-probe` → `gstack-outside-voice` rename — **v1.4 に繰り延べ**

---

## v1.0.3 — Phase A++：B-3 先行パッチ — **完了**

v1.1 の前提として、認識問題と追従パイプを追加修正したパッチリリース。スコープ詳細は [docs/v1.1-implementation-plan.md](docs/v1.1-implementation-plan.md) 参照。

- [x] `plugin.json` の version を VERSION ファイルと一致させる（乗り越しで 1.0.0 のままだった）
- [x] 3 ファイル（VERSION / package.json / plugin.json）バージョン一致テストを `quality-gate.test.js` に追加
- [x] `bin/upstream-diff.sh` の堅牢化:
  - dirty tree ガード追加（`--sync` 実行前に modified + untracked changes を検出して fail-fast）
  - サブシェルでカウンタが親シェルに伝播しないバグを修正（`while read` のパイプ → `< <(...)` に変更）
  - **ロールバック可能性の確保**: dirty-tree guard により実行前 HEAD が常にクリーンなスナップショット状態であることが保証される。`git checkout HEAD -- .github/skills/` で確実にロールバック可能（自動 pre-sync commit は冗長のため不採用）
  - `--sync --interactive` モード追加（diff プレビューと確認プロンプト、各スキルの先頭 40 行表示で supply chain 緩和）
- [x] **Python code injection 修正** (`/gstack-review` 指摘 F1-F3): `bin/upstream-diff.sh` の 3 箇所の `python3 -c` ブロックで bash 変数を文字列補間する code injection 脆弱性を環境変数渡しパターンに統一
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

## v1.1.1 — /gstack-review 後追い hotfix — **完了**

v1.1.0.0 (PR #16) を post-merge `/gstack-review` で再評価して見つかった 11 findings (HIGH 2, MEDIUM 4, LOW 3, INFO 2) のうち修正可能な 8 件を v1.1.1 patch で出荷。

**Security**:
- [x] **F1 [HIGH]**: `bin/gstack-open-url` の PowerShell command injection 修正。`'$URL'` を環境変数渡し (`GSTACK_URL` env var) に変更し、シングルクォート breakout を遮断
- [x] **F2 [MEDIUM]**: `bin/gstack-open-url` に scheme allowlist 追加 (`http://` / `https://` のみ許可、`file://` `javascript:` 排除)
- [x] **F5 [MEDIUM]**: `bin/adapt-upstream-skill.sh` に `status='adapted'` ガード追加。手動再構築済み SKILL.md を誤って上書きしないよう保護
- [x] adapter 内の `python3 -c` 2 箇所も env-var パターンに統一 (v1.0.3 の同種修正と整合)

**Documentation truthfulness**:
- [x] **F4 [HIGH]**: `landing-report` SKILL.md と README から「Bun 不在時は Node.js + tsx でフォールバック」の虚偽記述を削除。実際には `bin/gstack-next-version` は Bun 必須 (shebang `#!/usr/bin/env bun`)
- [x] **F6 [MEDIUM]**: `landing-report` SKILL.md Step 1 に gh / bun 不在チェックを実コード化 (前バージョンは「停止する」と記述するのみ、実装は `echo main` フォールバック)
- [x] **F10 [LOW]**: README で `browse` の Node.js fallback と `bin/gstack-next-version` の Bun 必須を明確に区別

**Test design**:
- [x] **F7 [MEDIUM]**: `quality-gate.test.js` のスキル数検証をディレクトリカウント single source of truth に変更。CHANGELOG / getting-started.md の prose regex 検証は「記載されている場合のみ一致」に緩和 (CHANGELOG 不要 preference との整合)

**v1.2 へ送り**:
- F3 [LOW] (URL 長さ制限・ASCII enforcement) — 過剰防衛、Phase C で再評価
- F8 [INFO] (`bin/gstack-next-version` smoke test) — Phase C の `gh` モックフレームワークと同時実装
- F9 [INFO] (CHANGELOG regex fragility) — F7 で部分的に解消、残りは Phase C で
- F11 [INFO] (setup sentinel cleanup trap) — 実害無し、defensive にしすぎる必要なし

---

## v1.1 — Phase B: スキル追従 + Phase E: Windows 再対応 — **完了**

> **Premise Gate（2026-04-29）決定**: B-2 (`/gstack-claude`) は v1.1 スコープから除外（task tool 経由 Outside Voice と機能重複）。B-3 は v1.0.3 で先行出荷済み。Phase D は v1.2 維持。詳細は [docs/v1.1-implementation-plan.md](docs/v1.1-implementation-plan.md)。

### B-1: `/landing-report` + `bin/gstack-next-version` ✓

- [x] upstream `bin/gstack-next-version` を vendor（Bun 必須、`gh pr list` で VERSION 衡突検出、Conductor 兄弟ワークツリー検出も含む）
- [x] `landing-report/SKILL.md` を `.github/skills/` に追加（preamble + GBrain Sync + skill routing 等 boilerplate を除外し、Steps 1-5 コア機能のみ手動再構築）
- [x] `upstream-tracking.json` で `landing-report` を `planned` → `adapted` に更新
- [x] README/INSTALL.md の前提条件に `gh` CLI 追加
- [x] INSTALL.md に v1.0.3 → v1.1 アップグレードガイド追加
- [ ] `/landing-report` smoke テスト追加（`gh` モック）— v1.2 Phase C のテスト基盤と同時に実施
- [ ] `/ship` の workspace-aware 版番割当を実コード化 — 上流仕様は /ship SKILL.md に記述済み、v1.2 で検証

### B-2: `/gstack-claude` 追加 — **v1.1 スコープ除外（v1.2 で再評価）**

`task` tool 経由のマルチモデル Outside Voice と機能重複のため、v1.1 では取込まない。Outside Voice 設計の見直しと同時に v1.2 以降で再検討する。

### B-3: `/gstack-review` 認識問題 + 既存スキル同期 — **v1.0.3 で完了**

→ ROADMAP の v1.0.3 セクション参照。

### B-4: `copilot-instructions.md` の追従 ✓

- [x] ルーティングテーブルに新スキル `/landing-report` を追加
- [x] **全ドキュメント**（README, INSTALL.md, getting-started.md, copilot-instructions.md, CHANGELOG.md）のスキル数表記を 38 → 39 に整合
- [ ] upstream `CLAUDE.md` (v1.20.0.0) に対する diff の完全適応 — 残存差分は v1.2 で評価

### E-1〜E-4: Windows 再対応 ✓

upstream は v1.0 から Windows 11（Git Bash / WSL）を公式サポート。dogfooding 目的（実ユーザー需要は作者のみ）を README で誠実に開示する。

- [x] `bin/browse.ps1` の修正（Phase A-2 で完了）
- [x] **E-1**: README に「Windows 対応（実験的）」セクション追加。Bun + Node.js + Git Bash/WSL2 + `gh` CLI の前提を明示
- [x] **E-2**: `setup --mode user-link` に Windows Developer Mode 検出を追加（symlink テスト sentinel + 親切なエラーメッセージ + 3 つの代替案案内）
- [x] **E-3**: hook の `windows` キーは **不要** と判定。`.github/hooks/lifecycle.json` は VS Code Copilot Chat 互換形式（PascalCase + `command`）で `bash bin/...` 統一されており、Windows 上でも WSL bash 経由で動作する
- [x] **E-4**: `bin/gstack-open-url` を vendor し、WSL2 検出（`/proc/version` の `microsoft` 検出）+ `powershell.exe Start-Process` フォールバックを追加

---

## v1.2 — Outside Voice 刷新（Codex CLI 依存撤廃）

詳細スコープ・前提・受入基準は [docs/v1.2-outside-voice-redesign.md](docs/v1.2-outside-voice-redesign.md)。

### OV-1: autoplan の Codex preflight 撤去

- [ ] Phase 0.5 を「Outside Voice preflight」に書き換え
- [ ] `command -v codex` ガード削除、`gstack-codex-probe` シム source の 1 行に統一
- [ ] Phase 1-3.5 の `**Codex {role} voice** (via Bash)` セクションを `**Outside Voice ({role}) — via task tool with model override**` に刷新
- [ ] CONSENSUS TABLE / phase-transition summary のラベル統一（`Codex` → `OutVoice`、`Claude subagent` → `Primary subagent` 等）

### OV-2 〜 OV-5: 下流スキルの言語刷新

- [ ] `bin/decodex-skills.sh`（新規 wrapper、dry-run モード付き）で機械置換
- [ ] OV-2: `plan-ceo-review` `plan-design-review` `plan-eng-review` `plan-devex-review`
- [ ] OV-3: `design-consultation` `design-review` `devex-review`
- [ ] OV-4: `office-hours` `ship` `retro`（誤誘導 `npm install -g @openai/codex` も削除）
- [ ] OV-5: 軽微 6 スキル（`pair-agent` `cso` `investigate` `qa` `qa-only` `land-and-deploy`）
- [ ] allowlist: `pair-agent`（外部エージェント連携機能）、`retro`（analytics 表示）

### OV-6: `gstack-codex-probe` rename — **v1.4 へ繰り延べ**

互換シム名と `_gstack_codex_*` 関数名は契約テストで例外処理しており、現状で機能は完結している。rename は Browser-Skills 取込（v1.4）と同期させると、本家 sync の摩擦増加を一回に押さえられる。

### OV-7: 契約テスト

- [ ] `test/skill-contracts.test.js` に「Codex 文字列が SKILL.md / copilot-instructions.md に混入しない」契約を追加
- [ ] autoplan/SKILL.md に `command -v codex` が無いことを fail-fast 検証
- [ ] PR-1 で **先に** 落ちる状態で landing → 以降の PR がグリーン化を進める

### OV-8: adapter の翻案ルール拡張

- [ ] `bin/adapt-upstream-skill.sh` Layer 2.4 として `CODEX SAYS` → `OUTSIDE VOICE SAYS` 等の sed 置換を追加
- [ ] `test/adapter.test.js` に翻案ルールの単体テスト追加
- [ ] 本家 sync 後も契約テストグリーンを維持

### OV-9 / OV-10: 文書整合

- [ ] DESIGN.md に「6.5 Outside Voice の正体」セクション追加
- [ ] README に「マルチモデル Outside Voice」段落追加、DESIGN.md へリンク
- [ ] `.github/copilot-instructions.md` のルーティング表で Codex 残存があれば置換

---

## v1.3 — Phase C: テスト基盤

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
- [ ] description 長さ制限（VS Code Copilot Chat / Codex 双方の上限相当 = 1024 文字）
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

### v1.1.1 から繰り延べた項目

- [ ] F3 [LOW] (URL 長さ制限・ASCII enforcement) — Phase C で再評価
- [ ] F8 [INFO] (`bin/gstack-next-version` smoke test) — `gh` モックフレームワークと同時実装
- [ ] F9 [INFO] (CHANGELOG regex fragility) — F7 で部分的に解消、残りは Phase C で

### v1.1 から繰り延べた項目

- [ ] `/landing-report` smoke テスト追加（`gh` モック）
- [ ] `/ship` の workspace-aware 版番割当を実コード化（上流仕様は /ship SKILL.md に記述済み）
- [ ] upstream `CLAUDE.md` (v1.20.0.0) に対する diff の完全適応

---

## v1.4 — Phase D: Browser-Skills runtime 取込（評価次第）

upstream v1.20 の `/scrape` + `/skillify` + 三層ストレージ + 155 unit テスト。
- 取込量が大きい（5 モジュール、`$B skill` サブコマンド 5 つ、`browser-skill-write.ts` の atomic-write contract）
- 本家 `/automate` 出荷（v1.21+ 予定）を待ってまとめて取り込む案も
- [ ] **v1.2 / v1.3 出荷後に再評価**して取込判断
- [ ] 取り込む場合: `bin/gstack-codex-probe` thin wrapper の削除も同期

### OV-6 繰り延べ分（v1.2 から）

- [ ] `bin/gstack-codex-probe` を `bin/gstack-outside-voice` に rename
- [ ] 本家互換関数名 `_gstack_codex_*` は維持（本家 sync の API 名空間契約）
- [ ] 旧 `gstack-codex-probe` は thin wrapper（`exec gstack-outside-voice`）として残置、下流リポへの影響を限定
- [ ] v1.5+ で wrapper 削除を CHANGELOG に予告

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
