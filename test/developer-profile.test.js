// test/developer-profile.test.js
// bin/gstack-developer-profile の契約テスト。
// GSTACK_HOME=mktemp で完全 isolation。child_process.spawnSync で bin を呼ぶ。
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const BIN = path.join(ROOT, 'bin', 'gstack-developer-profile');
const FIXTURES = path.join(ROOT, 'test', 'fixtures');

function run(args, opts = {}) {
  return spawnSync(BIN, args, {
    encoding: 'utf-8',
    env: { ...process.env, ...opts.env },
  });
}

function mkHome() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gstack-dp-test-'));
  return dir;
}

function copyFixture(home, name, dest = 'builder-profile.jsonl') {
  fs.copyFileSync(path.join(FIXTURES, name), path.join(home, dest));
}

describe('gstack-developer-profile --read', () => {
  let home;
  beforeEach(() => { home = mkHome(); });
  afterEach(() => { fs.rmSync(home, { recursive: true, force: true }); });

  it('returns defaults when no profile or legacy file exists', () => {
    const r = run(['--read'], { env: { GSTACK_HOME: home } });
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/SESSION_COUNT: 0/);
    expect(r.stdout).toMatch(/TIER: introduction/);
    expect(r.stdout).toMatch(/CROSS_PROJECT: false/);
    expect(r.stdout).toMatch(/NUDGE_ELIGIBLE: false/);
  });

  it('creates a stub developer-profile.json on first read with no legacy', () => {
    run(['--read'], { env: { GSTACK_HOME: home } });
    const profilePath = path.join(home, 'developer-profile.json');
    expect(fs.existsSync(profilePath)).toBe(true);
    const p = JSON.parse(fs.readFileSync(profilePath, 'utf-8'));
    expect(p.schema_version).toBe(1);
    expect(p.sessions).toEqual([]);
    expect(p.inferred.values.scope_appetite).toBe(0.5);
  });

  it('emits KEY: VALUE format compatible with /office-hours', () => {
    copyFixture(home, 'builder-profile-legacy.jsonl');
    const r = run(['--read'], { env: { GSTACK_HOME: home } });
    expect(r.status).toBe(0);
    // Required keys for office-hours Phase 6 parsing
    const required = [
      'SESSION_COUNT', 'TIER', 'LAST_PROJECT', 'LAST_ASSIGNMENT',
      'LAST_DESIGN_TITLE', 'DESIGN_COUNT', 'DESIGN_TITLES',
      'ACCUMULATED_SIGNALS', 'TOTAL_SIGNAL_COUNT', 'CROSS_PROJECT',
      'NUDGE_ELIGIBLE', 'RESOURCES_SHOWN', 'RESOURCES_SHOWN_COUNT', 'TOPICS',
    ];
    for (const k of required) {
      expect(r.stdout).toMatch(new RegExp(`^${k}: `, 'm'));
    }
  });

  it('computes tier from session count (welcome_back / regular / inner_circle)', () => {
    // 1 session → welcome_back
    fs.writeFileSync(path.join(home, 'builder-profile.jsonl'),
      JSON.stringify({ project_slug: 'a', signals: [] }) + '\n');
    let r = run(['--read'], { env: { GSTACK_HOME: home } });
    expect(r.stdout).toMatch(/TIER: welcome_back/);
  });

  it('detects cross-project transitions', () => {
    copyFixture(home, 'builder-profile-legacy.jsonl');
    const r = run(['--read'], { env: { GSTACK_HOME: home } });
    // legacy fixture: alpha → beta → alpha (last two are beta→alpha, different)
    expect(r.stdout).toMatch(/CROSS_PROJECT: true/);
  });

  it('counts signals across all sessions', () => {
    copyFixture(home, 'builder-profile-legacy.jsonl');
    const r = run(['--read'], { env: { GSTACK_HOME: home } });
    // 2x scope_appetite_high + 1x detail_low = 3 total
    expect(r.stdout).toMatch(/TOTAL_SIGNAL_COUNT: 3/);
    expect(r.stdout).toMatch(/scope_appetite_high:2/);
    expect(r.stdout).toMatch(/detail_low:1/);
  });
});

