// test/skill-contracts.test.js
// スキル精度監査: 意味的契約テスト
// P0-P2 スキルの方法論的精度を検証する。
// 契約テストが FAIL = そのスキルに精度ギャップがある。
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..');
const SKILLS_DIR = join(ROOT, '.github', 'skills');

// --- ヘルパー ---

/**
 * Markdown を見出しレベルでセクション分割する。
 * コードブロック内の行は見出しとして扱わない。
 * 返り値: { heading: string, level: number, content: string, lineCount: number, listItems: number }[]
 */
function parseSections(md) {
  const lines = md.split('\n');
  const sections = [];
  let current = null;
  let inCodeBlock = false;

  for (const line of lines) {
    // コードフェンスの開始/終了を追跡
    if (line.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      if (current) current.lines.push(line);
      continue;
    }

    const match = !inCodeBlock && line.match(/^(#{1,6})\s+(.+)/);
    if (match) {
      if (current) {
        current.lineCount = current.lines.length;
        current.listItems = current.lines.filter(l => /^\s*[-*]\s/.test(l)).length;
        current.content = current.lines.join('\n');
        delete current.lines;
        sections.push(current);
      }
      current = {
        heading: match[2].trim(),
        level: match[1].length,
        lines: [],
        lineCount: 0,
        listItems: 0,
        content: ''
      };
    } else if (current) {
      current.lines.push(line);
    }
  }

  if (current) {
    current.lineCount = current.lines.length;
    current.listItems = current.lines.filter(l => /^\s*[-*]\s/.test(l)).length;
    current.content = current.lines.join('\n');
    delete current.lines;
    sections.push(current);
  }

  return sections;
}

function readSkill(name) {
  return readFileSync(join(SKILLS_DIR, name, 'SKILL.md'), 'utf-8');
}

function findSection(sections, pattern) {
  return sections.find(s => s.heading.match(pattern));
}

function findSections(sections, pattern) {
  return sections.filter(s => s.heading.match(pattern));
}

// --- P0: /cso 契約 ---

describe('/cso semantic contract', () => {
  const md = readSkill('cso');
  const sections = parseSections(md);

  it('フェーズ1-14の見出しが全て存在する', () => {
    for (let i = 1; i <= 14; i++) {
      const pattern = new RegExp(`(フェーズ|Phase)\\s*${i}[:\\s：]`, 'i');
      const found = sections.some(s => pattern.test(s.heading));
      expect(found, `フェーズ/Phase ${i}の見出しが見つからない`).toBe(true);
    }
  });

  it('各フェーズに具体的なチェック項目がある', () => {
    for (let i = 1; i <= 14; i++) {
      const pattern = new RegExp(`(フェーズ|Phase)\\s*${i}[:\\s：]`, 'i');
      const section = sections.find(s => pattern.test(s.heading));
      expect(section, `フェーズ/Phase ${i}が見つからない`).toBeTruthy();
      const contentLines = section.content.split('\n').filter(l => l.trim().length > 0).length;
      expect(contentLines, `フェーズ/Phase ${i}の内容が${contentLines}行しかない（1行以上必要）`).toBeGreaterThanOrEqual(1);
    }
  });

  it('エクスプロイトシナリオの構造が存在する', () => {
    // "エクスプロイト" or "攻撃シナリオ" or "exploit" の概念が記述されている
    expect(md).toMatch(/エクスプロイト|攻撃シナリオ|exploit.*scenario/i);
  });

  it('daily/comprehensive の閾値が明記されている', () => {
    expect(md).toMatch(/daily/i);
    expect(md).toMatch(/comprehensive/i);
    // 信頼度の数値閾値が存在する
    expect(md).toMatch(/[0-9]+\/10/);
  });

  it('指摘テンプレートに必須フィールドがある', () => {
    // File:Line, Severity, Confidence, Remediation の概念
    expect(md).toMatch(/ファイル|File|file.*line/i);
    expect(md).toMatch(/深刻度|severity/i);
    expect(md).toMatch(/信頼度|confidence/i);
    expect(md).toMatch(/修正|remediation|fix/i);
  });
});

// --- P1: /review 契約 ---

describe('/review semantic contract', () => {
  const md = readSkill('gstack-review');
  const sections = parseSections(md);

  it('スペシャリスト dispatch のトリガー条件が定義されている', () => {
    // "dispatch" or "起動" or "サブエージェント" のトリガー条件
    expect(md).toMatch(/dispatch|起動条件|サブエージェント.*条件/);
  });

  it('code-review チェックリストが存在する', () => {
    // code-review に関するチェックリスト（箇条書き or 表）
    const hasChecklist = md.match(/code.?review/i) &&
      (md.match(/チェックリスト|checklist/i) || md.match(/- \[[ x]\]/));
    expect(hasChecklist, 'code-review チェックリストが見つからない').toBeTruthy();
  });

  it('architecture チェックリストが存在する', () => {
    expect(md).toMatch(/architect.*チェック|アーキテクチャ.*チェック|architecture.*check|architect/i);
  });

  it('security チェックリストが存在する', () => {
    expect(md).toMatch(/security.*チェック|セキュリティ.*チェック|security.*check|security/i);
  });

  it('スコープドリフト検出の手順がある', () => {
    expect(md).toMatch(/スコープ.*ドリフト|scope.*drift/i);
  });

  it('信頼度キャリブレーションテーブルがある', () => {
    // 信頼度の段階的定義（5段階: 1-2, 3-4, 5-6, 7-8, 9-10 等）
    const confidenceLevels = md.match(/[0-9][-–][0-9]0?\s*[|｜]/g) || [];
    expect(confidenceLevels.length, `信頼度レベルが${confidenceLevels.length}個（4段階以上必要）`).toBeGreaterThanOrEqual(4);
  });

  it('Outside Voice の dispatch 手順が具体的', () => {
    expect(md).toMatch(/Outside Voice|outside voice|Second Opinion|cross.?model/i);
    expect(md).toMatch(/code-review|rubber-duck|codex|adversarial/i);
    expect(md).toMatch(/task|agent|exec/i);
  });
});

// --- P1: /ship 契約 ---

describe('/ship semantic contract', () => {
  const md = readSkill('ship');
  const sections = parseSections(md);

  it('テスト失敗時のトリアージがある', () => {
    // ブランチ起因 vs 既存の区別
    expect(md).toMatch(/トリアージ|triage|ブランチ.*既存|既存.*失敗/i);
  });

  it('プラン完了監査がある', () => {
    // DESIGN.md との差分チェック
    expect(md).toMatch(/プラン.*完了.*監査|plan.*completion.*audit|DESIGN\.md.*差分|実装漏れ/i);
  });

  it('bisectable コミットの粒度ルールが具体的', () => {
    expect(md).toMatch(/bisect/i);
    // 具体的なルール（論理単位、1コミット1変更 等）
    const bisectSection = sections.find(s => /bisect|コミット.*分割|分割.*コミット/i.test(s.heading + s.content));
    expect(bisectSection, 'bisect に関するセクションが見つからない').toBeTruthy();
  });

  it('VERSION/package.json ドリフト検出がある', () => {
    expect(md).toMatch(/VERSION/);
    expect(md).toMatch(/package\.json/);
    expect(md).toMatch(/ドリフト|drift|同期|sync/i);
  });

  it('Outside Voice レビューの dispatch 条件がある', () => {
    expect(md).toMatch(/Outside Voice/);
  });
});

// --- P2: /autoplan 契約 ---

describe('/autoplan semantic contract', () => {
  const md = readSkill('autoplan');
  const sections = parseSections(md);

  it('6つの意思決定原則が定義されている', () => {
    // 6原則が列挙されている（日本語 or 英語）
    expect(md).toMatch(/完全性|completeness|complete/i);
    expect(md).toMatch(/既存.*方針|ユーザー.*方針|boil.*lake/i);
    expect(md).toMatch(/具体性|pragmatic|concrete/i);
    expect(md).toMatch(/段階的|DRY|duplicate/i);
    expect(md).toMatch(/テスト|explicit|obvious/i);
    expect(md).toMatch(/既存パターン|bias.*action|action/i);
  });

  it('判断監査証跡のフォーマットが定義されている', () => {
    expect(md).toMatch(/監査.*証跡|audit.*trail|判断.*記録|自動.*判断.*記録|decision.*log|decision.*classification/i);
  });

  it('最終承認ゲートで味覚判断と方針チャレンジが分離されている', () => {
    expect(md).toMatch(/味覚判断|taste/i);
    expect(md).toMatch(/方針チャレンジ|policy.*challenge|direction.*challenge|user.*challenge/i);
  });

  it('再実行時の差分表示仕様がある', () => {
    expect(md).toMatch(/再実行|re-?run|やり直し/i);
  });
});

// --- v1.0.3: VS Code Copilot Chat / Codex 認識のための契約 ---
//
// `/gstack-review` がスキルとして認識されない問題を契機に、ホスト側で skill が
// 黙ってスキップされるパターンを契約化する。フロントマター契約を満たさないスキルは
// fail-fast でテスト落ちさせ、リグレッションを防ぐ。


describe('全スキル frontmatter 契約 (v1.0.3+)', () => {
  const skillDirs = readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== 'bin')
    .map(d => d.name);

  // 既知のホスト互換ツール ID。upstream Claude Code + VS Code Copilot Chat + Codex で
  // 共通して認識される値のスーパーセット。新ツールを追加する際は upstream の動向確認が必要。
  const KNOWN_TOOLS = new Set([
    'ask_user', 'bash', 'create', 'edit', 'glob', 'grep',
    'task', 'view', 'web_search',
  ]);

  // VS Code Copilot Chat の description フィールド長の安全圏。
  // Codex (1024) と VS Code (実測上は更に小さい可能性あり) の両方を満たすため
  // 1024 を上限とする。実測でより厳しい上限が判明した場合はここを更新。
  const DESCRIPTION_MAX = 1024;

  for (const skill of skillDirs) {
    describe(`${skill}`, () => {
      const content = readSkill(skill).replace(/\r\n/g, '\n');
      const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);

      it('フロントマターブロックがファイル先頭にある', () => {
        expect(fmMatch, `${skill}: SKILL.md がフロントマターで始まっていない`).toBeTruthy();
      });

      const fm = fmMatch ? fmMatch[1] : '';

      it('name フィールドがディレクトリ名と一致する (silent-skip 防止)', () => {
        // 公式仕様: name 不一致は silently skip される。
        const m = fm.match(/^name:\s*([a-z][a-z0-9-]*)\s*$/m);
        expect(m, `${skill}: name フィールドが見つからない or kebab-case でない`).toBeTruthy();
        if (m) {
          expect(m[1], `${skill}: name="${m[1]}" がディレクトリ名と不一致`).toBe(skill);
        }
      });

      it('description が定義されており 1024 文字以内 (Codex/VS Code 上限)', () => {
        // description は 1 行 quoted または block scalar。両形式に対応。
        // bare fallback は YAML block scalar indicator (`|` / `>`) を除外しないと
        // false-pass するため、negative lookahead でガードする。
        const quoted = fm.match(/^description:\s*"((?:[^"\\]|\\.)*)"\s*$/m);
        const bare = fm.match(/^description:\s*(?![|>])(.+)$/m);
        const desc = quoted ? quoted[1].replace(/\\"/g, '"') : (bare ? bare[1].trim() : '');
        expect(desc, `${skill}: description フィールドが空または block scalar (未対応)`).toBeTruthy();
        expect(desc.length, `${skill}: description が ${desc.length} 文字 (上限 ${DESCRIPTION_MAX})`)
          .toBeLessThanOrEqual(DESCRIPTION_MAX);
      });

      it('allowed-tools が既知ツール ID のみを含む', () => {
        // 未知のツール ID はホスト側で skill 全体を弾く可能性がある。
        const toolBlock = fm.match(/^allowed-tools:\s*\n((?:\s+-\s+\S+\s*\n?)+)/m);
        if (!toolBlock) return; // allowed-tools 自体が任意フィールド
        const tools = [...toolBlock[1].matchAll(/-\s+(\S+)/g)].map(m => m[1]);
        for (const tool of tools) {
          expect(KNOWN_TOOLS.has(tool), `${skill}: allowed-tools に未知の値 "${tool}"`)
            .toBe(true);
        }
      });
    });
  }
});

