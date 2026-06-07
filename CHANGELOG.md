# Changelog

All notable changes to this project will be documented in this file.

## [1.3.2.0] - 2026-06-07

### 🤖 Outside Voice のモデルを最新世代に更新

Outside Voice（マルチモデルレビュー）のデフォルトモデルが古い世代（GPT-5.4 / Claude Sonnet 4）に固定されており、最新モデルが選択されていなかった。

### Fixed

- **`bin/gstack-codex-probe` のデフォルトモデルを最新世代へ更新** — Claude プライマリ時の Outside Voice を `gpt-5.4` → **`gpt-5.5`**、GPT プライマリ時を `claude-sonnet-4` → **`claude-sonnet-4.6`** に変更。各ファミリーの最新モデルを指定し、新モデル登場時に更新すべき旨をコメントで明記
- ドキュメント（`DESIGN.md`、`browse` スキルの例）のモデル表記も GPT-5.5 に追従。なお `outside_voice_model` 設定での明示指定が常に優先される点は不変

## [1.3.1.0] - 2026-06-07

### 🇯🇵 日本語出力の回帰を修正 — ask_user の質問が英語化する問題

v1.3.0.0 の同期で本家スキル本体が大幅に長大化（v1.46 の on-demand sections 化）した結果、各スキル内の英語 ask_user テンプレートが「近接指示」として優先され、`copilot-instructions.md` の日本語ファースト指示を上書きしてしまい、ユーザーへの質問が英語で表示される回帰が発生していた。

### Fixed

- **全スキル本体の冒頭（frontmatter 直後）に言語ルール banner を注入** — 「ユーザーに表示するテキストは必ず日本語に翻訳する」ことを最優先・上書き禁止として明示。手順・テンプレート・ask_user の質問文や選択肢が英語でも、ユーザー向け表示は日本語になる。vendored・adapted を含む全 39 ディレクトリのスキルに適用
- **`bin/adapt-upstream-skill.sh` に banner 注入を組み込み** — Layer 3 の最終出力組み立て時に banner を自動付与。今後の同期でも日本語出力指示が確実に残る

## [1.3.0.0] - 2026-06-07

### ⬆️ 本家 gstack v1.20.0.0 → v1.56.0.0 を同期（58 commits）

本家の方法論改善 ── とりわけ大幅な token-reduction（v1.46 の catalog tokens -56%、v1.54 の ship skeleton 化）── を取り込んだ。`/office-hours` や 4 つの `/plan-*` レビュー系スキルは 7 割前後スリムになり、同じ振る舞いをより少ないトークンで読み込めるようになった。日本語ファーストの出力や Outside Voice（マルチモデルレビュー）の仕組みはそのまま維持している。

GitHub Copilot CLI 専用という方針は不変で、本家が追加した iOS デバイスファーム・GBrain クロスマシンメモリ・Claude Code サイドバー固有の機能は取り込んでいない。

### Changed

- **34 の vendored スキルを再生成** — `/office-hours` `/plan-ceo-review` `/plan-eng-review` `/plan-design-review` `/plan-devex-review` `/autoplan` `/cso` `/qa` ほか。本家 v1.21〜v1.56 の簡潔化・AskUserQuestion 分割ルール（v1.48）を反映
- **`/plan-*` の「次のスキル」ハンドオフと `/office-hours` の品質ゲート（Spec Review Loop）を維持** — 本家が削除した skill-chaining セクションを gstack-copilot-jp の契約として復元

### Fixed

- **スキル同期ツール `bin/adapt-upstream-skill.sh` を本家の新パターンに対応** — gbrain の「Brain Context」ブロック混入、`eval "$(true"` という壊れた bash の生成、小文字 `codex` 表記の残存、`allowed-tools` への不正値混入を解消。次回以降の同期がよりクリーンになる
- **`sections/` サイドカー（v1.46 で導入された on-demand セクション分割）の互換変換に対応** — 本体と同じ互換ルールを適用し、Claude 固有パス・gbrain 参照・`codex` 表記を除去。さらに本体側のパス書き換え（`/review` → `/gstack-review`）に合わせてサイドカーのファイル名（`review-sections.md` → `gstack-review-sections.md`）も変換し、参照切れを防止

### Tracking

