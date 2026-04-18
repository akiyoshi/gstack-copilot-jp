import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..', '..');

describe('/loop SKILL.md', () => {
  const skillPath = join(ROOT, '.github', 'skills', 'loop', 'SKILL.md');

  it('SKILL.md が存在する', () => {
    expect(existsSync(skillPath)).toBe(true);
  });

  it('フロントマターに name: loop がある', () => {
    const content = readFileSync(skillPath, 'utf-8');
    const frontmatter = content.split('---')[1];
    expect(frontmatter).toContain('name: loop');
  });

  it('フロントマターに description がある', () => {
    const content = readFileSync(skillPath, 'utf-8');
    const frontmatter = content.split('---')[1];
    expect(frontmatter).toContain('description:');
  });

  it('安全弁セクションがある', () => {
    const content = readFileSync(skillPath, 'utf-8');
    expect(content).toMatch(/安全弁|safety|safeguard/i);
  });

  it('.gstack/plans/TEMPLATE.md への参照がある', () => {
    const content = readFileSync(skillPath, 'utf-8');
    expect(content).toContain('.gstack/plans/');
  });

  it('/multi-execute とのスコープ分離が明記されている', () => {
    const content = readFileSync(skillPath, 'utf-8');
    expect(content).toContain('/multi-execute');
  });
});

describe('context-management.instructions.md', () => {
  const instrPath = join(ROOT, '.github', 'instructions', 'context-management.instructions.md');

  it('ファイルが存在する', () => {
    expect(existsSync(instrPath)).toBe(true);
  });

  it('50行以下である（コンテキスト圧迫を防止）', () => {
    const content = readFileSync(instrPath, 'utf-8');
    const lines = content.split(/\r?\n/);
    expect(lines.length).toBeLessThanOrEqual(50);
  });

  it('フロントマターに description がある', () => {
    const content = readFileSync(instrPath, 'utf-8');
    const normalized = content.replace(/\r\n/g, '\n');
    expect(normalized.startsWith('---\n')).toBe(true);
    const frontmatter = normalized.split('---')[1];
    expect(frontmatter).toContain('description:');
  });

  it('セッション管理の記述がある', () => {
    const content = readFileSync(instrPath, 'utf-8');
    expect(content).toMatch(/セッション|session/i);
  });

  it('コンテキスト整理の記述がある', () => {
    const content = readFileSync(instrPath, 'utf-8');
    expect(content).toMatch(/コンテキスト|context/i);
  });

  it('メモリシステム参照がある', () => {
    const content = readFileSync(instrPath, 'utf-8');
    expect(content).toMatch(/\/memories\//);
  });
});

describe('copilot-instructions.md に /loop ルーティング', () => {
  const copilotPath = join(ROOT, '.github', 'copilot-instructions.md');

  it('/loop のルーティングがある', () => {
    const content = readFileSync(copilotPath, 'utf-8');
    expect(content).toContain('/loop');
  });
});
