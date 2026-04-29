# TODO.md — ロードマップと未実装項目

DESIGN.md が設計方針、このファイルがタスク管理。完了したら `**Completed**` マークを付ける。

## v1.0 リリース基準

| 基準 | 状態 | 備考 |
|------|------|------|
| 38スキル全て SKILL.md 存在 | ✅ | `.github/skills/` に配置 |
| 5エージェント動作 | ✅ | architect, design-critic, dx-tester, security, testing |
| 4 hooks 動作 | ✅ | SessionStart, Stop, PreToolUse, PostToolUse |
| browse ビルド成功 | ✅ | `bun build --compile` → `browse/dist/browse` |
| Tier 1 テスト全 pass | ✅ | `npm test` (Vitest) — 444テスト |
| 本家 v1.12.1.0 まで追跡完了 | ✅ | `upstream-tracking.md` |
| README + getting-started 完備 | ✅ | |
| ARCHITECTURE.md 作成 | ✅ | |
| `plugin.json` 作成 | ✅ | copilot-plugin.json → plugin.json にリネーム済み |
| VERSION を `1.0.0.0` に更新 | ✅ | upstream 4桁形式に統一 |
| git tag `v1.0.0.0` | 🔲 | マージ後に実行 |

## 未実装・改善項目

### マルチホスト拡張（v1.0後）

- [ ] **ホスト抽象化レイヤー** — ホスト判定の一元化（現在4箇所に重複: `gstack-detect-host.sh`, `gstack-env`, `gstack-session-start.sh`, `gstack-init.sh`）
- [ ] **Host capability matrix** — ホスト毎のツール名・hook形式・browse可否を宣言的に定義
- [ ] **OpenClaw 対応** — 第3ホストとして追加。Phase 0（互換性調査）→ Phase 1（ホスト検出）→ Phase 2（SKILL.md互換）→ Phase 3（テスト）→ Phase 4（ドキュメント）→ Phase 5（ClawHub公開）
  - 詳細プラン: `~/.copilot/session-state/fe2d1ce5-ad27-4eab-814e-7ab810c589d9/plan.md`
  - autoplanレビュー結果: CEO Critical 2件（v1.0前拡張リスク、互換性未検証）、Eng High 5件（判定重複、hooks固定、capability不足、配布固定、方針矛盾）
  - 前提条件: v1.0リリース完了、ホスト抽象化レイヤー導入済み
- [ ] **upstream OpenClaw実装の調査** — 本家 `hosts/openclaw.ts`, `scripts/host-adapters/`, `openclaw/skills/` の実装を調査し、互換可能な部分は移植する（ホスト抽象化レイヤーの設計にも反映）

### 配布

- [ ] `copilot plugin install` の動作確認（Copilot CLI のプラグインシステム安定後）
- [ ] `/plugin update` での自動更新フロー検証

### テスト

- [ ] Tier 2 E2E テスト — `copilot -p` による実スキル実行テスト
- [ ] Tier 3 LLM Judge — `/model` 切替による品質スコアリング
- [ ] coexistence テスト — Claude Code と Copilot CLI の `~/.gstack/` 共存検証

### ドキュメント

- [ ] `.github/rules/` ディレクトリの作成（copilot-instructions.md の「ルール体系」で参照している概念だが、実ファイルは未作成）
  - `common/`: coding-style.md, git-workflow.md, testing.md, security.md
  - `typescript/`: coding-style.md, testing.md
  - `python/`: coding-style.md, testing.md
- [ ] ETHOS.md upstream版に差し替え
### 上流追跡

- [ ] 本家の次期バージョン（v1.12.1.0以降）への追随
- [ ] `bin/upstream-diff.sh` の定期実行自動化

### セッション管理

- [ ] Builder Profile / Archetypes の実装（`store_memory` ベース）

## 完了済み

- **Completed:** v1.0.0.0 (2026-04-25) — 🎉 v1.0 安定版リリース。バージョン書式を upstream 4桁形式に統一
- **Completed:** v1.0.0-alpha.8 (2026-04-25) — v1.0リリース準備（LICENSE追加、README最新化、plugin.jsonリネーム、ドキュメント整合性修正）
- **Completed:** v1.0.0-alpha.7 (2026-04-25) — マルチホスト対応（Copilot CLI + VS Code Chat）
- **Completed:** v1.0.0-alpha.6 (2026-04-25) — `/make-pdf`, Decision-Brief Format, upstream v1.12.1.0 catchup
- **Completed:** v1.0.0-alpha.5 以前 — 基盤構築（38スキル、5エージェント、4 hooks、browse）
