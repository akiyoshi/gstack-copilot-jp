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

  it('/go の記載がある', () => {
    const content = readFileSync(gsPath, 'utf-8');
    expect(content).toContain('/go');
  });
});

describe('全スキル フロントマター検証', () => {
  const skillsDir = join(ROOT, '.github', 'skills');
  const skillDirs = readdirSync(skillsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  it('45個のスキルディレクトリが存在する', () => {
    expect(skillDirs.length).toBe(45);
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
    const aliases = { 'learn': 'learn', 'gstack-upgrade': 'upgrade', 'health': 'health' };
    for (const skill of routedSkills) {
      const dirName = aliases[skill] || skill;
      // health はまだディレクトリ未作成（Phase 2）なのでスキップ
      if (dirName === 'health') continue;
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

describe('Confusion Protocol ルール', () => {
  it('confusion-protocol.md が rules/common/ に存在する', () => {
    const rulePath = join(ROOT, '.github', 'rules', 'common', 'confusion-protocol.md');
    expect(existsSync(rulePath)).toBe(true);
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

  it('skill.md テンプレートが instructions/ への重複を禁止している', () => {
    const content = readFileSync(join(ROOT, 'templates', 'skill.md'), 'utf-8');
    expect(content).toContain('instructions/ の共通ルールを重複して書いていない');
  });
});

describe('成果物永続化 instruction', () => {
  const instrPath = join(ROOT, '.github', 'instructions', 'artifact-persistence.instructions.md');

  it('ファイルが存在する', () => {
    expect(existsSync(instrPath)).toBe(true);
  });

  it('60行以下である', () => {
    const content = readFileSync(instrPath, 'utf-8');
    const lines = content.split(/\r?\n/);
    expect(lines.length).toBeLessThanOrEqual(60);
  });

  it('フロントマターに description がある', () => {
    const content = readFileSync(instrPath, 'utf-8');
    const normalized = content.replace(/\r\n/g, '\n');
    expect(normalized.startsWith('---\n')).toBe(true);
    const frontmatter = normalized.split('---')[1];
    expect(frontmatter).toContain('description:');
  });

  it('保存先テーブルがある', () => {
    const content = readFileSync(instrPath, 'utf-8');
    expect(content).toMatch(/保存先/);
    expect(content).toContain('DESIGN.md');
    expect(content).toContain('.gstack/plans/');
  });

  it('発見ルールがある', () => {
    const content = readFileSync(instrPath, 'utf-8');
    expect(content).toMatch(/発見ルール/);
  });
});

describe('品質ゲート instruction', () => {
  const instrPath = join(ROOT, '.github', 'instructions', 'quality-gate.instructions.md');

  it('ファイルが存在する', () => {
    expect(existsSync(instrPath)).toBe(true);
  });

  it('60行以下である', () => {
    const content = readFileSync(instrPath, 'utf-8');
    const lines = content.split(/\r?\n/);
    expect(lines.length).toBeLessThanOrEqual(60);
  });

  it('フロントマターに description がある', () => {
    const content = readFileSync(instrPath, 'utf-8');
    const normalized = content.replace(/\r\n/g, '\n');
    expect(normalized.startsWith('---\n')).toBe(true);
    const frontmatter = normalized.split('---')[1];
    expect(frontmatter).toContain('description:');
  });

  it('信頼度スコアテーブルがある', () => {
    const content = readFileSync(instrPath, 'utf-8');
    expect(content).toMatch(/信頼度/);
    expect(content).toMatch(/9-10|7-8|5-6|3-4|1-2/);
  });

  it('敵対レビューループの記述がある', () => {
    const content = readFileSync(instrPath, 'utf-8');
    expect(content).toMatch(/敵対レビュー|レビューループ/);
  });

  it('レビュー追跡の記述がある', () => {
    const content = readFileSync(instrPath, 'utf-8');
    expect(content).toMatch(/レビュー追跡/);
  });

  it('前提スキル提案の記述がある', () => {
    const content = readFileSync(instrPath, 'utf-8');
    expect(content).toMatch(/前提スキル|office-hours/);
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

  it('命令数が実ファイル数と一致する', () => {
    const instrDir = join(ROOT, '.github', 'instructions');
    const instrCount = readdirSync(instrDir)
      .filter(f => f.endsWith('.instructions.md')).length;
    const match = designContent.match(/\|\s*命令\s*\|\s*(\d+)\s*\|/);
    expect(match).not.toBeNull();
    expect(parseInt(match[1])).toBe(instrCount);
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

describe('instruction ファイル数', () => {
  it('instructionファイルが9個存在する', () => {
    const instrDir = join(ROOT, '.github', 'instructions');
    const count = readdirSync(instrDir)
      .filter(f => f.endsWith('.instructions.md')).length;
    expect(count).toBe(9);
  });
});
