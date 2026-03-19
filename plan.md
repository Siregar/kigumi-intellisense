# Feature: Custom CSS Properties IntelliSense

## Ziel
User können eigene CSS-Dateien (z.B. `theme.css`) konfigurieren, deren Custom Properties (`--*`) in Completion und Hover erscheinen – überall dort, wo `var()` verwendet wird (Style- und Markup-Dateien).

## Konfiguration

Neue Setting in `package.json`:

```json
"kigumi.customTokenFiles": {
  "type": "array",
  "default": [],
  "items": { "type": "string" },
  "description": "Glob patterns for CSS files containing custom properties (e.g. [\"**/theme.css\", \"src/styles/variables.css\"])"
}
```

## Änderungen

### 1. `src/custom-token-scanner.ts` (NEU)
- Funktion `scanCustomTokens(filePaths: string[]): TokenEntry[]`
- Parst CSS-Dateien mit Regex nach Custom Property Declarations: `--property-name: value;`
- Erzeugt `TokenEntry` mit `category: "custom"`, `group` = Dateiname (z.B. "theme.css"), `description` = leer
- Unterstützt auch `:root { }` Blöcke, `@media`, etc. – extrahiert einfach alle `--name: value;` Deklarationen

### 2. `src/catalog.ts` – Erweiterung
- Neue Methode `addTokens(tokens: TokenEntry[])`: Fügt Tokens zur bestehenden Map hinzu (überschreibt bei Namenskollision den bestehenden Eintrag nicht, custom tokens haben niedrigere Prio)
- Oder besser: `mergeCustomTokens(tokens: TokenEntry[])` – fügt nur hinzu wenn Name noch nicht existiert

### 3. `src/providers/attribute-detector.ts` – Regex-Erweiterung
- `detectTokenContext`: Regex von `/var\(\s*(--wa-[a-z0-9-]*)$/` zu `/var\(\s*(--[a-z0-9-]*)$/` ändern
- `detectTokenAtCursor`: Regex von `/--wa-[a-z0-9-]+/g` zu `/--[a-z0-9-]+/g` ändern
- Damit werden alle `--*` Properties erkannt, nicht nur `--wa-*`
- Der Catalog-Lookup entscheidet dann, ob es einen Match gibt

### 4. `src/extension.ts` – Integration
- Custom Token Files laden:
  - `vscode.workspace.getConfiguration('kigumi').get<string[]>('customTokenFiles')`
  - Glob-Patterns mit `vscode.workspace.findFiles()` auflösen
  - Dateien parsen mit `scanCustomTokens()`
  - `catalog.mergeCustomTokens()` aufrufen
- FileWatcher einrichten:
  - `vscode.workspace.createFileSystemWatcher()` für die Glob-Patterns
  - Bei Änderungen: Dateien neu parsen, Catalog aktualisieren
- Token-Providers auch für MARKUP_LANGUAGES registrieren (für `var()` in inline styles / `<style>`-Blöcken)

### 5. `README.md` – Dokumentation
- Neuer Abschnitt "Custom CSS Properties" mit Konfigurationsbeispiel
- Setting in der Config-Tabelle ergänzen

## Tests

### `tests/custom-token-scanner.test.ts` (NEU)
- Parst einfache CSS-Datei mit Custom Properties
- Parst `:root { --foo: bar; }` korrekt
- Ignoriert Kommentare
- Handhabt fehlende/leere Dateien graceful
- Korrekte `category`, `group`, `value` Zuordnung

### `tests/catalog.test.ts` – Erweitern
- `mergeCustomTokens` fügt neue Tokens hinzu
- Bestehende `--wa-*` Tokens werden nicht überschrieben
- `filterTokens` findet auch Custom Tokens mit `--` Prefix
- `getToken` findet Custom Tokens

### `tests/attribute-detector.test.ts` – Erweitern
- `detectTokenContext` erkennt `var(--custom-foo-)` (nicht nur `--wa-*`)
- `detectTokenAtCursor` erkennt `--custom-foo` bei Hover
- Bestehende `--wa-*` Tests bleiben grün

### `tests/token-completion.test.ts` – Erweitern
- Completion für Custom Tokens in `var()` Context
- Custom Tokens bekommen `Variable` Kind (nicht `Color`, es sei denn Heuristik)

### `tests/token-hover.test.ts` – Erweitern
- Hover für Custom Tokens zeigt Name + Value

## Reihenfolge der Implementierung
1. `custom-token-scanner.ts` + Tests → isoliert testbar
2. `catalog.ts` Erweiterung + Tests → isoliert testbar
3. `attribute-detector.ts` Regex-Änderung + Tests → isoliert testbar
4. `extension.ts` Integration (Laden, FileWatcher, Markup-Registration)
5. README aktualisieren
6. Manueller Smoke-Test / alle Tests grün
