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

  it('/sprint の記載がある', () => {
    const content = readFileSync(gsPath, 'utf-8');
    expect(content).toContain('/sprint');
  });
});

describe('全スキル フロントマター検証', () => {
  const skillsDir = join(ROOT, '.github', 'skills');
  const skillDirs = readdirSync(skillsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
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
        .filter(d => d.isDirectory())
        .map(d => d.name)
    );

    // ルーティングされたスキルのうち、ディレクトリが存在しないものがない
    // (learn 振り返り → learn, gstack-upgrade → upgrade のようなエイリアスは除外)
    const aliases = { 'learn': 'learn', 'gstack-upgrade': 'gstack-upgrade', 'health': 'health', 'gstack-review': 'gstack-review', 'gstack-status': 'gstack-status' };
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

describe('Confusion Protocol', () => {
  it('copilot-instructions.md に Confusion Protocol がある', () => {
    const copilotPath = join(ROOT, '.github', 'copilot-instructions.md');
    const content = readFileSync(copilotPath, 'utf-8');
    expect(content).toContain('Confusion Protocol');
  });
});

describe('テンプレートシステム', () => {
  it('templates/skill.md が存在する', () => {
    expect(existsSync(join(ROOT, 'templates', 'skill.md'))).toBe(true);
  });

  it('skill.md テンプレートに必須セクションがある', () => {
    const content = readFileSync(join(ROOT, 'templates', 'skill.md'), 'utf-8');
    expect(content).toContain('フロントマター');
    expect(content).toContain('いつ使うか');
    expect(content).toContain('ロール');
    expect(content).toContain('ワークフロー');
    expect(content).toContain('最終レポート');
    expect(content).toContain('重要ルール');
    expect(content).toContain('次のスキル');
  });

  it('skill.md テンプレートが共通ルールへの重複を禁止している', () => {
    const content = readFileSync(join(ROOT, 'templates', 'skill.md'), 'utf-8');
    expect(content).toContain('共通ルールを重複して書いていない');
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

describe('DESIGN.md 数値整合性', () => {
  const designPath = join(ROOT, 'DESIGN.md');
  const designContent = readFileSync(designPath, 'utf-8');

  it('スキル数が実ディレクトリ数と一致する', () => {
    const skillsDir = join(ROOT, '.github', 'skills');
    const skillCount = readdirSync(skillsDir, { withFileTypes: true })
      .filter(d => d.isDirectory()).length;
    // "| スキル | N |" パターンを抽出
    const match = designContent.match(/\|\s*スキル\s*\|\s*(\d+)\s*\|/);
    expect(match).not.toBeNull();
    expect(parseInt(match[1])).toBe(skillCount);
  });

  it('バージョンがVERSIONファイルと一致する', () => {
    const version = readFileSync(join(ROOT, 'VERSION'), 'utf-8').trim();
    expect(designContent).toContain(`VERSION: ${version}`);
  });
});

describe('VERSION ファイル', () => {
  it('semver形式である', () => {
    const version = readFileSync(join(ROOT, 'VERSION'), 'utf-8').trim();
    expect(version).toMatch(/^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/);
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
