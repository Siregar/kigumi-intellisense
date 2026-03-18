import * as vscode from 'vscode';
import { Catalog } from '../catalog';
import { detectClassContext } from './attribute-detector';

export class ClassCompletionProvider implements vscode.CompletionItemProvider {
  constructor(
    private readonly catalog: Catalog,
    private readonly classAttributes: string[]
  ) {}

  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.CompletionItem[] | null {
    const prefix = detectClassContext(document, position, this.classAttributes);
    if (prefix === null) return null;

    // Only trigger for wa- prefixed classes
    if (prefix.length > 0 && !prefix.startsWith('wa-') && !'wa-'.startsWith(prefix)) {
      return null;
    }

    const entries = this.catalog.filterUtilities(prefix);

    return entries.map((entry, idx) => {
      const item = new vscode.CompletionItem(entry.name, vscode.CompletionItemKind.Constant);

      item.detail = `wa: ${entry.category}`;

      // CSS preview as documentation
      const docs = new vscode.MarkdownString();
      docs.appendCodeblock(entry.declarations, 'css');
      if (entry.description) {
        docs.appendText('\n' + entry.description);
      }
      if (entry.tokens.length > 0) {
        docs.appendText('\n\nTokens: ' + entry.tokens.join(', '));
      }
      item.documentation = docs;

      // Sort above other suggestions: leading space pushes to top
      item.sortText = ` ${entry.category.padEnd(20)}${String(idx).padStart(4, '0')}`;

      // Preselect first item so wa- suggestions are prominent
      if (idx === 0) item.preselect = true;

      // filterText ensures typing "wa-gap" matches even if other providers compete
      item.filterText = entry.name;

      // Replace only the current partial class name
      if (prefix.length > 0) {
        const startChar = position.character - prefix.length;
        item.range = new vscode.Range(position.line, startChar, position.line, position.character);
      }

      return item;
    });
  }
}
