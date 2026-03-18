import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Catalog } from '../src/catalog';
import { createTestCatalog } from './helpers/test-catalog';

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return { ...actual, existsSync: vi.fn(), readFileSync: vi.fn() };
});

import { existsSync, readFileSync } from 'node:fs';
const mockExistsSync = vi.mocked(existsSync);
const mockReadFileSync = vi.mocked(readFileSync);

describe('Catalog', () => {
  const catalog = createTestCatalog();

  describe('getUtility', () => {
    it('returns entry for known utility', () => {
      const entry = catalog.getUtility('wa-flex');
      expect(entry).toBeDefined();
      expect(entry!.name).toBe('wa-flex');
      expect(entry!.category).toBe('layout');
    });

    it('returns undefined for unknown utility', () => {
      expect(catalog.getUtility('nope')).toBeUndefined();
    });
  });

  describe('getToken', () => {
    it('returns entry for known token', () => {
      const entry = catalog.getToken('--wa-color-blue');
      expect(entry).toBeDefined();
      expect(entry!.name).toBe('--wa-color-blue');
      expect(entry!.value).toBe('#3b82f6');
    });

    it('returns undefined for unknown token', () => {
      expect(catalog.getToken('nope')).toBeUndefined();
    });
  });

  describe('filterUtilities', () => {
    it('returns all utilities for empty prefix', () => {
      expect(catalog.filterUtilities('')).toHaveLength(3);
    });

    it('filters by prefix', () => {
      const results = catalog.filterUtilities('wa-gap');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('wa-gap-m');
    });

    it('returns empty for no match', () => {
      expect(catalog.filterUtilities('wa-zzz')).toHaveLength(0);
    });
  });

  describe('filterTokens', () => {
    it('returns all tokens for empty prefix', () => {
      expect(catalog.filterTokens('')).toHaveLength(3);
    });

    it('filters by prefix', () => {
      const results = catalog.filterTokens('--wa-color');
      expect(results).toHaveLength(2);
    });

    it('returns empty for no match', () => {
      expect(catalog.filterTokens('--wa-zzz')).toHaveLength(0);
    });
  });

  describe('Catalog.load', () => {
    beforeEach(() => {
      mockExistsSync.mockReset();
      mockReadFileSync.mockReset();
    });

    it('loads from valid data directory', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockImplementation((filePath: unknown) => {
        const p = String(filePath);
        if (p.includes('wa-utilities.json')) {
          return JSON.stringify([{ name: 'wa-test', category: 'test', declarations: '', description: '', tokens: [] }]);
        }
        if (p.includes('wa-tokens.json')) {
          return JSON.stringify([{ name: '--wa-test', category: 'test', value: '1px', description: '', group: 'test' }]);
        }
        return '[]';
      });

      const loaded = Catalog.load('/fake/ext');
      expect(loaded.utilities).toHaveLength(1);
      expect(loaded.tokens).toHaveLength(1);
    });

    it('returns empty catalog when files are missing', () => {
      mockExistsSync.mockReturnValue(false);

      const loaded = Catalog.load('/fake/ext');
      expect(loaded.utilities).toHaveLength(0);
      expect(loaded.tokens).toHaveLength(0);
    });
  });
});
