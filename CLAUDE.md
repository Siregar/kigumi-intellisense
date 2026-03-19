# Kigumi IntelliSense

VS Code extension providing IntelliSense (completion + hover) for Web Awesome CSS utility classes and custom property tokens.

## Build Commands

```bash
pnpm generate          # Parse Web Awesome CSS into JSON catalogs (src/data/)
pnpm compile           # TypeScript compile + copy JSON data to out/data/
pnpm watch             # TypeScript watch mode (does NOT copy data)
pnpm package           # Compile + create .vsix with vsce
npx vitest             # Run tests (no test script in package.json)
npx vitest run         # Run tests once (CI mode)
```

After changing scripts in `scripts/`, re-run `pnpm generate` then `pnpm compile` to update the data catalogs.

## Architecture

```
src/
  extension.ts              # activate/deactivate — registers all providers
  catalog.ts                # Catalog class — loads JSON, exposes lookup/filter
  data/                     # Generated JSON catalogs (wa-utilities.json, wa-tokens.json)
  providers/
    attribute-detector.ts   # Context parsing: detects class attrs, var() expressions, cursor position
    class-completion.ts     # CompletionItemProvider for class="wa-*" in markup
    class-hover.ts          # HoverProvider for class names in markup
    token-completion.ts     # CompletionItemProvider for var(--wa-*) in stylesheets
    token-hover.ts          # HoverProvider for --wa-* tokens in stylesheets
scripts/
  parse-utility-classes.ts  # Generates wa-utilities.json from Web Awesome CSS
  parse-css-tokens.ts       # Generates wa-tokens.json from Web Awesome CSS
```

**Provider pattern**: Each provider receives a `Catalog` instance and implements a VS Code API (`CompletionItemProvider` or `HoverProvider`). The `attribute-detector` module handles all context/cursor parsing — providers call its functions to determine if they should respond.

**Language scopes**: Class providers activate for markup languages (html, tsx, jsx, vue, ts, js). Token providers activate for style languages (css, scss, less).

**Trigger characters**: Class completion triggers on `-`, `"`, `'`, ` `. Token completion triggers on `-`.

## Data Pipeline

The `scripts/` directory contains parsers that read Web Awesome CSS and produce JSON catalogs in `src/data/`. These JSON files are committed to the repo. The `copy-data` script copies them to `out/data/` during compilation. Regenerate when upstream Web Awesome changes.

## Testing

- **Framework**: Vitest with a VS Code API mock (`tests/setup/vscode-mock.ts`)
- **Helpers**: `tests/helpers/mock-document.ts` (mock TextDocument), `tests/helpers/test-catalog.ts` (small fixture catalog)
- **Pattern**: Tests import directly from `src/` — no compilation needed
- **Run**: `npx vitest` (watch) or `npx vitest run` (single pass)

## Key Conventions

- CommonJS output (`"module": "commonjs"` in tsconfig) — required by VS Code extension host
- Zero runtime dependencies — only `vscode` API and Node built-ins
- All class names use `wa-` prefix; all tokens use `--wa-` prefix
- `Catalog.load()` reads from `out/data/` relative to `extensionPath`
