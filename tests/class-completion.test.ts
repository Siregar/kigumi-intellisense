import { describe, it, expect } from 'vitest';
import { Position, CompletionItemKind } from 'vscode';
import { ClassCompletionProvider } from '../src/providers/class-completion';
import { createMockDocument, itemRange } from './helpers/mock-document';
import { createTestCatalog } from './helpers/test-catalog';

const catalog = createTestCatalog();
const provider = new ClassCompletionProvider(catalog, ['class', 'className']);

describe('ClassCompletionProvider', () => {
  describe('prefix guard boundary values', () => {
    it('empty prefix returns all utilities', () => {
      const doc = createMockDocument(['<div class="">']);
      const items = provider.provideCompletionItems(doc, new Position(0, 12));
      expect(items).not.toBeNull();
      expect(items).toHaveLength(3);
    });

    it('"w" passes guard (wa- starts with w)', () => {
      const doc = createMockDocument(['<div class="w">']);
      const items = provider.provideCompletionItems(doc, new Position(0, 13));
      expect(items).not.toBeNull();
    });

    it('"wa" passes guard', () => {
      const doc = createMockDocument(['<div class="wa">']);
      const items = provider.provideCompletionItems(doc, new Position(0, 14));
      expect(items).not.toBeNull();
    });

    it('"wa-" passes guard', () => {
      const doc = createMockDocument(['<div class="wa-">']);
      const items = provider.provideCompletionItems(doc, new Position(0, 15));
      expect(items).not.toBeNull();
    });

    it('"wa-f" passes guard and filters', () => {
      const doc = createMockDocument(['<div class="wa-f">']);
      const items = provider.provideCompletionItems(doc, new Position(0, 16));
      expect(items).not.toBeNull();
      expect(items!.length).toBe(1);
      expect(items![0].label).toBe('wa-flex');
    });

    it('"b" returns null (no prefix match)', () => {
      const doc = createMockDocument(['<div class="b">']);
      const items = provider.provideCompletionItems(doc, new Position(0, 13));
      expect(items).toBeNull();
    });

    it('"flex" returns null (no prefix match)', () => {
      const doc = createMockDocument(['<div class="flex">']);
      const items = provider.provideCompletionItems(doc, new Position(0, 16));
      expect(items).toBeNull();
    });
  });

  describe('CompletionItem properties', () => {
    it('uses Constant kind', () => {
      const doc = createMockDocument(['<div class="wa-">']);
      const items = provider.provideCompletionItems(doc, new Position(0, 15));
      expect(items![0].kind).toBe(CompletionItemKind.Constant);
    });

    it('formats detail as "wa: category"', () => {
      const doc = createMockDocument(['<div class="wa-">']);
      const items = provider.provideCompletionItems(doc, new Position(0, 15));
      const flex = items!.find((i) => i.label === 'wa-flex');
      expect(flex!.detail).toBe('wa: layout');
    });

    it('sets sortText with category padding', () => {
      const doc = createMockDocument(['<div class="wa-">']);
      const items = provider.provideCompletionItems(doc, new Position(0, 15));
      expect(items![0].sortText).toBeDefined();
      expect(items![0].sortText!.startsWith(' ')).toBe(true);
    });

    it('sets filterText to entry name', () => {
      const doc = createMockDocument(['<div class="wa-">']);
      const items = provider.provideCompletionItems(doc, new Position(0, 15));
      expect(items![0].filterText).toBe(items![0].label);
    });

    it('preselects first item only', () => {
      const doc = createMockDocument(['<div class="wa-">']);
      const items = provider.provideCompletionItems(doc, new Position(0, 15));
      expect(items![0].preselect).toBe(true);
      expect(items![1].preselect).toBeUndefined();
    });
  });

  describe('range behavior', () => {
    it('sets range when prefix is non-empty', () => {
      const doc = createMockDocument(['<div class="wa-f">']);
      const items = provider.provideCompletionItems(doc, new Position(0, 16));
      expect(items![0].range).toBeDefined();
      const range = itemRange(items![0]);
      expect(range.start.character).toBe(12);
      expect(range.end.character).toBe(16);
    });

    it('does not set range when prefix is empty', () => {
      const doc = createMockDocument(['<div class="">']);
      const items = provider.provideCompletionItems(doc, new Position(0, 12));
      expect(items![0].range).toBeUndefined();
    });
  });

  describe('no context', () => {
    it('returns null when not in class attribute', () => {
      const doc = createMockDocument(['<div id="wa-flex">']);
      expect(provider.provideCompletionItems(doc, new Position(0, 16))).toBeNull();
    });
  });
});
