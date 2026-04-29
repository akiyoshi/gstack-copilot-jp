# Changelog

All notable changes to this project will be documented in this file.

## [1.0.2.0] - 2026-04-29

### Fixed (critical)

- **`bin/upstream-diff.sh` のサイレント追従停止を解消** — `git pull --ff-only` が浅いクローン（`--depth 50`）+ 多コミット間隔でサイレント失敗していた。結果として 3 か月分（v1.13-v1.20、8 リリース）の本家進化を見逃していた。完全クローンに変更し、pull/unshallow 失敗を exit code 1 で表面化、HEAD と pinned commit の lag 数を表示。
- **`bin/adapt-upstream-skill.sh` の awk anchor バグ修正** — `^# [A-Z]` が upstream の `# /skill-name` 形式 h1 にマッチせず、フォールバックでファイル全体コピー → preamble の bash が混入してコードフェンス不均衡が発生する deep regression。アンカーを `^# (\/|[A-Z])` に修正、フォールバックを fail-fast (`exit 2`) に変更、Layer 2.5 にコードフェンス balance バリデーションを追加。
- **`bin/browse.ps1` を機能する状態に復旧** — 存在しない `cli.js` を参照していた壊れた PowerShell ラッパーを修正。Windows 用 `.exe` バイナリ → Bun 直接実行 → Node + tsx の 3 段フォールバック構成に。

### Added

- **`bin/gstack-platform-detect`** — Copilot CLI / VS Code / Claude / Codex / Cursor の検出と gstack-copilot-jp インストール状態の表示（`--json` 対応、Bun 非依存）。
- **`bin/gstack-update-check`** — 24h キャッシュで本家追従ラグを通知。severity 階段（none/info/warn）、`--json` 対応。`bin/gstack-session-start.sh` から実呼び出しに（旧: 「Phase 3 で実装予定」のサイレントスキップ）。
- **テスト 40 件追加** — Phase A bin 存在確認 (2) + 全 SKILL.md コードフェンス balance 動的検証 (38)。adapter regression の再発防止。

### Changed

- **upstream を v1.20.0.0 (e8893a18) に同期** — 27 SKILL.md を一括更新（+5813 / -3805 行）。v1.13-v1.20 の方法論改善（preamble 削減、AskUserQuestion 強化、`/health` 軸調整、`/ship` workspace-aware 等）が反映。
- **`upstream-tracking.json/md`** — `upstream_version` を `1.20.0.0` に、`upstream_commit` を `e8893a18` に更新。新規取込予定スキル（`landing-report`, `claude`, `scrape`, `skillify`）を `planned` ステータスで追加。`tracking.test.js` に planned サポート。
- **ROADMAP.md** — Phase A 完了状態に更新。重複セクション整理。Phase B-E (v1.1) と Phase C-D (v1.2) を再構成。

### Documentation

- **`docs/upstream-gap-plan.md` 新設** — upstream 追従ギャップの全体監査と Phase A〜E の実装計画。

### Notes

- 総差分は +1701 / -15842 行。削除側の大半は upstream v1.15 の preamble 削減を 27 SKILL.md にまとめて反映した結果（SKILL.md 部分: +5813 / -3805）。新規ロジックは bin/ の 2 スクリプトと adapter の awk anchor 修正のみ。

## [1.0.1.0] - 2026-04-29

### Changed (docs)

- **ドキュメント構造のリファクタリング** — 業界ベストプラクティス（Diátaxis 風）に沿って整理:
  - `TODO.md` → `ROADMAP.md` にリネーム。完了済みの v1.0 リリース基準を削除し、未着手項目に集中
  - `DESIGN.md` を 575 行 → 約 200 行にスリム化。「これからどう作る」型の探索を排し、現状の設計判断記録に再構成
  - `DESIGN-upstream-fidelity.md` → `docs/archive/2026-04-upstream-fidelity-migration.md` にアーカイブ（完了済み移行レポート）
  - 旧 `DESIGN.md`（探索版）は `docs/archive/2026-04-v1.0-design-exploration.md` として保存
  - `docs/vscode-setup.md` から方式 A/B/C の重複説明を削除し、VS Code 固有の機能差分・トラブルシューティングに集中
  - `README.md` のインストールセクションを圧縮し、`INSTALL.md` をハブとしてリンク。ドキュメント目次を追加
  - `docs/archive/README.md` を新設し、アーカイブ運用ルールを明文化

### Updated

- `ARCHITECTURE.md`: ファイル構成図を最新化（CHANGELOG / ROADMAP / docs/ を反映）
- `.github/copilot-instructions.md`: ファイル構成記述を更新、`TODO.md` 参照を `ROADMAP.md` に修正
- `test/phase4-completeness.test.js` / `test/quality-gate.test.js`: `TODO.md` 依存テストを `ROADMAP.md` / `CHANGELOG.md` に移行

## [1.0.0.0] - 2026-04-25

### 🎉 v1.0 リリース

gstack-copilot-jp の最初の安定版リリース。日本語の GitHub Copilot ユーザーが、gstack の方法論をそのまま使える。

- **38スキル** — `/office-hours` から `/ship` まで、アイディア→出荷の全工程をカバー
- **5サブエージェント** — architect, security, testing, design-critic, dx-tester が専門レビューを担当
- **ヘッドレスブラウザ** — `/browse` でリアルなクリック、スクリーンショット、QAテスト
- **デュアルボイス** — Claude + GPT の独立レビューで死角を潰す `/autoplan`
- **本家 gstack v1.12.1.0 追跡完了** — 方法論とスキル判定基準は本家に追随

### Changed
- バージョン書式を upstream に統一: semver (`1.0.0-alpha.N`) → 4桁形式 (`MAJOR.MINOR.PATCH.MICRO`)

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