describe('gstack-developer-profile --migrate', () => {
  let home;
  beforeEach(() => { home = mkHome(); });
  afterEach(() => { fs.rmSync(home, { recursive: true, force: true }); });

  it('returns no-op when no legacy file exists', () => {
    const r = run(['--migrate'], { env: { GSTACK_HOME: home } });
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/no legacy file/);
    expect(fs.existsSync(path.join(home, 'developer-profile.json'))).toBe(false);
  });

  it('migrates legacy fixture preserving sessions, signals, resources, topics', () => {
    copyFixture(home, 'builder-profile-legacy.jsonl');
    const r = run(['--migrate'], { env: { GSTACK_HOME: home } });
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/migrated 3 sessions/);

    const p = JSON.parse(fs.readFileSync(path.join(home, 'developer-profile.json'), 'utf-8'));
    expect(p.sessions).toHaveLength(3);
    expect(p.signals_accumulated.scope_appetite_high).toBe(2);
    expect(p.signals_accumulated.detail_low).toBe(1);
    expect(p.resources_shown).toEqual(expect.arrayContaining([
      'https://a.example/1', 'https://b.example/2', 'https://a.example/3'
    ]));
    expect(p.topics).toEqual(expect.arrayContaining(['scaling', 'refactor']));
    expect(p.schema_version).toBe(1);
    expect(p.migrated_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('archives the legacy file to .migrated-<TS>', () => {
    copyFixture(home, 'builder-profile-legacy.jsonl');
    run(['--migrate'], { env: { GSTACK_HOME: home } });
    expect(fs.existsSync(path.join(home, 'builder-profile.jsonl'))).toBe(false);
    const archived = fs.readdirSync(home).filter(f => f.startsWith('builder-profile.jsonl.migrated-'));
    expect(archived).toHaveLength(1);
  });

  it('is idempotent (second --migrate is a no-op when profile exists)', () => {
    copyFixture(home, 'builder-profile-legacy.jsonl');
    run(['--migrate'], { env: { GSTACK_HOME: home } });
    const before = fs.readFileSync(path.join(home, 'developer-profile.json'), 'utf-8');
    // Restore a legacy file to test the idempotency guard
    copyFixture(home, 'builder-profile-legacy.jsonl');
    const r = run(['--migrate'], { env: { GSTACK_HOME: home } });
    expect(r.stdout).toMatch(/already migrated/);
    const after = fs.readFileSync(path.join(home, 'developer-profile.json'), 'utf-8');
    expect(after).toBe(before);
  });

  it('handles empty legacy file gracefully', () => {
    copyFixture(home, 'builder-profile-empty.jsonl');
    const r = run(['--migrate'], { env: { GSTACK_HOME: home } });
    expect(r.status).toBe(0);
    const p = JSON.parse(fs.readFileSync(path.join(home, 'developer-profile.json'), 'utf-8'));
    expect(p.sessions).toEqual([]);
  });

  it('skips malformed lines and salvages valid ones', () => {
    copyFixture(home, 'builder-profile-malformed.jsonl');
    const r = run(['--migrate'], { env: { GSTACK_HOME: home } });
    expect(r.status).toBe(0);
    const p = JSON.parse(fs.readFileSync(path.join(home, 'developer-profile.json'), 'utf-8'));
    expect(p.sessions).toHaveLength(2);
    expect(p.sessions[0].project_slug).toBe('good');
    expect(p.sessions[1].project_slug).toBe('good2');
  });

  it('auto-migrates on first --read when legacy exists', () => {
    copyFixture(home, 'builder-profile-legacy.jsonl');
    const r = run(['--read'], { env: { GSTACK_HOME: home } });
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/SESSION_COUNT: 3/);
    expect(fs.existsSync(path.join(home, 'developer-profile.json'))).toBe(true);
    const archived = fs.readdirSync(home).filter(f => f.startsWith('builder-profile.jsonl.migrated-'));
    expect(archived).toHaveLength(1);
  });
});

