// test/developer-profile-shim.test.js
// .github/skills/bin/gstack-builder-profile が legacy shim として
// gstack-developer-profile --read に正しく委譲することを検証。
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const SHIM = path.join(ROOT, '.github', 'skills', 'bin', 'gstack-builder-profile');
const FIXTURES = path.join(ROOT, 'test', 'fixtures');

describe('gstack-builder-profile (legacy shim)', () => {
  let home;
  beforeEach(() => {
    home = fs.mkdtempSync(path.join(os.tmpdir(), 'gstack-shim-test-'));
  });
  afterEach(() => { fs.rmSync(home, { recursive: true, force: true }); });

  it('emits KEY: VALUE format (delegated to --read)', () => {
    const r = spawnSync(SHIM, [], {
      encoding: 'utf-8',
      env: { ...process.env, GSTACK_HOME: home },
    });
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/^SESSION_COUNT: /m);
    expect(r.stdout).toMatch(/^TIER: /m);
    expect(r.stdout).toMatch(/^NUDGE_ELIGIBLE: /m);
  });

  it('respects GSTACK_HOME for isolation', () => {
    fs.copyFileSync(
      path.join(FIXTURES, 'builder-profile-legacy.jsonl'),
      path.join(home, 'builder-profile.jsonl')
    );
    const r = spawnSync(SHIM, [], {
      encoding: 'utf-8',
      env: { ...process.env, GSTACK_HOME: home },
    });
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/SESSION_COUNT: 3/);
    // Auto-migration should have occurred
    expect(fs.existsSync(path.join(home, 'developer-profile.json'))).toBe(true);
  });
});
