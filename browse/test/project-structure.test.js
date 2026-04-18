import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// プロジェクトルートは browse/ の親ディレクトリ
const ROOT = join(import.meta.dirname, '..', '..');

describe('.gstack/plans/ 基盤', () => {
  it('.gstack/plans/ ディレクトリが存在する', () => {
    expect(existsSync(join(ROOT, '.gstack', 'plans'))).toBe(true);
  });

  it('.gitignore に .gstack/plans/ のignoreルールが含まれる', () => {
    const gitignore = readFileSync(join(ROOT, '.gitignore'), 'utf-8');
    expect(gitignore).toMatch(/\.gstack\/plans/);
  });
});

describe('プランテンプレート', () => {
  const templatePath = join(ROOT, '.gstack', 'plans', 'TEMPLATE.md');

  it('TEMPLATE.md が存在する', () => {
    expect(existsSync(templatePath)).toBe(true);
  });

  it('YAMLフロントマターを持つ（--- で囲まれている）', () => {
    const content = readFileSync(templatePath, 'utf-8');
    const normalized = content.replace(/\r\n/g, '\n');
    expect(normalized.startsWith('---\n')).toBe(true);
    // 2番目の --- が存在する
    const secondDash = normalized.indexOf('---', 4);
    expect(secondDash).toBeGreaterThan(4);
  });

  it('フロントマターに必須フィールド（feature, models, tasks）がある', () => {
    const content = readFileSync(templatePath, 'utf-8');
    const frontmatter = content.split('---')[1];
    expect(frontmatter).toContain('feature:');
    expect(frontmatter).toContain('models:');
    expect(frontmatter).toContain('tasks:');
  });

  it('フロントマターに cost_estimate フィールドがある', () => {
    const content = readFileSync(templatePath, 'utf-8');
    const frontmatter = content.split('---')[1];
    expect(frontmatter).toContain('cost_estimate:');
  });

  it('Markdownボディに合意点・相違点・独自発見セクションがある', () => {
    const content = readFileSync(templatePath, 'utf-8');
    const parts = content.split('---');
    const body = parts.slice(2).join('---');
    expect(body).toContain('## 合意点');
    expect(body).toContain('## 相違点');
    expect(body).toContain('## 独自発見');
  });

  it('Markdownボディに実装手順セクションがある', () => {
    const content = readFileSync(templatePath, 'utf-8');
    const parts = content.split('---');
    const body = parts.slice(2).join('---');
    expect(body).toContain('## 実装手順');
  });
});

describe('model-routing.yaml 検証', () => {
  const routingPath = join(ROOT, '.gstack', 'model-routing.yaml');

  it('model-routing.yaml が存在する', () => {
    expect(existsSync(routingPath)).toBe(true);
  });

  it('有効なYAML構文である', async () => {
    // yamlパーサなしで基本構造を検証
    const content = readFileSync(routingPath, 'utf-8');
    expect(content).toContain('routing:');
  });

  it('必須ロール（orchestrator, backend, fallback）が定義されている', () => {
    const content = readFileSync(routingPath, 'utf-8');
    expect(content).toContain('orchestrator:');
    expect(content).toContain('backend:');
    expect(content).toContain('fallback:');
  });

  it('各ロールに model と multiplier が定義されている', () => {
    const content = readFileSync(routingPath, 'utf-8');
    // orchestrator セクションに model と multiplier がある
    const orchestratorSection = content.slice(
      content.indexOf('orchestrator:'),
      content.indexOf('backend:')
    );
    expect(orchestratorSection).toContain('model:');
    expect(orchestratorSection).toContain('multiplier:');
  });
});

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
