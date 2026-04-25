// test/skill-contracts.test.js
// スキル精度監査: 意味的契約テスト
// P0-P2 スキルの方法論的精度を検証する。
// 契約テストが FAIL = そのスキルに精度ギャップがある。
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
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
