/**
 * Parse Web Awesome theme/palette CSS files into a token catalog.
 *
 * Scans ALL theme and palette files to collect every unique --wa-* token.
 * Uses the default theme's values as the representative display value.
 *
 * Usage:
 *   tsx scripts/parse-css-tokens.ts [path-to-wa-styles-dir]
 *
 * Default path: node_modules/@awesome.me/webawesome-pro/dist/styles
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

interface TokenEntry {
  name: string;
  category: string;
  value: string;
  description: string;
  group: string;
}

function categorize(name: string): { category: string; group: string; description: string } {
  // Color tokens
  if (/^--wa-color-surface/.test(name)) {
    return { category: 'color', group: 'color-surface', description: descFromName(name, 'Surface') };
  }
  if (/^--wa-color-text/.test(name)) {
    return { category: 'color', group: 'color-text', description: descFromName(name, 'Text color') };
  }
  if (/^--wa-color-overlay/.test(name)) {
    return { category: 'color', group: 'color-overlay', description: descFromName(name, 'Overlay color') };
  }
  if (/^--wa-color-shadow/.test(name)) {
    return { category: 'color', group: 'color-shadow', description: 'Shadow color' };
  }
  if (/^--wa-color-focus/.test(name)) {
    return { category: 'color', group: 'color-focus', description: 'Focus ring color' };
  }
  if (/^--wa-color-mix/.test(name)) {
    return { category: 'color', group: 'color-mix', description: descFromName(name, 'Color mix') };
  }
  if (/^--wa-color-brand/.test(name)) {
    return { category: 'color', group: 'color-brand', description: descFromName(name, 'Brand') };
  }
  if (/^--wa-color-success/.test(name)) {
    return { category: 'color', group: 'color-success', description: descFromName(name, 'Success') };
  }
  if (/^--wa-color-warning/.test(name)) {
    return { category: 'color', group: 'color-warning', description: descFromName(name, 'Warning') };
  }
  if (/^--wa-color-danger/.test(name)) {
    return { category: 'color', group: 'color-danger', description: descFromName(name, 'Danger') };
  }
  if (/^--wa-color-neutral/.test(name)) {
    return { category: 'color', group: 'color-neutral', description: descFromName(name, 'Neutral') };
  }
  if (/^--wa-color-(red|orange|yellow|green|cyan|blue|indigo|purple|pink|gray)/.test(name)) {
    const hue = name.match(/--wa-color-(\w+)/)?.[1] || 'color';
    return { category: 'color', group: `color-${hue}`, description: descFromName(name, capitalize(hue)) };
  }
  if (/^--wa-color-fill/.test(name)) {
    return { category: 'color', group: 'color-fill', description: descFromName(name, 'Fill color') };
  }
  if (/^--wa-color-border/.test(name)) {
    return { category: 'color', group: 'color-border', description: descFromName(name, 'Border color') };
  }
  if (/^--wa-color-on/.test(name)) {
    return { category: 'color', group: 'color-on', description: descFromName(name, 'On-color') };
  }
  if (/^--wa-color/.test(name)) {
    return { category: 'color', group: 'color', description: descFromName(name, 'Color') };
  }

  // Space tokens
  if (/^--wa-space/.test(name)) {
    return { category: 'spacing', group: 'space', description: descFromName(name, 'Spacing') };
  }
  if (/^--wa-content-spacing/.test(name)) {
    return { category: 'spacing', group: 'space', description: 'Default content spacing' };
  }

  // Font tokens
  if (/^--wa-font-family/.test(name)) {
    return { category: 'typography', group: 'font-family', description: descFromName(name, 'Font family') };
  }
  if (/^--wa-font-size/.test(name)) {
    return { category: 'typography', group: 'font-size', description: descFromName(name, 'Font size') };
  }
  if (/^--wa-font-weight/.test(name)) {
    return { category: 'typography', group: 'font-weight', description: descFromName(name, 'Font weight') };
  }
  if (/^--wa-line-height/.test(name)) {
    return { category: 'typography', group: 'line-height', description: descFromName(name, 'Line height') };
  }
  if (/^--wa-link/.test(name)) {
    return { category: 'typography', group: 'link', description: descFromName(name, 'Link') };
  }

  // Border tokens
  if (/^--wa-border-radius/.test(name)) {
    return { category: 'border', group: 'border-radius', description: descFromName(name, 'Border radius') };
  }
  if (/^--wa-border-width/.test(name)) {
    return { category: 'border', group: 'border-width', description: descFromName(name, 'Border width') };
  }
  if (/^--wa-border-style/.test(name)) {
    return { category: 'border', group: 'border-style', description: 'Border style' };
  }

  // Shadow tokens
  if (/^--wa-shadow/.test(name)) {
    return { category: 'shadow', group: 'shadow', description: descFromName(name, 'Shadow') };
  }

  // Focus tokens
  if (/^--wa-focus/.test(name)) {
    return { category: 'focus', group: 'focus', description: descFromName(name, 'Focus ring') };
  }

  // Transition tokens
  if (/^--wa-transition/.test(name)) {
    return { category: 'transition', group: 'transition', description: descFromName(name, 'Transition') };
  }

  // Form control tokens
  if (/^--wa-form-control/.test(name)) {
    return { category: 'component', group: 'form-control', description: descFromName(name, 'Form control') };
  }

  // Panel tokens
  if (/^--wa-panel/.test(name)) {
    return { category: 'component', group: 'panel', description: descFromName(name, 'Panel') };
  }

  // Tooltip tokens
  if (/^--wa-tooltip/.test(name)) {
    return { category: 'component', group: 'tooltip', description: descFromName(name, 'Tooltip') };
  }

  return { category: 'other', group: 'other', description: descFromName(name, 'Token') };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function descFromName(name: string, prefix: string): string {
  // --wa-color-brand-fill-loud -> "Brand fill loud"
  const parts = name
    .replace(/^--wa-/, '')
    .replace(/^color-/, '')
    .replace(/^font-/, '')
    .replace(/^border-/, '')
    .split('-');

  // If prefix already covers the first parts, skip them
  const prefixLower = prefix.toLowerCase().split(' ');
  let startIdx = 0;
  for (let i = 0; i < prefixLower.length && i < parts.length; i++) {
    if (parts[i] === prefixLower[i]) startIdx = i + 1;
    else break;
  }

  const suffix = parts.slice(startIdx).join(' ');
  if (!suffix) return prefix;
  return `${prefix}: ${suffix}`;
}

/**
 * Extract all --wa-* custom property declarations from CSS text.
 * Returns Map of token name -> value (first occurrence wins).
 */
