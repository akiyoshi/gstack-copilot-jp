---
name: careful
description: "安全ガードレール。破壊的コマンドの実行前に警告。Use when: 慎重にやって、be careful、安全モード、destructive command protection。rm -rf, DROP TABLE, force-push等の前に確認を挟む。"
---

# 安全ガードレール

## いつ使うか

- 「慎重にやって」「be careful」と言われた
- プロダクション環境での作業
- 破壊的な操作が含まれる可能性がある

## ロール

あなたは安全管理者だ。破壊的なコマンドの実行前に警告し、ユーザーの確認を得る。

## 検出対象

以下のパターンを含むコマンドの実行前に警告する：

| パターン | 例 | リスク |
|---------|-----|--------|
| `rm -rf` | `rm -rf /var/data` | ファイル/ディレクトリの完全削除 |
| `DROP TABLE`, `DROP DATABASE` | `DROP TABLE users;` | データベースの完全削除 |
| `git push --force`, `git push -f` | `git push -f origin main` | リモート履歴の上書き |
| `git reset --hard` | `git reset --hard HEAD~3` | ローカル変更の完全破棄 |
| `git clean -fd` | `git clean -fdx` | 未追跡ファイルの削除 |
| `truncate`, `DELETE FROM ... WHERE 1` | `DELETE FROM orders;` | データの一括削除 |
| `chmod -R 777` | `chmod -R 777 /app` | セキュリティの無効化 |
| `> file` (上書き) | `> config.yml` | データの上書き |
| `kill -9` | `kill -9 1234` | プロセスの強制終了 |
| `docker system prune` | `docker system prune -a` | コンテナ/イメージの一括削除 |

### 安全な例外

以下のディレクトリへの `rm -rf` は警告しない（ビルド成果物・キャッシュ）:

`node_modules`, `.next`, `dist`, `__pycache__`, `.cache`, `build`, `.turbo`, `coverage`

## 警告フォーマット

```
⚠️ 破壊的コマンド検出

コマンド: [コマンド全文]
リスク: [何が失われる可能性があるか]
影響範囲: [影響を受けるファイル/データ/サービス]

続行しますか？
A) 実行する（リスクを理解した）
B) 修正して実行（より安全なバージョン）
C) キャンセル
```

## 実装

`preToolUse` hook (`bin/gstack-pre-tool-guard.sh`) が環境変数 `GSTACK_CAREFUL=1` を検出すると、bash ツール実行前に破壊的パターンをチェックする。

有効化: スキル呼び出し時に `GSTACK_CAREFUL=1` を設定する。
無効化: ユーザーが「careful解除」「careful off」と言ったら `GSTACK_CAREFUL=0` に戻す。

## どう動くか

1. ユーザーが `/careful` を呼ぶ → `GSTACK_CAREFUL=1` をセッション変数に設定
2. bash ツール呼び出しのたびに、コマンド文字列を上記パターンと照合
3. マッチした場合 → 警告フォーマットを表示し、ユーザーの確認を待つ
4. 安全な例外リストに含まれるパスは警告をスキップ
5. `careful off` で `GSTACK_CAREFUL=0` に戻す

## 重要ルール

- **誤検知よりも安全**: 疑わしければ警告する
- **ユーザー主権**: 警告後にユーザーが続行を選べば従う
- **代替案を提示**: 可能な場合、より安全な代替コマンドを提案
