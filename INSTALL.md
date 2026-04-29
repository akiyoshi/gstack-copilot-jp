# INSTALL.md

gstack-copilot-jp を **複数のリポジトリ・workspace から再利用するための公式手順**。

## TL;DR

- VS Code で使う → **方式 A: Plugin From Source**
- スキルを編集する / 複数バージョン並行 → **方式 B: pluginLocations**
- Copilot CLI 中心 → **方式 C: setup --mode user-link**

すべての方式で **複数のリポジトリ・workspace から同じスキルが使える**。リポジトリ単位の手動セットアップ（`.gitmodules` や Junction）は不要。

---

## 方式 A: VS Code Plugin From Source（推奨）

VS Code 公式の Agent Plugin 仕様で配布されているため、URL を渡すだけで全 workspace に展開される。

### 手順

```text
1. VS Code でコマンドパレット (Ctrl+Shift+P)
2. "Chat: Install Plugin From Source"
3. URL: https://github.com/akiyoshi/gstack-copilot-jp
4. 承認
```

完了後、**任意の workspace** で Copilot Chat を開いて `/office-hours` と打って動作確認。

### 検証

```text
Chat ビュー → 右クリック → "Diagnostics"
→ Plugins セクションに gstack-copilot-jp が出ていれば OK
→ Skills セクションに 38 個のスキルがロードされていることを確認
```

### 更新

- 自動: `extensions.autoUpdate` を有効にしておくと 24 時間ごとに `git pull` が走る
- 手動: コマンドパレット → `Extensions: Check for Extension Updates`

### アンインストール

Extensions ビュー → `Agent Plugins - Installed` → `gstack-copilot-jp` → 右クリック → `Uninstall`

---

## 方式 B: ローカルクローン + `chat.pluginLocations`

スキルを編集しながら検証したい場合・自分用フォークを使いたい場合に。

### 手順

```bash
git clone https://github.com/akiyoshi/gstack-copilot-jp.git ~/.gstack-copilot-jp
```

ユーザー `settings.json`（`Ctrl+,` → 右上のファイルアイコン）に追加:

```jsonc
{
  "chat.pluginLocations": {
    "/home/<USERNAME>/.gstack-copilot-jp": true
  }
}
```

WSL Ubuntu からは `/home/<USERNAME>/...` の Linux パスを使う。Windows のドライブパス (`C:\Users\...`) は WSL Remote セッションでは認識されないことがある。

### 更新

```bash
cd ~/.gstack-copilot-jp && git pull
```

VS Code は次回 Chat 起動時に自動再ロード。

### 無効化（設定は残す）

```jsonc
{
  "chat.pluginLocations": {
    "/home/<USERNAME>/.gstack-copilot-jp": false
  }
}
```

---

## 方式 C: Copilot CLI（ターミナル派）

CLI で使いつつ VS Code Chat にも露出させたい場合。

### 手順

```bash
git clone https://github.com/akiyoshi/gstack-copilot-jp.git ~/.gstack-copilot-jp
cd ~/.gstack-copilot-jp
./setup --mode user-link
```

`./setup --mode user-link` で:

- Bun ビルド（browse バイナリ）
- Playwright Chromium 取得
- `~/.copilot/skills/gstack-copilot-jp` にシンボリックリンク
- マニフェストを `~/.gstack/hosts/copilot-cli/installations/` に書き込み

VS Code Copilot Chat も `~/.copilot/skills/` を自動的に **個人スキル** として読む。

### 検証

```bash
copilot
> /office-hours
```

### アンインストール

```bash
cd ~/.gstack-copilot-jp && ./setup --uninstall
```

---

## ボーナス: 親リポからの自動発見

monorepo の子フォルダだけを VS Code で開く場合や、`d:\github` のような **複数リポジトリを束ねた multi-folder workspace** で各サブリポにスキルを浸透させたい場合。

任意のユーザー設定 or workspace 設定 (`.vscode/settings.json`) に:

```jsonc
{
  "chat.useCustomizationsInParentRepositories": true
}
```

→ `.git` を持つリポルートまでさかのぼってスキル/エージェント/instructions/hooks を発見。trust プロンプト承認が必要。

---

## 既存の利用方法からの移行

### 旧方式: Junction / シンボリックリンク

過去版で案内していた:

```bash
# 旧（Windows Junction）
mklink /J .github\skills D:\github\gstack-copilot-jp\.github\skills

# 旧（Linux/macOS symlink）
ln -s ../.gstack-copilot-jp/.github/skills .github/skills
```

この方式は **各リポで手動セットアップが必要**で Windows 互換性も悪かった。**方式 A または B に切り替え推奨**。

### 移行手順

```bash
# 1. 旧 Junction/symlink を削除
cd /path/to/your-repo/.github
rm skills agents          # WSL/Linux/macOS
# または rmdir skills agents (Windows: junction はディレクトリ扱い)

# 2. プロジェクトの copilot-instructions.md から `inherits: gstack-copilot-jp` 行を削除
#    （単独運用に戻す or プロジェクト固有ルールのみ保持）

# 3. 方式 A or B でグローバルに再導入（一度だけでよい）
```

---

## 比較表

| 観点 | A: Plugin | B: pluginLocations | C: CLI user-link |
|------|-----------|--------------------|--------------------|
| セットアップ手数 | 1 ステップ | 2 ステップ | 3 ステップ |
| 編集→反映 | 拡張更新後 | 即時 | 即時 |
| browse / Playwright | ❌ | ❌ | ✅ |
| Hook（Preview） | △ | △ | ✅ |
| 複数 workspace 共通利用 | ✅ | ✅ | ✅ |
| Copilot CLI でも使える | ❌ | ❌ | ✅ |
| Windows ネイティブ | ✅（hook以外） | ✅（hook以外） | ❌（WSL必須） |

**迷ったら方式 A**。CLI/Hook/Browser を本格的に使うなら **方式 C** を併用。

---

## アップグレード

### v1.1.0.0 → v1.1.1.0

**含まれる変更**: post-merge `/gstack-review` 指摘の hotfix。
- **Security**: `bin/gstack-open-url` の PowerShell injection 修正（env-var パターン、scheme allowlist 追加）。`bin/adapt-upstream-skill.sh` の Python injection 修正と `status='adapted'` ガード
- **Truth in docs**: `/landing-report` SKILL.md と README から「Bun fallback」虚偽記述削除。`/landing-report` Step 1 に gh/bun 不在チェック実装
- **Test design**: スキル数検証をディレクトリカウント single source of truth に統一

**互換性**: 機能変更なし、バグ修正のみ。**`/landing-report` を使うには bun が PATH に必要**（前バージョンの「Node.js fallback」記述に依拠していた場合は注意）。

### v1.0.3.0 → v1.1.0.0

**含まれる変更**:
- 新スキル `/landing-report` 追加（並行 PR の VERSION 衝突検出ダッシュボード）
- 新コマンド `bin/gstack-next-version` 追加（VERSION スロット自動割当ユーティリティ、`/ship` の workspace-aware 機能を有効化）
- 新コマンド `bin/gstack-open-url` 追加（クロス OS URL オープナー、WSL2 検出対応）
- Windows 11 公式サポート再開（dogfooding 段階、実験的）
- README に Windows セクション追加、`gh` CLI を前提条件に追加
- `setup` の Developer Mode 検出と親切エラーメッセージ
- スキル数 38 → 39

**互換性**: 全て追加的な変更。既存スキル・コマンドは挙動変更なし。

**方式 A（Plugin From Source）**: 自動更新（24h）または `Extensions: Check for Extension Updates`。

**方式 B / C**: `git pull origin main`。新機能を使うには `gh` CLI がインストール・認証済みであることが推奨。

```bash
# 確認
gh auth status   # 既に認証済みなら OK
gh auth login    # 未認証ならログイン
```

