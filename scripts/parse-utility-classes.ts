/**
 * Parse Web Awesome utility CSS files into a structured catalog.
 *
 * Usage:
 *   tsx scripts/parse-utility-classes.ts [path-to-wa-styles-dir]
 *
 * Default path: node_modules/@awesome.me/webawesome-pro/dist/styles
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

interface UtilityEntry {
  name: string;
  category: string;
  declarations: string;
  description: string;
  tokens: string[];
}

// Human-written descriptions per category/class
const descriptions: Record<string, string> = {
  // Layout
  'wa-cluster': 'Horizontal wrapping layout with centered items',
  'wa-flank': 'Sidebar + content layout (first child is sidebar)',
  'wa-flank:start': 'Flank with sidebar on the start side',
  'wa-flank:end': 'Flank with sidebar on the end side',
  'wa-frame': 'Aspect-ratio container for media',
  'wa-frame:square': 'Square aspect ratio (1:1)',
  'wa-frame:landscape': 'Landscape aspect ratio (16:9)',
  'wa-frame:portrait': 'Portrait aspect ratio (9:16)',
  'wa-grid': 'Auto-fit responsive grid layout',
  'wa-stack': 'Vertical flex column layout',
  'wa-split': 'Space-between flex row layout',
  'wa-split:row': 'Split in row direction',
  'wa-split:column': 'Split in column direction',
  'wa-span-grid': 'Span full width of grid',

  // Gap / Spacing
  'wa-gap-0': 'No gap spacing',
  'wa-gap-3xs': 'Smallest gap (2px)',
  'wa-gap-2xs': 'Extra-extra-small gap (4px)',
  'wa-gap-xs': 'Extra-small gap (8px)',
  'wa-gap-s': 'Small gap (12px)',
  'wa-gap-m': 'Medium gap (16px)',
  'wa-gap-l': 'Large gap (24px)',
  'wa-gap-xl': 'Extra-large gap (32px)',
  'wa-gap-2xl': 'Extra-extra-large gap (40px)',
  'wa-gap-3xl': 'Triple-extra-large gap (48px)',
  'wa-gap-4xl': 'Quadruple-extra-large gap (64px)',

  // Alignment
  'wa-align-items-start': 'Align items to flex-start',
  'wa-align-items-end': 'Align items to flex-end',
  'wa-align-items-center': 'Align items to center',
  'wa-align-items-stretch': 'Stretch items to fill cross axis',
  'wa-align-items-baseline': 'Align items to baseline',
  'wa-align-self-start': 'Align self to flex-start',
  'wa-align-self-end': 'Align self to flex-end',
  'wa-align-self-center': 'Align self to center',
  'wa-align-self-stretch': 'Stretch self to fill cross axis',
  'wa-align-self-baseline': 'Align self to baseline',

  // Justify
  'wa-justify-content-start': 'Justify content to flex-start',
  'wa-justify-content-end': 'Justify content to flex-end',
  'wa-justify-content-center': 'Justify content to center',
  'wa-justify-content-space-around': 'Distribute items with equal space around',
  'wa-justify-content-space-between': 'Distribute items with space between',
  'wa-justify-content-space-evenly': 'Distribute items with equal space evenly',

  // Flex wrap
  'wa-flex-wrap': 'Allow flex items to wrap',
  'wa-flex-nowrap': 'Prevent flex items from wrapping',
  'wa-flex-wrap-reverse': 'Wrap flex items in reverse',

  // Text
  'wa-body': 'Body text style',
  'wa-heading': 'Heading text style',
  'wa-caption': 'Caption text style (quiet color)',
  'wa-longform': 'Long-form text style (serif)',
  'wa-text-truncate': 'Truncate text with ellipsis',
  'wa-link': 'Styled link with hover effect',
  'wa-link-plain': 'Plain link without decoration',
  'wa-list-plain': 'Remove list markers and padding',

  // Font size
  'wa-font-size-2xs': 'Font size: extra-extra-small (11px)',
  'wa-font-size-xs': 'Font size: extra-small (12px)',
  'wa-font-size-s': 'Font size: small (14px)',
  'wa-font-size-m': 'Font size: medium (16px)',
  'wa-font-size-l': 'Font size: large (20px)',
  'wa-font-size-xl': 'Font size: extra-large (25px)',
  'wa-font-size-2xl': 'Font size: 2x-large (32px)',
  'wa-font-size-3xl': 'Font size: 3x-large (41px)',
  'wa-font-size-4xl': 'Font size: 4x-large (52px)',

  // Font weight
  'wa-font-weight-light': 'Font weight: light (300)',
  'wa-font-weight-normal': 'Font weight: normal (400)',
  'wa-font-weight-semibold': 'Font weight: semibold (500)',
  'wa-font-weight-bold': 'Font weight: bold (600)',

  // Text color
  'wa-color-text-normal': 'Normal text color',
  'wa-color-text-quiet': 'Quieter/secondary text color',
  'wa-color-text-link': 'Link text color',

  // Border radius
  'wa-border-radius-s': 'Small border radius',
  'wa-border-radius-m': 'Medium border radius',
  'wa-border-radius-l': 'Large border radius',
  'wa-border-radius-pill': 'Pill border radius (9999px)',
  'wa-border-radius-circle': 'Circle border radius (50%)',
  'wa-border-radius-square': 'Square border radius (0px)',

  // Size
  'wa-size-s': 'Small component size',
  'wa-size-m': 'Medium component size',
  'wa-size-l': 'Large component size',

  // Variants
  'wa-neutral': 'Neutral color variant',
  'wa-brand': 'Brand color variant',
  'wa-success': 'Success color variant',
  'wa-warning': 'Warning color variant',
  'wa-danger': 'Danger color variant',

  // Accessibility
  'wa-visually-hidden': 'Visually hidden but accessible to screen readers',
  'wa-visually-hidden-force': 'Force visually hidden (always)',
  'wa-visually-hidden-hint': 'Visually hide hint part of form control',
  'wa-visually-hidden-label': 'Visually hide label part of form control',

  // Misc
  'wa-scroll-lock': 'Lock page scroll (used by modals)',
  'wa-cloak': 'Hide undefined custom elements until registered',
  'wa-placeholder': 'Placeholder box for prototyping',

  // Form controls
  'wa-form-control-label': 'Form control label style',
  'wa-form-control-value': 'Form control value style',
  'wa-form-control-placeholder': 'Form control placeholder style',
  'wa-form-control-hint': 'Form control hint text style',
};

// Category mapping by prefix
function categorize(name: string): string {
  if (/^wa-(cluster|flank|frame|grid|stack|split|span-grid)/.test(name)) return 'layout';
  if (/^wa-gap/.test(name)) return 'spacing';
  if (/^wa-align/.test(name)) return 'alignment';
  if (/^wa-justify/.test(name)) return 'justify';
  if (/^wa-flex/.test(name)) return 'flexbox';
  if (/^wa-(body|heading|caption|longform|font-|text-|link|list-)/.test(name)) return 'text';
  if (/^wa-color-text/.test(name)) return 'text';
  if (/^wa-border-radius/.test(name)) return 'border-radius';
  if (/^wa-size/.test(name)) return 'size';
  if (/^wa-(neutral|brand|success|warning|danger)$/.test(name)) return 'variant';
  if (/^wa-visually-hidden/.test(name)) return 'accessibility';
  if (/^wa-scroll-lock/.test(name)) return 'scroll';
  if (/^wa-cloak/.test(name)) return 'fouce';
  if (/^wa-placeholder/.test(name)) return 'prototype';
  if (/^wa-form-control/.test(name)) return 'form';
  return 'other';
}

function extractTokens(declarations: string): string[] {
  const tokens: string[] = [];
  const re = /var\((--wa-[a-z0-9-]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(declarations)) !== null) {
    if (!tokens.includes(match[1])) {
      tokens.push(match[1]);
    }
  }
  return tokens;
}

function cleanDecls(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/;\s*/g, '; ')
    .trim()
    .replace(/; $/, ';');
}

