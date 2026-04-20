---
name: guard
description: "フルセーフティモード。/careful + /freeze 統合。Use when: 最大限の安全、guard mode、full safety、本番作業。"
argument-hint: "編集を許可するディレクトリ（省略可）"
---

# フルセーフティモード

## いつ使うか

- 本番環境に関わる作業
- 最大限の安全性が必要なとき

## セットアップ

ディレクトリ指定ありの場合:
```
/guard src/auth/
```

ディレクトリ指定なしの場合:
```
/guard
→ /careful のみ有効（freeze は全ファイル編集可）
```

実行すると両方の保護を有効化:
```
🛡️ GUARD MODE 有効
  ✅ /careful — 破壊的コマンドの実行前に確認
  ✅ /freeze — 編集を src/auth/ に限定
  解除: /unfreeze
```

**依存**: `/careful` と `/freeze` のスキル定義を参照。本スキルはそれらの同時有効化ラッパー。

## 何が保護されるか

| 保護レイヤー | 対象 | 例 |
|---|---|---|
| 破壊的コマンド警告 | bash ツール | `rm -rf`, `git push -f` |
| 編集ロック | edit/create ツール | 指定パス外のファイル変更 |

## 解除

`/unfreeze` で両方を解除。
