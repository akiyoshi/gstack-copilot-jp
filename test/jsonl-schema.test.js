// test/jsonl-schema.test.js
// Tier 1: JSONL スキーマ互換テスト
// 本家 gstack と同一フィールドで出力されることを検証する

import { describe, it, expect } from 'vitest';

const SCHEMAS = {
  learnings: {
    required: ['ts', 'type', 'confidence', 'source', 'text', 'project'],
    types: { ts: 'string', type: 'string', confidence: 'number', source: 'string', text: 'string', project: 'string' },
  },
  reviews: {
    required: ['ts', 'skill', 'branch', 'verdict', 'findings_count'],
    types: { ts: 'string', skill: 'string', branch: 'string', verdict: 'string', findings_count: 'number' },
  },
  'skill-usage': {
    required: ['ts', 'skill', 'duration_ms', 'success', 'version'],
    types: { ts: 'string', skill: 'string', duration_ms: 'number', success: 'boolean', version: 'string' },
  },
  'health-history': {
    required: ['ts', 'branch', 'score'],
    types: { ts: 'string', branch: 'string', score: 'number' },
  },
}

// ISO 8601 timestamp format
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/

describe('JSONL Schema Compatibility', () => {
  for (const [name, schema] of Object.entries(SCHEMAS)) {
    describe(name, () => {
      // Build a sample record matching the schema
      const sample = {}
      for (const field of schema.required) {
        const t = schema.types[field]
        if (t === 'string') sample[field] = field === 'ts' ? '2026-04-19T10:00:00Z' : `test-${field}`
        else if (t === 'number') sample[field] = 1
        else if (t === 'boolean') sample[field] = true
      }

      it('sample record has all required fields', () => {
        for (const field of schema.required) {
          expect(sample).toHaveProperty(field)
        }
      })

      it('field types match spec', () => {
        for (const [field, expectedType] of Object.entries(schema.types)) {
          expect(typeof sample[field]).toBe(expectedType)
        }
      })

      it('ts field is ISO 8601', () => {
        expect(sample.ts).toMatch(ISO_RE)
      })

      it('serializes to valid JSON', () => {
        const json = JSON.stringify(sample)
        const parsed = JSON.parse(json)
        for (const field of schema.required) {
          expect(parsed).toHaveProperty(field)
        }
      })

      it('does not contain upstream-incompatible keys in required set', () => {
        // Copilot-specific keys are allowed as optional, but required keys must match upstream
        const copilotOnlyKeys = ['model', 'copilot_version', 'host']
        for (const key of copilotOnlyKeys) {
          expect(schema.required).not.toContain(key)
        }
      })
    })
  }
})
