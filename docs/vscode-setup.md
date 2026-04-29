# VS Code Copilot Chat — 補足ガイド

> インストール手順は **[../INSTALL.md](../INSTALL.md)** を参照。
> このファイルは VS Code 固有の機能差分・トラブルシューティングのみを扱う。

## 前提

- VS Code 1.110+
- GitHub Copilot Chat 拡張 0.45+
- `chat.plugins.enabled` が `true`（組織で無効化されていないこと）
- WSL Ubuntu（Windows の場合のみ。bash hook 実行のため）

## 機能差分マトリクス

INSTALL.md の方式 A / B / C で使える機能を VS Code 視点で比較:

| 機能 | 方式 A (Plugin From Source) | 方式 B (pluginLocations) | 方式 C (CLI user-link) |
|------|---------------------------|------------------------|----------------------|
| `/skill-name` 発火 | ✅ | ✅ | ✅ |
| MCP サーバー | ✅ | ✅ | — |
| Hooks（`PreToolUse`/`Stop` 等） | △ Preview / 相対パス問題あり | △ 同上 | ✅（cwd が repo のため安定） |
| browse / `$B`（Chromium） | ❌ CLI 専用 | ❌ CLI 専用 | ✅ |
| 複数 workspace で共通利用 | ✅ | ✅（ユーザー設定なら） | ✅ |
| 編集して即反映 | △ 拡張更新が必要 | ✅ | ✅ |

> **Tier C スキル**（`/browse`, `/canary`, `/benchmark`）はヘッドレス Chromium に依存するため CLI ターミナルから使う。VS Code 内ではメッセージのみ表示。

## 親リポからの自動発見（monorepo / multi-folder workspace）

別リポジトリのサブフォルダだけを VS Code で開いても親階層の gstack スキルを認識させたい場合:

```jsonc
{
  "chat.useCustomizationsInParentRepositories": true
}
```

`.git` の存在するリポルートまでさかのぼってカスタマイゼーションを発見する。trust プロンプトに承認が必要。

## トラブルシューティング

### スキルが `/` メニューに出ない

1. `chat.plugins.enabled` を確認（組織管理者により disabled の場合あり）
2. Chat 出力チャネル `GitHub Copilot Chat` のログを確認
3. **Diagnostics 表示**: Chat ビューで右クリック → `Diagnostics`。読み込まれたスキル/エージェント/プラグインとエラーが列挙される
4. スキルの frontmatter `name` フィールドがディレクトリ名と一致しているか確認（不一致は silently skip される）

### `Chat: Install Plugin From Source` が `destination already exists` で失敗

キャッシュを削除して再試行:

- Linux: `~/.config/Code/agentPlugins/github.com/akiyoshi/gstack-copilot-jp`
- macOS: `~/Library/Application Support/Code/agentPlugins/github.com/akiyoshi/gstack-copilot-jp`
- Windows (WSL): WSL 側 `~/.config/Code/agentPlugins/...`

### Hooks が動かない

VS Code Copilot Chat の hook は **Preview**。`chat.hookFilesLocations` に `.github/hooks` を含める:

```jsonc
{
  "chat.hookFilesLocations": {
    ".github/hooks": true
  }
}
```

`/careful` `/freeze` のセーフティガードは hook 依存。

### Windows ネイティブで bash が動かない

WSL Ubuntu 必須。VS Code は WSL Remote で開く（`Ctrl+Shift+P` → `WSL: Connect to WSL`）。

### 検証コマンド

VS Code Copilot Chat で:

```text
/office-hours   ← YC オフィスアワー
/investigate    ← 根本原因デバッガー
/ship           ← リリース PR 作成
```

これらが補完候補に出ない場合、上記トラブルシューティングを順に確認。

## 旧方式（非推奨）

`ln -s ../.gstack-copilot-jp/.github/skills .github/skills` のような Junction / シンボリックリンクを各リポに張る手順は **非推奨**。Windows 互換性に難があり、リポ毎に管理が必要。

代わりに INSTALL.md の方式 A または B を使う。
