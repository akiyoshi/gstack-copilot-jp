// test/reserved-names.js
// Single source of truth: VS Code Copilot Chat 組み込みのスラッシュコマンド名。
// スキル `name:` がこれらと完全一致すると built-in 機能 (例: /review) を
// 静かに上書きしてしまうため、quality-gate と sync ツール両方で検証する。
//
// 出典: VS Code 内蔵 Copilot 拡張の package.json
//   `~/AppData/Local/Programs/Microsoft VS Code/<ver>/resources/app/extensions/copilot/package.json`
// 該当 participants:
//   - github.copilot.default      → explain, review, tests, fix, new, newNotebook,
//                                   semanticSearch, setupTests
//   - github.copilot.editsAgent   → 上記 + error, compact, chronicle 系
//   - github.copilot.editingSessionEditor → generate, edit, fix, tests
//   - github.copilot.terminal     → explain
//   - github.copilot.vscode       → search
//
// 対象 OS が Windows でも他環境でも同じ built-in が同梱されているので、
// 全環境共通の禁止リストとして扱う。

export const RESERVED_BUILTIN_COMMANDS = [
  // 主要 (github.copilot.default)
  'explain',
  'review',
  'tests',
  'fix',
  'new',
  'newNotebook',
  'semanticSearch',
  'setupTests',
  // edits agent 追加分
  'error',
  'compact',
  'chronicle',
  // editing session
  'generate',
  'edit',
  // vscode / terminal
  'search',
];

/**
 * スキル名が reserved built-in と衝突するかを判定する。
 * @param {string} name - スキルの `name:` フィールド値
 * @returns {boolean}
 */
export function isReservedName(name) {
  return RESERVED_BUILTIN_COMMANDS.includes(name);
}
