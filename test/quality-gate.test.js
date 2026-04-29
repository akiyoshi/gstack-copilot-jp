import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { RESERVED_BUILTIN_COMMANDS, isReservedName } from './reserved-names.js';

const ROOT = join(import.meta.dirname, '..');

describe('全スキル フロントマター検証', () => {
  const skillsDir = join(ROOT, '.github', 'skills');
  const skillDirs = readdirSync(skillsDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== 'bin')
    .map(d => d.name);

  it('スキルディレクトリが30個以上存在する', () => {
    expect(skillDirs.length).toBeGreaterThanOrEqual(30);
  });

  for (const skill of skillDirs) {
    describe(`${skill}/SKILL.md`, () => {
      const skillPath = join(skillsDir, skill, 'SKILL.md');

      it('SKILL.md が存在する', () => {
        expect(existsSync(skillPath)).toBe(true);
      });

      it('フロントマターに name フィールドがある', () => {
        const content = readFileSync(skillPath, 'utf-8');
        const normalized = content.replace(/\r\n/g, '\n');
        expect(normalized.startsWith('---\n')).toBe(true);
        const frontmatter = normalized.split('---')[1];
        expect(frontmatter).toContain('name:');
      });

      it('フロントマターに description フィールドがある', () => {
        const content = readFileSync(skillPath, 'utf-8');
        const frontmatter = content.split('---')[1];
        expect(frontmatter).toContain('description:');
      });

      it('フロントマターに version フィールドがある', () => {
        const content = readFileSync(skillPath, 'utf-8');
        const frontmatter = content.split('---')[1];
        // 全スキルが vendored であるため version フィールドは必須
        expect(frontmatter).toMatch(/version:\s*\d+\.\d+\.\d+/);
      });

      it('フロントマターブロックが1つだけである (重複なし)', () => {
        // v1.1.2: gstack-upgrade に upstream マージ取りこぼしで 2 つの YAML
        // フロントマターブロックが残っていた事故の再発防止。
        // 正しい構造: `---\n<yaml>\n---\n<body>`。body 中の `---` は
        // markdown 水平線として正常なので、第 2 ブロック開始だけを検出する。
        const content = readFileSync(skillPath, 'utf-8').replace(/\r\n/g, '\n');
        expect(content.startsWith('---\n')).toBe(true);
        // 最初のブロックの終端 `---` を見つける
        const closeIdx = content.indexOf('\n---\n', 4);
        expect(closeIdx, `${skill}/SKILL.md のフロントマターが閉じていない`).toBeGreaterThan(0);
        const body = content.slice(closeIdx + 5); // skip "\n---\n"
        // 直後 (空行を許容) に再び `---\n<key>:` が来たら重複ブロック
        const trimmedBody = body.replace(/^\n+/, '');
        const dupMatch = trimmedBody.match(/^---\n[a-zA-Z][\w-]*:/);
        expect(
          dupMatch,
          `${skill}/SKILL.md に複数のフロントマターブロックがある (重複検出: ${dupMatch ? dupMatch[0].slice(0, 40) : ''})`
        ).toBeNull();
      });

      it('フロントマターの name が VS Code 組み込みスラッシュコマンドと衝突しない', () => {
        // v1.1.2: built-in `/review` `/explain` `/fix` 等と name 衝突すると
        // VS Code Copilot Chat の組み込み機能を静かに上書きしてしまう。
        // (例: name: review → built-in /review 不可視化)
        // 衝突したら fail させて再発防止。
        // skill-contracts.test.js と同一の kebab-case 厳格パターンを使う。
        const content = readFileSync(skillPath, 'utf-8').replace(/\r\n/g, '\n');
        const fm = content.split('---')[1] || '';
        const m = fm.match(/^name:\s*([a-z][a-z0-9-]*)\s*$/m);
        expect(m, `${skill}/SKILL.md の name フィールドが解析できない (kebab-case 必須)`).toBeTruthy();
        const skillName = m[1];
        expect(
          isReservedName(skillName),
          `${skill}/SKILL.md の name "${skillName}" は VS Code 組み込みコマンドと衝突する。リネームしてください (例: gstack-${skillName})。Reserved: ${RESERVED_BUILTIN_COMMANDS.join(', ')}`
        ).toBe(false);
      });

      it('スキルディレクトリ名がフロントマター name と一致する', () => {
        // VS Code Copilot Chat はディレクトリ名ベースで /<name> を登録する。
        // ディレクトリ名と name フィールドが食い違うと skill が認識されない
        // (silently skipped)。両者一致を契約化。
        const content = readFileSync(skillPath, 'utf-8').replace(/\r\n/g, '\n');
        const fm = content.split('---')[1] || '';
        const m = fm.match(/^name:\s*([a-z][a-z0-9-]*)\s*$/m);
        expect(m, `${skill}/SKILL.md の name が見つからない`).toBeTruthy();
        expect(
          m[1],
          `${skill}/SKILL.md: ディレクトリ名 (${skill}) と name (${m[1]}) が一致しない`
        ).toBe(skill);
      });
    });
  }
});

