import type { BrandTokens, TypeStyle } from '@/types/tokens'

/**
 * Flatten BrandTokens into CSS custom properties.
 *
 * This is the consume contract. The REST API (`?format=css` / `?format=stylesheet`)
 * emits the same keys. A consumer site applies the map to `:root` at runtime so a
 * CMS publish updates the live site without a rebuild.
 *
 *   --color-<scale>-<step>              e.g. --color-primary-500
 *   --color-semantic-<name>             e.g. --color-semantic-surface-page
 *   --space-<key> / --radius-<key> / --stroke-<key> / --elevation-<key> / --layout-<key>
 *   --font-family-<role>                e.g. --font-family-heading
 *   --type-<name>                       shorthand: weight size/line-height family
 *   --type-<name>-size|weight|line-height|letter-spacing|family|decoration|transform
 *   --type-<name>-size-<breakpoint>     responsive font sizes
 *   --icon-<name>                       icon box size
 */
export function brandTokensToCssVars(tokens: BrandTokens): Record<string, string> {
  const vars: Record<string, string> = {}

  for (const [scale, ramp] of Object.entries(tokens.colors.scales)) {
    for (const [step, value] of Object.entries(ramp)) {
      vars[`--color-${scale}-${step}`] = value
    }
  }
  for (const [name, value] of Object.entries(tokens.colors.semanticResolved)) {
    vars[`--color-semantic-${name}`] = value
  }

  const sizingGroups: [keyof BrandTokens['sizing'], string][] = [
    ['spacing', 'space'],
    ['borderRadius', 'radius'],
    ['stroke', 'stroke'],
    ['elevation', 'elevation'],
    ['layout', 'layout'],
  ]
  for (const [group, prefix] of sizingGroups) {
    const record = tokens.sizing[group]
    if (!record) continue
    for (const [key, value] of Object.entries(record)) {
      vars[`--${prefix}-${key}`] = value
    }
  }

  for (const [role, def] of Object.entries(tokens.typography.fontFamilies)) {
    vars[`--font-family-${role}`] = def.stack
  }

  for (const [name, style] of Object.entries(tokens.typography.scale)) {
    writeTypeStyleVars(vars, name, style)
  }

  for (const [name, { fontSize }] of Object.entries(tokens.typography.icons)) {
    vars[iconVarName(name)] = fontSize
  }

  return vars
}

function iconVarName(name: string): string {
  return name.startsWith('icon') ? `--${name}` : `--icon-${name}`
}

function writeTypeStyleVars(
  vars: Record<string, string>,
  name: string,
  style: TypeStyle,
): void {
  const family = `var(--font-family-${style.fontFamily})`
  vars[`--type-${name}-family`] = family
  vars[`--type-${name}-size`] = style.fontSize
  vars[`--type-${name}-weight`] = String(style.fontWeight)
  vars[`--type-${name}-line-height`] = style.lineHeight
  vars[`--type-${name}-letter-spacing`] = style.letterSpacing
  vars[`--type-${name}-decoration`] = style.textDecoration
  if (style.textTransform) vars[`--type-${name}-transform`] = style.textTransform
  if (style.margin) vars[`--type-${name}-margin`] = style.margin
  if (style.padding) vars[`--type-${name}-padding`] = style.padding
  vars[`--type-${name}`] = `${style.fontWeight} ${style.fontSize}/${style.lineHeight} ${family}`
  for (const bp of style.responsive ?? []) {
    vars[`--type-${name}-size-${bp.breakpoint}`] = bp.fontSize
  }
}

/** Apply a CSS-variable map to an element (usually `document.documentElement`). */
export function applyCssVars(
  target: HTMLElement,
  vars: Record<string, string>,
): void {
  for (const [name, value] of Object.entries(vars)) {
    target.style.setProperty(name, value)
  }
}

/** `:root { … }` stylesheet for `?format=stylesheet`. */
export function cssVarsToStylesheet(vars: Record<string, string>): string {
  const body = Object.entries(vars)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join('\n')
  return `:root {\n${body}\n}\n`
}
