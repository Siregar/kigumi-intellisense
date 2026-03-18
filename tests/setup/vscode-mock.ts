import { vi } from 'vitest';

class MockPosition {
  constructor(
    public readonly line: number,
    public readonly character: number
  ) {}
}

class MockRange {
  public readonly start: MockPosition;
  public readonly end: MockPosition;

  constructor(startLine: number, startChar: number, endLine: number, endChar: number) {
    this.start = new MockPosition(startLine, startChar);
    this.end = new MockPosition(endLine, endChar);
  }
}

class MockMarkdownString {
  value = '';

  appendMarkdown(text: string) {
    this.value += text;
    return this;
  }

  appendCodeblock(code: string, language?: string) {
    this.value += `\n\`\`\`${language ?? ''}\n${code}\n\`\`\`\n`;
    return this;
  }

  appendText(text: string) {
    this.value += text;
    return this;
  }
}

class MockCompletionItem {
  label: string;
  kind: number;
  detail?: string;
  documentation?: MockMarkdownString;
  sortText?: string;
  filterText?: string;
  preselect?: boolean;
  range?: MockRange;

  constructor(label: string, kind?: number) {
    this.label = label;
    this.kind = kind ?? 0;
  }
}

class MockHover {
  contents: MockMarkdownString;
  range?: MockRange;

  constructor(contents: MockMarkdownString, range?: MockRange) {
    this.contents = contents;
    this.range = range;
  }
}

vi.mock('vscode', () => ({
  Position: MockPosition,
  Range: MockRange,
  MarkdownString: MockMarkdownString,
  CompletionItem: MockCompletionItem,
  CompletionItemKind: {
    Constant: 14,
    Color: 15,
    Variable: 5,
  },
  Hover: MockHover,
}));
