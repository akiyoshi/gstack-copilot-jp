---
name: unfreeze
description: "編集ロック解除。/freeze と /guard による制限を解除。Use when: ロック解除、unfreeze、制限を外す。"
argument-hint: "レビュー対象のプランまたは機能の説明"
---

---
name: unfreeze
version: 0.1.0
description: |
  Clear the freeze boundary set by /freeze, allowing edits to all directories
  again. Use when you want to widen edit scope without ending the session.
  Use when asked to "unfreeze", "unlock edits", "remove freeze", or
  "allow all edits". (gstack)
triggers:
  - unfreeze edits
  - unlock all directories
  - remove edit restrictions
allowed-tools:
  - Bash
  - Read
---

# /unfreeze — Clear Freeze Boundary

Remove the edit restriction set by `/freeze`, allowing edits to all directories.

```bash
```

## Clear the boundary

```bash
STATE_DIR="${CLAUDE_PLUGIN_DATA:-$HOME/.gstack}"
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