- **新規スキルを追跡台帳に分類** — iOS デバイスファーム 5 種類と `/sync-gbrain` を excluded、`/spec`・`/document-generate` を planned（将来採用候補）として追加
- `upstream-tracking.json` / `upstream-tracking.md` を v1.56.0.0 (cab774cc) に更新

## [1.2.6.0] - 2026-05-02

### 🧠 /office-hours の記憶機能を復活（developer-profile 統合）

これまで `/office-hours` は何度実行してもセッション数を覚えていなかった。`gstack-builder-profile` バイナリが stub のまま出荷されており、Phase 6 の関係深化（welcome_back / regular / inner_circle）が常に `introduction` モードに固定されていた。本家 gstack v1.20.0.0 の `gstack-developer-profile` 設計に合わせて、休眠していた記憶機能を復活させた。

これで複数のリポジトリで `/office-hours` を並行実行しても、リポごとに独立したコンテキストとして記録される（`~/.gstack/projects/{slug}/` 配下にイベントが per-slug 分離）。同じプロジェクトに何度も戻れば、CEO は前回の design doc / assignment を覚えていて関係を深めてくれる。

### Added

- **`bin/gstack-developer-profile`** — 統一プロファイルバイナリ（本家 v1.20.0.0 準拠の最小実装）。`--read` / `--profile` / `--migrate` / `--append-session` をサポート
- **自動マイグレーション** — 既存ユーザーの `~/.gstack/builder-profile.jsonl` は初回 `--read` で `~/.gstack/developer-profile.json` に idempotent 移行される。元ファイルは `.migrated-<TS>` にアーカイブ

### Changed

- **`.github/skills/bin/gstack-builder-profile`** — stub から legacy shim へ。`gstack-developer-profile --read` に委譲
- **`.github/skills/office-hours/SKILL.md`** — `builder-profile.jsonl` 直書き 2 箇所を `gstack-developer-profile --append-session` 経由に変更。Phase 6 の profile 読み込みも統一バイナリ経由に
- **`upstream-tracking.json` / `upstream-tracking.md`** — developer-profile 周りの追跡を `vendored` に更新

## [1.2.5.0] - 2026-04-29

### 🔁 出荷時 CHANGELOG 必須化（preference 撤回）

「CHANGELOG 不要」というユーザー preference を撤回し、`/ship` ほかスキル本来の動作に戻した。CHANGELOG はリリースノートとして利用者向けの主要なコミュニケーション手段なので、不要 preference は実態と乖離していた（実際にすべてのリリースで CHANGELOG エントリは書かれていた）。

### Changed

- **`test/quality-gate.test.js` のスキル数整合チェック** — `if (!existsSync(changelogPath)) return` の早期 return を削除し、`CHANGELOG.md is required` の `expect` に変更。CHANGELOG 不在は失敗扱い

## [1.2.4.0] - 2026-04-29

### 🔄 upstream 整合：`TODOS.md` 命名へ統一

本家 gstack の `autoplan` ほか各レビュースキルが採用する `TODOS.md` 命名にリポジトリ全体を揃えた。これまで `bin/adapt-upstream-skill.sh` で upstream の `TODOS.md` を `plan.md` に書き換えていたため、autoplan / ship / plan-ceo-review などで「Deferred to TODOS.md」「TODOS.md auto-update」といった本家の手順がローカルでは `plan.md` を参照しており、ファイルがないため事実上スキップされていた。

### Changed

- **`ROADMAP.md` → `TODOS.md` にリネーム** — 本家命名と整合。VERSION 整合テストや retro / ship のバックログ走査も `TODOS.md` を見るように更新
- **15 個のスキルの SKILL.md で `plan.md` → `TODOS.md` 90 箇所置換** — autoplan / ship / plan-ceo-review / plan-eng-review / plan-design-review / plan-devex-review / qa / qa-only / retro / investigate / cso / design-review / document-release / gstack-review / office-hours
- **`bin/adapt-upstream-skill.sh` の `TODOS.md → plan.md` sed を削除** — 今後 upstream を取り込むと `TODOS.md` がそのまま反映される
- **README / ARCHITECTURE / DESIGN / copilot-instructions のリンク・記述を `TODOS.md` に更新**
- **VERSION / package.json / plugin.json を `1.2.4.0` に統一** — `1.2.3.0` 出荷時に `package.json` が `1.2.2.0` のまま残っていたドリフトを解消

