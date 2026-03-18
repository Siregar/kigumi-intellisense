import * as vscode from 'vscode';

/**
 * Detect whether the cursor is inside a class/className attribute value.
 *
 * Returns the current partial class name being typed, or null if not in context.
 */
export function detectClassContext(
  document: vscode.TextDocument,
  position: vscode.Position,
  classAttributes: string[]
): string | null {
  const lineText = document.lineAt(position).text;
  const charPos = position.character;
  const textBeforeCursor = lineText.slice(0, charPos);

  // Build pattern for attribute names
  const attrPattern = classAttributes.map(escapeRegex).join('|');

  // Strategy 1: Same-line match: className="value..."
  const sameLineRe = new RegExp(`(?:${attrPattern})\\s*=\\s*["']([^"']*)$`);
  const sameLineMatch = sameLineRe.exec(textBeforeCursor);
  if (sameLineMatch) {
    const valueBeforeCursor = sameLineMatch[1];
    const lastSpace = valueBeforeCursor.lastIndexOf(' ');
    return valueBeforeCursor.slice(lastSpace + 1);
  }

  // Strategy 2: Same-line JSX expression: className={`value...`} or className={'value...'}
  const jsxExprRe = new RegExp(`(?:${attrPattern})\\s*=\\s*\\{[\`'"]([^}\`'"]*?)$`);
  const jsxMatch = jsxExprRe.exec(textBeforeCursor);
  if (jsxMatch) {
    const valueBeforeCursor = jsxMatch[1];
    const lastSpace = valueBeforeCursor.lastIndexOf(' ');
    return valueBeforeCursor.slice(lastSpace + 1);
  }

  // Strategy 3: Multi-line - scan backward to find opening class attribute
  // Handles cases where className=" is on a previous line
  const maxScanLines = 5;
  const startLine = Math.max(0, position.line - maxScanLines);
  let combined = '';
  for (let i = startLine; i <= position.line; i++) {
    const line = i === position.line ? textBeforeCursor : document.lineAt(i).text;
    combined += (i === position.line ? line : line + ' ');
  }

  const multiLineRe = new RegExp(`(?:${attrPattern})\\s*=\\s*["']([^"']*)$`);
  const multiLineMatch = multiLineRe.exec(combined);
  if (multiLineMatch) {
    const valueBeforeCursor = multiLineMatch[1];
    const lastSpace = valueBeforeCursor.lastIndexOf(' ');
    return valueBeforeCursor.slice(lastSpace + 1);
  }

  return null;
}

/**
 * Detect the class name under the cursor for hover.
 *
 * Returns the full class name at the cursor position, or null if not in context.
 */
export function detectClassAtCursor(
  document: vscode.TextDocument,
  position: vscode.Position,
  classAttributes: string[]
): { name: string; range: vscode.Range } | null {
  const lineText = document.lineAt(position).text;
  const charPos = position.character;

  // Check if we're inside a class attribute
  const attrPattern = classAttributes.map(escapeRegex).join('|');
  const attrRe = new RegExp(`(?:${attrPattern})\\s*=\\s*["']`, 'g');

  let attrMatch: RegExpExecArray | null;
  while ((attrMatch = attrRe.exec(lineText)) !== null) {
    const valueStart = attrMatch.index + attrMatch[0].length;

    // Find the closing quote
    const quoteChar = attrMatch[0].slice(-1);
    const closeIdx = lineText.indexOf(quoteChar, valueStart);
    const valueEnd = closeIdx === -1 ? lineText.length : closeIdx;

    if (charPos < valueStart || charPos > valueEnd) continue;

    // We're inside this attribute value - find the word at cursor
    const valueText = lineText.slice(valueStart, valueEnd);
    const cursorInValue = charPos - valueStart;

    // Find word boundaries (space-delimited)
    let wordStart = valueText.lastIndexOf(' ', cursorInValue - 1) + 1;
    let wordEnd = valueText.indexOf(' ', cursorInValue);
    if (wordEnd === -1) wordEnd = valueText.length;

    const word = valueText.slice(wordStart, wordEnd);
    if (!word || !word.startsWith('wa-')) return null;

    const range = new vscode.Range(
      position.line,
      valueStart + wordStart,
      position.line,
      valueStart + wordEnd
    );

    return { name: word, range };
  }

  return null;
}

/**
 * Detect whether the cursor is inside a var(--wa-...) expression.
 *
 * Returns the current partial token name being typed, or null if not in context.
 */
export function detectTokenContext(
  document: vscode.TextDocument,
  position: vscode.Position
): string | null {
  const lineText = document.lineAt(position).text;
  const charPos = position.character;
  const textBeforeCursor = lineText.slice(0, charPos);

  // Look for var( with optional --wa- prefix
  const match = /var\(\s*(--wa-[a-z0-9-]*)$/.exec(textBeforeCursor);
  if (match) return match[1];

  // Also match bare --wa- in property declarations (e.g. in :root blocks)
  const bareMatch = /:\s*(--wa-[a-z0-9-]*)$/.exec(textBeforeCursor);
  if (bareMatch) return bareMatch[1];

  return null;
}

/**
 * Detect a --wa-* token name under the cursor for hover.
 */
export function detectTokenAtCursor(
  document: vscode.TextDocument,
  position: vscode.Position
): { name: string; range: vscode.Range } | null {
  const lineText = document.lineAt(position).text;
  const charPos = position.character;

  // Find --wa-* token at cursor position
  const re = /--wa-[a-z0-9-]+/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(lineText)) !== null) {
    const start = match.index;
    const end = start + match[0].length;
    if (charPos >= start && charPos <= end) {
      return {
        name: match[0],
        range: new vscode.Range(position.line, start, position.line, end),
      };
    }
  }

  return null;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
