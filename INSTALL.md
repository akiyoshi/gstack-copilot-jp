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