## [1.2.2.0] - 2026-04-29

### 📚 ドキュメント整理（Diátaxis 風 + Keep a Changelog）

実装済みの内容を ROADMAP から CHANGELOG に集約し、完了済みの設計探索ドキュメントをアーカイブへ退避。`getting-started.md` の独自要素を README/INSTALL に集約して 2 箇所メンテを解消。

### Changed

- **CHANGELOG.md にリリース実績を集約** — 抜けていた v1.0.3.0 / v1.1.0.0 / v1.1.1.0 / v1.2.0.0 / v1.2.1.0 のエントリを git log + ROADMAP の完了セクションから再構成
- **ROADMAP.md をスリム化** — 完了したリリース／Phase をすべて削除し、未着手・進行中（現在は v1.3 Phase C / v1.4 Browser-Skills）のみに圧縮（236 → 約 65 行）
- **README §「使い始める」を強化** — 削除した `getting-started.md` から「最初に試す 3 つ」表とスキル連鎖サンプルを README §2 に統合
- **INSTALL.md トラブルシュートに `/browse` Chromium 起動失敗を追加** — Playwright インストール手順 + Bun#4253 の Node.js フォールバック説明

### Removed

- **`docs/getting-started.md`** — 内容は README §2 と INSTALL.md トラブルシュートに完全統合
- **`docs/upstream-gap-plan.md`** → [docs/archive/2026-04-upstream-gap-plan.md](docs/archive/2026-04-upstream-gap-plan.md)（v1.0.2 〜 v1.1 で消化済み）
- **`docs/v1.1-implementation-plan.md`** → [docs/archive/2026-04-v1.1-implementation-plan.md](docs/archive/2026-04-v1.1-implementation-plan.md)（v1.1.0.0 で出荷済み）
- **`docs/v1.2-outside-voice-redesign.md`** → [docs/archive/2026-04-v1.2-outside-voice-redesign.md](docs/archive/2026-04-v1.2-outside-voice-redesign.md)（v1.2.0.0 で出荷済み）
- **`test/quality-gate.test.js` から `getting-started.md` 品質検証 describe ブロックを撤去**（参照先消失）

### Updated

- `ARCHITECTURE.md` / `.github/copilot-instructions.md`: ファイル構成図から `docs/getting-started.md` を削除、archive コメントを「過去の設計探索資料・実装計画」に更新
- `docs/archive/README.md`: アーカイブテーブルに 3 ファイル追記
- `upstream-tracking.md` / `docs/archive/2026-04-v1.2-outside-voice-redesign.md`: アーカイブ移動後の相互参照パスを修正

### Notes

- ドキュメント変更のみ（PATCH リリース）。スキル設計・コマンド名・フロントマター契約・bin/ ロジックの変更なし。
- テスト 826 件中 761 件 pass（事前から失敗している 65 件は `Next skill` ハンドオフ節未記載に関するもので、本リリースとは無関係）。

## [1.2.1.0] - 2026-04-29

### 🎯 user-skills sync 統合 — VS Code 認識保証 + 予約名衝突検出

`~/.copilot/skills/` への per-skill リンク管理を `setup` に統合。VS Code Copilot Chat と Copilot CLI からスキルが認識されるよう保証し、VS Code 組み込みコマンド（`/review` `/explain` 等）との衝突を fail-fast で検出（PR #19）。

### Added

- **`bin/gstack-sync-user-skills`（bash 248 行）** — repo の `.github/skills/<dir>/SKILL.md` を持つ全ディレクトリを発見し、`~/.copilot/skills/<dir>` に link 作成（Linux/macOS/WSL: symlink、Windows Git Bash: junction で管理者権限不要）。dangling link / 古いリンク残骸を自動削除、予約名衝突は fail-fast (exit 2)、`--dry-run` / `--quiet` サポート
- **`bin/gstack-sync-user-skills.ps1`（PowerShell 187 行）** — Windows ネイティブ動作（WSL/Git Bash 不要）。`mklink /J` でジャンクション作成（管理者権限不要、NTFS のみ）
- **`test/reserved-names.js`** — VS Code Copilot Chat 組み込み 14 コマンド名を canonical list として管理。`RESERVED_BUILTIN_COMMANDS` を export、`isReservedName(name)` ヘルパー提供
- **`test/quality-gate.test.js` に 5 契約追加**:
  1. 重複フロントマターブロック検出（v1.1.2 の `gstack-upgrade` 事故の再発防止）
  2. 予約名衝突検出（`name: review` 等で built-in を上書きしないよう fail-fast）
  3. ディレクトリ名 ≡ name フィールド一致（silent-skip 防止）
  4. name 正規表現の統一（kebab-case 厳格）
  5. bash / ps1 / JS の予約名リスト同期検証

