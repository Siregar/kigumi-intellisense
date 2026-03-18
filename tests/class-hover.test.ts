import { describe, it, expect } from 'vitest';
import { Position } from 'vscode';
import { ClassHoverProvider } from '../src/providers/class-hover';
import { createMockDocument, hoverMarkdown } from './helpers/mock-document';
import { createTestCatalog } from './helpers/test-catalog';

const catalog = createTestCatalog();
const provider = new ClassHoverProvider(catalog, ['class', 'className']);

describe('ClassHoverProvider', () => {
  it('returns hover for known utility', () => {
    const doc = createMockDocument(['<div class="wa-flex">']);
    const hover = provider.provideHover(doc, new Position(0, 15));
    expect(hover).not.toBeNull();
    const md = hoverMarkdown(hover!);
    expect(md).toContain('**wa-flex**');
    expect(md).toContain('layout');
    expect(md).toContain('display: flex;');
  });

  it('returns null for unknown utility in class attr', () => {
    const doc = createMockDocument(['<div class="wa-unknown">']);
    expect(provider.provideHover(doc, new Position(0, 18))).toBeNull();
  });

  it('returns null when cursor not in class attribute', () => {
    const doc = createMockDocument(['<div id="wa-flex">']);
    expect(provider.provideHover(doc, new Position(0, 13))).toBeNull();
  });

  it('includes tokens in hover when present', () => {
    const doc = createMockDocument(['<div class="wa-gap-m">']);
    const hover = provider.provideHover(doc, new Position(0, 16));
    expect(hover).not.toBeNull();
    expect(hoverMarkdown(hover!)).toContain('--wa-spacing-m');
  });

  it('omits tokens line when entry has none', () => {
    const doc = createMockDocument(['<div class="wa-flex">']);
    const hover = provider.provideHover(doc, new Position(0, 15));
    expect(hoverMarkdown(hover!)).not.toContain('Tokens:');
  });

  it('omits description when entry has none', () => {
    const doc = createMockDocument(['<div class="wa-text-center">']);
    const hover = provider.provideHover(doc, new Position(0, 18));
    const md = hoverMarkdown(hover!);
    expect(md).toContain('**wa-text-center**');
    expect(md).toContain('text-align: center;');
  });
});
