---
name: unfreeze
description: "編集ロック解除。/freeze と /guard による制限を解除。Use when: ロック解除、unfreeze、制限を外す。"
---

# ロック解除

`/freeze` または `/guard` による編集制限を解除する。

## 解除処理

1. `GSTACK_FREEZE_PATH` セッション変数をクリア
2. `GSTACK_CAREFUL` セッション変数をクリア（`/guard` 経由の場合）

## 確認メッセージ

```
🔓 UNFREEZE 完了
  解除された制限: src/auth/（freeze 範囲）
  /careful モードも解除しますか？ (Y/n)
```

freeze のみの場合:
```
🔓 UNFREEZE 完了
  編集ロックを解除しました。全ファイルが編集可能です。
```
