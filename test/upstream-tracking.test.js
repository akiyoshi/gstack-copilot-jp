// test/upstream-tracking.test.js
// upstream-tracking.json の整合性テスト
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..');
const SKILLS_DIR = join(ROOT, '.github', 'skills');
const TRACKING_PATH = join(ROOT, 'upstream-tracking.json');

const VALID_STATUSES = ['unaudited', 'same', 'adapted', 'precision-gap', 'diverged', 'excluded'];

describe('upstream-tracking.json structure', () => {
  it('exists and is valid JSON', () => {
    expect(existsSync(TRACKING_PATH)).toBe(true);
    const content = readFileSync(TRACKING_PATH, 'utf-8');
    expect(() => JSON.parse(content)).not.toThrow();
  });

  it('has required top-level fields', () => {
    const tracking = JSON.parse(readFileSync(TRACKING_PATH, 'utf-8'));
    expect(tracking).toHaveProperty('upstream_version');
    expect(tracking).toHaveProperty('skills');
    expect(typeof tracking.skills).toBe('object');
  });

  it('all skill entries have valid status', () => {
    const tracking = JSON.parse(readFileSync(TRACKING_PATH, 'utf-8'));
    for (const [name, entry] of Object.entries(tracking.skills)) {
      expect(VALID_STATUSES, `${name}: invalid status "${entry.status}"`).toContain(entry.status);
    }
  });
});

describe('upstream-tracking.json ↔ skills/ consistency', () => {
  const tracking = JSON.parse(readFileSync(TRACKING_PATH, 'utf-8'));
  const skillDirs = readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  it('all skill directories have a tracking entry', () => {
    const missing = skillDirs.filter(s => !tracking.skills[s]);
    expect(missing, `Missing tracking entries: ${missing.join(', ')}`).toEqual([]);
  });

  it('all tracking entries have a corresponding skill directory', () => {
    const orphaned = Object.keys(tracking.skills).filter(s => !skillDirs.includes(s));
    expect(orphaned, `Orphaned tracking entries: ${orphaned.join(', ')}`).toEqual([]);
  });
});

describe('upstream-tracking.json state integrity', () => {
  const tracking = JSON.parse(readFileSync(TRACKING_PATH, 'utf-8'));

  it('status=adapted entries have non-empty reason', () => {
    for (const [name, entry] of Object.entries(tracking.skills)) {
      if (entry.status === 'adapted') {
        expect(entry.reason, `${name}: adapted but no reason`).toBeTruthy();
      }
    }
  });

  it('status=precision-gap entries have non-empty reason', () => {
    for (const [name, entry] of Object.entries(tracking.skills)) {
      if (entry.status === 'precision-gap') {
        expect(entry.reason, `${name}: precision-gap but no reason`).toBeTruthy();
      }
    }
  });

  it('status=diverged entries have upstream=null', () => {
    for (const [name, entry] of Object.entries(tracking.skills)) {
      if (entry.status === 'diverged') {
        expect(entry.upstream, `${name}: diverged but upstream is set`).toBeNull();
      }
    }
  });

  it('non-diverged entries have upstream path', () => {
    for (const [name, entry] of Object.entries(tracking.skills)) {
      if (entry.status !== 'diverged' && entry.status !== 'excluded') {
        expect(entry.upstream, `${name}: status=${entry.status} but no upstream path`).toBeTruthy();
      }
    }
  });

  it('no skill claims "same" without passing contract tests', () => {
    // "same" は契約テスト通過後のみ許可。現時点では same は 0 のはず
    const sameSkills = Object.entries(tracking.skills)
      .filter(([, e]) => e.status === 'same')
      .map(([name]) => name);
    // same を主張するスキルがあれば、契約テストも存在するはず
    // 今回のスプリントではまだ same は 0
    if (sameSkills.length > 0) {
      // 将来: ここで契約テストの存在を検証する
      expect(sameSkills).toEqual([]);
    }
  });
});
