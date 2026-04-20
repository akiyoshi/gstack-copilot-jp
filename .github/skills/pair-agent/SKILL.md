---
name: pair-agent
description: "他のAIエージェントとブラウザを共有。セットアップキー生成→他エージェントが接続→同一ブラウザで並行作業。OpenClaw、Cursor、Codex等と連携。Use when: エージェント連携、pair agent、ブラウザ共有、connect agent。"
argument-hint: "接続先エージェント名（openclaw, cursor, codex等）"
---

# pair-agent — マルチエージェント ブラウザ共有

他のAIエージェントと同じブラウザセッションを共有する。
各エージェントは独自のタブで作業し、互いに干渉しない。

## いつ使うか

- 別のAIエージェント（OpenClaw、Cursor、Codex等）にもブラウザを使わせたい
- クロスモデルでWeb検証を行いたい
- 複数エージェントで並行してサイトを調査したい

## アーキテクチャ

```
┌─────────────────────────────────────────────────┐
│  gstack-copilot-jp (ホスト)                      │
│    $B goto / $B click / $B snapshot             │
│         │                                        │
│         ▼                                        │
│  ┌──────────────────────┐                        │
│  │  browse HTTP サーバー  │ ← Bearer token A     │
│  │  127.0.0.1:random     │ ← Bearer token B     │
│  │  Playwright + Chrome  │   (エージェントごと)    │
│  └──────────────────────┘                        │
│         ▲                                        │
│  ┌──────┴──────┐                                 │
│  │ 他エージェント │ (同一マシン / ngrok経由)       │
│  │ curl POST    │                                │
│  └─────────────┘                                 │
└─────────────────────────────────────────────────┘
```

## ワークフロー

### ステップ0: 前提チェック

```bash
# browse サーバーが起動しているか確認
$B status 2>/dev/null || echo "browseサーバー未起動"
```

起動していない場合 → `$B connect` を先に実行。

### ステップ1: ユーザーに聞く

```
何をしたいですか？
A) 別のエージェント（Cursor, Codex等）にブラウザを共有
B) ブラウザの接続情報を表示するだけ
```

### ステップ2: ローカル or リモート

```
接続先は同じマシン？リモート？
A) 同一マシン（推奨: レイテンシなし）
B) リモートマシン（ngrok 使用）
```

### ステップ3: ペアリング実行

#### 同一マシンの場合

browse サーバーの状態ファイルを共有する:

```bash
# .gstack/browse.json の内容を確認
cat .gstack/browse.json
# → { "port": 12345, "token": "uuid-xxx", "pid": 1234 }
```

他のエージェントに以下の指示を渡す:

```
以下のHTTPサーバーにPOSTリクエストを送信してブラウザを操作できます:
URL: http://127.0.0.1:{port}
Authorization: Bearer {token}
Content-Type: application/json

リクエスト例:
  {"command": "newtab", "args": ["https://example.com"]}
  {"command": "text", "args": []}
  {"command": "snapshot", "args": ["-i"]}
  {"command": "click", "args": ["@e3"]}

注意: 新しいタブで作業してください。他のタブは操作しないでください。
```

### リモートマシンの場合（ngrok使用）

```bash
# ngrokがインストール済みの場合
ngrok http 127.0.0.1:$(cat .gstack/browse.json | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).port))")
```

ngrok のURLとtokenを他エージェントに共有する。

### ステップ4: 接続確認

ペアリング後、接続が正常か確認:

```bash
# 他エージェントのタブが見えるか
$B tabs
# → Tab 1: https://app.com (self)
# → Tab 2: https://example.com (paired agent)
```

## ステップ5: アクセス制御

### デフォルト権限（読み書き）
- ナビゲーション: `goto`, `back`, `forward`, `reload`
- 読み取り: `text`, `html`, `links`, `snapshot`
- インタラクション: `click`, `fill`, `select`, `type`
- ビジュアル: `screenshot`
- タブ: `newtab`, `tab`, `closetab`, `tabs`

### 制限事項
- JavaScript実行 (`js`, `eval`) は信頼できるエージェントのみ
- Cookie・Storage アクセスは機密情報を含むため制限推奨
- 各エージェントは自分が開いたタブのみ操作すべき

## ステップ6: セッション終了

```bash
# 全エージェントの接続を切る
$B disconnect
# または
$B stop
```

## 対応エージェント

| エージェント | 接続方法 |
|------------|----------|
| OpenClaw | curl / httpie で HTTP POST |
| Cursor | Terminal tool で curl |
| Codex | Bash tool で curl |
| Claude Code | Bash tool で curl |
| GitHub Copilot | Terminal で node/curl |

## セキュリティ注意

- Bearer token は**秘密情報**。信頼できるエージェントのみに共有
- ngrok 使用時は token を URL に含めない
- テスト完了後は `$B stop` でサーバーを停止
- 本番環境の認証情報は共有しない
- 各エージェントのアクティビティはネットワークログで監視可能:
  ```bash
  $B network 50
  ```

## トラブルシューティング

| 問題 | 対処 |
|------|------|
| 接続拒否 | `$B status` でサーバー起動確認。停止していれば `$B connect` |
| Token無効 | `.gstack/browse.json` のtokenを再確認 |
| ngrok接続不安定 | ローカル接続に切替えるか、ngrok のリージョンを変更 |
| タブが見えない | `$B tabs` で確認。タブ作成は `newtab` コマンドで |

## 制限事項

- 現在の実装ではタブ単位の分離のみ（プロセス分離なし）
- レート制限は未実装（将来版で対応予定）
- トークンの有効期限管理は手動（サーバー再起動で無効化）