function parseUtilityCss(css: string): Map<string, { declarations: string }> {
  const entries = new Map<string, { declarations: string }>();

  // Remove comments
  const cleaned = css.replace(/\/\*[\s\S]*?\*\//g, '');

  // Strategy 1: Class selectors (handles pseudo-classes/elements after class name)
  // .wa-class-name[:pseudo][::part(x)][, ...] { declarations }
  const classRe = /\.(wa-[a-z0-9-]+)(?:[:\[>+~ ][^{]*)?\{([^}]+)\}/g;
  let match: RegExpExecArray | null;
  while ((match = classRe.exec(cleaned)) !== null) {
    const name = match[1];
    const decls = cleanDecls(match[2]);
    if (decls && !entries.has(name)) {
      entries.set(name, { declarations: decls });
    }
  }

  // Strategy 2: Attribute selectors [class*='wa-name'] (with optional suffixes)
  const attrRe = /\[class\*='(wa-[a-z-]+)'\](?:[^[{]*)\{([^}]+)\}/g;
  while ((match = attrRe.exec(cleaned)) !== null) {
    const name = match[1];
    const decls = cleanDecls(match[2]);
    if (decls && !entries.has(name)) {
      entries.set(name, { declarations: decls });
    }
  }

  // Strategy 3: Modifier patterns [class*='wa-name'][class*='\:modifier'] (with suffixes)
  const modRe = /\[class\*='(wa-[a-z-]+)'\]\[class\*='\\:([\w-]+)'\](?:[^{]*)\{([^}]+)\}/g;
  while ((match = modRe.exec(cleaned)) !== null) {
    const name = `${match[1]}:${match[2]}`;
    const decls = cleanDecls(match[3]);
    if (decls && !entries.has(name)) {
      entries.set(name, { declarations: decls });
    }
  }

  // Strategy 4: :not() modifier patterns (e.g. [class*='wa-flank']:not([class*='\:end']))
  const notModRe =
    /\[class\*='(wa-[a-z-]+)'\]:not\(\[class\*='\\:([\w-]+)'\]\)(?:[^{]*)\{([^}]+)\}/g;
  while ((match = notModRe.exec(cleaned)) !== null) {
    // This is the default behavior (without modifier), so use base name
    const name = match[1];
    const decls = cleanDecls(match[3]);
    if (!entries.has(name)) {
      entries.set(name, { declarations: decls });
    }
  }

  // Strategy 5: Composite class selectors (e.g. .wa-body-2xs, .wa-heading-2xs { ... })
  // Finds all rule blocks and extracts every .wa-* class name from the selector
  const ruleRe = /([^{}]+)\{([^}]+)\}/g;
  while ((match = ruleRe.exec(cleaned)) !== null) {
    const selector = match[1];
    const decls = cleanDecls(match[2]);
    if (!decls) continue;

    const classNames = [...selector.matchAll(/\.(wa-[a-z0-9-]+)/g)].map((m) => m[1]);
    for (const name of classNames) {
      if (!entries.has(name)) {
        entries.set(name, { declarations: decls });
      }
    }
  }

  return entries;
}

function main() {
  const stylesDir = process.argv[2] || 'node_modules/@awesome.me/webawesome-pro/dist/styles';
  const utilitiesDir = path.join(stylesDir, 'utilities');

  if (!fs.existsSync(utilitiesDir)) {
    console.error(`Utilities directory not found: ${utilitiesDir}`);
    console.error('Usage: tsx scripts/parse-utility-classes.ts [path-to-wa-styles-dir]');
    process.exit(1);
  }

  const catalog: UtilityEntry[] = [];
  const seen = new Set<string>();

  const files = fs.readdirSync(utilitiesDir).filter((f) => f.endsWith('.css'));

  for (const file of files) {
    const css = fs.readFileSync(path.join(utilitiesDir, file), 'utf-8');
    const entries = parseUtilityCss(css);

    for (const [name, { declarations }] of entries) {
      if (seen.has(name)) continue;
      seen.add(name);

      catalog.push({
        name,
        category: categorize(name),
        declarations,
        description: descriptions[name] || `${name} utility class`,
        tokens: extractTokens(declarations),
      });
    }
  }

  // Sort by category, then name
  catalog.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

  const outDir = path.join(__dirname, '..', 'src', 'data');
  fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, 'wa-utilities.json');
  fs.writeFileSync(outPath, JSON.stringify(catalog, null, 2) + '\n');

  console.log(`Wrote ${catalog.length} utility classes to ${outPath}`);

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
