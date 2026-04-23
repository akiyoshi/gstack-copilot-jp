// test/phase2-structure.test.js
// Phase 2 構造検証: 資産整理・スキル整合性・bin互換性を確認
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SKILLS_DIR = path.join(ROOT, '.github', 'skills');
const AGENTS_DIR = path.join(ROOT, '.github', 'agents');
const BIN_DIR = path.join(ROOT, 'bin');

describe('Phase 2: Asset Cleanup', () => {
  const deletedSkills = [
    'build-fix', 'clean', 'loop', 'multi-plan',
    'multi-execute', 'second-opinion', 'checkpoint'
  ]

  for (const skill of deletedSkills) {
    it(`deprecated skill "${skill}" directory does not exist`, () => {
      expect(fs.existsSync(path.join(SKILLS_DIR, skill))).toBe(false)
    })
  }

  it('deprecated "upgrade" directory does not exist (renamed to gstack-upgrade)', () => {
    expect(fs.existsSync(path.join(SKILLS_DIR, 'upgrade'))).toBe(false)
  })

  it('gstack-upgrade directory exists', () => {
    expect(fs.existsSync(path.join(SKILLS_DIR, 'gstack-upgrade', 'SKILL.md'))).toBe(true)
  })

  const deletedAgents = ['reviewer.agent.md', 'adversarial.agent.md']
  for (const agent of deletedAgents) {
    it(`deprecated agent "${agent}" does not exist`, () => {
      expect(fs.existsSync(path.join(AGENTS_DIR, agent))).toBe(false)
    })
  }

  const deletedVscodeDirs = ['instructions', 'rules', 'prompts']
  for (const dir of deletedVscodeDirs) {
    it(`VS Code asset ".github/${dir}/" does not exist`, () => {
      expect(fs.existsSync(path.join(ROOT, '.github', dir))).toBe(false)
    })
  }
})

describe('Phase 2: Skill Integrity', () => {
  it('all skill directories have a SKILL.md', () => {
    const skills = fs.readdirSync(SKILLS_DIR).filter(d =>
      fs.statSync(path.join(SKILLS_DIR, d)).isDirectory()
    )
    for (const skill of skills) {
      const skillFile = path.join(SKILLS_DIR, skill, 'SKILL.md')
      expect(fs.existsSync(skillFile), `${skill}/SKILL.md missing`).toBe(true)
    }
  })

  it('all SKILL.md files have name and description in frontmatter', () => {
    const skills = fs.readdirSync(SKILLS_DIR).filter(d =>
      fs.statSync(path.join(SKILLS_DIR, d)).isDirectory()
    )
    for (const skill of skills) {
      const content = fs.readFileSync(path.join(SKILLS_DIR, skill, 'SKILL.md'), 'utf-8')
      expect(content.startsWith('---'), `${skill}: missing frontmatter`).toBe(true)
      expect(content).toContain('name:')
      expect(content).toContain('description:')
    }
  })

  it('/health skill exists', () => {
    expect(fs.existsSync(path.join(SKILLS_DIR, 'health', 'SKILL.md'))).toBe(true)
  })

  it('routing table has no stale skill references', () => {
    const routing = fs.readFileSync(
      path.join(ROOT, '.github', 'copilot-instructions.md'), 'utf-8'
    )
    const staleSkills = [
      '/build-fix', '/clean |', '/loop |', '/multi-plan',
      '/multi-execute', '/second-opinion', '/checkpoint'
    ]
    for (const stale of staleSkills) {
      expect(routing).not.toContain(stale)
    }
  })

  it('routing table references all active skills', () => {
    const routing = fs.readFileSync(
      path.join(ROOT, '.github', 'copilot-instructions.md'), 'utf-8'
    )
    const activeSkills = ['/review', '/ship', '/health', '/sprint', '/tdd', '/gstack-upgrade']
    for (const skill of activeSkills) {
      expect(routing, `routing missing ${skill}`).toContain(skill)
    }
  })
})

describe('Phase 2: Outside Voice', () => {
  it('/review SKILL.md contains independent review mechanism', () => {
    const content = fs.readFileSync(
      path.join(SKILLS_DIR, 'review', 'SKILL.md'), 'utf-8'
    )
    expect(content).toMatch(/Outside Voice|Adversarial|Cross-Model|Second Opinion|codex/i)
  })

  it('/ship SKILL.md contains independent review mechanism', () => {
    const content = fs.readFileSync(
      path.join(SKILLS_DIR, 'ship', 'SKILL.md'), 'utf-8'
    )
    expect(content).toMatch(/Outside Voice|Adversarial|Cross-Model|Second Opinion|codex/i)
  })
})

describe('Phase 2: bin/ Utilities', () => {
  const requiredBins = [
    'gstack-slug', 'gstack-config', 'gstack-review-log',
    'gstack-learnings-log', 'gstack-session-track',
    'gstack-diff-scope', 'gstack-timeline-log', 'gstack-analytics'
  ]

  for (const bin of requiredBins) {
    it(`${bin} exists and is executable`, () => {
      const binPath = path.join(BIN_DIR, bin)
      expect(fs.existsSync(binPath), `${bin} missing`).toBe(true)
      const stat = fs.statSync(binPath)
      // Check executable bit (owner)
      expect(stat.mode & 0o100, `${bin} not executable`).toBeTruthy()
    })
  }
})

describe('Phase 2: Hook System', () => {
  it('lifecycle.json includes postToolUse hook', () => {
    const hooks = JSON.parse(
      fs.readFileSync(path.join(ROOT, '.github', 'hooks', 'lifecycle.json'), 'utf-8')
    )
    expect(hooks.hooks).toHaveProperty('postToolUse')
    expect(hooks.hooks.postToolUse.length).toBeGreaterThan(0)
  })

  it('postToolUse hook script exists', () => {
    expect(fs.existsSync(path.join(BIN_DIR, 'gstack-post-tool-log.sh'))).toBe(true)
  })
})
