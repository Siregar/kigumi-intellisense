import type * as vscode from 'vscode';

/**
 * Create a minimal TextDocument mock from an array of lines.
 * Each line corresponds to the line number (0-indexed).
 */
export function createMockDocument(lines: string[]): vscode.TextDocument {
  return {
    lineAt(lineOrPos: number | vscode.Position) {
      const lineNum = typeof lineOrPos === 'number' ? lineOrPos : lineOrPos.line;
      return { text: lines[lineNum] ?? '' };
    },
    lineCount: lines.length,
  } as unknown as vscode.TextDocument;
}

/** Cast mock Hover.contents to access .value (mock stores a single MarkdownString) */
export function hoverMarkdown(hover: vscode.Hover): string {
  return (hover.contents as unknown as { value: string }).value;
}

/** Cast mock CompletionItem.range to access .start/.end */
export function itemRange(item: vscode.CompletionItem): vscode.Range {
  return item.range as unknown as vscode.Range;
}
