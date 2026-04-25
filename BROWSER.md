# Browser — 技術詳細

gstack-copilot-jp のヘッドレスブラウザの技術仕様。

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────────────┐
│  GitHub Copilot CLI                                             │
│                                                                 │
│  "browse goto https://staging.myapp.com"                        │
│       │                                                         │
│       ▼                                                         │
│  ┌──────────┐    HTTP POST     ┌──────────────┐                 │
│  │ CLI      │ ──────────────── │ Bun          │                 │
│  │ cli.ts   │  localhost:rand  │ HTTP server  │                 │
│  │          │  Bearer token    │              │                 │
│  │ ~1ms     │ ◄──────────────  │  Playwright  │──── Chromium    │
│  │ startup  │  plain text      │  API calls   │    (headless)   │
│  └──────────┘                  └──────────────┘                 │
│                                 persistent daemon               │
│                                 auto-starts on first call       │
│                                 auto-stops after 30 min idle    │
└─────────────────────────────────────────────────────────────────┘
```

## ライフサイクル

1. **初回呼び出し**: CLI が `.gstack/browse.json` を確認。なければサーバーを起動。
   サーバーは Playwright 経由でヘッドレス Chromium を起動、ランダムポートでリッスン、
   Bearer token を生成、状態ファイルに書き込む。約3秒。

2. **以降の呼び出し**: CLI が状態ファイルを読み、HTTP POST + Bearer token でコマンド送信。
   約100-200ms。

3. **アイドル停止**: 30分コマンドなしでサーバーが自動シャットダウン。
   次の呼び出しで自動再起動。

4. **クラッシュ回復**: Chromium がクラッシュした場合、CLI が次の呼び出しで検出し
   新しいサーバーを起動。

## コンポーネント

```
browse/                           # 本家 gstack vendored
├── package.json                  # playwright + 依存
├── src/                          # 35 ファイル（本家と同一）
│   ├── cli.ts                    # シンクライアント — 状態ファイル読み取り、HTTP送信
│   ├── server.ts                 # Bun HTTP サーバー — コマンドルーティング
│   ├── browser-manager.ts        # Chromium ライフサイクル、タブ管理、@ref マップ
│   ├── commands.ts               # コアコマンドハンドラ
│   ├── read-commands.ts          # 読み取り系コマンド
│   ├── write-commands.ts         # 書き込み系コマンド
│   ├── meta-commands.ts          # メタコマンド（tunnel, pair-agent等）
│   ├── security*.ts              # 多層セキュリティ
│   └── ...                       # cookie-picker, sidebar-agent, activity 等
├── test/                         # 63 テストファイル（bun test で実行）
├── bin/
│   ├── find-browse               # browse バイナリ検索
│   └── remote-slug               # Git リモート slug 取得
└── scripts/
    └── build-node-server.sh      # Windows Node.js bundle ビルド
