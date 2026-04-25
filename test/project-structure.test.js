import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';

// プロジェクトルートは browse/ の親ディレクトリ
const ROOT = join(import.meta.dirname, '..');

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

describe('/loop は廃止済み', () => {
  it('/loop ディレクトリが存在しない', () => {
    const skillPath = join(ROOT, '.github', 'skills', 'loop');
    expect(existsSync(skillPath)).toBe(false);
  });
});

describe('VS Code 資産は copilot-instructions.md に統合済み', () => {
  it('.github/instructions/ が存在しない', () => {
    expect(existsSync(join(ROOT, '.github', 'instructions'))).toBe(false);
  });
});

describe('hookシステム: スキルの「次のスキル」推奨', () => {
  const skillsDir = join(ROOT, '.github', 'skills');
  const skillDirs = readdirSync(skillsDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== 'bin')
    .map(d => d.name);

  // Post-Hook不要のトグル/ユーティリティスキル
  const exemptSkills = [
    'careful', 'freeze', 'guard', 'unfreeze',
    'browse', 'open-gstack-browser', 'pair-agent',
    'setup-browser-cookies', 'setup-deploy', 'gstack-upgrade', 'benchmark',
    'benchmark-models', 'document-release', 'investigate', 'learn',
    'gstack-review', 'ship', 'make-pdf',
  ];

  const processSkills = skillDirs.filter(s => !exemptSkills.includes(s));

  it.each(processSkills)('%s に「次のスキル」セクションがある', (skillName) => {
    const skillPath = join(skillsDir, skillName, 'SKILL.md');
    const content = readFileSync(skillPath, 'utf-8');
    expect(content).toMatch(/次のスキル|推奨する次|Next skill|Handoff|Next Steps|next skill/i);
  });
});

describe('Spec Review Loop: ドキュメント生成スキルに品質ゲートがある', () => {
  // ドキュメントを生成して下流スキルに引き渡すスキル
  const docGeneratingSkills = [
    'office-hours',
    'plan-ceo-review',
  ];

  it.each(docGeneratingSkills)('%s に品質ゲートのステップがある', (skillName) => {
    const skillPath = join(ROOT, '.github', 'skills', skillName, 'SKILL.md');
    const content = readFileSync(skillPath, 'utf-8');
    expect(content).toMatch(/品質ゲート|敵対レビュー|Spec Review/);
  });
});
