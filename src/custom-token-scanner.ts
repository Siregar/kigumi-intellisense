import * as fs from 'node:fs';
import * as path from 'node:path';
import type { TokenEntry } from './catalog';

/**
 * Extract CSS custom property declarations from a CSS file.
 *
 * Matches lines like:
 *   --brand-primary: #ff6600;
 *   --spacing-lg: 2rem;
 *
 * inside any context (:root, selectors, @media, etc.)
 */
export function parseCustomProperties(css: string, sourceName: string): TokenEntry[] {
  const tokens: TokenEntry[] = [];
  const seen = new Set<string>();

  // Match custom property declarations: --name: value;
  // Handles multiline values by capturing until ; or }
  const re = /(--[a-zA-Z0-9-]+)\s*:\s*([^;}\n]+)/g;
  let match: RegExpExecArray | null;

  while ((match = re.exec(css)) !== null) {
    const name = match[1];
    const value = match[2].trim();

    // Skip duplicates within the same file (keep first occurrence)
    if (seen.has(name)) continue;
    seen.add(name);

    tokens.push({
      name,
      category: 'custom',
      value,
      description: '',
      group: sourceName,
    });
  }

  return tokens;
}

/**
 * Read and parse custom properties from multiple CSS files.
 */
export function scanCustomTokens(filePaths: string[]): TokenEntry[] {
  const allTokens: TokenEntry[] = [];
  const seen = new Set<string>();

  for (const filePath of filePaths) {
    if (!fs.existsSync(filePath)) continue;

    let css: string;
    try {
      css = fs.readFileSync(filePath, 'utf-8');
    } catch {
      continue;
    }

    const sourceName = path.basename(filePath);
    const tokens = parseCustomProperties(css, sourceName);

    for (const token of tokens) {
      if (!seen.has(token.name)) {
        seen.add(token.name);
        allTokens.push(token);
      }
    }
  }

  return allTokens;
}
