# Upstream 追従ギャップ — 実装計画 (2026-04-29)

本ドキュメントは upstream `garrytan/gstack` v1.20.0.0 と現状 `gstack-copilot-jp` v1.0.1.0 の差分監査と、追随性を高める実装計画。

## 出発点の認識ずれ

| 項目 | 主張 | 実態 |
|---|---|---|
| 追跡 upstream バージョン | v1.12.1.0 (`upstream-tracking.json`) | v1.20.0.0（**8 リリース遅れ**） |
| `bin/upstream-diff.sh` の挙動 | 「up to date」を期待 | `git pull --ff-only` が浅いクローン + コミット間隔で**サイレント失敗** |
| 「Windows は対応外」 | v2.0 方針メモ | 本家は v1.0 から Windows 11 (Git Bash/WSL) 公式対応 |
| E2E テスト | 「Tier 2 を v1.0.x で計画」 | 本家は v1.15 で real-PTY harness (654行) を確立済み、現在 30+ E2E |

**致命的**: upstream-diff.sh のサイレント失敗で、3 か月分の本家進化を見逃していた。本計画ではこれを最優先で塞ぐ。

## ギャップ分類

### 致命度 P0（破綻している／すぐ直すべき）

| # | 項目 | 影響 | 修正方針 |
|---|---|---|---|
| P0-1 | `bin/upstream-diff.sh` の浅いクローン + サイレント `pull` 失敗 | 追跡が止まる | clone 時 `--depth` 廃止、`pull` 失敗時 exit code 非 0 に |
| P0-2 | `bin/browse.ps1` が存在しない `cli.js` を参照 | Windows で起動不可 | TypeScript ソース直接実行 or `cli.ts` 参照に修正、または削除 |
| P0-3 | `upstream-tracking.json/md` が v1.12.1.0 を主張 | 監査の信頼が崩壊 | v1.20.0.0 へ実態追記、未取込みエントリを `pending` で列挙 |

### 致命度 P1（upstream 取り込み遅延）

| # | 項目 | upstream バージョン | 影響 | 取込判断 |
|---|---|---|---|---|
| P1-1 | `/landing-report` スキル | v1.11.0.0 系 | `/ship` workspace-aware の補助。複数 PR 並行で必須 | **取込** |
| P1-2 | `/gstack-claude` スキル | v1.13.0.0 | 非-Claude ホスト向け Outside Voice | **取込**（Copilot CLI から Claude を呼ぶ手段として有用） |
| P1-3 | `bin/gstack-next-version` | v1.11.0.0 系 | `/ship` & `/landing-report` の workspace-aware 版番割当 | **取込** |
| P1-4 | `/scrape` + `/skillify` + browser-skills runtime | v1.20.0.0 | 200ms スクレイプ閉ループ | **取込**（`$B` 拡張を含む大型機能） |
| P1-5 | `/automate` の P0 トラッキング | v1.21+ 予定 | `/skillify` の mutating 版 | **追跡のみ**（upstream 出荷待ち） |

### 致命度 P2（基盤の追従）

| # | 項目 | upstream | 現状 | 取込判断 |
|---|---|---|---|---|
| P2-1 | E2E テスト基盤（real-PTY harness） | `test/helpers/claude-pty-runner.ts` 654行 | 構造テストのみ 7 ファイル | **採用**（`copilot -p` 用に翻案） |
| P2-2 | `skill-validation.test` フロントマター契約 | upstream あり | `skill-contracts.test.js` 部分的 | **拡張**（host/triggers/args 契約強化） |
| P2-3 | `hook-scripts.test` フック存在検証 | upstream あり | なし | **新規追加** |
| P2-4 | AskUserQuestion フォーマット適合テスト | v1.15 | なし | **新規追加**（ELI10/Recommendation/Pros/Cons） |
| P2-5 | tool-budget 退行検知 | v1.15 | なし | **後送り**（v1.2 以降） |
| P2-6 | `slop-scan` 統合 | v1.0+ | `/gstack-review` 内のみ | **CI 連携追加** |