### Changed

- **`setup` の `do_user_link` / `do_uninstall` に sync 統合** — per-skill link を先に作成 / 削除し、repo root link はその後に処理
- **`browse/SKILL.md` の重複フロントマターブロック解消** — v1.1.2 で残った事故の根因対応

### Documentation

- **INSTALL.md トラブルシュートセクション追加** — コマンド embeddings キャッシュ削除手順（VS Code が古いコマンド一覧をキャッシュする問題）、dangling link の自動復旧手順、`/review` などの組み込みコマンドが反応しない場合の prefix 回避策

## [1.2.0.0] - 2026-04-29

### 🎯 Outside Voice 刷新（Codex CLI 依存撤廃）

設計判断（マルチホスト + マルチモデル）と SKILL.md 表面の乖離を解消。設計ドキュメントは [docs/archive/2026-04-v1.2-outside-voice-redesign.md](docs/archive/2026-04-v1.2-outside-voice-redesign.md) に保存（PR #18）。

### Changed

- **17 個のスキルの言語刷新** — `Codex` 言及を `Outside Voice` 表記へ統一。互換シム名（`gstack-codex-probe`、`_gstack_codex_*`）は本家 sync 摩擦を抑えるため維持
- **autoplan の preflight 統一** — `command -v codex` ガード撤去 → `gstack-codex-probe` シム経由に一本化
- **DESIGN.md §6.5「マルチモデル Outside Voice」追加** — README + ROADMAP と整合

### Added

- **`bin/decodex-skills.sh`** — 一括置換ツール（互換シム名 protect、dry-run 対応）
- **契約テスト** — `Codex` 文字列が SKILL.md / `.github/copilot-instructions.md` に再混入したら fail（`test/skill-contracts.test.js`）
- **adapter 翻案ルール** — `bin/adapt-upstream-skill.sh` Layer 2 に Codex → Outside Voice 自動置換を追加

### Deferred

- `gstack-codex-probe` → `gstack-outside-voice` rename は v1.4（Browser-Skills 取込と同期）に繰り延べ

## [1.1.1.0] - 2026-04-29

### Fixed (security)

- **`bin/gstack-open-url` の PowerShell command injection 修正** — `'$URL'` を環境変数渡し（`GSTACK_URL` env var）に変更し、シングルクォート breakout を遮断
- **`bin/gstack-open-url` に scheme allowlist 追加** — `http://` / `https://` のみ許可、`file://` `javascript:` 排除
- **`bin/adapt-upstream-skill.sh` に `status='adapted'` ガード追加** — 手動再構築済み SKILL.md を本家 sync で誤って上書きしないよう保護
- **adapter 内の `python3 -c` 2 箇所を env-var パターンに統一** — v1.0.3 の同種修正と整合

### Fixed (truthfulness)

- **`landing-report` SKILL.md と README から虚偽記述削除** — 「Bun 不在時は Node.js + tsx でフォールバック」は誤り（`bin/gstack-next-version` は Bun 必須、shebang `#!/usr/bin/env bun`）
- **`landing-report` Step 1 に gh / bun 不在チェックを実コード化** — 前バージョンは「停止する」と記述するのみで実装は `echo main` フォールバックだった
- **README で `browse` の Node.js fallback と `bin/gstack-next-version` の Bun 必須を明確に区別**

### Changed

- **`quality-gate.test.js` のスキル数検証をディレクトリカウント single source of truth に変更** — CHANGELOG / getting-started.md の prose regex 検証は「記載されている場合のみ一致」に緩和（CHANGELOG 不要 preference との整合）

## [1.1.0.0] - 2026-04-29

### Added