// --- v1.2: Outside Voice 言語契約 ---
//
// 設計判断: gstack-copilot-jp は Copilot のマルチモデル機能（task tool / runSubagent
// + 異なるモデルファミリー指定）で Outside Voice を実装する。Codex CLI は呼ばない。
// upstream sync で Codex 表記が再混入しないよう、SKILL.md / copilot-instructions.md に
// `Codex` 文字列が混ざらないことを契約として固定する。
//
// 互換シム名は許容: `gstack-codex-probe` ファイルパス、および `_gstack_codex_*` 関数名は
// 本家 gstack 互換 API としてシム実装で保持される。これらの文字列は Codex CLI への
// 依存ではなく、シムの公開関数面である（v1.4 で `gstack-outside-voice` rename 予定）。
//
// allowlist:
//   - pair-agent: 外部エージェント連携機能で Codex CLI を例示する必要がある
//   - retro: analytics 表示で過去ユーザーの Codex 使用パターンを参照する
//   - cso, investigate, qa, qa-only: Codex 言及が文脈上意味を持つ
//   - land-and-deploy: 過渡的な保護（v1.2 の刷新対象だが慎重に処理）

describe('Outside Voice 言語契約 (v1.2+)', () => {
  // codex 文字列のうち、シム互換 API への参照は除外する。
  // 残った素の `Codex` だけが「Codex CLI への依存」として検出対象になる。
  function stripShimReferences(content) {
    return content
      // `gstack-codex-probe` (互換シムのファイル名)
      .replace(/gstack-codex-probe/g, '')
      // `_gstack_codex_*` (互換関数: auth_probe / version_check / log_event / log_hang / available)
      .replace(/_gstack_codex_[a-z_]+/g, '');
  }

  const ALLOWLIST = new Set([
    'pair-agent',
    'retro',
    'cso',
    'investigate',
    'qa',
    'qa-only',
    'land-and-deploy',
  ]);

  const skillDirs = readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== 'bin')
    .map(d => d.name);

  for (const skill of skillDirs) {
    if (ALLOWLIST.has(skill)) continue;
    it(`${skill}/SKILL.md に Codex 文字列が混入しない`, () => {
      const content = stripShimReferences(readSkill(skill));
      const matches = content.match(/\bcodex\b/gi);
      const samples = matches ? [...new Set(matches.slice(0, 3))] : [];
      expect(matches, `${skill}: Codex 残存 (${matches?.length} 箇所): ${samples.join(', ')}`)
        .toBeNull();
    });
  }

  it('autoplan/SKILL.md に command -v codex ガードが残っていない', () => {
    const content = readSkill('autoplan');
    expect(content, 'autoplan: command -v codex ガードが残存している')
      .not.toMatch(/command\s+-v\s+codex/);
  });

  it('copilot-instructions.md に Codex 文字列が混入しない', () => {
    const routingPath = join(ROOT, '.github', 'copilot-instructions.md');
    const content = stripShimReferences(readFileSync(routingPath, 'utf-8'));
    expect(content.match(/\bcodex\b/i),
      'copilot-instructions.md: Codex 残存').toBeNull();
  });

  it('autoplan/SKILL.md は Outside Voice 用のシムを source している', () => {
    // gstack-codex-probe (互換名) または gstack-outside-voice (新名) のいずれか。
    // Phase 0.5 で source されることでシム経由のマルチモデル Outside Voice が有効化される。
    const content = readSkill('autoplan');
    expect(content,
      'autoplan: Outside Voice シムが source されていない')
      .toMatch(/source\s+\.github\/skills\/bin\/gstack-(codex-probe|outside-voice)/);
  });
});
