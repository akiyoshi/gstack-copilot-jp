# TODOS — 未実装項目と将来計画

**現在のリリース:** v1.3.0.0（2026-06-07）
**次のリリース:** v1.3.0.0 — Phase C: テスト基盤
**追跡 upstream:** garrytan/gstack v1.20.0.0
**完了済みリリース履歴:** [CHANGELOG.md](CHANGELOG.md)

このファイルは **未着手 / 進行中** の作業のみを管理する。
完了したリリース・Phase は `CHANGELOG.md` に集約済み。
過去の実装計画ドキュメントは [docs/archive/](docs/archive/) を参照。

## リリースポリシー

SemVer に準拠（上流 gstack の 4 桁形式 `MAJOR.MINOR.PATCH.BUILD` に拡張）。

- **PATCH** (`x.y.Z`): バグ修正、ドキュメント修正、後方互換の内部改修。スキル設計・コマンド名・フロントマター契約を変えない
- **MINOR** (`x.Y.0`): 新スキル追加、新しい hook、追加的なオプション。既存スキルの動作を変えない
- **MAJOR** (`X.0.0`): スキル rename / 削除、フロントマター契約変更、host サポート取り下げ等の破壊的変更

---

## 進行中

なし。次の大きな作業は **v1.3（Phase C: テスト基盤）**。

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
- [ ] F9 [INFO] (CHANGELOG regex fragility) — 部分的に解消済み、残りは Phase C で

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