- **`/landing-report` スキル** — 並行 PR の VERSION 衝突検出ダッシュボード。`bin/gstack-next-version` で次の空き VERSION スロットを表示
- **`bin/gstack-next-version`** — VERSION スロット自動割当ユーティリティ（Bun 必須、`gh pr list` で衝突検出、Conductor 兄弟ワークツリー検出）
- **`bin/gstack-open-url`** — クロス OS URL オープナー。WSL2 検出（`/proc/version` の `microsoft`）+ `powershell.exe Start-Process` フォールバック
- **Windows 11 公式サポート再開（実験的、dogfooding）** — README に「Windows 対応（実験的）」セクション追加。Bun + Node.js + Git Bash/WSL2 + `gh` CLI の前提を明示
- **`setup --mode user-link` の Windows Developer Mode 検出** — symlink テスト sentinel + 親切なエラーメッセージ + 3 つの代替案案内
- **INSTALL.md にアップグレードガイド** — v1.0.3 → v1.1 の手順、ロールバック手順

### Changed

- **`copilot-instructions.md` ルーティングテーブル更新** — `/landing-report` 追加、スキル数 38 → 39 に整合
- **前提条件に `gh` CLI 追加** — `/ship` `/landing-report` `/land-and-deploy` で必須

### Notes

- **B-2 `/gstack-claude` は v1.1 スコープ除外** — task tool 経由 Outside Voice と機能重複のため、v1.2 で再評価（→ v1.2 で「重複は解消、rename は v1.4 に繰延」と確定）
- **hook の `windows` キーは不要** — `.github/hooks/lifecycle.json` は VS Code Copilot Chat 互換形式（PascalCase + `command`）で `bash bin/...` 統一されており、Windows でも WSL bash 経由で動作

## [1.0.3.0] - 2026-04-29

### Fixed (security)

- **Python code injection 修正（`bin/upstream-diff.sh`）** — `python3 -c "... '$VAR' ..."` で bash 変数を文字列補間する箇所 3 箇所を環境変数渡しパターン（`VAR="$VAR" python3 -c 'import os; v=os.environ["VAR"]; ...'`）に統一。攻撃例: ディレクトリ名 `evil'+__import__('os').system('id')+'pad/`

### Fixed

- **`plugin.json` の version を VERSION ファイルと一致** — 乗り越しで 1.0.0 のままだったバグを修正
- **15 個のスキルのフロントマター修正** — `/setup-deploy` `/unfreeze` ほか、v1.0.2 以前の壊れた `allowed-tools` を整形

### Added

- **3 ファイルバージョン一致テスト** — `quality-gate.test.js` に VERSION / package.json / plugin.json の version 一致を契約化（再発防止）
- **`bin/upstream-diff.sh` 堅牢化**:
  - dirty tree ガード追加（`--sync` 実行前に modified + untracked changes を検出して fail-fast）
  - サブシェルでカウンタが親シェルに伝播しないバグを修正（`while read` のパイプ → `< <(...)`）
  - `--sync --interactive` モード追加（diff プレビュー + 確認プロンプト、各スキルの先頭 40 行表示で supply chain 緩和）
- **`test/skill-contracts.test.js` 拡張**:
  - `name` フィールドがディレクトリ名と一致（認識不能のサイレントスキップを防ぐ）
  - `allowed-tools` の値が既知ツール ID 集合に含まれる
  - `description` が 1024 文字以下（VS Code Copilot Chat と Codex 両方の上限に適合）
- **`bin/adapt-upstream-skill.sh` の設計見直し** — `upstream-tracking.json` の `upstream` フィールドをローカル名 ≠ upstream 名マッピングの単一情報源として使用
- **INSTALL.md にアップグレードガイドセクション追加** — v1.0.2 → v1.0.3 の手順、ロールバック手順、`/gstack-review` 認識不能時のトラブルシュート
- **ROADMAP.md にリリースポリシーセクション追加**

### Changed

- **ROADMAP の現在のリリース表記を v1.0.3.0 に修正**

### Notes

- v1.0.3 は内部改修と `plugin.json` のバージョン修正のみ。スキル設計・コマンド名・フロントマター契約は変えていないため PATCH リリース。

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

- **39スキル** — `/office-hours` から `/ship` まで、アイディア→出荷の全工程をカバー
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