### 致命度 P3（Windows / クロスプラットフォーム）

| # | 項目 | upstream | 現状 | 取込判断 |
|---|---|---|---|---|
| P3-1 | Windows 11 公式サポート（Git Bash / WSL） | あり | 「PowerShell 不要」に方針シフトしていた | **再開**（WSL/Git Bash で動かす条件で再対応） |
| P3-2 | Bun→Node.js フォールバック（Playwright pipe transport bug） | あり (`bun#4253`) | bash ラッパー側にあり、PS は壊れている | **適合**（PS 版を修正 or 廃止） |
| P3-3 | `bin/gstack-platform-detect` | あり | なし | **取込**（Bash 実装、Bun 不要版） |
| P3-4 | `bin/gstack-open-url` | あり | なし | **取込**（クロス OS URL オープナー） |
| P3-5 | `setup` の Windows 対応 | bash で動く（WSL/Git Bash 想定） | 同 | **明文化**（README に Windows 手順） |

### 致命度 P4（運用 bin の取りこぼし）

| # | bin スクリプト | 用途 | 必要性 |
|---|---|---|---|
| P4-1 | `gstack-next-version` | workspace-aware 版番 | P1-3 と同一 |
| P4-2 | `gstack-platform-detect` | エージェント検出 | P3-3 |
| P4-3 | `gstack-update-check` | sessionStart で plugin 更新通知 | hook が呼ぶが未実装（サイレントスキップ）→ **実装** |
| P4-4 | `gstack-uninstall` | アンインストール | setup の `--uninstall` で代替済み → **不要** |
| P4-5 | `gstack-repo-mode` | リポモード検出 | スキル内検出で代替 → **不要** |
| P4-6 | `gstack-open-url` | URL opener | P3-4 |
| P4-7 | `gstack-jsonl-merge` | JSONL マージ | 未使用 → **不要** |
| P4-8 | `gstack-relink` | グローバルリンク貼り直し | setup で代替 → **不要** |

### 致命度 P5（既に除外済み・追跡対象外）

引き続き除外。再評価不要:
- GBrain Sync 一式（v1.17）
- Sidebar Terminal REPL / xterm.js / WebSocket（v1.14）
- Tunnel dual-listener / 26-command allowlist（v1.16）
- Plan Mode Handshake（v1.12.1）
- ML Prompt Injection Defense（v1.4-v1.6.4）
- Model Overlays（v1.5.2）
- Agent SDK ベース機能全般（v1.10.1+）
- マルチホスト基盤（hosts/, model-overlays/, gen-skill-docs.ts, extension/, conductor.json）

## 実装計画（フェーズ分け）

### Phase A — 配管修理（v1.0.x パッチ、即時）

- **A-1**: `bin/upstream-diff.sh` を堅牢化
  - clone を `--depth 50` から完全クローンに（既存 repo は `git fetch --unshallow`）
  - `git pull` 失敗時に exit 1
  - VERSION 不一致時に強い警告
- **A-2**: `bin/browse.ps1` を修正
  - `cli.js` 参照を `src/cli.ts` + Bun 実行に
  - Bun 不在時は明示的にエラー（Node.js での TS 直接実行を案内）
  - もしくは PS 版を完全廃止して `bash` 経由統一を README で案内（Git Bash/WSL 要求）
- **A-3**: `upstream-tracking.json/md` を v1.20.0.0 反映
  - `upstream_commit` を最新へ
  - 取込予定エントリに `status: "planned"` を追加
  - `methodology の差分` テーブルに v1.13-v1.20 行を追加
- **A-4**: `bin/gstack-platform-detect` 移植（Bun 依存を bash + ハードコード解決に置換）
- **A-5**: `bin/gstack-update-check` を実装（hook がサイレントスキップしている件）

### Phase B — スキル追従（v1.1）

- **B-1**: `/landing-report` 追加 + `bin/gstack-next-version` 移植
  - `/ship` の workspace-aware 版番割当を実コード化
  - 並行 PR の VERSION 衝突を自動検出
