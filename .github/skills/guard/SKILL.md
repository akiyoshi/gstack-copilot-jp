---
name: guard
description: "フルセーフティモード。/careful + /freeze 統合。Use when: 最大限の安全、guard mode、full safety、本番作業。"
argument-hint: "編集を許可するディレクトリ（省略可）"
---

# フルセーフティモード

## いつ使うか

- 本番環境に関わる作業
- 最大限の安全性が必要なとき

## 動作

`/careful` と `/freeze` を同時に有効化する：

1. **破壊的コマンド警告**: `/careful` と同じ
2. **編集ロック**: `/freeze` と同じ（ディレクトリ指定あれば適用）

## 解除

`/unfreeze` で両方を解除。
