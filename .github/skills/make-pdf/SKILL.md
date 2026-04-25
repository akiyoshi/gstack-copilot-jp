---
name: make-pdf
version: 1.0.0
description: "MarkdownをPDFに変換。Use when: PDF作成、markdown to pdf、ドキュメント出力、export pdf。カバーページ、目次、ページ番号、ウォーターマーク対応。出版品質のPDF生成。"
argument-hint: "変換対象のMarkdownファイルパス"
triggers:
  - markdown to pdf
  - generate pdf
  - make pdf
  - export pdf
allowed-tools:
  - ask_user
  - bash
  - view
  - edit
  - create
  - glob
  - grep
---

# Make PDF: Markdown → 出版品質PDF

browse の `$B pdf` コマンドを使って Markdown を PDF に変換する。

## 前提チェック

```bash
eval "$(bin/gstack-env 2>/dev/null || true)"
if command -v $B >/dev/null 2>&1; then
  $B status 2>/dev/null && echo "BROWSE_READY" || echo "BROWSE_NOT_RUNNING"
else
  echo "BROWSE_NOT_AVAILABLE"
fi
```

- `BROWSE_READY` → 続行
- `BROWSE_NOT_RUNNING` → `$B` でデーモン起動を試行
- `BROWSE_NOT_AVAILABLE` → 「browseバイナリが見つかりません。`cd browse && bun run build` でビルドしてください」と案内

## ワークフロー

### Step 1: 入力の確認

1. ユーザーが指定した `.md` ファイルを読み込む
2. ファイルが存在しなければエラー
3. Markdownの構造を確認（H1の数、コードブロック、画像参照）

### Step 2: HTMLレンダリング

Markdown → HTML 変換を行い、印刷CSSを適用する:

1. Markdownをパースしてセマンティック HTML に変換
2. 印刷用CSSを埋め込む:
   - 1インチマージン（既定）
   - H1でページブレーク
   - ページ番号フッター
   - スマートタイポグラフィ（カーリークォート、emダッシュ）
3. HTMLファイルを一時ディレクトリに出力

### Step 3: PDF生成

`$B` コマンドで PDF を生成:

```bash
$B load-html /tmp/make-pdf-<hash>.html
$B pdf <output-path> [flags]
```

### Step 4: 出力確認

生成された PDF を確認:
- ファイルサイズが 0 でないこと
- パスをユーザーに表示

## コアパターン

### 80% ケース — メモ/レター

```bash
# Markdown → HTML → $B pdf
$B load-html /tmp/rendered.html
$B pdf /tmp/letter.pdf
```

### 出版モード — カバー + 目次 + チャプターブレーク

```bash
$B load-html /tmp/rendered.html
$B pdf output.pdf --toc --page-numbers
```

H1 ごとに改ページ。`--no-chapter-breaks` で無効化。

### ドラフトステージ（ウォーターマーク）

HTML に透かし用CSSを埋め込んでレンダリング:
- 対角10%不透明度の DRAFT テキスト
- 最終版ではフラグを外して再生成

## 対応フラグ

**注意**: フラグは明示的に指定する必要がある。既定でONになるフラグはない。

```
ページレイアウト:
  --format letter|a4|legal      ページサイズ
  --margins <dim>               マージン（1in 既定）
  --margin-top/right/bottom/left  個別マージン

構造:
  --toc                         目次を生成（Paged.jsがない場合、ページ番号なしの簡易版）
  --page-numbers                "N of M" フッター

ブランディング:
  --header-template <html>      カスタムヘッダー
  --footer-template <html>      カスタムフッター

出力:
  --tagged                      アクセシブルPDF
  --outline                     見出しからPDFブックマーク
  --print-background            背景色/画像を含む
```

## PDF作成を検出すべきパターン

以下の意図を検出したら `$B pdf` ワークフローを実行:

- 「このMarkdownをPDFにして」
- 「PDFとして出力して」
- 「このレターをPDFに変換」
- 「エッセイのPDFが必要」
- 「PDFで印刷して」

ユーザーが `.md` ファイルを指定して「きれいにして」と言った場合、カバー+目次付きPDFを提案。

## デバッグ

- 出力が空白 → browse デーモンが動作しているか確認: `$B status`
- コピペでテキストが崩れる → コードブロック内のハイライト出力。`--no-syntax` で再試行
- TOCタイムアウト → Markdown に見出しがない。`--toc` を外す
- 外部画像が表示されない → Markdown 内の画像URLへのアクセスを確認

## 出力契約

```
成功時:
  stdout: PDF saved: /tmp/output.pdf    ← "PDF saved: " プレフィックス付き
  exit code: 0

失敗時:
  stderr: エラーメッセージ
  exit code: 1 (引数不正) / 2 (レンダーエラー) / 4 (browse利用不可)
```

## Smart Typography

HTMLレンダリング時に以下の変換を適用:

| 入力 | 出力 | 説明 |
|------|------|------|
| `"text"` | "text" | カーリークォート |
| `'text'` | 'text' | シングルカーリークォート |
| `--` | — | emダッシュ |
| `...` | … | 省略記号 |

## CSS印刷スタイル

HTMLに埋め込む印刷CSSの基本構造:

```css
@page {
  size: letter;
  margin: 1in;
  @bottom-center {
    content: counter(page) " of " counter(pages);
  }
}

h1 { page-break-before: always; }
h1:first-of-type { page-break-before: avoid; }

pre, code { font-size: 0.85em; }
pre { page-break-inside: avoid; }
img { max-width: 100%; page-break-inside: avoid; }
```
