# VS Code Copilot Chat セットアップガイド

gstack-copilot-jp を VS Code Copilot Chat (Agent Mode) で使うための手順。

## 前提条件

- VS Code 1.110 以降
- GitHub Copilot Chat 拡張機能（0.45 以降）
- Git
- WSL (Ubuntu)（Windows の場合）

## インストール

### 方式 1: プロジェクトにクローン（推奨）

```bash
cd your-project
git clone https://github.com/akiyoshi/gstack-copilot-jp.git .gstack-copilot-jp

# スキルとエージェントをプロジェクトにリンク
mkdir -p .github
ln -s ../.gstack-copilot-jp/.github/skills .github/skills
ln -s ../.gstack-copilot-jp/.github/agents .github/agents
```

### 方式 2: サブモジュールとして追加

```bash
cd your-project
git submodule add https://github.com/akiyoshi/gstack-copilot-jp.git .gstack-copilot-jp

mkdir -p .github
ln -s ../.gstack-copilot-jp/.github/skills .github/skills
ln -s ../.gstack-copilot-jp/.github/agents .github/agents
```

### 方式 3: ユーザーグローバルにインストール

```bash
git clone https://github.com/akiyoshi/gstack-copilot-jp.git ~/.gstack-copilot-jp

# ユーザースキルディレクトリにリンク
mkdir -p ~/.copilot/skills
ln -s ~/.gstack-copilot-jp/.github/skills/office-hours ~/.copilot/skills/office-hours
ln -s ~/.gstack-copilot-jp/.github/skills/investigate ~/.copilot/skills/investigate
# ... 必要なスキルを追加
```

## 動作確認

1. VS Code でプロジェクトを開く
2. Copilot Chat パネルを開く（`Ctrl+Shift+I` or `Cmd+Shift+I`）
3. Agent Mode を選択（チャットモードのドロップダウン）
4. `/office-hours` と入力
5. スキルが読み込まれて応答すれば成功

## スキル互換性

| Tier | 定義 | スキル例 |
|------|------|---------|
| **A: 完全互換** | CLI と VS Code で同一品質 | /office-hours, /investigate, /careful, /freeze, /plan-*-review |
| **B: 制限付き互換** | コア機能は動くが Outside Voice が制限 | /autoplan, /ship, /gstack-review |
| **C: CLI専用** | ブラウザ統合が必要 | /browse, /open-gstack-browser, /canary, /benchmark |

Tier C スキルを VS Code で呼び出すと、未対応メッセージが表示される。CLI ターミナルで `copilot` を起動して使用できる。

## 制限事項

### hooks（ライフサイクルフック）

VS Code Copilot Chat の hook サポートは Preview。hooks が動作しない場合:
- `/careful` `/freeze` のセーフティガードが発火しない可能性がある
- セッション開始/終了の自動処理（更新チェック、学習記録保存）がスキップされる

### browse（ヘッドレスブラウザ）

VS Code からは `$B` コマンド（ヘッドレス Chromium）を直接使えない。
`/browse`, `/canary`, `/benchmark` 等のブラウザ依存スキルは CLI で使用すること。

### プラグインシステム

`copilot plugin install` は VS Code では認識されない。上記のインストール方式を使用すること。

## トラブルシューティング

### スキルが認識されない

1. `.github/skills/` ディレクトリがプロジェクトルートに存在するか確認
2. VS Code の設定で `chat.useAgentSkills` が有効か確認
3. Copilot Chat を再起動（コマンドパレット → `Copilot: Reset Chat`）

### bash スクリプトでエラーが出る

- Windows: WSL がインストールされているか確認（`wsl --version`）
- preamble の bash ブロックが失敗してもスキル本体は実行される

### hooks が動作しない

VS Code Copilot Chat の hook サポートは Preview。動作しない場合:
- 通常のスキル利用には影響しない
- `/careful` `/freeze` は hook に依存するため、VS Code では制限される
