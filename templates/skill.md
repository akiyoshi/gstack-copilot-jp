# SKILL.md テンプレート
#
# 新しいスキルを作るとき、このテンプレートをコピーして
# .github/skills/[skill-name]/SKILL.md に配置する。
#
# [PLACEHOLDER] は実際の値に置き換える。
# [OPTIONAL] セクションは不要なら削除する。
#
# 共通ルールは copilot-instructions.md で自動適用されるため、
# スキル内に重複して書く必要はない:
#   - voice.instructions.md      → ボイス・トーン
#   - completeness.instructions.md → 完全性原則・工数見積もり
#   - ethos.instructions.md       → 湖を沸かせ・作る前に探せ
#   - sovereignty.instructions.md  → ユーザー主権
#   - ask-format.instructions.md   → 質問フォーマット
#   - context-management.instructions.md → セッション管理
#   - post-hook.instructions.md    → 成果物記録・次スキル推奨
#   - artifact-persistence.instructions.md → 成果物永続化
#   - quality-gate.instructions.md → 信頼度スコア・レビューループ

---

## フロントマター（必須）

```yaml
---
name: [skill-name]
description: "[ロール]として[何をするか]。Use when: [日本語トリガー], [英語トリガー]。"
argument-hint: "[ユーザーに期待する入力の説明]"
---
```

name: copilot-instructions.md のルーティングテーブルと一致させる
description: 「Use when:」以降がスキル検出に使われる。日本語と英語の両方を含める
argument-hint: スキル呼び出し時に表示されるプレースホルダ

---

## 本体構造（この順序で記述する）

### 1. いつ使うか
- スキルの発動条件を3-5個の箇条書きで
- ユーザーが「これは自分の状況だ」と判断できる具体性

### 2. ロール
1文でペルソナを定義する。「あなたは〜だ。」形式。

### 3. 前提条件チェック [OPTIONAL]
デザインドキュメントや先行レビューが必要なスキルの場合:
```
1. DESIGN.md またはデザインドキュメントを検索
2. 見つからなければ `/office-hours` の実行を提案
3. ユーザーがスキップした場合はそのまま進行
```
先行スキルがないスキル（office-hours等）ではこのセクションを省略。

### 4. ワークフロー
スキル固有のステップを記述する。以下の原則に従う:
- 各ステップに番号を振る
- 判断ポイントでは選択肢をA/B/Cで提示
- STOPポイント（ユーザー回答待ち）を明示
- 図はASCII図を使う（テキストのみの説明は禁止）

### 5. 成果物 [OPTIONAL]
スキルが生成する成果物を列挙する:
```
| 成果物 | 保存先 | 消費者 |
|--------|--------|--------|
| デザインドキュメント | DESIGN.md | /plan-ceo-review, /plan-eng-review |
| テスト計画 | .gstack/plans/ | /qa, /tdd |
```
成果物がないスキル（トグル系）では省略。
artifact-persistence.instructions.md が保存ルールを規定する。

### 6. 品質ゲート [OPTIONAL]
レビューやドキュメント生成スキルの場合:
```
1. 生成した成果物をサブエージェントで敵対レビュー（最大3回）
2. 各指摘に信頼度スコア（1-10）を付与
3. 信頼度8以上のみ本文に含める
```
quality-gate.instructions.md が共通ルールを規定する。

### 7. 最終レポート
スキル完了時の出力フォーマットを定義する:
```
┌──────────────────────────────────┐
│ [SKILL NAME] 完了                │
├──────────────────────────────────┤
│ [結果サマリー]                   │
│ 判定: [APPROVE / NEEDS WORK]     │
│ 次のスキル: [推奨]               │
└──────────────────────────────────┘
```

### 8. 重要ルール
スキル固有の鉄則を3-7個。copilot-instructions.md の共通ルールと重複させない。

### 9. 次のスキル
post-hook.instructions.md のテーブルと一致する推奨を記述。

---

## チェックリスト（新規スキル作成時）

- [ ] フロントマターに name, description がある
- [ ] description に「Use when:」がある
- [ ] copilot-instructions.md のルーティングテーブルに追加した
- [ ] post-hook.instructions.md の推奨テーブルに追加した
- [ ] 「次のスキル」セクションがある
- [ ] copilot-instructions.md の共通ルールを重複して書いていない
- [ ] 品質ゲートテスト（browse/test/quality-gate.test.js）が通る