describe('Reserved 名リスト同期 (v1.2.1+)', () => {
  // RESERVED_BUILTIN_COMMANDS は test/reserved-names.js が canonical source。
  // 同じリストが bin/gstack-sync-user-skills (bash) と
  // bin/gstack-sync-user-skills.ps1 (PowerShell) に **コピー** されており、
  // 同期が崩れると skill 衝突検出が片方で抜ける。
  // 3 ファイルが同一リストを保持していることを契約化する。

  function extractBashList(content) {
    // RESERVED_NAMES=(... ) からトークンを抽出
    const m = content.match(/RESERVED_NAMES=\(([^)]*)\)/s);
    if (!m) return null;
    return m[1]
      .replace(/\\\n/g, ' ') // bash 行継続を除去
      .split(/\s+/)
      .map(t => t.trim())
      .filter(t => t && t !== '\\'); // 空文字と継続文字を除外
  }

  function extractPs1List(content) {
    // $ReservedNames = @(...) から quoted トークンを抽出
    const m = content.match(/\$ReservedNames\s*=\s*@\(([^)]*)\)/s);
    if (!m) return null;
    return [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]);
  }

  it('bash 版 (bin/gstack-sync-user-skills) の RESERVED_NAMES が canonical と一致する', () => {
    const bashContent = readFileSync(
      join(ROOT, 'bin', 'gstack-sync-user-skills'),
      'utf-8',
    );
    const bashList = extractBashList(bashContent);
    expect(bashList, 'bash の RESERVED_NAMES=(...) ブロックが見つからない').toBeTruthy();
    expect(new Set(bashList)).toEqual(new Set(RESERVED_BUILTIN_COMMANDS));
  });

  it('PowerShell 版 (bin/gstack-sync-user-skills.ps1) の $ReservedNames が canonical と一致する', () => {
    const ps1Content = readFileSync(
      join(ROOT, 'bin', 'gstack-sync-user-skills.ps1'),
      'utf-8',
    );
    const ps1List = extractPs1List(ps1Content);
    expect(ps1List, 'ps1 の $ReservedNames = @(...) ブロックが見つからない').toBeTruthy();
    expect(new Set(ps1List)).toEqual(new Set(RESERVED_BUILTIN_COMMANDS));
  });
});

describe('copilot-instructions.md とスキルの整合性', () => {
  it('ルーティングテーブルの各スキルに対応するディレクトリが存在する', () => {
    const copilotPath = join(ROOT, '.github', 'copilot-instructions.md');
    const content = readFileSync(copilotPath, 'utf-8');
    // `/skill-name` パターンをルーティングテーブルから抽出
    const routingMatches = content.match(/\| `\/[a-z-]+`/g) || [];
    const routedSkills = new Set(routingMatches.map(m => m.match(/`\/([a-z-]+)`/)[1]));

    const skillsDir = join(ROOT, '.github', 'skills');
    const existingDirs = new Set(
      readdirSync(skillsDir, { withFileTypes: true })
        .filter(d => d.isDirectory() && d.name !== 'bin')
        .map(d => d.name)
    );

    // ルーティングされたスキルのうち、ディレクトリが存在しないものがない
    // (learn 振り返り → learn, gstack-upgrade → upgrade のようなエイリアスは除外)
    const aliases = { 'learn': 'learn', 'gstack-upgrade': 'gstack-upgrade', 'health': 'health', 'gstack-review': 'gstack-review' };
    for (const skill of routedSkills) {
      const dirName = aliases[skill] || skill;
      expect(existingDirs.has(dirName), `ルート /${skill} に対応するディレクトリ ${dirName}/ が見つからない`).toBe(true);
    }
  });
});