function extractTokens(css: string): Map<string, string> {
  const tokens = new Map<string, string>();
  // Remove comments
  const cleaned = css.replace(/\/\*[\s\S]*?\*\//g, '');

  // Match: --wa-property-name: value;
  // Handles multi-line values by matching everything up to the next ; or }
  const re = /(--wa-[a-z0-9-]+)\s*:\s*([^;}\n]+)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(cleaned)) !== null) {
    const name = match[1];
    const value = match[2].trim();
    // Keep the first occurrence (default/light theme values)
    if (!tokens.has(name)) {
      tokens.set(name, value);
    }
  }
  return tokens;
}

function collectCssFiles(dir: string): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectCssFiles(fullPath));
    } else if (entry.name.endsWith('.css')) {
      files.push(fullPath);
    }
  }
  return files;
}

function main() {
  const stylesDir = process.argv[2] || 'node_modules/@awesome.me/webawesome-pro/dist/styles';

  if (!fs.existsSync(stylesDir)) {
    console.error(`Styles directory not found: ${stylesDir}`);
    console.error('Usage: tsx scripts/parse-css-tokens.ts [path-to-wa-styles-dir]');
    process.exit(1);
  }

  // Parse default theme FIRST to get representative values
  const defaultThemePath = path.join(stylesDir, 'themes', 'default.css');
  const defaultTokens = new Map<string, string>();

  if (fs.existsSync(defaultThemePath)) {
    const css = fs.readFileSync(defaultThemePath, 'utf-8');
    for (const [name, value] of extractTokens(css)) {
      defaultTokens.set(name, value);
    }
  }

  // Then scan ALL CSS files to collect every unique --wa-* name
  const allTokenNames = new Set<string>();
  const allValues = new Map<string, string>();

  // Priority order: themes first, then palettes, then everything else
  const scanDirs = [
    path.join(stylesDir, 'themes'),
    path.join(stylesDir, 'color', 'palettes'),
    path.join(stylesDir, 'color', 'variants'),
    path.join(stylesDir, 'color'),
    stylesDir,
  ];

  for (const dir of scanDirs) {
    for (const file of collectCssFiles(dir)) {
      const css = fs.readFileSync(file, 'utf-8');
      for (const [name, value] of extractTokens(css)) {
        allTokenNames.add(name);
        if (!allValues.has(name)) {
          allValues.set(name, value);
        }
      }
    }
  }

  // Build catalog: prefer default theme values, fall back to first-seen value
  const catalog: TokenEntry[] = [];

  for (const name of allTokenNames) {
    const value = defaultTokens.get(name) || allValues.get(name) || '';
    const { category, group, description } = categorize(name);
    catalog.push({ name, category, value, description, group });
  }

  // Sort by category, group, then name
  catalog.sort(
    (a, b) =>
      a.category.localeCompare(b.category) ||
      a.group.localeCompare(b.group) ||
      a.name.localeCompare(b.name)
  );

  const outDir = path.join(__dirname, '..', 'src', 'data');
  fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, 'wa-tokens.json');
  fs.writeFileSync(outPath, JSON.stringify(catalog, null, 2) + '\n');

  console.log(`Wrote ${catalog.length} tokens to ${outPath}`);

  // Print category summary
  const categories = new Map<string, number>();
  for (const entry of catalog) {
    categories.set(entry.category, (categories.get(entry.category) || 0) + 1);
  }
  for (const [cat, count] of [...categories.entries()].sort()) {
    console.log(`  ${cat}: ${count}`);
  }
}

main();
