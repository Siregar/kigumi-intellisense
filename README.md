# Kigumi IntelliSense

Your companion for [Kigumi](https://kigumi.style) projects. Autocomplete and hover previews for `wa-*` utility classes and `--wa-*` design tokens in your projects.

## Features

### Class Name Completions

Type `wa-` inside any `class` or `className` attribute to get completions with CSS previews.

```html
<div class="wa-stack wa-gap-m">
  <wa-card class="wa-padding-l wa-surface-raised">
    <h2 class="wa-text-xl wa-font-semibold">Dashboard</h2>
  </wa-card>
</div>
```

```tsx
<WaCard className="wa-padding-l wa-surface-raised">
  <p className="wa-text-s wa-color-neutral">No results found.</p>
</WaCard>
```

### CSS Token Completions

Type `--wa-` inside `var()` to get token completions with resolved values.

```css
.card-header {
  padding: var(--wa-space-m);
  color: var(--wa-color-text-normal);
  border-bottom: 1px solid var(--wa-color-border-normal);
}
```

### Hover Previews

Hover over any `wa-*` class to see its CSS declarations, or any `--wa-*` token to see its resolved value and category.

## Supported Languages

| Type   | Languages                                          |
| ------ | -------------------------------------------------- |
| Markup | HTML, React (TSX/JSX), TypeScript, JavaScript, Vue |
| Styles | CSS, SCSS, Less                                    |

## Configuration

| Setting                  | Default                  | Description                                |
| ------------------------ | ------------------------ | ------------------------------------------ |
| `kigumi.enable`          | `true`                   | Enable or disable the extension            |
| `kigumi.classAttributes` | `["class", "className"]` | Attribute names to provide completions for |

## Requirements

Works with any project using Kigumi components or [Web Awesome](https://webawesome.com).

### Install via the [Kigumi CLI](https://kigumi.style):

```bash
npx kigumi init
```

## License

[MIT](LICENSE.md)
