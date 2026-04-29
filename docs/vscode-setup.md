# VS Code Copilot Chat セットアップガイド

gstack-copilot-jp を VS Code Copilot Chat (Agent Mode) で複数のリポジトリから安全に使い回す手順。

## 前提

- VS Code 1.110+
- GitHub Copilot Chat 拡張 0.45+
- Git
- WSL Ubuntu（Windows の場合は必須。bash hook 実行のため）
- `chat.plugins.enabled` が `true`（組織管理者により無効化されている場合は不可）

## 推奨: 方式 A — Plugin From Source（1コマンド・複数リポ自動対応）

VS Code 公式の **Agent Plugin** 仕様で配布しているため、GitHub URL を渡すだけで取り込める。

1. VS Code でコマンドパレット (`Ctrl+Shift+P`) を開く
2. `Chat: Install Plugin From Source` を選択
3. URL を入力: `https://github.com/akiyoshi/gstack-copilot-jp`
4. 信頼プロンプトを承認
5. **どのワークスペースを開いても** Copilot Chat の `/` メニューに 38 スキルが現れる

検証:

```text
/office-hours   ← YC オフィスアワー
/investigate    ← 根本原因デバッガー
/ship           ← リリース PR 作成
```

更新は `Extensions: Check for Extension Updates`（または 24 時間ごとに自動）。`extensions.autoUpdate` で自動化。

無効化/有効化: Extensions ビュー → `Agent Plugins - Installed` → 右クリックメニュー。ワークスペース単位の有効化も可能。

## 方式 B — ローカルクローン + `chat.pluginLocations`

スキルを編集しながら使う場合や、複数バージョンを並行運用したい場合に。

```bash
git clone https://github.com/akiyoshi/gstack-copilot-jp.git ~/.gstack-copilot-jp
```

ユーザー設定 (`Ctrl+,` → 右上のファイルアイコンで `settings.json`) に追加:

```jsonc
{
  "chat.pluginLocations": {
    "/home/<USERNAME>/.gstack-copilot-jp": true
  }
}
```

> Windows WSL の場合は WSL 側のパス（例: `/home/akiyoshi/.gstack-copilot-jp`）。Linux/macOS は `~` 展開ではなく絶対パス推奨。
> `false` にすると登録は残したまま無効化できる。

## 方式 C — Copilot CLI（ターミナル派）

```bash
git clone https://github.com/akiyoshi/gstack-copilot-jp.git
cd gstack-copilot-jp && ./setup --mode user-link
```

`~/.copilot/skills/gstack-copilot-jp` にシンボリックリンクが張られ、Copilot CLI と VS Code Copilot Chat の両方で `~/.copilot/skills/` 配下のスキルとして検出される。

## 親リポからの自動発見（monorepo / multi-folder workspace）

別リポジトリのサブフォルダだけを VS Code で開いても親階層の gstack スキルを使いたい場合:

```jsonc
{
  "chat.useCustomizationsInParentRepositories": true
}
```

`.git` の存在するリポルートまでさかのぼってカスタマイゼーションを発見する。trust プロンプトに承認が必要。

## 何が動いて何が動かないか

| 機能 | 方式 A (Plugin) | 方式 B (pluginLocations) | 方式 C (CLI user-link) |
|------|----------------|------------------------|----------------------|
| `/skill-name` 発火 | ✅ | ✅ | ✅ |
| エージェント (`*.agent.md`) | ✅ | ✅ | ✅ |
| MCP サーバー | ✅ | ✅ | — |
| Hooks（`PreToolUse`/`Stop` 等） | △ Preview / 一部スクリプトの相対パス問題あり | △ 同上 | ✅（cwd が repo のため安定） |
| browse / `$B`（Chromium） | ❌ CLI 専用 | ❌ CLI 専用 | ✅ |
| 複数 workspace で共通利用 | ✅ 1 回設定で全 workspace | ✅ ユーザー設定なら同上 | ✅ |
| 編集して即反映 | △ 拡張更新が必要 | ✅ | ✅ |

> Tier C スキル（`/browse`, `/canary`, `/benchmark`）はヘッドレス Chromium に依存するため CLI ターミナルから使う。VS Code 内ではメッセージのみ。

## トラブルシューティング

### スキルが `/` メニューに出ない

1. `chat.plugins.enabled` を確認（組織で disabled の場合あり）
2. Chat 出力チャネル `GitHub Copilot Chat` を確認
3. **Diagnostics 表示**: Chat ビューで右クリック → `Diagnostics`。読み込まれたスキル/エージェント/プラグインとエラーが列挙される
4. スキルのフロントマター `name` フィールドがディレクトリ名と一致しているか確認（不一致は silently skip）

### Plugin From Source が `destination already exists` で失敗

キャッシュを削除して再試行:

- Linux: `~/.config/Code/agentPlugins/github.com/akiyoshi/gstack-copilot-jp`
- macOS: `~/Library/Application Support/Code/agentPlugins/github.com/akiyoshi/gstack-copilot-jp`
- Windows (WSL): WSL 側 `~/.config/Code/agentPlugins/...`

### Hooks が動かない

VS Code Copilot Chat の hook は **Preview**。`chat.hookFilesLocations` に `.github/hooks` が含まれることを確認。`/careful` `/freeze` のセーフティガードは hook 依存。

```jsonc
{
  "chat.hookFilesLocations": {
    ".github/hooks": true
  }
}
```

### Windows ネイティブで bash が動かない

WSL Ubuntu 必須。VS Code は WSL Remote で開く（`Ctrl+Shift+P` → `WSL: Connect to WSL`）。

## 旧方式（非推奨）

過去版の README で案内していた以下の手順は **非推奨**。Junction/シンボリックリンクは Windows 互換性に難があり、各リポで手動で張る必要があった。

```bash
# 旧: 推奨しない
ln -s ../.gstack-copilot-jp/.github/skills .github/skills
```

代わりに方式 A または B を使う。
