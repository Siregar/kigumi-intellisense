import * as vscode from 'vscode';
import { Catalog } from './catalog';
import { ClassCompletionProvider } from './providers/class-completion';
import { ClassHoverProvider } from './providers/class-hover';
import { TokenCompletionProvider } from './providers/token-completion';
import { TokenHoverProvider } from './providers/token-hover';

const MARKUP_LANGUAGES = [
  'html',
  'typescriptreact',
  'javascriptreact',
  'vue',
  'svelte',
  'astro',
  'php',
  'erb',
];

const STYLE_LANGUAGES = ['css', 'scss', 'less', 'vue', 'svelte', 'astro'];

export function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration('kigumi');

  if (!config.get<boolean>('enable', true)) {
    return;
  }

  const catalog = Catalog.load(context.extensionPath);

  if (catalog.utilities.length === 0 && catalog.tokens.length === 0) {
    vscode.window.showWarningMessage(
      'Kigumi IntelliSense: No data catalogs found. Run `pnpm generate` to build them.'
    );
    return;
  }

  const classAttributes = config.get<string[]>('classAttributes', ['class', 'className']);

  // Class name completions in markup files
  const classCompletion = new ClassCompletionProvider(catalog, classAttributes);
  for (const lang of MARKUP_LANGUAGES) {
    context.subscriptions.push(
      vscode.languages.registerCompletionItemProvider(
        { language: lang, scheme: 'file' },
        classCompletion,
        '-' // Trigger on hyphen for wa- prefix
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

  // CSS token completions in style files
  const tokenCompletion = new TokenCompletionProvider(catalog);
  for (const lang of STYLE_LANGUAGES) {
    context.subscriptions.push(
      vscode.languages.registerCompletionItemProvider(
        { language: lang, scheme: 'file' },
        tokenCompletion,
        '-' // Trigger on hyphen for --wa- prefix
      )
    );
  }

  // CSS token hover in style files
  const tokenHover = new TokenHoverProvider(catalog);
  for (const lang of STYLE_LANGUAGES) {
    context.subscriptions.push(
      vscode.languages.registerHoverProvider({ language: lang, scheme: 'file' }, tokenHover)
    );
  }

  console.log(
    `Kigumi IntelliSense activated: ${catalog.utilities.length} utilities, ${catalog.tokens.length} tokens`
  );
}

export function deactivate() {
  // Nothing to clean up
}
