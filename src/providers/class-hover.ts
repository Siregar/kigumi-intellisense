import * as vscode from 'vscode';
import { Catalog } from '../catalog';
import { detectClassAtCursor } from './attribute-detector';

export class ClassHoverProvider implements vscode.HoverProvider {
  constructor(
    private readonly catalog: Catalog,
    private readonly classAttributes: string[]
  ) {}

  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.Hover | null {
    const result = detectClassAtCursor(document, position, this.classAttributes);
    if (!result) return null;

    const entry = this.catalog.getUtility(result.name);
    if (!entry) return null;

    const md = new vscode.MarkdownString();
    md.appendMarkdown(`**${entry.name}** _(${entry.category})_\n\n`);
    md.appendCodeblock(entry.declarations, 'css');
    if (entry.description) {
      md.appendMarkdown('\n' + entry.description);
    }
    if (entry.tokens.length > 0) {
      md.appendMarkdown('\n\n_Tokens:_ ' + entry.tokens.map((t) => `\`${t}\``).join(', '));
    }

    return new vscode.Hover(md, result.range);
  }
}
