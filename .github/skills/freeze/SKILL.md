---
name: freeze
description: "編集ロック。指定ディレクトリ以外のファイル編集を禁止。Use when: スコープを限定したい、他のファイルを触るな、freeze、edit lock。デバッグ中の事故防止。"
argument-hint: "編集を許可するディレクトリまたはファイルパス"
---

# 編集ロック

## いつ使うか

- デバッグ中に関係ないファイルを触りたくない
- 特定のディレクトリだけに変更を限定したい

## 使い方

```
/freeze src/auth/
→ src/auth/ 配下のファイルのみ編集可。他は読み取り専用。

/freeze src/auth/ src/db/
→ 複数ディレクトリを指定可。
```

## 動作

- 指定されたパス以外のファイル編集を試みた場合 → 警告して中止
- 読み取りは制限なし
- `/unfreeze` で解除

## 実装

`preToolUse` hook (`bin/gstack-pre-tool-guard.sh`) が環境変数 `GSTACK_FREEZE_PATH` を検出すると、edit/create ツール実行前にパスをチェックする。

有効化: スキル呼び出し時に `GSTACK_FREEZE_PATH=<許可パス>` を設定する。
無効化: `/unfreeze` で `GSTACK_FREEZE_PATH` をクリアする。

## 重要ルール

- **読み取りは自由**: 制限は編集のみ
- **ユーザーが明示的に解除するまで有効**
- **`/investigate` は自動的にバグのあるモジュールにfreezeする**