- **B-2**: `/gstack-claude` 追加（Copilot CLI から Claude を Outside Voice として呼ぶ）
  - 既存の `task` tool での代替と差別化
  - claude CLI 不在時のグレースフル劣化
- **B-3**: 既存スキルの本家追従パッチを `bin/upstream-diff.sh --sync` で一括反映
  - v1.13-v1.20 の SKILL.md 変更（preamble 削減、フォーマット改善等）
- **B-4**: `copilot-instructions.md` を upstream `CLAUDE.md` に追従
  - v1.20 の Outside Voice ルーティング更新を反映

### Phase C — テスト基盤（v1.1〜v1.2）

- **C-1**: vitest → bun:test 段階移行検討
  - upstream と同じランナーで diff が取れる
  - もしくは vitest のまま、テスト構造は upstream に合わせる
- **C-2**: `test/hook-scripts.test.ts` 新設
  - `lifecycle.json` の各 hook が指すスクリプトの存在検証
- **C-3**: `test/skill-validation.test.ts` の契約強化
  - host / triggers / args / allowed-tools フィールドの厳格検証
- **C-4**: real-PTY harness を `copilot -p` 用に翻案（実験的）
  - `test/helpers/copilot-pty-runner.ts` を新設
  - 1〜2 個の E2E（`/office-hours`, `/ship` dry-run）から開始
- **C-5**: AskUserQuestion フォーマット適合テスト
  - スキル本文を grep し、ELI10/Recommendation/Pros/Cons 構造を検証

### Phase D — Browser-Skills 取込（v1.2 候補、要評価）

- **D-1**: 上流の `browse/src/{browse-client,browser-skills,browser-skill-commands,skill-token,browser-skill-write}.ts` を vendoring
- **D-2**: `/scrape` + `/skillify` SKILL.md を翻案
- **D-3**: バンドルリファレンス `hackernews-frontpage` 付属
- **D-4**: 三層ストレージ（project > global > bundled）を gstack-copilot-jp 上で動作確認
- **D-5**: 関連テストを移植（155 unit + 5 E2E）

**判断**: D は v1.2 で実装するか、本家 v1.21+ で `/automate` まで揃ってからまとめて取り込むかを v1.1 出荷後に再評価する。

### Phase E — Windows 再対応（v1.1 並行）

- **E-1**: README に Windows 手順を明記（Git Bash or WSL Ubuntu、Bun + Node.js 両方）
- **E-2**: `setup` を Git Bash で動作確認、必要な調整
- **E-3**: hook の `windows` キー（VS Code Copilot Chat 互換）の必要性再評価
- **E-4**: ユーザーメモリ（learnings.md）の v2.0 Linux 統一方針を更新

## 受入基準

各 Phase 完了時の判定:

- **Phase A**: `bin/upstream-diff.sh` が exit code で差分を返す。Windows ユーザーが `browse` 起動できる。トラッキング台帳が現実と一致。
- **Phase B**: `/landing-report` `/gstack-claude` が動く。SKILL.md 群が v1.20 ベースに揃う。
- **Phase C**: hook 検証テスト緑。real-PTY harness の最小デモ（office-hours）が CI で通る。
- **Phase D**: `/scrape` で hackernews-frontpage が JSON を返す。`/skillify` でスキル合成→テスト→commit が動く。
- **Phase E**: Git Bash on Windows 11 で `./setup && bash bin/browse.sh tabs` が成功。

## 非目標（本計画の対象外）

- マルチホスト基盤（hosts/, model-overlays/）の自前実装
- GBrain Sync の取込
- Sidebar Terminal REPL（xterm.js）
- ML Prompt Injection Defense
- Tunnel dual-listener
- Anthropic Agent SDK 依存機能

## 次アクション

1. ROADMAP.md を本計画に沿って書き直し（短期=Phase A、中期=Phase B+C+E、長期=Phase D）。
2. Phase A-1〜A-3 を即着手（即ライト）。
3. Phase A 完了後、上流の `--sync` を実行して B-3 を一気に進められる状態にする。
