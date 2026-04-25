# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0-alpha.8] - 2026-04-25

### Added
- **MIT LICENSE ファイル追加** — package.json/README で宣言済みだった MIT ライセンスの実ファイルを追加。LICENSE 存在テスト3件も追加
- **README ポジショニング強化** — 「なぜ gstack 本体ではなくこれを使うのか」を冒頭に明記（Copilot CLIネイティブ/VS Code Chat統合/日本語）

### Changed
- **`copilot-plugin.json` → `plugin.json` にリネーム** — Copilot CLI の `plugin install` が認識する正式なマニフェスト名に修正
- **インストール導線の再構成** — `git clone && ./setup` を主導線に昇格。plugin install は「実験的」に降格（プラグインシステム安定化待ち）
- README の見出し階層を正規化（「1. インストール」「2. 使い始める」「3. 更新」）
- VS Code パスに `mkdir -p .github` を追加（新規プロジェクトでのエラー防止）
- `getting-started.md` の browse セットアップを `npm` → `bun` に統一
- `copilot-instructions.md` のスキル数を 39 → 38 に修正（実際の SKILL.md 数と一致）

### Fixed
- plugin install コマンドの形式を `github:owner/repo` → `owner/repo` に修正（Copilot CLI 正式形式）
- `.gitignore` に `land-deploy-confirmed`（ランタイム成果物）を追加

## [1.0.0-alpha.7] - 2026-04-25

### Added
- **マルチホスト対応**: Copilot CLI + VS Code Copilot Chat の両方で動作する構成に移行
- `bin/gstack-detect-host.sh`: capability-based ホスト検出（JSON出力対応、入力サニタイズ付き）
- `docs/vscode-setup.md`: VS Code Copilot Chat 向けセットアップガイド
- マルチホスト互換性テスト 9件追加（442テスト全通過）
- スキル互換性 Tier 分類: A（完全互換）/ B（制限付き互換）/ C（CLI専用）

### Changed
- `GSTACK_HOST` 環境変数でホスト自動検出 + 手動上書き（エスケープハッチ）
- `bin/gstack-env`: `$B` フォールバック追加（browse 未インストール時にエラーではなく案内）
- `bin/gstack-session-start.sh`: `hosts/${GSTACK_HOST}/` 動的パス、PPID-RANDOM セッションID
- `bin/gstack-session-end.sh`: PPID-* パターン削除で新セッションID形式と整合
- `bin/gstack-init.sh`: `hosts/copilot-cli` ハードコード → `hosts/${GSTACK_HOST}` 動的化
- `.github/hooks/lifecycle.json`: VS Code 互換形式（PascalCase + `command` key）
- DESIGN.md / ARCHITECTURE.md / README.md / copilot-instructions.md: 「CLI専用」→「マルチホスト」に改訂

### Fixed
- `bin/gstack-detect-host.sh`: `||` / `&&` 演算子優先度バグ修正
- `bin/gstack-detect-host.sh`: GSTACK_HOST パス操作攻撃に対するサニタイズ追加
- `bin/gstack-session-end.sh`: session-start/end 間のセッションID不一致を修正

### Migration Notes
- hooks イベント名が PascalCase に変更（`sessionStart` → `SessionStart`, `sessionEnd` → `Stop`）
- hooks コマンドキーが `"bash"` → `"command"` に変更
- `plugin.json` は VS Code では認識されない。VS Code は git clone ベースでインストール

## [1.0.0-alpha.6] - 2026-04-25

### Added
- `/make-pdf` スキル — Markdown → 出版品質PDF変換。browse `$B pdf` 経由で動作
- AskUserQuestion Decision-Brief 形式 — 対話型レビューの質問が構造化（D<N>ヘッダー、ELI10、Stakes、✅/❌）
- `/ship` に queue-aware version check — 他の open PR とバージョン衝突を自動検出

### Changed
- 本家追跡を v1.4.0.0 → v1.12.1.0 に更新（8メジャーバージョン分）
- `/ship` PR タイトルを `v<VERSION> <type>: <summary>` 形式に統一
- `/health` を adapted に変更（GBrain次元は除外、4軸スコアリングを維持）
- upstream-tracking テストを excluded エントリー対応に拡張

### Excluded (upstream tracking)
- GBrain Sync（8バイナリ + PGLite/Supabase）— store_memory で代替
- ML Prompt Injection Defense（BERT分類器）— サイドバー固有
- Model Overlays / Opus 4.7 — Copilot CLI `/model` で代替
- Plan Mode Handshake — Copilot CLI ネイティブ plan mode で代替
- Tunnel dual-listener / SSRF — Claude Code インフラ固有
