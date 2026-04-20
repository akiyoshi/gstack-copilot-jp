---
name: health
description: "コード品質ダッシュボード。typecheck/lint/test/deadcode の4軸で 0-10 スコアリング。Use when: コード品質、ヘルスチェック、health、品質ダッシュボード、プロジェクトの状態。"
argument-hint: "空（自動検出）またはチェック対象のディレクトリ"
---

# コード品質ダッシュボード

**CIダッシュボードを管理するスタッフエンジニア**として行動する。コード品質は単一のメトリクスではなく、型安全性、lint、テストカバレッジ、デッドコード、シェルスクリプト品質の複合指標。ツールを実行し、スコアリングし、ダッシュボードを提示し、トレンドを追跡する。

**ハードゲート:** 問題を修正しない。ダッシュボードと推奨事項のみ。ユーザーが何に対処するか決める。

---

## Step 1: ヘルススタックの検出

プロジェクトの設定ファイルからツールを自動検出する:

```bash
# 型チェッカー
[ -f tsconfig.json ] && echo "TYPECHECK: tsc --noEmit"

# リンター
[ -f biome.json ] || [ -f biome.jsonc ] && echo "LINT: biome check ."
ls eslint.config.* .eslintrc.* .eslintrc 2>/dev/null | head -1 | xargs -I{} echo "LINT: eslint ."
[ -f pyproject.toml ] && grep -q "ruff" pyproject.toml 2>/dev/null && echo "LINT: ruff check ."

# テストランナー
[ -f package.json ] && grep -q '"test"' package.json 2>/dev/null && echo "TEST: $(node -e "console.log(JSON.parse(require('fs').readFileSync('package.json','utf8')).scripts.test)" 2>/dev/null)"
[ -f pyproject.toml ] && grep -q "pytest" pyproject.toml 2>/dev/null && echo "TEST: pytest"
[ -f Cargo.toml ] && echo "TEST: cargo test"
[ -f go.mod ] && echo "TEST: go test ./..."

# デッドコード
[ -f package.json ] && grep -q '"knip"' package.json 2>/dev/null && echo "DEADCODE: npx knip"

# シェルリント
command -v shellcheck >/dev/null 2>&1 && echo "SHELL: shellcheck"
```

シェルスクリプトの検索:
```bash
find . -name '*.sh' -not -path './node_modules/*' -not -path './.git/*' 2>/dev/null | head -5
```

検出したツールをユーザーに提示:

「このプロジェクトで以下のヘルスチェックツールを検出しました:
- 型チェック: `tsc --noEmit`
- リント: `biome check .`
- テスト: `npm test`
- デッドコード: `npx knip`
- シェルリント: `shellcheck *.sh`

A) 正しい — 続行
B) 調整が必要（どれを変更するか教えてください）
C) 保存せず実行のみ」

---

## Step 2: ツールの実行

検出した各ツールを順に実行する。ツールごとに:

1. 開始時刻を記録
2. コマンドを実行（stdout/stderrをキャプチャ）
3. 終了コードを記録
4. 終了時刻を記録
5. 出力の末尾50行をレポート用に保存

```bash
# 各ツールの実行例
START=$(date +%s)
tsc --noEmit 2>&1 | tail -50
EXIT_CODE=$?
END=$(date +%s)
echo "TOOL:typecheck EXIT:$EXIT_CODE DURATION:$((END-START))s"
```

ツールは順次実行（リソース共有やロックファイルの可能性）。未インストールのツールは `SKIPPED`（理由付き）として記録。失敗にはしない。

---

## Step 3: 各カテゴリのスコアリング（0-10）

| カテゴリ | ウェイト | 10 | 7 | 4 | 0 |
|---------|--------|------|-----------|------------|-----------|
| 型チェック | 25% | クリーン（exit 0） | エラー10未満 | エラー50未満 | エラー50以上 |
| リント | 20% | クリーン（exit 0） | 警告5未満 | 警告20未満 | 警告20以上 |
| テスト | 30% | 全通過（exit 0） | 通過率95%超 | 通過率80%超 | 通過率80%以下 |
| デッドコード | 15% | クリーン（exit 0） | 未使用5未満 | 未使用20未満 | 未使用20以上 |
| シェルリント | 10% | クリーン（exit 0） | 問題5未満 | 問題5以上 | N/A（スキップ） |

**ツール出力のパース:**
- **tsc:** 出力の `error TS` にマッチする行をカウント
- **biome/eslint/ruff:** エラー/警告パターンにマッチする行をカウント。サマリー行があればパース
- **テスト:** テストランナー出力からpass/failカウントをパース。終了コードのみの場合: exit 0 = 10, exit非0 = 4
- **knip:** 未使用エクスポート、ファイル、依存関係を報告する行をカウント
- **shellcheck:** 個別の発見（"In ... line" で始まる行）をカウント

**複合スコア:**
```
composite = (typecheck × 0.25) + (lint × 0.20) + (test × 0.30) + (deadcode × 0.15) + (shell × 0.10)
```

カテゴリがスキップ（ツール未検出）の場合、そのウェイトを残りのカテゴリに比例配分する。

---

## Step 4: ダッシュボードの提示

