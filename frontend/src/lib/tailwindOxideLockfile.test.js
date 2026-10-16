import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cwd } from 'node:process';
import { describe, expect, it } from 'vitest';

const lockfile = JSON.parse(
  readFileSync(resolve(cwd(), '../package-lock.json'), 'utf8'),
);
const oxide = lockfile.packages['frontend/node_modules/@tailwindcss/oxide'];

describe('Tailwind Oxide platform lockfile entries', () => {
  it('locks every optional platform package declared by Oxide at its expected version', () => {
    const optionalDependencies = Object.entries(oxide.optionalDependencies ?? {});

    expect(optionalDependencies.length).toBeGreaterThan(0);

    for (const [packageName, expectedVersion] of optionalDependencies) {
      const entry = lockfile.packages[`frontend/node_modules/${packageName}`];

      expect(entry, `${packageName} should have a lockfile entry`).toBeDefined();
      expect(entry.version, `${packageName} should match Oxide's expected version`).toBe(
        expectedVersion,
      );
      expect(entry.optional, `${packageName} should remain optional`).toBe(true);
      expect(entry.resolved, `${packageName} should have a registry tarball URL`).toMatch(
        /^https:\/\/registry\.npmjs\.org\/@tailwindcss\/oxide-/,
      );
      expect(entry.integrity, `${packageName} should have registry integrity`).toMatch(/^sha512-/);
    }
  });

  it('keeps the Ubuntu x64 glibc native binding installable by the CI runner', () => {
    const packageName = '@tailwindcss/oxide-linux-x64-gnu';
    const entry = lockfile.packages[`frontend/node_modules/${packageName}`];

    expect(oxide.optionalDependencies[packageName]).toBe(oxide.version);
    expect(entry).toMatchObject({
      version: oxide.version,
      optional: true,
      os: ['linux'],
      cpu: ['x64'],
      libc: ['glibc'],
    });
    expect(entry.integrity).toMatch(/^sha512-/);
  });
});
