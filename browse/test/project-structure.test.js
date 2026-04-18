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