```
CODE HEALTH DASHBOARD
=====================

プロジェクト: <プロジェクト名>
ブランチ:     <現在のブランチ>
日付:         <今日>

カテゴリ      ツール              スコア  ステータス  所要時間  詳細
----------    ----------------  -----   --------   --------  -------
型チェック    tsc --noEmit      10/10   CLEAN      3s        0 errors
リント        biome check .      8/10   WARNING    2s        3 warnings
テスト        npm test          10/10   CLEAN      12s       47/47 passed
デッドコード  npx knip           7/10   WARNING    5s        4 unused exports
シェルリント  shellcheck        10/10   CLEAN      1s        0 issues

複合スコア: 9.1 / 10

所要時間: 合計 23s
```

ステータスラベル:
- 10: `CLEAN`
- 7-9: `WARNING`
- 4-6: `NEEDS WORK`
- 0-3: `CRITICAL`

7未満のカテゴリはツール出力のトップ問題をリスト:

```
詳細: リント (3 warnings)
  biome check . output:
    src/utils.ts:42 — lint/complexity/noForEach: Prefer for...of
    src/api.ts:18 — lint/style/useConst: Use const instead of let
    src/api.ts:55 — lint/suspicious/noExplicitAny: Unexpected any
```

---

## Step 5: ヘルス履歴への保存

```bash
SLUG=$(bin/gstack-slug 2>/dev/null)
GSTACK_DIR="${HOME}/.gstack/projects/${SLUG}"
mkdir -p "$GSTACK_DIR"
```

`${GSTACK_DIR}/health-history.jsonl` に1行追記:

```json
{"ts":"2026-03-31T14:30:00Z","branch":"main","score":9.1,"typecheck":10,"lint":8,"test":10,"deadcode":7,"shell":10,"duration_s":23}
```

フィールド:
- `ts` — ISO 8601タイムスタンプ
- `branch` — 現在のgitブランチ
- `score` — 複合スコア（小数1桁）
- `typecheck`, `lint`, `test`, `deadcode`, `shell` — 個別カテゴリスコア（0-10の整数）
- `duration_s` — 全ツールの合計所要秒数

スキップされたカテゴリの値は `null` にする。

---

## Step 6: トレンド分析 + 推奨事項

`${GSTACK_DIR}/health-history.jsonl` の直近10エントリを読み込む:

```bash
SLUG=$(bin/gstack-slug 2>/dev/null)
tail -10 "${HOME}/.gstack/projects/${SLUG}/health-history.jsonl" 2>/dev/null || echo "NO_HISTORY"
```

**過去のエントリがある場合、トレンドを表示:**

```
HEALTH TREND (直近5回)
==========================
日付          ブランチ       スコア  TC   Lint  Test  Dead  Shell
----------    -----------    -----   --   ----  ----  ----  -----
2026-03-28    main           9.4     10   9     10    8     10
2026-03-29    feat/auth      8.8     10   7     10    7     10
2026-03-30    feat/auth      8.2     10   6     9     7     10
2026-03-31    feat/auth      9.1     10   8     10    7     10

トレンド: 改善 (+0.9 前回比)
```

**前回からスコアが低下した場合:**
1. どのカテゴリが低下したか特定
2. 各低下カテゴリの差分を表示
3. ツール出力と相関 — 具体的なエラー/警告を特定

```
回帰検出
  リント: 9 → 6 (-3) — 12件の新しいbiome警告
    最多: lint/complexity/noForEach (7件)
  テスト: 10 → 9 (-1) — 2件のテスト失敗
    FAIL src/auth.test.ts > should validate token expiry
    FAIL src/auth.test.ts > should reject malformed JWT
```

**改善推奨（常に表示）:**

影響度（ウェイト × スコア不足分）で優先順位付け:

```
推奨事項（影響度順）
============================
1. [HIGH]  失敗中の2テストを修正 (テスト: 9/10, ウェイト 30%)
   実行: npm test -- --verbose で失敗を確認
2. [MED]   12件のリント警告に対処 (リント: 6/10, ウェイト 20%)
   実行: biome check . --write で自動修正
3. [LOW]   4件の未使用エクスポートを削除 (デッドコード: 7/10, ウェイト 15%)
   実行: knip --fix で自動削除
```

`weight × (10 - score)` の降順でランク。10未満のカテゴリのみ表示。

---

## 重要ルール

- **ツールが未インストールでも失敗しない**: N/A で skip。インストールの強制はしない（ユーザー主権）
- **スキップは失敗ではない**: ツールが利用不可ならスキップし、ウェイトを再配分する。スコアにペナルティを与えない
- **スコアは相対指標**: 他プロジェクトとの比較ではなく、同プロジェクト内の推移を追跡する
- **改善提案は具体的に**: 「テストを増やす」ではなく「auth.ts のログイン関数にテストを追加（カバレッジ +5%）」
- **実行に副作用なし**: 読み取りと計測のみ。コードの変更は行わない
- **失敗時は生の出力を表示**: ツールがエラーを報告した場合、末尾50行を含めて再実行不要にする
- **トレンドには履歴が必要**: 初回は「初回ヘルスチェック — トレンドデータはまだありません。変更後に再度 `/health` を実行してください」

次のスキル: スコアに問題がなければ `/ship`。改善が必要なら `/tdd` で修正。
