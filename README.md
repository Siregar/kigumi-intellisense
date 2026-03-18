# Kigumi IntelliSense

CSS class name and custom property IntelliSense for [Web Awesome](https://webawesome.com).

## Features

### Class Name Completion

Autocomplete for Web Awesome utility classes inside `class` and `className` attributes.

```html
<div class="wa-stack wa-gap-m">
<!--                   ↑ autocomplete triggers here -->
```

Supports: HTML, React (TSX/JSX), Vue, Svelte, Astro, PHP

### CSS Token Completion

Autocomplete for `--wa-*` CSS custom properties inside `var()` expressions.

```css
.my-component {
  color: var(--wa-color-text-normal);
  /*                ↑ autocomplete triggers here */
}
```

Supports: CSS, SCSS, Less, Vue, Svelte, Astro

### Hover Previews

Hover over any `wa-*` class name or `--wa-*` token to see its CSS declarations and resolved value.

## Configuration

| Setting                  | Default                    | Description                              |
|--------------------------|----------------------------|------------------------------------------|
| `kigumi.enable`          | `true`                     | Enable/disable the extension             |
| `kigumi.classAttributes` | `["class", "className"]`   | Attribute names to provide completions for |

## Development

```bash
# Install dependencies
pnpm install

# Generate data catalogs from Web Awesome CSS
pnpm generate

# Compile TypeScript
pnpm compile

# Launch Extension Development Host
# Press F5 in VS Code

# Package for distribution
pnpm package
```

## Updating Web Awesome Data

When a new version of Web Awesome is released:

```bash
pnpm update @awesome.me/webawesome-pro
pnpm generate
pnpm compile
```

## License

MIT
