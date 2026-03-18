import * as vscode from 'vscode';
import { Catalog } from '../catalog';
import { detectTokenAtCursor } from './attribute-detector';

export class TokenHoverProvider implements vscode.HoverProvider {
  constructor(private readonly catalog: Catalog) {}

  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.Hover | null {
    const result = detectTokenAtCursor(document, position);
    if (!result) return null;

    const entry = this.catalog.getToken(result.name);
    if (!entry) return null;

    const md = new vscode.MarkdownString();
    md.appendMarkdown(`**${entry.name}**\n\n`);
    md.appendMarkdown(`_${entry.category} / ${entry.group}_\n\n`);
    md.appendCodeblock(entry.name + ': ' + entry.value + ';', 'css');
    if (entry.description) {
      md.appendMarkdown('\n' + entry.description);
    }

    return new vscode.Hover(md, result.range);
  }
}
