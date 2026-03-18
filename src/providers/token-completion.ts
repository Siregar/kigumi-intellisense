import * as vscode from 'vscode';
import { Catalog } from '../catalog';
import { detectTokenContext } from './attribute-detector';

export class TokenCompletionProvider implements vscode.CompletionItemProvider {
  constructor(private readonly catalog: Catalog) {}

  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.CompletionItem[] | null {
    const prefix = detectTokenContext(document, position);
    if (prefix === null) return null;

    const entries = this.catalog.filterTokens(prefix);

    return entries.map((entry, idx) => {
      // Use Color kind for color tokens to get swatch preview
      const kind =
        entry.category === 'color'
          ? vscode.CompletionItemKind.Color
          : vscode.CompletionItemKind.Variable;

      const item = new vscode.CompletionItem(entry.name, kind);

      item.detail = `${entry.category} - ${entry.group}`;

      const docs = new vscode.MarkdownString();
      docs.appendCodeblock(entry.name + ': ' + entry.value + ';', 'css');
      if (entry.description) {
        docs.appendText('\n' + entry.description);
      }
      item.documentation = docs;

      // Group by category then group for ordering
      item.sortText = `${entry.group.padEnd(30)}${String(idx).padStart(4, '0')}`;

      // Replace the current partial token name
      if (prefix.length > 0) {
        const startChar = position.character - prefix.length;
        item.range = new vscode.Range(position.line, startChar, position.line, position.character);
      }

      return item;
    });
  }
}
