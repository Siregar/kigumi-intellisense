import { describe, it, expect } from 'vitest';
import { Position } from 'vscode';
import {
  detectClassContext,
  detectClassAtCursor,
  detectTokenContext,
  detectTokenAtCursor,
} from '../src/providers/attribute-detector';
import { createMockDocument } from './helpers/mock-document';

const defaultAttrs = ['class', 'className'];

// ---------------------------------------------------------------------------
// detectClassContext
// ---------------------------------------------------------------------------
describe('detectClassContext', () => {
  describe('positive cases', () => {
    it('returns partial prefix mid-value', () => {
      const doc = createMockDocument(['<div class="wa-fl">']);
      //                               cursor at char 17 => after "wa-fl"
      expect(detectClassContext(doc, new Position(0, 17), defaultAttrs)).toBe('wa-fl');
    });

    it('returns prefix after space (second class)', () => {
      const doc = createMockDocument(['<div class="wa-flex wa-g">']);
      expect(detectClassContext(doc, new Position(0, 24), defaultAttrs)).toBe('wa-g');
    });

    it('returns empty string when cursor is right after opening quote', () => {
      const doc = createMockDocument(['<div className="">']);
      expect(detectClassContext(doc, new Position(0, 16), defaultAttrs)).toBe('');
    });

    it('detects JSX expression with single quotes', () => {
      const doc = createMockDocument(["<div className={'wa-fl'}>"]);
      expect(detectClassContext(doc, new Position(0, 22), defaultAttrs)).toBe('wa-fl');
    });

    it('detects JSX expression with template literal', () => {
      const doc = createMockDocument(['<div className={`wa-fl`}>']);
      expect(detectClassContext(doc, new Position(0, 22), defaultAttrs)).toBe('wa-fl');
    });

    it('detects multi-line class attribute with partial prefix', () => {
      const doc = createMockDocument([
        '<div className="',
        '  wa-fl',
      ]);
      expect(detectClassContext(doc, new Position(1, 7), defaultAttrs)).toBe('wa-fl');
    });

    it('supports custom classAttributes', () => {
      const doc = createMockDocument(['<div classList="wa-">']);
      expect(detectClassContext(doc, new Position(0, 19), ['classList'])).toBe('wa-');
    });
  });

  describe('false positives (must return null)', () => {
    it('rejects non-class attribute', () => {
      const doc = createMockDocument(['<div id="wa-flex">']);
      expect(detectClassContext(doc, new Position(0, 16), defaultAttrs)).toBeNull();
    });

    it('rejects wrong attribute when multiple present', () => {
      const doc = createMockDocument(['<div class="done" onclick="wa-fl">']);
      expect(detectClassContext(doc, new Position(0, 31), defaultAttrs)).toBeNull();
    });

    it('rejects cursor outside quotes', () => {
      const doc = createMockDocument(['<div class="done"  wa-fl>']);
      expect(detectClassContext(doc, new Position(0, 23), defaultAttrs)).toBeNull();
    });

    it('rejects multi-line beyond 5-line lookback', () => {
      const doc = createMockDocument([
        '<div className="',
        'line1',
        'line2',
        'line3',
        'line4',
        'line5',
        'line6',
        '  wa-fl',
      ]);
      expect(detectClassContext(doc, new Position(7, 7), defaultAttrs)).toBeNull();
    });

    it('rejects plain text with no attribute', () => {
      const doc = createMockDocument(['wa-flex is cool']);
      expect(detectClassContext(doc, new Position(0, 7), defaultAttrs)).toBeNull();
    });

    it('rejects empty line', () => {
      const doc = createMockDocument(['']);
      expect(detectClassContext(doc, new Position(0, 0), defaultAttrs)).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// detectClassAtCursor
// ---------------------------------------------------------------------------
describe('detectClassAtCursor', () => {
  describe('positive cases', () => {
    it('detects wa- class under cursor', () => {
      const doc = createMockDocument(['<div class="wa-flex">']);
      const result = detectClassAtCursor(doc, new Position(0, 15), defaultAttrs);
      expect(result).not.toBeNull();
      expect(result!.name).toBe('wa-flex');
    });

    it('detects second class in multi-class value', () => {
      const doc = createMockDocument(['<div class="wa-flex wa-gap-m">']);
      const result = detectClassAtCursor(doc, new Position(0, 24), defaultAttrs);
      expect(result).not.toBeNull();
      expect(result!.name).toBe('wa-gap-m');
    });

    it('returns correct range', () => {
      const doc = createMockDocument(['<div class="wa-flex">']);
      const result = detectClassAtCursor(doc, new Position(0, 15), defaultAttrs);
      expect(result!.range.start.character).toBe(12);
      expect(result!.range.end.character).toBe(19);
    });
  });

  describe('false positives (must return null)', () => {
    it('rejects non-wa- class name', () => {
      const doc = createMockDocument(['<div class="my-custom-class">']);
      expect(detectClassAtCursor(doc, new Position(0, 18), defaultAttrs)).toBeNull();
    });

    it('rejects wa- in wrong attribute', () => {
      const doc = createMockDocument(['<div id="wa-flex">']);
      expect(detectClassAtCursor(doc, new Position(0, 13), defaultAttrs)).toBeNull();
    });

    it('rejects empty class value', () => {
      const doc = createMockDocument(['<div class="">']);
      expect(detectClassAtCursor(doc, new Position(0, 12), defaultAttrs)).toBeNull();
    });

    it('rejects cursor on non-wa word in mixed classes', () => {
      const doc = createMockDocument(['<div class="foo wa-flex">']);
      const result = detectClassAtCursor(doc, new Position(0, 14), defaultAttrs);
      expect(result).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// detectTokenContext
// ---------------------------------------------------------------------------
describe('detectTokenContext', () => {
  describe('positive cases', () => {
    it('detects var(--wa-...) partial', () => {
      const doc = createMockDocument(['color: var(--wa-color-bl);']);
      expect(detectTokenContext(doc, new Position(0, 24))).toBe('--wa-color-bl');
    });

    it('detects var( --wa-) with space after paren', () => {
      const doc = createMockDocument(['color: var( --wa-);']);
      expect(detectTokenContext(doc, new Position(0, 17))).toBe('--wa-');
    });

    it('detects bare --wa- after colon', () => {
      const doc = createMockDocument([': --wa-spacing-;']);
      expect(detectTokenContext(doc, new Position(0, 15))).toBe('--wa-spacing-');
    });
  });

  describe('custom properties (non-wa)', () => {
    it('detects var(--my-custom) partial', () => {
      const doc = createMockDocument(['color: var(--my-custom);']);
      expect(detectTokenContext(doc, new Position(0, 22))).toBe('--my-custom');
    });

    it('detects var(--brand-primary) partial', () => {
      const doc = createMockDocument(['background: var(--brand-primar);']);
      expect(detectTokenContext(doc, new Position(0, 30))).toBe('--brand-primar');
    });

    it('detects bare --custom-var after colon', () => {
      const doc = createMockDocument([': --custom-spacing-lg;']);
      expect(detectTokenContext(doc, new Position(0, 21))).toBe('--custom-spacing-lg');
    });
  });

  describe('false positives (must return null)', () => {
    it('rejects plain CSS value', () => {
      const doc = createMockDocument(['display: flex;']);
      expect(detectTokenContext(doc, new Position(0, 13))).toBeNull();
    });

    it('rejects color keyword', () => {
      const doc = createMockDocument(['border: 1px solid blue;']);
      expect(detectTokenContext(doc, new Position(0, 22))).toBeNull();
    });

    it('rejects empty line', () => {
      const doc = createMockDocument(['']);
      expect(detectTokenContext(doc, new Position(0, 0))).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// detectTokenAtCursor
// ---------------------------------------------------------------------------
describe('detectTokenAtCursor', () => {
  describe('positive cases', () => {
    it('detects token under cursor', () => {
      const doc = createMockDocument(['color: var(--wa-color-blue);']);
      const result = detectTokenAtCursor(doc, new Position(0, 18));
      expect(result).not.toBeNull();
      expect(result!.name).toBe('--wa-color-blue');
    });

    it('returns correct range', () => {
      const doc = createMockDocument(['color: var(--wa-color-blue);']);
      const result = detectTokenAtCursor(doc, new Position(0, 18));
      expect(result!.range.start.character).toBe(11);
      expect(result!.range.end.character).toBe(26);
    });

    it('detects second token on same line', () => {
      const doc = createMockDocument(['border: var(--wa-color-blue) var(--wa-spacing-m);']);
      const result = detectTokenAtCursor(doc, new Position(0, 40));
      expect(result).not.toBeNull();
      expect(result!.name).toBe('--wa-spacing-m');
    });

    it('matches at token start boundary', () => {
      const doc = createMockDocument(['var(--wa-color-blue)']);
      const result = detectTokenAtCursor(doc, new Position(0, 4));
      expect(result).not.toBeNull();
      expect(result!.name).toBe('--wa-color-blue');
    });

    it('matches at token end boundary', () => {
      const doc = createMockDocument(['var(--wa-color-blue)']);
      const result = detectTokenAtCursor(doc, new Position(0, 19));
      expect(result).not.toBeNull();
      expect(result!.name).toBe('--wa-color-blue');
    });
  });

  describe('custom properties (non-wa)', () => {
    it('detects non-wa custom property', () => {
      const doc = createMockDocument(['var(--my-custom-var)']);
      const result = detectTokenAtCursor(doc, new Position(0, 10));
      expect(result).not.toBeNull();
      expect(result!.name).toBe('--my-custom-var');
    });

    it('detects --brand-primary in var()', () => {
      const doc = createMockDocument(['color: var(--brand-primary);']);
      const result = detectTokenAtCursor(doc, new Position(0, 18));
      expect(result).not.toBeNull();
      expect(result!.name).toBe('--brand-primary');
    });
  });

  describe('false positives (must return null)', () => {
    it('rejects plain CSS value', () => {
      const doc = createMockDocument(['color: blue;']);
      expect(detectTokenAtCursor(doc, new Position(0, 8))).toBeNull();
    });

    it('rejects whitespace between tokens', () => {
      const doc = createMockDocument(['var(--wa-color-blue) var(--wa-spacing-m)']);
      const result = detectTokenAtCursor(doc, new Position(0, 21));
      expect(result).toBeNull();
    });
  });
});
