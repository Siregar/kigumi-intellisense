import { Catalog } from '../../src/catalog';
import type { UtilityEntry, TokenEntry } from '../../src/catalog';

const utilities: UtilityEntry[] = [
  {
    name: 'wa-flex',
    category: 'layout',
    declarations: 'display: flex;',
    description: 'Sets display to flex',
    tokens: [],
  },
  {
    name: 'wa-gap-m',
    category: 'spacing',
    declarations: 'gap: var(--wa-spacing-m);',
    description: 'Medium gap',
    tokens: ['--wa-spacing-m'],
  },
  {
    name: 'wa-text-center',
    category: 'typography',
    declarations: 'text-align: center;',
    description: '',
    tokens: [],
  },
];

const tokens: TokenEntry[] = [
  {
    name: '--wa-color-blue',
    category: 'color',
    value: '#3b82f6',
    description: 'Blue color',
    group: 'base',
  },
  {
    name: '--wa-color-red',
    category: 'color',
    value: '#ef4444',
    description: '',
    group: 'base',
  },
  {
    name: '--wa-spacing-m',
    category: 'spacing',
    value: '1rem',
    description: 'Medium spacing',
    group: 'scale',
  },
];

export function createTestCatalog(): Catalog {
  return new Catalog(utilities, tokens);
}
