import * as fs from 'node:fs';
import * as path from 'node:path';

export interface UtilityEntry {
  name: string;
  category: string;
  declarations: string;
  description: string;
  tokens: string[];
}

export interface TokenEntry {
  name: string;
  category: string;
  value: string;
  description: string;
  group: string;
}

export class Catalog {
  readonly utilities: UtilityEntry[];
  readonly tokens: TokenEntry[];

  private readonly utilityMap: Map<string, UtilityEntry>;
  private readonly tokenMap: Map<string, TokenEntry>;

  constructor(utilities: UtilityEntry[], tokens: TokenEntry[]) {
    this.utilities = utilities;
    this.tokens = tokens;

    this.utilityMap = new Map();
    for (const u of utilities) {
      this.utilityMap.set(u.name, u);
    }

    this.tokenMap = new Map();
    for (const t of tokens) {
      this.tokenMap.set(t.name, t);
    }
  }

  getUtility(name: string): UtilityEntry | undefined {
    return this.utilityMap.get(name);
  }

  getToken(name: string): TokenEntry | undefined {
    return this.tokenMap.get(name);
  }

  filterUtilities(prefix: string): UtilityEntry[] {
    if (!prefix) return this.utilities;
    return this.utilities.filter((u) => u.name.startsWith(prefix));
  }

  filterTokens(prefix: string): TokenEntry[] {
    if (!prefix) return this.tokens;
    return this.tokens.filter((t) => t.name.startsWith(prefix));
  }

  static load(extensionPath: string): Catalog {
    const utilitiesPath = path.join(extensionPath, 'src', 'data', 'wa-utilities.json');
    const tokensPath = path.join(extensionPath, 'src', 'data', 'wa-tokens.json');

    // Also check in out/ for packaged extensions
    const utilitiesPathAlt = path.join(extensionPath, 'out', 'data', 'wa-utilities.json');
    const tokensPathAlt = path.join(extensionPath, 'out', 'data', 'wa-tokens.json');

    let utilities: UtilityEntry[] = [];
    let tokens: TokenEntry[] = [];

    const uPath = fs.existsSync(utilitiesPath) ? utilitiesPath : utilitiesPathAlt;
    const tPath = fs.existsSync(tokensPath) ? tokensPath : tokensPathAlt;

    if (fs.existsSync(uPath)) {
      utilities = JSON.parse(fs.readFileSync(uPath, 'utf-8'));
    }

    if (fs.existsSync(tPath)) {
      tokens = JSON.parse(fs.readFileSync(tPath, 'utf-8'));
    }

    return new Catalog(utilities, tokens);
  }
}
