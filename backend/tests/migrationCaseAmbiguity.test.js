import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  new URL('../prisma/migrations/20261002153000_sync_schema_drift/migration.sql', import.meta.url),
  'utf8',
);

describe('sync_schema_drift table-name lookups', () => {
  it('does not pick an arbitrary table when case-folded names are ambiguous', () => {
    const lookups = [
      ...migration.matchAll(
        /SET @t := \(SELECT TABLE_NAME FROM information_schema\.TABLES([\s\S]*?)\);/gi,
      ),
    ];

    expect(lookups.length).toBeGreaterThan(0);

    for (const [, lookup] of lookups) {
      expect(lookup).toContain('TABLE_SCHEMA = DATABASE()');
      expect(lookup).toMatch(/LOWER\(TABLE_NAME\)\s*=\s*LOWER\(/i);
      expect(lookup).not.toMatch(/\bLIMIT\b/i);
    }
  });
});
