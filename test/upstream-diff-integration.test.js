// test/upstream-diff-integration.test.js
//
// bin/upstream-diff.sh の exit code 契約テスト (v1.0.3)
//
// /gstack-review F5 で指摘: --sync の新ロジック（dirty tree guard, --interactive,
// process substitution, exit 2 on partial failure）に対するテストが無い。
// real-PTY harness は v1.2 (Phase C) 送りだが、最低限 exit code 契約を vitest から
// child_process 経由で検証する。bash + python3 が必要。
import { describe, it, expect } from 'vitest';
import { execFileSync, spawnSync } from 'child_process';
import { existsSync, statSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..');
const SCRIPT_REL = 'bin/upstream-diff.sh';
const SCRIPT_ABS = join(ROOT, 'bin', 'upstream-diff.sh');

// bash コマンドが利用可能か確認。Windows + Git Bash / WSL / Linux / macOS で動作。
// WSL bash on Windows は \\ パスを正しく扱えないため、相対パス + cwd で渡す。
let BASH_AVAILABLE = false;
let SKIP_REASON = null;
try {
  execFileSync('bash', ['--version'], { encoding: 'utf-8', stdio: 'pipe' });
  // sanity check: bash がスクリプトを見つけられるか（WSL マウント issue 検出）
  const probe = spawnSync('bash', ['-c', `test -f "${SCRIPT_REL}"`], {
    cwd: ROOT,
    encoding: 'utf-8',
  });
  if (probe.status !== 0) {
    SKIP_REASON = 'bash exists but cannot resolve script via cwd (likely WSL path mount issue)';
  } else {
    BASH_AVAILABLE = true;
  }
} catch {
  SKIP_REASON = 'bash not available in PATH';
}

const describeIfBash = BASH_AVAILABLE ? describe : describe.skip;

// SCRIPT_ABS を bash に渡せる形に正規化（Git Bash は forward slash + ドライブ接頭辞 OK、
// WSL は /mnt/<drive>/... が必要だが上の probe で WSL 不一致は skip 済み）
function runScript(args, opts = {}) {
  return spawnSync('bash', [SCRIPT_REL, ...args], {
    cwd: ROOT,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...opts,
  });
}

describeIfBash('upstream-diff.sh exit code contract', () => {
  it('スクリプトが存在し、bash 構文が valid', () => {
    expect(existsSync(SCRIPT_ABS)).toBe(true);
    const result = spawnSync('bash', ['-n', SCRIPT_REL], { cwd: ROOT, encoding: 'utf-8' });
    expect(result.status, `bash -n stderr: ${result.stderr}`).toBe(0);
  });

  it('--help は exit 0 で usage を出力する', () => {
    const r = runScript(['--help']);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('upstream');
    expect(r.stdout).toContain('--sync');
    expect(r.stdout).toContain('--interactive');
  });

  it('-h も --help と同じ動作', () => {
    const r = runScript(['-h']);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('upstream');
  });

  it('不明な引数は exit 1 + stderr メッセージ', () => {
    const r = runScript(['--definitely-not-a-flag']);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/不明|unknown|ERROR/i);
  });

  it('引数の順序に依存しない (--help が最後でも先頭でも有効)', () => {
    // for ループのパース動作を検証。--help は順序に関わらず exit 0 を返すべき。
    const r1 = runScript(['--sync', '--interactive', '--help']);
    const r2 = runScript(['--interactive', '--sync', '--help']);
    expect(r1.status, `r1.stderr: ${r1.stderr}`).toBe(0);
    expect(r2.status, `r2.stderr: ${r2.stderr}`).toBe(0);
    expect(r1.stdout).toContain('upstream');
    expect(r2.stdout).toContain('upstream');
  });
});
