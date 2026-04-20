# スキル精度監査 デザインドキュメント

## 概要

gstack-copilot-jp の40スキルを本家 gstack と突き合わせ、翻訳・適応時に脱落した精度（チェックリスト、フェーズ詳細、判定基準）を回復し、再発を防ぐ仕組みを構築する。

## 問題

スキルの日本語版はLLMで生成し、そのまま使っていた。大枠の方法論は正しいが、本家の具体的なチェックリスト・判定ステップ・エクスプロイトシナリオ等が脱落している。`upstream-tracking.md` は `same` と記録しているが、実際には精度差がある。

### 具体例

| スキル | 本家 | 日本語版 | 脱落内容 |
|--------|------|---------|---------|
| `/cso` | 14フェーズ × 各4-10チェック | 14フェーズ × ヘッダーのみ | エクスプロイトシナリオ、具体的チェック項目 |
| `/review` | スペシャリストチェックリスト5種 | チェックリストなし | code-review, security, architecture チェックリスト |
| `/ship` | プラン完了監査、テスト失敗トリアージ | なし | DESIGN.md との差分検証、failure ownership |
| `/autoplan` | 判断監査証跡 | なし | 自動判断の記録・提示フォーマット |

### 問題ではないもの

本家との差のうち、以下は**意図的な適応**であり修正対象外:

- プリアンブルインフラ（セッション管理、テレメトリ、config管理）→ Copilot CLI が別の仕組みで提供
- Codex/Greptile 統合 → Copilot CLI 対象外
- モデル固有パッチ → Copilot CLI のモデル切替で対応
- テンプレート生成パイプライン → 手書きSKILL.mdで運用

## ターゲットユーザー

- gstack-copilot-jp のメンテナー（自分）
- 将来のコントリビューター

## 提案するアプローチ

### Phase 0: 監査基準の定義

#### 0.1 上流バージョンの固定

監査対象の本家バージョンを固定する。現在: **v1.4.0.0**。

```
upstream_baseline:
  repo: garrytan/gstack
  version: v1.4.0.0
  pinned_at: 2026-04-20
```

監査レポートに必ずこのバージョンを記録する。

#### 0.2 セクション分類ルール

本家SKILL.mdの各セクションを3つに分類する:

| 分類 | 定義 | 処理 |
|------|------|------|
| **excluded** | Copilot CLI に不要なホスト固有インフラ | upstream-tracking.json に除外理由を記録。修正しない |
| **required** | スキルの方法論的精度に直結する内容 | 脱落していれば日本語で復元 |
| **optional** | あると良いが、なくてもスキルは正しく動く | 優先度を下げて対応 |

#### 除外リスト（excluded）

以下のパターンに該当するセクションは自動除外:

```
- {{PREAMBLE}} / preamble 関連（セッション管理、テレメトリ、config）
- {{BROWSE_SETUP}} / browse セットアップ手順
- Codex / codex-* 関連
- Greptile 関連
- model-overlays / モデル固有パッチ
- conductor / 並列セッション管理
- telemetry / analytics イベント
- gstack-update-check / 自動更新
- eval suite / コスト追跡（本家固有のLLM評価基盤）
- TODOS.md 管理（本家固有のタスク管理方式）
```

#### 0.3 スキル別の意味的契約（Semantic Contracts）

構造メトリクス（見出し数、コードブロック数）は前段フィルタとして使うが、精度判定はスキル別の**意味的契約**で行う。

##### /cso 契約
- [ ] 各フェーズ（1-14）に具体的なチェック項目が3つ以上ある
- [ ] 高信頼度の指摘にはエクスプロイトシナリオが含まれる
- [ ] daily / comprehensive の閾値が明示されている
- [ ] 指摘テンプレートに File:Line, Severity, Confidence, Exploit, Remediation がある

##### /review 契約
- [ ] スペシャリスト dispatch のトリガー条件が定義されている
- [ ] code-review, architecture, security の各チェックリストが存在する
- [ ] スコープドリフト検出の手順がある
- [ ] 信頼度キャリブレーションテーブルがある（5段階）
- [ ] Outside Voice（task agents）の dispatch 手順が具体的

##### /ship 契約
- [ ] テスト失敗時のトリアージ（ブランチ起因 vs 既存）がある
- [ ] プラン完了監査（DESIGN.md との差分チェック）がある
- [ ] bisectable コミットの粒度ルールが具体的
- [ ] VERSION/package.json ドリフト検出がある
- [ ] Outside Voice レビューの dispatch 条件がある

