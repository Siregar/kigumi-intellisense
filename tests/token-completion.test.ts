import { describe, it, expect } from 'vitest';
import { Position, CompletionItemKind } from 'vscode';
import { TokenCompletionProvider } from '../src/providers/token-completion';
import { createMockDocument, itemRange } from './helpers/mock-document';
import { createTestCatalog } from './helpers/test-catalog';

const catalog = createTestCatalog();
const provider = new TokenCompletionProvider(catalog);

describe('TokenCompletionProvider', () => {
  describe('CompletionItemKind', () => {
    it('color tokens get Color kind', () => {
      const doc = createMockDocument(['color: var(--wa-color-);']);
      const items = provider.provideCompletionItems(doc, new Position(0, 21));
      expect(items).not.toBeNull();
      const blue = items!.find((i) => i.label === '--wa-color-blue');
      expect(blue!.kind).toBe(CompletionItemKind.Color);
    });

    it('non-color tokens get Variable kind', () => {
      const doc = createMockDocument(['gap: var(--wa-spacing-);']);
      const items = provider.provideCompletionItems(doc, new Position(0, 21));
      expect(items).not.toBeNull();
      const spacing = items!.find((i) => i.label === '--wa-spacing-m');
      expect(spacing!.kind).toBe(CompletionItemKind.Variable);
    });
  });

  describe('detail format', () => {
    it('shows "category - group"', () => {
      const doc = createMockDocument(['color: var(--wa-color-);']);
      const items = provider.provideCompletionItems(doc, new Position(0, 21));
      const blue = items!.find((i) => i.label === '--wa-color-blue');
      expect(blue!.detail).toBe('color - base');
    });
  });

  describe('range behavior', () => {
    it('replaces partial prefix', () => {
      const doc = createMockDocument(['color: var(--wa-color-bl);']);
      const items = provider.provideCompletionItems(doc, new Position(0, 24));
      expect(items![0].range).toBeDefined();
      const range = itemRange(items![0]);
      expect(range.start.character).toBe(11);
      expect(range.end.character).toBe(24);
    });
  });

  describe('no context', () => {
    it('returns null outside token context', () => {
      const doc = createMockDocument(['display: flex;']);
      expect(provider.provideCompletionItems(doc, new Position(0, 13))).toBeNull();
    });
  });
});
