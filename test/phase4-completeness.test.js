// test/phase4-completeness.test.js
// Phase 4: v1.0 完全性テスト — リリースゲート
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const ROOT = join(import.meta.dirname, '..');
const SKILLS_DIR = join(ROOT, '.github', 'skills');
const BIN_DIR = join(ROOT, 'bin');

// === bin/ スクリプトの構文検証 ===
describe('bin/ syntax validation', () => {
  const binFiles = readdirSync(BIN_DIR).filter(f => {
    const fullPath = join(BIN_DIR, f);
    if (!statSync(fullPath).isFile()) return false;
    const content = readFileSync(fullPath, 'utf-8');
    return content.startsWith('#!/usr/bin/env bash') || content.startsWith('#!/bin/bash');
  });

  it.each(binFiles)('bin/%s passes bash syntax check', (script) => {
    const result = execSync(`bash -n "${join(BIN_DIR, script)}" 2>&1 || true`, { encoding: 'utf-8' });
    expect(result.trim(), `${script} has syntax errors: ${result}`).toBe('');
  });

  it.each(binFiles)('bin/%s is executable', (script) => {
    const stat = statSync(join(BIN_DIR, script));
    expect(stat.mode & 0o100, `${script} not executable`).toBeTruthy();
  });

  it.each(binFiles)('bin/%s uses set -euo pipefail', (script) => {
    const content = readFileSync(join(BIN_DIR, script), 'utf-8');
    expect(content).toContain('set -euo pipefail');
  });
});

// === copilot-plugin.json 整合性 ===
describe('copilot-plugin.json integrity', () => {
  const pluginPath = join(ROOT, 'copilot-plugin.json');

  it('exists and is valid JSON', () => {
    expect(existsSync(pluginPath)).toBe(true);
    const content = readFileSync(pluginPath, 'utf-8');
    expect(() => JSON.parse(content)).not.toThrow();
  });

  it('has required fields', () => {
    const plugin = JSON.parse(readFileSync(pluginPath, 'utf-8'));
    expect(plugin).toHaveProperty('name');
    expect(plugin).toHaveProperty('version');
    expect(plugin).toHaveProperty('includes');
  });

  it('copilot-instructions.md exists', () => {
    expect(existsSync(join(ROOT, '.github', 'copilot-instructions.md'))).toBe(true);
  });
});

// === スキルルーティング完全性 ===
describe('skill routing completeness', () => {
  const routing = readFileSync(join(ROOT, '.github', 'copilot-instructions.md'), 'utf-8');
  const skillDirs = readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  // ルーティングテーブルから `/skill-name` を抽出
  const routeMatches = routing.match(/`\/[a-z][-a-z]*`/g) || [];
  const routedSkills = new Set(routeMatches.map(m => m.replace(/`\//g, '').replace(/`/g, '')));

  // ルーティング不要のユーティリティスキル（トグル系）
  const noRouteNeeded = new Set([
    'context-save', 'context-restore', 'open-gstack-browser',
    'setup-browser-cookies', 'pair-agent', 'setup-deploy',
  ]);

  it('all non-utility skills appear in routing table', () => {
    const missing = skillDirs.filter(s =>
      !noRouteNeeded.has(s) &&
      !routedSkills.has(s) &&
      !routedSkills.has(s.replace('gstack-', ''))
    );
    expect(missing, `Missing from routing: ${missing.join(', ')}`).toEqual([]);
  });
});

// === voice-friendly triggers ===
describe('voice-friendly triggers', () => {
  const skillDirs = readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  it.each(skillDirs)('%s description contains "Use when:"', (skill) => {
    const content = readFileSync(join(SKILLS_DIR, skill, 'SKILL.md'), 'utf-8');
    const frontmatter = content.split('---')[1] || '';
    expect(frontmatter).toContain('Use when:');
  });

  it.each(skillDirs)('%s description contains Japanese trigger words', (skill) => {
    const content = readFileSync(join(SKILLS_DIR, skill, 'SKILL.md'), 'utf-8');
    const frontmatter = content.split('---')[1] || '';
    const desc = frontmatter.match(/description:\s*"([^"]*)"/)?.[1] || '';
    // description に日本語が含まれること
    expect(desc).toMatch(/[\u3040-\u9fff]/);
  });
});

// === setup スクリプト ===
describe('setup script', () => {
  it('exists and is executable', () => {
    const setupPath = join(ROOT, 'setup');
    expect(existsSync(setupPath)).toBe(true);
    const stat = statSync(setupPath);
    expect(stat.mode & 0o100).toBeTruthy();
  });

  it('passes bash syntax check', () => {
    const result = execSync(`bash -n "${join(ROOT, 'setup')}" 2>&1 || true`, { encoding: 'utf-8' });
    expect(result.trim()).toBe('');
  });
});

// === VERSION format ===
describe('VERSION for v1.0', () => {
  it('is valid semver', () => {
    const version = readFileSync(join(ROOT, 'VERSION'), 'utf-8').trim();
    expect(version).toMatch(/^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/);
  });

  it('DESIGN.md references matching version', () => {
    const version = readFileSync(join(ROOT, 'VERSION'), 'utf-8').trim();
    const design = readFileSync(join(ROOT, 'DESIGN.md'), 'utf-8');
    expect(design).toContain(`VERSION: ${version}`);
  });
});

// === hook 整合性 ===
describe('hook system completeness', () => {
  it('lifecycle.json has all 4 hooks', () => {
    const hooks = JSON.parse(readFileSync(join(ROOT, '.github', 'hooks', 'lifecycle.json'), 'utf-8'));
    expect(hooks.hooks).toHaveProperty('sessionStart');
    expect(hooks.hooks).toHaveProperty('sessionEnd');
    expect(hooks.hooks).toHaveProperty('preToolUse');
    expect(hooks.hooks).toHaveProperty('postToolUse');
  });

  it('all hook scripts exist', () => {
    const hooks = JSON.parse(readFileSync(join(ROOT, '.github', 'hooks', 'lifecycle.json'), 'utf-8'));
    for (const [event, handlers] of Object.entries(hooks.hooks)) {
      for (const handler of handlers) {
        if (handler.bash) {
          expect(existsSync(join(ROOT, handler.bash)), `${event}: ${handler.bash} missing`).toBe(true);
        }
      }
    }
  });
});

// === browse TypeScript ===
describe('browse TypeScript sources', () => {
  const browseDir = join(ROOT, 'browse', 'src');

  const expectedFiles = ['cli.ts', 'server.ts', 'browser-manager.ts', 'commands.ts'];
  it.each(expectedFiles)('browse/src/%s exists', (file) => {
    expect(existsSync(join(browseDir, file))).toBe(true);
  });

  const oldFiles = ['cli.js', 'server.js', 'browser-manager.js', 'commands.js'];
  it.each(oldFiles)('browse/src/%s does NOT exist (migrated to .ts)', (file) => {
    expect(existsSync(join(browseDir, file))).toBe(false);
  });
});