describe('gstack-developer-profile --profile', () => {
  let home;
  beforeEach(() => { home = mkHome(); });
  afterEach(() => { fs.rmSync(home, { recursive: true, force: true }); });

  it('outputs the full profile JSON', () => {
    const r = run(['--profile'], { env: { GSTACK_HOME: home } });
    expect(r.status).toBe(0);
    const p = JSON.parse(r.stdout);
    expect(p.schema_version).toBe(1);
    expect(p).toHaveProperty('inferred.values.scope_appetite');
  });
});

describe('gstack-developer-profile --append-session', () => {
  let home;
  beforeEach(() => { home = mkHome(); });
  afterEach(() => { fs.rmSync(home, { recursive: true, force: true }); });

  function appendSession(entry) {
    return spawnSync(BIN, ['--append-session'], {
      encoding: 'utf-8',
      env: { ...process.env, GSTACK_HOME: home },
      input: JSON.stringify(entry),
    });
  }

  it('appends a session to an empty profile and updates aggregates', () => {
    const r = appendSession({
      date: '2026-05-02T09:00:00Z',
      mode: 'builder',
      project_slug: 'foo',
      signals: ['scope_appetite_high', 'detail_low'],
      design_doc: 'foo.md',
      assignment: 'build foo',
      resources_shown: ['https://x.example/1'],
      topics: ['scaling'],
    });
    expect(r.status).toBe(0);
    const p = JSON.parse(fs.readFileSync(path.join(home, 'developer-profile.json'), 'utf-8'));
    expect(p.sessions).toHaveLength(1);
    expect(p.signals_accumulated.scope_appetite_high).toBe(1);
    expect(p.signals_accumulated.detail_low).toBe(1);
    expect(p.resources_shown).toContain('https://x.example/1');
    expect(p.topics).toContain('scaling');
    expect(p.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('accumulates signals/resources/topics across multiple appends', () => {
    appendSession({ project_slug: 'a', signals: ['x'], resources_shown: ['u1'], topics: ['t1'] });
    appendSession({ project_slug: 'b', signals: ['x', 'y'], resources_shown: ['u2'], topics: ['t2'] });
    const p = JSON.parse(fs.readFileSync(path.join(home, 'developer-profile.json'), 'utf-8'));
    expect(p.sessions).toHaveLength(2);
    expect(p.signals_accumulated.x).toBe(2);
    expect(p.signals_accumulated.y).toBe(1);
    expect(p.resources_shown).toEqual(expect.arrayContaining(['u1', 'u2']));
    expect(p.topics).toEqual(expect.arrayContaining(['t1', 't2']));
  });

  it('deduplicates resources_shown and topics across appends', () => {
    appendSession({ project_slug: 'a', resources_shown: ['u1'], topics: ['t1'] });
    appendSession({ project_slug: 'a', resources_shown: ['u1', 'u2'], topics: ['t1', 't2'] });
    const p = JSON.parse(fs.readFileSync(path.join(home, 'developer-profile.json'), 'utf-8'));
    expect(p.resources_shown.sort()).toEqual(['u1', 'u2']);
    expect(p.topics.sort()).toEqual(['t1', 't2']);
  });

  it('exits non-zero on invalid JSON input', () => {
    const r = spawnSync(BIN, ['--append-session'], {
      encoding: 'utf-8',
      env: { ...process.env, GSTACK_HOME: home },
      input: 'not json {{{',
    });
    expect(r.status).not.toBe(0);
    expect(r.stderr).toMatch(/invalid JSON/);
  });
});

describe('gstack-developer-profile error handling', () => {
  it('exits non-zero on unknown subcommand', () => {
    const home = mkHome();
    try {
      const r = run(['--bogus'], { env: { GSTACK_HOME: home } });
      expect(r.status).not.toBe(0);
      expect(r.stderr).toMatch(/unknown subcommand/);
    } finally {
      fs.rmSync(home, { recursive: true, force: true });
    }
  });
});
