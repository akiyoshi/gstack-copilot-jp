# gstack-copilot-jp ワークスペース指示

## スキルルーティング

リクエストが利用可能なスキルに一致する場合 → **必ず該当スキルを最初に呼び出す。**
直接回答したり、他のツールを先に使ったりしない。

| ユーザーの意図 | 呼び出すスキル |
|---|---|
| プロダクトのアイディア、「これ作る価値ある？」 | `/office-hours` |
| 戦略レビュー、スコープ、野心度 | `/plan-ceo-review` |
| アーキテクチャレビュー、データフロー | `/plan-eng-review` |
| デザインレビュー、UI/UX | `/plan-design-review` |
| 開発者体験、オンボーディング、API設計 | `/plan-devex-review` |
| 全レビューを一括で | `/autoplan` |
| デザイン相談、ブランド構築 | `/design-consultation` |
| デザイン案を複数見たい | `/design-shotgun` |
| デザインをHTMLに変換 | `/design-html` |
| コードレビュー、diff確認 | `/review` |
| デザイン実装レビュー | `/design-review` |
| DX実装レビュー | `/devex-review` |
| バグ、エラー、「なぜ壊れた？」 | `/investigate` |
| QA、テスト実行 | `/qa` |
| QAレポートのみ（修正なし） | `/qa-only` |
| セキュリティ監査、脆弱性 | `/cso` |
| パフォーマンス計測 | `/benchmark` |
| リリース、PR作成 | `/ship` |
| マージ＆デプロイ | `/land-and-deploy` |
| デプロイ後の監視 | `/canary` |
| 週次振り返り | `/retro` |
| ドキュメント更新 | `/document-release` |
| 学習記録の管理 | `/learn` |
| セッション振り返り | `/learn 振り返り` |
| TDD、テストファースト | `/tdd` |
| ビルドエラー、型エラー | `/build-fix` |
| コード整理、スロップ除去 | `/clean` |
| マルチモデル設計、並列分析 | `/multi-plan` |
| 計画の自動実行 | `/multi-execute` |
| クロスモデルレビュー、別視点 | `/second-opinion` |
| 「慎重にやって」、安全モード | `/careful` |
| ファイル編集を制限 | `/freeze` |
| フル安全モード | `/guard` |
| 制限解除 | `/unfreeze` |
| ブラウザで開く、サイトテスト | `/browse` |
| ブラウザCookieインポート | `/setup-browser-cookies` |
| 可視ブラウザ起動 | `/open-browser` |
| エージェント連携、ブラウザ共有 | `/pair-agent` |
| デプロイ環境の設定 | `/setup-deploy` |
| アップグレード | `/upgrade` |

## プロジェクト共通ルール

1. **言語**: ユーザーとのやり取りは日本語で行う
2. **ボイス**: `instructions/voice.instructions.md` に従う
3. **完全性**: アプローチを選ぶとき、完全版を推奨する（ETHOS.md参照）
4. **ユーザー主権**: AIは推奨する。決めるのはユーザー
5. **工数見積もり**: 常に2軸（人間 / AI）で示す

## ルール体系

`rules/` ディレクトリに常時適用のガイドラインがある。スキルと異なり呼び出し不要で常に効く。

- `rules/common/` — 言語非依存の原則。全ファイルに適用
- `rules/typescript/` — TypeScript/JavaScript ファイルに適用
- `rules/python/` — Python ファイルに適用

優先順位: ユーザー主権 > instructions > rules > skills

## スプリントプロセス

gstack-copilot-jpはプロセスである。ツール集ではない。スキルは以下の順序で連携する：

**考える → 計画する → 作る → レビューする → テストする → 出荷する → 振り返る**

各スキルは前のスキルの成果物を読み、次のスキルが使える成果物を残す。