### v1.0.2.0 → v1.0.3.0

**含まれる変更**: バージョン乖離修正（plugin.json）、`bin/upstream-diff.sh` 堅牢化、`/setup-deploy` `/unfreeze` ほか 13 スキルのフロントマター修正、契約テスト追加、Python code injection の修正（`--sync` 内）。
**互換性**: スキル名・コマンド・フロントマター契約に破壊的変更なし。設定ファイルや CLI 引数の使い方も変わらない。

> **注記 (plugin.json バージョン跳躍)**: `plugin.json.version` は v1.0.0 から v1.0.3.0 に直接ジャンプする（v1.0.1.0 / v1.0.2.0 では更新漏れだった）。VS Code の Plugin From Source キャッシュは内部的に最新版へ追従するため通常は問題なし。`plugin.json.version` を直接パースしている独自ツールがあれば確認推奨。

**方式 A（Plugin From Source）**:

VS Code が 24h ごとに自動 pull するため、特別な手順は不要。即時更新したい場合:

```text
コマンドパレット → "Extensions: Check for Extension Updates"
```

**方式 B / C（ローカルクローン）**:

```bash
cd ~/.gstack-copilot-jp   # または clone した場所
git fetch origin
git pull --ff-only origin main
```

`bin/upstream-diff.sh --sync` を **使っていた場合のみ**: v1.0.3 から `--sync` は事前に `.github/skills/` の dirty tree を検出して fail-fast するようになった。同期前に作業中の変更は commit/stash しておくこと。

```bash
# Before sync (v1.0.3+):
git status .github/skills/   # 未コミットがないか確認
git stash push -m pre-sync -- .github/skills/   # 必要なら退避

# Sync with preview:
bash bin/upstream-diff.sh --sync --interactive

# Rollback if needed:
git checkout HEAD -- .github/skills/
```

### ロールバック手順（v1.0.3 → v1.0.2）

問題が発生した場合:

```bash
# 方式 A: VS Code 拡張のロールバックは不可。
#         代わりに akiyoshi/gstack-copilot-jp を pin commit clone:
#   1. Uninstall して
#   2. git clone --branch v1.0.2.0 ... して方式 B/C へ移行

# 方式 B/C:
cd ~/.gstack-copilot-jp
git checkout v1.0.2.0
```

> **方式 A の制限**: Plugin From Source は最新版への自動追従が前提で、特定バージョン固定の機構はない。バージョン固定が必要な運用（社内本番など）では、最初から方式 B または方式 C を選ぶこと。

---

## トラブルシューティング

### スキルが Copilot Chat の `/` 候補に出てこない

VS Code Copilot Chat はスキル一覧をローカルにキャッシュする。新スキル追加 / フロントマター修正後に認識されない場合:

1. **VS Code をリロード**: コマンドパレット → `Developer: Reload Window`
2. **Plugin の再読み込み**: コマンドパレット → `Chat: Reload Plugin From Source` → URL に `https://github.com/akiyoshi/gstack-copilot-jp` を再入力
3. **Diagnostics で確認**: Chat ビュー → 右クリック → `Diagnostics` → Plugins セクションで gstack-copilot-jp の `Skills` 個数を確認
4. それでも出ない場合は SKILL.md のフロントマターが契約を満たしているか:
   ```bash
   npx vitest run test/skill-contracts.test.js
   ```

### `/setup-deploy` `/unfreeze` 等で「allowed-tools 未知」エラー

v1.0.2.0 以前の壊れたフロントマターが残っている可能性。v1.0.3.0 でこれら 13 スキルのフロントマターが修正された。`git pull` で最新へ更新すれば解消する。

### Windows で `bin/upstream-diff.sh` が動かない

Git Bash または WSL2 から実行すること。PowerShell から bash スクリプトを直接呼ぶことはサポートしていない（v1.1 で改善予定）。

```bash
# Git Bash の例:
bash bin/upstream-diff.sh
```