##### /autoplan 契約
- [ ] 6つの意思決定原則の適用ルールがフェーズごとに定義されている
- [ ] 判断監査証跡のフォーマットが定義されている
- [ ] 最終承認ゲートで味覚判断と方針チャレンジが分離されている
- [ ] 再実行時の差分表示仕様がある

#### 0.4 ソースアンカー（外部マッピング方式）

SKILL.md にインラインHTMLコメントは埋めない（メンテナンスコスト、トークン消費、diff ノイズの問題）。代わりに `upstream-tracking.json` 内にセクション対応表を持つ:

```json
{
  "cso": {
    "section_map": {
      "フェーズ4: 入力バリデーション": "Phase 4: Input Validation",
      "フェーズ5: 認証・認可": "Phase 5: Authentication & Authorization"
    }
  }
}
```

重度に適応したセクションのみ記録する。1:1 対応が明確なセクションは省略可。

#### 0.5 固定上流スナップショット

CI はネットワーク・ホームディレクトリに依存しない。本家スキルの固定スナップショットをリポジトリにコミットする:

```
test/fixtures/upstream/
  v1.4.0.0/
    review/SKILL.md.tmpl    # テンプレート（除外パターン特定用）
    review/SKILL.md          # 展開済み（構造比較用）
    ship/SKILL.md.tmpl
    ship/SKILL.md
    cso/SKILL.md.tmpl
    cso/SKILL.md
    autoplan/SKILL.md.tmpl
    autoplan/SKILL.md
```

`bin/upstream-diff.sh --update` で最新版を取得し、スナップショットを更新する（手動・低頻度）。

### Phase 1: 全40スキル精度監査

#### 1.1 構造メトリクス収集（トリアージ用）

全スキルについて以下を計測する。**合否判定には使わない**（トリアージのみ）:

```
| スキル | 本家bytes | 日本語bytes | 比率 | ##数比 | ###数比 | コードブロック比 | テーブル比 |
```

日本語は英語より少ない見出し/箇条書きで同じ意味を表現できるため、比率が低くても精度ギャップとは限らない。

#### 1.2 分類（手動 + 契約テスト）

- 契約が定義済みのスキル → 契約テストで判定
- 契約が未定義のスキル → `unaudited` 状態。構造メトリクスで優先度付けのみ
- `upstream-tracking.json` で `same` と記録されているスキル → 契約テストで再検証

#### 1.3 優先度付け

| 優先度 | 基準 | 対象 |
|--------|------|------|
| P0 | セキュリティ・安全性に直結 | /cso |
| P1 | 最頻利用スキル | /review, /ship |
| P2 | オーケストレーション | /autoplan, /sprint |
| P3 | その他 | 残り35スキル |

### Phase 2: 優先スキルの精度回復

P0-P2 の5スキルについて:

1. 本家の対応セクションを読む
2. 除外リストに該当するセクションを除外
3. 意味的契約のチェック項目を満たすよう日本語で内容を復元
4. ソースアンカーを付与
5. テスト追加（契約チェック項目の自動検証）

#### 言語方針

| 要素 | 言語 | 理由 |
|------|------|------|
| ロール説明、「いつ使うか」 | 日本語 | ユーザーが読む |
| フェーズ説明、チェックリスト | 日本語 | LLMへの指示は日本語で統一しないと応答言語がブレる |
| 判定テーブル、閾値 | 日本語 | スキル内の一貫性 |
| コード例、コマンド例 | 英語 | プログラミング言語は英語 |
| ソースアンカー（コメント） | 英語 | 本家との対応付けのため |

### Phase 3: 契約テスト + 追跡データ構造

#### 3.1 `upstream-tracking.json`（機械可読な正）

`upstream-tracking.md` のマークダウン表をパースするのは脆い。機械可読な JSON を正とし、`.md` は `.json` から生成する:

```json
{
  "upstream_version": "v1.4.0.0",
  "snapshot_path": "test/fixtures/upstream/v1.4.0.0",
  "skills": {
    "cso": {
      "local": ".github/skills/cso/SKILL.md",
      "upstream": "cso/SKILL.md",
      "status": "precision-gap",
      "reason": "14フェーズのヘッダーのみ。チェック項目・エクスプロイトシナリオ欠落",
      "exclusions": ["preamble", "codex", "telemetry", "greptile"],
      "section_map": {}
    },
    "review": {
      "local": ".github/skills/review/SKILL.md",
      "upstream": "review/SKILL.md",
      "status": "precision-gap",
      "reason": "specialist チェックリスト欠落、スコープドリフト検出なし"
    },
    "tdd": {
      "local": ".github/skills/tdd/SKILL.md",
      "upstream": null,
      "status": "diverged",
      "reason": "本家に対応なし。独自実装"
    }
  }
}
```

#### 3.2 契約テスト（Vitest）

Markdown の見出し階層・リスト項目数・表構造をパースして検証する。正規表現ではなく**見出しベースのセクション分割 + 行カウント**で判定:

```javascript
// test/skill-contracts.test.js
import { readFileSync } from 'fs';

function parseSections(md) {
  // ## / ### 見出しでセクション分割、各セクションの行数・リスト項目数を返す
}

describe('/cso semantic contract', () => {
  const md = readFileSync('.github/skills/cso/SKILL.md', 'utf-8');
  const sections = parseSections(md);

  it('フェーズ1-14 の各見出しが存在する', () => { ... })
  it('各フェーズに3行以上の具体的内容がある', () => { ... })
  it('エクスプロイトシナリオの構造が存在する', () => { ... })
  it('daily/comprehensive の閾値が明記されている', () => { ... })
})
```

契約は「この概念が存在するか」で判定する。表現の形式（表 vs 箇条書き）は問わない。

#### 3.3 追跡状態の定義

| ステータス | 定義 | 遷移条件 |
|-----------|------|---------|
| **unaudited** | 精度監査未実施 | 初期状態。契約テスト未定義のスキル |
| **same** | 本家と同一（精度監査済み） | 契約テスト PASS + 構造的差分なし |
| **adapted** | 意図的適応（精度監査済み、差分理由記録あり） | 契約テスト PASS + 差分理由が `reason` に記録 |
| **precision-gap** | 精度ギャップあり（修正予定） | 契約テスト FAIL |
| **diverged** | 独自実装 | 本家に対応なし |
| **excluded** | 追跡対象外 | マルチホスト基盤等 |

`same` と `adapted` は契約テストを通過した場合のみ使用。35スキルは契約定義まで `unaudited`。

#### 3.4 追跡整合性テスト

```javascript
// test/upstream-tracking.test.js
describe('upstream-tracking.json integrity', () => {
  it('全スキルディレクトリに対応するエントリがある', () => { ... })
  it('status=same のスキルは契約テストが定義されている', () => { ... })
  it('status=adapted のスキルは reason が空でない', () => { ... })
})
```

## 成功指標

| 指標 | 目標 |
|------|------|
| P0-P2 スキル（5個）の契約テスト通過 | 100% |
| upstream-tracking.json の全スキルにエントリあり | 100% |
| `unaudited` 以外のスキルは全て契約テスト定義済み | 100% |
| CI で契約テスト実行 | `npm test` に統合 |

## スコープ外

- 本家のプリアンブルインフラの移植（Copilot CLI が別の仕組みで提供）
- Greptile / Codex 統合
- テレメトリパイプライン
- 全40スキルの精度回復（Phase 2 は P0-P2 の5スキルのみ。残りは v1.1）
- 本家との自動同期（手動 `upstream-diff.sh` + 契約テストで運用）

## 工数見積もり

| フェーズ | 人間 | AI | 圧縮率 |
|---------|------|-----|-------|
| Phase 0: 監査基準定義 | 2時間 | 30分 | ~4x |
| Phase 1: 全スキル監査 | 4時間 | 1時間 | ~4x |
| Phase 2: 5スキル精度回復 | 2日 | 2時間 | ~10x |
| Phase 3: ツール + CI | 1日 | 1時間 | ~10x |
| **合計** | **~4日** | **~4時間** | **~10x** |

## リスク

| リスク | 影響 | 対策 |
|--------|------|------|
| 本家スキルが大きすぎてコンテキストに入らない | 精度回復時にLLMが全体を把握できない | セクション単位で処理。テーブル形式で圧縮 |
| 契約テストの維持コスト | 本家更新のたびにテスト修正 | 契約は抽象的に定義（「チェック項目3つ以上」等） |
| 精度回復でスキルが肥大化 | コンテキストウィンドウ圧迫 | 密度の高い表形式を優先。冗長な散文は避ける |
