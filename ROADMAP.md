# ROADMAP — 未実装項目と将来計画

**現在のリリース:** v1.0.1.0（2026-04-29）
**完了済みリリース履歴:** [CHANGELOG.md](CHANGELOG.md)

このファイルは **未着手 / 進行中** の作業を管理する。完了したら CHANGELOG に移し、ここから削除する。

## 進行中

なし（v1.0 出荷直後）。

## 短期（v1.0.x パッチ）

### 配布の安定化

- [ ] `copilot plugin install` の動作確認（Copilot CLI プラグインシステム安定後）
- [ ] `/plugin update` での自動更新フロー検証

### テストの拡張

- [ ] **Tier 2 E2E テスト** — `copilot -p` による実スキル実行
- [ ] **Tier 3 LLM Judge** — `/model` 切替による品質スコアリング
- [ ] **coexistence テスト** — Claude Code と Copilot CLI の `~/.gstack/` 共存検証

### ドキュメント

- [ ] `.github/rules/` ディレクトリの作成（`copilot-instructions.md` の「ルール体系」で参照済みだが実ファイル未作成）
  - `common/`: coding-style.md, git-workflow.md, testing.md, security.md
  - `typescript/`: coding-style.md, testing.md
  - `python/`: coding-style.md, testing.md
- [ ] `ETHOS.md` を upstream 版に差し替え

## 中期（v1.1）

### マルチホスト拡張

- [ ] **ホスト抽象化レイヤー** — ホスト判定の一元化（現在 4 箇所に重複: `gstack-detect-host.sh`, `gstack-env`, `gstack-session-start.sh`, `gstack-init.sh`）
- [ ] **Host capability matrix** — ホスト毎のツール名・hook 形式・browse 可否を宣言的に定義
- [ ] **OpenClaw 対応** — 第 3 ホストとして追加（前提条件: ホスト抽象化レイヤー導入済み）
  - autoplan レビュー結果: CEO Critical 2 件、Eng High 5 件
  - 詳細プラン: `~/.copilot/session-state/fe2d1ce5-ad27-4eab-814e-7ab810c589d9/plan.md`
- [ ] **upstream OpenClaw 実装の調査** — 本家 `hosts/openclaw.ts`, `scripts/host-adapters/`, `openclaw/skills/` の互換可能な部分の移植

### 上流追跡の自動化

- [ ] 本家の次期バージョン（v1.12.1.0 以降）への追随
- [ ] `bin/upstream-diff.sh` の定期実行自動化

## 長期（v2.0 候補）

### セッション管理

- [ ] Builder Profile / Archetypes の実装（`store_memory` ベース）

---

> v1.0 リリース基準のチェックリストや過去の出荷履歴は [CHANGELOG.md](CHANGELOG.md) を参照。
