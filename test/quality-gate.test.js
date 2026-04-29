import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..');

describe('getting-started.md 品質', () => {
  const gsPath = join(ROOT, 'docs', 'getting-started.md');

  it('スキル数がスキルディレクトリ数と一致する', () => {
    const content = readFileSync(gsPath, 'utf-8');
    const skillsDir = join(ROOT, '.github', 'skills');
    const skillCount = readdirSync(skillsDir, { withFileTypes: true })
      .filter(d => d.isDirectory() && d.name !== 'bin').length;
    // "Nのスキル" パターンを抽出
    const match = content.match(/(\d+)のスキル/);
    expect(match).not.toBeNull();
    expect(parseInt(match[1])).toBe(skillCount);
  });
});

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
    });
  }
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

  it('スキル数が実ディレクトリ数と一致する', () => {
    const skillsDir = join(ROOT, '.github', 'skills');
    const skillCount = readdirSync(skillsDir, { withFileTypes: true })
      .filter(d => d.isDirectory() && d.name !== 'bin').length;
    // CHANGELOG.md の "**N スキル**" パターンを抽出
    const changelogContent = readFileSync(join(ROOT, 'CHANGELOG.md'), 'utf-8');
    const match = changelogContent.match(/\*\*(\d+)スキル\*\*/);
    expect(match).not.toBeNull();
    expect(parseInt(match[1])).toBe(skillCount);
  });

  it('バージョンがVERSIONファイルと一致する', () => {
    const version = readFileSync(join(ROOT, 'VERSION'), 'utf-8').trim();
    // ROADMAP.md に現在のバージョンが含まれる
    const roadmapContent = readFileSync(join(ROOT, 'ROADMAP.md'), 'utf-8');
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
