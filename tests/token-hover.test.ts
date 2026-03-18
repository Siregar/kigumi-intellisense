import { describe, it, expect } from 'vitest';
import { Position } from 'vscode';
import { TokenHoverProvider } from '../src/providers/token-hover';
import { createMockDocument, hoverMarkdown } from './helpers/mock-document';
import { createTestCatalog } from './helpers/test-catalog';

const catalog = createTestCatalog();
const provider = new TokenHoverProvider(catalog);

describe('TokenHoverProvider', () => {
  it('returns hover for known token', () => {
    const doc = createMockDocument(['color: var(--wa-color-blue);']);
    const hover = provider.provideHover(doc, new Position(0, 18));
    expect(hover).not.toBeNull();
    const md = hoverMarkdown(hover!);
    expect(md).toContain('**--wa-color-blue**');
    expect(md).toContain('color / base');
    expect(md).toContain('#3b82f6');
  });

  it('returns null for unknown token', () => {
    const doc = createMockDocument(['color: var(--wa-color-unknown);']);
    expect(provider.provideHover(doc, new Position(0, 18))).toBeNull();
  });

  it('returns null when cursor not on token', () => {
    const doc = createMockDocument(['color: blue;']);
    expect(provider.provideHover(doc, new Position(0, 8))).toBeNull();
  });

  it('omits description when entry has none', () => {
    const doc = createMockDocument(['color: var(--wa-color-red);']);
    const hover = provider.provideHover(doc, new Position(0, 18));
    expect(hover).not.toBeNull();
    const md = hoverMarkdown(hover!);
    expect(md).toContain('**--wa-color-red**');
    expect(md).toContain('#ef4444');
  });
});
