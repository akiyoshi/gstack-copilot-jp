# TODO.md — ロードマップと未実装項目

DESIGN.md が設計方針、このファイルがタスク管理。完了したら `**Completed**` マークを付ける。

## v1.0 リリース基準

| 基準 | 状態 | 備考 |
|------|------|------|
| 38スキル全て SKILL.md 存在 | ✅ | `.github/skills/` に配置 |
| 5エージェント動作 | ✅ | architect, design-critic, dx-tester, security, testing |
| 4 hooks 動作 | ✅ | SessionStart, Stop, PreToolUse, PostToolUse |
| browse ビルド成功 | ✅ | `bun build --compile` → `browse/dist/browse` |
| Tier 1 テスト全 pass | ✅ | `npm test` (Vitest) — 442テスト |
| 本家 v1.12.1.0 まで追跡完了 | ✅ | `upstream-tracking.md` |
| README + getting-started 完備 | ✅ | |
| ARCHITECTURE.md 作成 | ✅ | |
| `copilot-plugin.json` 作成 | ✅ | |
| VERSION を `1.0.0` に更新 | 🔲 | リリース時 |
| git tag `v1.0.0` | 🔲 | リリース時 |

## 未実装・改善項目

### 配布

- [ ] `copilot plugin install` の動作確認（Copilot CLI のプラグインシステム安定後）
- [ ] `/plugin update` での自動更新フロー検証

### テスト

- [ ] Tier 2 E2E テスト — `copilot -p` による実スキル実行テスト
- [ ] Tier 3 LLM Judge — `/model` 切替による品質スコアリング
- [ ] coexistence テスト — Claude Code と Copilot CLI の `~/.gstack/` 共存検証

### ドキュメント

- [ ] `.github/rules/` ディレクトリの作成（README で参照しているが未作成）
  - `common/`: coding-style.md, git-workflow.md, testing.md, security.md
  - `typescript/`: coding-style.md, testing.md
  - `python/`: coding-style.md, testing.md

### 上流追跡

- [ ] 本家の次期バージョン（v1.12.1.0以降）への追随
- [ ] `bin/upstream-diff.sh` の定期実行自動化

### セッション管理

- [ ] Builder Profile / Archetypes の実装（`store_memory` ベース）

## 完了済み

- **Completed:** v1.0.0-alpha.7 (2026-04-25) — マルチホスト対応（Copilot CLI + VS Code Chat）
- **Completed:** v1.0.0-alpha.6 (2026-04-25) — `/make-pdf`, Decision-Brief Format, upstream v1.12.1.0 catchup
- **Completed:** v1.0.0-alpha.5 以前 — 基盤構築（38スキル、5エージェント、4 hooks、browse）
