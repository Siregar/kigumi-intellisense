import * as vscode from 'vscode';
import { Catalog } from './catalog';
import { scanCustomTokens } from './custom-token-scanner';
import { ClassCompletionProvider } from './providers/class-completion';
import { ClassHoverProvider } from './providers/class-hover';
import { TokenCompletionProvider } from './providers/token-completion';
import { TokenHoverProvider } from './providers/token-hover';

const MARKUP_LANGUAGES = [
  'html',
  'typescriptreact',
  'javascriptreact',
  'typescript',
  'javascript',
  'vue',
];

const STYLE_LANGUAGES = ['css', 'scss', 'less'];

export function activate(context: vscode.ExtensionContext) {
  const output = vscode.window.createOutputChannel('Kigumi IntelliSense');
  const config = vscode.workspace.getConfiguration('kigumi');

  if (!config.get<boolean>('enable', true)) {
    output.appendLine('Extension disabled via kigumi.enable setting');
    return;
  }

  const catalog = Catalog.load(context.extensionPath);
  output.appendLine(`Data path: ${context.extensionPath}/out/data/`);
  output.appendLine(`Loaded: ${catalog.utilities.length} utilities, ${catalog.tokens.length} tokens`);

  if (catalog.utilities.length === 0 && catalog.tokens.length === 0) {
    vscode.window
      .showErrorMessage(
        'Kigumi IntelliSense: No data catalogs found.',
        'Run pnpm generate'
      )
      .then((action) => {
        if (action) {
          output.show();
        }
      });
    output.appendLine('ERROR: No catalogs found. Run `pnpm generate` then `pnpm compile` to build them.');
  }

  // Load custom tokens from user-configured CSS files
  const customTokenFilePatterns = config.get<string[]>('customTokenFiles', []);
  if (customTokenFilePatterns.length > 0) {
    loadCustomTokens(catalog, customTokenFilePatterns, output).then(() => {
      output.appendLine(`Custom tokens loaded. Total tokens: ${catalog.tokens.length}`);
    });

    // Watch for changes in custom token files
    for (const pattern of customTokenFilePatterns) {
      const watcher = vscode.workspace.createFileSystemWatcher(pattern);
      const reload = () => {
        loadCustomTokens(catalog, customTokenFilePatterns, output).then(() => {
          output.appendLine(`Custom tokens reloaded. Total tokens: ${catalog.tokens.length}`);
        });
      };
      watcher.onDidChange(reload);
      watcher.onDidCreate(reload);
      watcher.onDidDelete(reload);
      context.subscriptions.push(watcher);
    }
  }

  const classAttributes = config.get<string[]>('classAttributes', ['class', 'className']);

  // Class name completions in markup files
  const classCompletion = new ClassCompletionProvider(catalog, classAttributes);
  for (const lang of MARKUP_LANGUAGES) {
    context.subscriptions.push(
      vscode.languages.registerCompletionItemProvider(
        { language: lang, scheme: 'file' },
        classCompletion,
        '-', '"', "'", ' ' // Trigger on hyphen, quotes (attr open), space (next class)
      )
    );
  }

  // Class name hover in markup files
  const classHover = new ClassHoverProvider(catalog, classAttributes);
  for (const lang of MARKUP_LANGUAGES) {
    context.subscriptions.push(
      vscode.languages.registerHoverProvider({ language: lang, scheme: 'file' }, classHover)
    );
  }

  // CSS token completions in style files + markup files (for inline styles / <style> blocks)
  const tokenCompletion = new TokenCompletionProvider(catalog);
  const tokenLanguages = [...STYLE_LANGUAGES, ...MARKUP_LANGUAGES];
  for (const lang of tokenLanguages) {
    context.subscriptions.push(
      vscode.languages.registerCompletionItemProvider(
        { language: lang, scheme: 'file' },
        tokenCompletion,
        '-' // Trigger on hyphen for -- prefix
      )
    );
  }

  // CSS token hover in style files + markup files
  const tokenHover = new TokenHoverProvider(catalog);
  for (const lang of tokenLanguages) {
    context.subscriptions.push(
      vscode.languages.registerHoverProvider({ language: lang, scheme: 'file' }, tokenHover)
    );
  }

  output.appendLine('Providers registered successfully');
}

export function deactivate() {
  // Nothing to clean up
}

async function loadCustomTokens(
  catalog: Catalog,
  patterns: string[],
  output: vscode.OutputChannel
): Promise<void> {
  const filePaths: string[] = [];

  for (const pattern of patterns) {
    try {
      const uris = await vscode.workspace.findFiles(pattern);
      for (const uri of uris) {
        filePaths.push(uri.fsPath);
      }
    } catch (err) {
      output.appendLine(`Warning: Failed to resolve pattern "${pattern}": ${err}`);
    }
  }

  const tokens = scanCustomTokens(filePaths);
  catalog.replaceCustomTokens(tokens);
  output.appendLine(`Scanned ${filePaths.length} file(s), found ${tokens.length} custom token(s)`);
}
