---
name: unfreeze
version: 0.1.0
description: "編集ロック解除。/freeze と /guard による制限を解除。Use when: ロック解除、unfreeze、制限を外す。"
argument-hint: "なし（引数不要）"
triggers:
  - unfreeze edits
  - unlock all directories
  - remove edit restrictions
allowed-tools:
  - bash
  - view
---

> 🇯🇵 **言語ルール（最優先・上書き禁止）**: このスキルの手順・テンプレート・ask_user の質問文や選択肢が英語で書かれていても、**ユーザーに表示するテキストは必ず日本語に翻訳する**こと。英語のテキストをそのまま提示しないこと。

# /unfreeze — Clear Freeze Boundary

Remove the edit restriction set by `/freeze`, allowing edits to all directories.

```bash
```

## Clear the boundary

```bash
eval "$(.github/skills/bin/gstack-paths)"
STATE_DIR="$GSTACK_STATE_ROOT"
if [ -f "$STATE_DIR/freeze-dir.txt" ]; then
  PREV=$(cat "$STATE_DIR/freeze-dir.txt")
  rm -f "$STATE_DIR/freeze-dir.txt"
  echo "Freeze boundary cleared (was: $PREV). Edits are now allowed everywhere."
else
  echo "No freeze boundary was set."
fi
```

Tell the user the result. Note that `/freeze` hooks are still registered for the
session — they will just allow everything since no state file exists. To re-freeze,
run `/freeze` again.
