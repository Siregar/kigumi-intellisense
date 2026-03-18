# Kigumi IntelliSense

Autocomplete and hover previews for [Web Awesome](https://webawesome.com) CSS classes and design tokens.

## Features

### Class Name Completions

Autocomplete for `wa-*` utility classes inside `class` and `className` attributes. Start typing and matching classes appear instantly.

```html
<div class="wa-stack wa-gap-m">
<!--                   ^ completions for wa-gap-* -->
```

```tsx
<WaCard className="wa-padding-l wa-text-center">
<!--                               ^ completions for wa-text-* -->
```

### CSS Token Completions

Autocomplete for `--wa-*` CSS custom properties inside `var()` expressions. Includes token descriptions and resolved values.

```css
.my-component {
  color: var(--wa-color-text-normal);
  /*                ^ completions for --wa-color-* */
}
```

### Hover Previews

Hover over any `wa-*` class name to see its CSS declarations, or any `--wa-*` token to see its resolved value.

## Supported Languages

| Type   | Languages                                    |
|--------|----------------------------------------------|
| Markup | HTML, TypeScript, JavaScript, React (TSX/JSX), Vue |
| Styles | CSS, SCSS, Less                              |

## Configuration

| Setting                  | Default                  | Description                                |
|--------------------------|--------------------------|--------------------------------------------|
| `kigumi.enable`          | `true`                   | Enable or disable the extension            |
| `kigumi.classAttributes` | `["class", "className"]` | Attribute names to provide completions for |

## Requirements

- [Web Awesome](https://webawesome.com) CSS loaded in your project
- Works best with the [Kigumi CLI](https://kigumi.style) for generating component wrappers

## License

See [LICENSE.md](LICENSE.md).
