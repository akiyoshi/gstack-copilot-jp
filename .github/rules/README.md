# ルール体系

ルールは**常時適用**のガイドラインだ。スキルと違い、呼び出さなくても常に効く。

## 構造

```
rules/
  common/           # 言語非依存の原則（常にロード）
  typescript/       # TypeScript/JavaScript 固有
  python/           # Python 固有
```

## 適用メカニズム

- `common/` のルールは全てのファイルに適用
- `typescript/` のルールは `.ts`, `.tsx`, `.js`, `.jsx` ファイルに適用
- `python/` のルールは `.py` ファイルに適用

## ルールとスキルの違い

| | ルール | スキル |
|---|---|---|
| 発動 | 常時 | 呼び出し時のみ |
| 目的 | 品質のベースライン | ワークフロー |
| 範囲 | 個別の原則 | 一連の手順 |
| 例 | 「テストは80%以上」 | 「TDDサイクルの実行」 |

## 優先順位

```
sovereignty.instructions.md（ユーザー主権）
  > instructions/*.instructions.md
    > rules/common/
      > rules/[language]/
        > skills/*/SKILL.md
```