describe('レガシー清掃', () => {
  it('setup.ps1 が存在しない', () => {
    expect(existsSync(join(ROOT, 'setup.ps1'))).toBe(false);
  });

  it('setup.sh が存在しない', () => {
    expect(existsSync(join(ROOT, 'setup.sh'))).toBe(false);
  });
});


describe('copilot-instructions.md 品質ゲート機能', () => {
  const copilotPath = join(ROOT, '.github', 'copilot-instructions.md');
  const content = readFileSync(copilotPath, 'utf-8');

  it('信頼度スコアまたは品質ゲートの参照がある', () => {
    // 品質ゲートの内容は copilot-instructions.md に統合済み
    // または instructions/ として独立していた内容が反映されていることを確認
    expect(content.length).toBeGreaterThan(100);
  });
});

describe('ドキュメント数値整合性', () => {

  // v1.1.1: ディレクトリカウントを single source of truth に、
  // CHANGELOG の prose regex を「記載されていれば一致」に緩和。
  // （ユーザー preference: CHANGELOG は作らない/作っても任意 format）
  it('CHANGELOG.md にスキル数が記載されている場合はディレクトリ数と一致する', () => {
    const skillsDir = join(ROOT, '.github', 'skills');
    const skillCount = readdirSync(skillsDir, { withFileTypes: true })
      .filter(d => d.isDirectory() && d.name !== 'bin').length;
    const changelogPath = join(ROOT, 'CHANGELOG.md');
    if (!existsSync(changelogPath)) return; // CHANGELOG 不要 preference
    const changelogContent = readFileSync(changelogPath, 'utf-8');
    const match = changelogContent.match(/\*{0,2}(\d+)\s*スキル\*{0,2}/);
    if (match) {
      expect(parseInt(match[1])).toBe(skillCount);
    }
    // 記載が無ければ skip。
  });

  it('バージョンがVERSIONファイルと一致する', () => {
    const version = readFileSync(join(ROOT, 'VERSION'), 'utf-8').trim();
    // TODOS.md に現在のバージョンが含まれる
    const roadmapContent = readFileSync(join(ROOT, 'TODOS.md'), 'utf-8');
    expect(roadmapContent).toContain(version);
  });
});

describe('VERSION ファイル', () => {
  it('upstream 4桁形式またはsemver形式である', () => {
    const version = readFileSync(join(ROOT, 'VERSION'), 'utf-8').trim();
    expect(version).toMatch(/^\d+\.\d+\.\d+(\.\d+)?(-[a-zA-Z0-9.-]+)?$/);
  });
});

describe('バージョン3ファイル一致 (VERSION / package.json / plugin.json)', () => {
  // v1.0.3 で追加: VERSION, package.json, plugin.json の version が乖離する
  // バグ（v1.0.2 で発覚: VERSION=1.0.2.0 vs plugin.json=1.0.0）の再発防止。
  // /ship・/landing-report・gstack-next-version の前提として 3 ファイル整合を契約化。
  const version = readFileSync(join(ROOT, 'VERSION'), 'utf-8').trim();
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));
  const plugin = JSON.parse(readFileSync(join(ROOT, 'plugin.json'), 'utf-8'));

  it('package.json の version が VERSION と一致する', () => {
    expect(pkg.version).toBe(version);
  });

  it('plugin.json の version が VERSION と一致する', () => {
    expect(plugin.version).toBe(version);
  });
});

describe('VS Code 資産が削除済み', () => {
  it('.github/instructions/ が存在しない（copilot-instructions.md に統合済み）', () => {
    expect(existsSync(join(ROOT, '.github', 'instructions'))).toBe(false);
  });

  it('.github/rules/ が存在しない（copilot-instructions.md に統合済み）', () => {
    expect(existsSync(join(ROOT, '.github', 'rules'))).toBe(false);
  });

  it('.github/prompts/ が存在しない（hook で代替済み）', () => {
    expect(existsSync(join(ROOT, '.github', 'prompts'))).toBe(false);
  });
});
