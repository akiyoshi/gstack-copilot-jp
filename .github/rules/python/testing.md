# Python テスト規約

## フレームワーク

- pytest を標準とする
- カバレッジ: `pytest-cov`
- E2E: Playwright（Web）または `httpx`（API）

## テスト構造

```python
class TestTargetFunction:
    """target_function のテスト"""

    def test_normal_case(self):
        """正常系: 有効な入力に対して期待する出力を返す"""
        # Arrange
        input_data = ...
        # Act
        result = target_function(input_data)
        # Assert
        assert result == expected

    def test_edge_case_empty_input(self):
        """エッジケース: 空入力に対してValueErrorを送出する"""
        with pytest.raises(ValueError, match="input must not be empty"):
            target_function("")
```

## フィクスチャ

- 共有フィクスチャは `conftest.py` に配置
- スコープを適切に設定: `function`（デフォルト）, `class`, `module`, `session`
- テンポラリファイルは `tmp_path` フィクスチャを使用
- DB接続等の重いフィクスチャは `session` スコープ

## パラメータ化

```python
@pytest.mark.parametrize("input,expected", [
    ("hello", 5),
    ("", 0),
    ("日本語", 3),
])
def test_string_length(input, expected):
    assert len(input) == expected
```

## モック

- `unittest.mock.patch` または `pytest-mock` の `mocker` フィクスチャ
- 外部API呼び出しは必ずモック
- `responses` ライブラリでHTTPレスポンスをモック
