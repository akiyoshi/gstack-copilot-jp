# Python コーディングスタイル

## 型ヒント

- 全ての関数の引数と戻り値に型ヒントを付ける
- `typing` モジュールの型を活用（`Optional`, `Union`, `TypeVar` 等）
- Python 3.10+ では `X | Y` 構文を `Optional[X]` より優先
- `# type: ignore` は最終手段。理由をコメントで付記

## 構造

- `dataclass` または `pydantic.BaseModel` でデータ構造を定義
- 辞書の直接使用より構造化されたクラスを優先
- `__init__.py` には公開APIの `__all__` を定義

## エラーハンドリング

- 裸の `except:` 禁止。具体的な例外をキャッチ
- `except Exception as e:` の `e` を使わない場合は `except Exception:`
- カスタム例外は `Exception` を継承して定義

## テスト

- pytest を使用
- フィクスチャは `conftest.py` に配置
- パラメータ化テスト: `@pytest.mark.parametrize`
- カバレッジ: `pytest-cov`

## フォーマット

- Ruff または Black でフォーマット
- isort でインポート整理（Ruff に統合されている場合はそちら）
- 行長: 88文字（Black デフォルト）
