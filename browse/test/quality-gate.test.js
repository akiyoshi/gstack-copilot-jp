import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..', '..');

describe('getting-started.md 品質', () => {
  const gsPath = join(ROOT, 'docs', 'getting-started.md');

  it('スキル数がスキルディレクトリ数と一致する', () => {
    const content = readFileSync(gsPath, 'utf-8');
    const skillsDir = join(ROOT, '.github', 'skills');
    const skillCount = readdirSync(skillsDir, { withFileTypes: true })
      .filter(d => d.isDirectory()).length;
    // "Nのスキル" パターンを抽出
    const match = content.match(/(\d+)のスキル/);
    expect(match).not.toBeNull();
    expect(parseInt(match[1])).toBe(skillCount);
  });

  it('/loop の記載がある', () => {
    const content = readFileSync(gsPath, 'utf-8');
    expect(content).toContain('/loop');
  });
});

describe('全スキル フロントマター検証', () => {
  const skillsDir = join(ROOT, '.github', 'skills');
  const skillDirs = readdirSync(skillsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  it('40個のスキルディレクトリが存在する', () => {
    expect(skillDirs.length).toBe(40);
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
    });
  }
});

describe('copilot-instructions.md とスキルの整合性', () => {
  it('ルーティングテーブルのスキル数がディレクトリ数と一致する', () => {
    const copilotPath = join(ROOT, '.github', 'copilot-instructions.md');
    const content = readFileSync(copilotPath, 'utf-8');
    // `/skill-name` パターンをルーティングテーブルから抽出
    const routingMatches = content.match(/\| `\/[a-z-]+`/g) || [];
    // /learn 振り返り は /learn と同一スキルなのでユニークスキル数を数える
    const uniqueSkills = new Set(routingMatches.map(m => m.match(/`(\/[a-z-]+)`/)[1]));

    const skillsDir = join(ROOT, '.github', 'skills');
    const skillCount = readdirSync(skillsDir, { withFileTypes: true })
      .filter(d => d.isDirectory()).length;

    expect(uniqueSkills.size).toBe(skillCount);
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