```

## スナップショットシステム

ブラウザのコア技術 — ref ベースの要素選択:

1. Playwright の `ariaSnapshot()` でアクセシビリティツリーを取得
2. パーサーが各要素に `@e1`, `@e2`, ... の ref を割り当て
3. 各 ref に対して `getByRole()` で Playwright Locator を構築
4. `click @e3` 等のコマンドで Locator を引き当て、操作実行

**DOM を汚さない。スクリプト注入なし。** Playwright のネイティブ API のみ使用。

### ref の陳腐化検出

SPA はナビゲーションなしで DOM を変更する。`resolveRef()` は使用前に
Locator の存在を確認し、要素がなければ即座にエラーを返す（`snapshot` を
再実行するよう案内）。

### 拡張スナップショット

| フラグ | 機能 |
|--------|------|
| `-i` | インタラクティブ要素のみ（button, link, textbox等） |
| `-c` | コンパクト表示 |
| `-d N` | 深さ制限 |
| `-s sel` | 特定セレクタ内のみ |
| `-D` | 差分モード — 前回との unified diff |
| `-C` | 非ARIA要素検出（`cursor:pointer`, `onclick`, `tabindex` を持つ div 等） |

## スクリーンショットモード

| モード | コマンド | 実装 |
|--------|----------|------|
| フルページ（デフォルト） | `screenshot [path]` | `fullPage: true` |
| ビューポートのみ | `screenshot --viewport [path]` | `fullPage: false` |
| 要素クロップ | `screenshot @e3 [path]` | `locator.screenshot()` |
| リージョンクリップ | `screenshot --clip x,y,w,h [path]` | `clip` オプション |

## コマンドリファレンス

### ナビゲーション
| コマンド | 説明 |
|----------|------|
| `goto <url>` | URL に移動（`file:`, `javascript:`, `data:` はブロック） |
| `back` | 戻る |
| `forward` | 進む |
| `reload` | リロード |
| `url` | 現在の URL |

### 読み取り
| コマンド | 説明 |
|----------|------|
| `text [sel]` | テキストコンテンツ |
| `html [sel]` | HTML |
| `links` | リンク一覧（text → href） |
| `forms` | フォーム構造（JSON） |
| `accessibility` | アクセシビリティツリー |

### インタラクション
| コマンド | 説明 |
|----------|------|
| `click <@ref\|sel>` | クリック |
| `fill <@ref\|sel> <text>` | テキスト入力 |
| `select <@ref\|sel> <value>` | セレクトボックス |
| `hover <@ref\|sel>` | ホバー |
| `type <text>` | キーボード入力（フォーカス要素） |
| `press <key>` | キー押下（Enter, Tab, Escape等） |
| `scroll <dir> [px]` | スクロール（up/down/top/bottom） |
| `wait <sel\|ms>` | 要素出現またはミリ秒待機（最大10秒） |
| `viewport [WxH]` | ビューポートサイズ設定・取得 |
| `upload <sel> <path>` | ファイルアップロード |

### 検査
| コマンド | 説明 |
|----------|------|
| `js <expr>` | JavaScript 実行（await対応） |
| `console [N]` | コンソールログ（直近N件） |
| `network [N] [errors]` | ネットワークログ（errors: 4xx+のみ） |
| `cookies [domain]` | Cookie 一覧 |
| `storage [local\|session]` | Web Storage 内容 |
| `is <state> <sel>` | 要素状態（visible/enabled/disabled/checked/editable/focused） |
| `attrs <sel>` | 要素属性 |
| `css <sel> [prop]` | CSS スタイル |
| `perf` | パフォーマンス指標（DNS, TTFB, FCP, Load） |
| `inspect <sel>` | 要素詳細（位置、サイズ、全CSS） |

### ビジュアル
| コマンド | 説明 |
|----------|------|
| `screenshot [opts] [path]` | スクリーンショット |
| `pdf [path]` | PDF 出力 |
| `responsive [base]` | 3サイズ（mobile/tablet/desktop）同時撮影 |
| `diff <url1> <url2>` | 2つのURLのテキスト差分 |

### スタイル修正
| コマンド | 説明 |
|----------|------|
| `style <sel> <prop> <val>` | CSSプロパティ変更 |
| `cleanup [--all\|--ads\|--cookies\|--sticky]` | ページ要素除去 |

### タブ管理
| コマンド | 説明 |
|----------|------|
| `newtab [url]` | 新規タブ |
| `tab <id>` | タブ切替 |
| `closetab [id]` | タブ閉じる |
| `tabs` | タブ一覧 |

### サーバー管理
| コマンド | 説明 |
|----------|------|
| `connect` | headed モードに切替（可視Chrome） |
| `disconnect` | headless モードに戻す |
| `status` | サーバー状態表示 |
| `stop` | サーバー停止 |
| `cookie-import <file>` | Cookie JSONインポート |

## 認証

サーバー起動時にランダム UUID を Bearer token として生成。状態ファイル
（`.gstack/browse.json`）に chmod 600 で書き込み。全 HTTP リクエストに
`Authorization: Bearer <token>` が必要。

## コンソール・ネットワークキャプチャ

Playwright の `page.on('console')`, `page.on('response')` にフック。
循環バッファ（5,000件）でメモリ内に保持。`console` / `network`
コマンドで直近のログを取得。

## マルチワークスペース

各ワークスペースが独自のブラウザインスタンスを持つ。状態は
プロジェクトルートの `.gstack/` に保存。ポート衝突なし。共有状態なし。

## パフォーマンス比較

| ツール | 起動 | コマンド | コンテキストコスト |
|--------|------|----------|------------------|
| Chrome MCP | ~5s | ~2-5s | ~2000 tokens |
| Playwright MCP | ~3s | ~1-3s | ~1500 tokens |
| gstack browse | ~3s | ~100-200ms | 0 tokens |

CLI はプレーンテキスト → stdout。プロトコルフレーミングなし。

## 環境変数

| 変数 | デフォルト | 説明 |
|------|-----------|------|
| `BROWSE_PORT` | 0（ランダム） | 固定ポート指定 |
| `BROWSE_IDLE_TIMEOUT` | 1800000（30分） | アイドルタイムアウト（ms） |
| `BROWSE_STATE_DIR` | `.gstack` | 状態ファイルの格納先 |

## 開発

### 前提条件
- Bun v1.0+
- Playwright の Chromium（`bunx playwright install chromium`）

### クイックスタート

```bash
cd browse
bun install                      # 依存インストール
bunx playwright install chromium # Chromium ダウンロード
bun run build                    # コンパイル（browse/dist/browse を生成）
./dist/browse goto https://example.com  # テスト
./dist/browse text               # ページテキスト取得
./dist/browse stop               # サーバー停止
```

## gstack (オリジナル) との違い

| 観点 | gstack | gstack-copilot-jp |
|------|--------|------------------|
| ランタイム | Bun + コンパイル済みバイナリ | Bun + コンパイル済みバイナリ（同一） |
| サイドバー | Chrome拡張 + Side Panel | なし |
| 反ボットステルス | カスタムパッチ | 基本的なUA設定のみ |
| Cookie復号 | macOS Keychain / Linux libsecret | JSON ファイルまたは headed ログイン |
| pair-agent | 専用トークン + ngrok | 状態ファイル共有 |
| バイナリサイズ | ~58MB (Bun --compile) | ~58MB (Bun --compile)（同一） |
