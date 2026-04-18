# TypeScript テスト規約

## フレームワーク

- Vitest または Jest を使用（プロジェクト設定に従う）
- E2E: Playwright を推奨
- カバレッジ: `v8` プロバイダーを優先

## テスト構造

```typescript
describe('[テスト対象]', () => {
  it('[正常系] ○○の場合、△△を返す', () => {
    // Arrange
    const input = ...;
    // Act
    const result = targetFunction(input);
    // Assert
    expect(result).toBe(expected);
  });

  it('[異常系] ○○が不正な場合、エラーをスローする', () => {
    expect(() => targetFunction(invalidInput)).toThrow();
  });
});
```

## モック

- 外部依存（API, DB, ファイルシステム）はモック
- モックは最小限。テスト対象の振る舞いに集中
- `vi.mock()` / `jest.mock()` はファイルトップレベル
- `vi.spyOn()` で既存の実装を部分的に置換

## React テスト

- `@testing-library/react` を使用
- DOM クエリの優先順位: `getByRole` > `getByLabelText` > `getByText` > `getByTestId`
- ユーザーイベントは `@testing-library/user-event` を使用
- 実装の詳細ではなく振る舞いをテスト

## 型テスト

- `expectTypeOf` / `assertType` で型の正しさもテスト可能（Vitest）
- ジェネリクスや条件型は型テストを書く
