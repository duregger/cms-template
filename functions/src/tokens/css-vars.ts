type TokenRecord = Record<string, unknown>
export type StringRecord = Record<string, string>

function asRecord(value: unknown): TokenRecord | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as TokenRecord)
    : undefined
}

function stringMap(value: unknown): StringRecord {
  const out: StringRecord = {}
  const record = asRecord(value)
  if (!record) return out
  for (const [key, val] of Object.entries(record)) {
    if (typeof val === 'string') out[key] = val
    else if (typeof val === 'number') out[key] = String(val)
  }
  return out
}

function iconVarName(name: string): string {
  return name.startsWith('icon') ? `--${name}` : `--icon-${name}`
}

/**
 * Same CSS custom-property map as `src/lib/token-css.ts` on the CMS.
 * Keep the two files in lockstep — this is the site consume contract.
 */
export function tokensToCssVars(tokens: TokenRecord): StringRecord {
  const vars: StringRecord = {}
  const colors = asRecord(tokens.colors)
  const scales = asRecord(colors?.scales)
  if (scales) {
    for (const [scale, ramp] of Object.entries(scales)) {
      for (const [step, value] of Object.entries(stringMap(ramp))) {
        vars[`--color-${scale}-${step}`] = value
      }
    }
  }
  for (const [name, value] of Object.entries(stringMap(colors?.semanticResolved))) {
    vars[`--color-semantic-${name}`] = value
  }

  const sizing = asRecord(tokens.sizing)
  const groups: [string, string][] = [
    ['spacing', 'space'],
    ['borderRadius', 'radius'],
    ['stroke', 'stroke'],
    ['elevation', 'elevation'],
    ['layout', 'layout'],
  ]
  for (const [group, prefix] of groups) {
    for (const [key, value] of Object.entries(stringMap(sizing?.[group]))) {
      vars[`--${prefix}-${key}`] = value
    }
  }

  const typography = asRecord(tokens.typography)
  const families = asRecord(typography?.fontFamilies)
  if (families) {
    for (const [role, def] of Object.entries(families)) {
      const stack = asRecord(def)?.stack
      if (typeof stack === 'string') vars[`--font-family-${role}`] = stack
    }
  }

  const scale = asRecord(typography?.scale)
  if (scale) {
    for (const [name, raw] of Object.entries(scale)) {
      const style = asRecord(raw)
      if (!style) continue
      const familyRole = typeof style.fontFamily === 'string' ? style.fontFamily : 'regular'
      const family = `var(--font-family-${familyRole})`
      const fontSize = typeof style.fontSize === 'string' ? style.fontSize : String(style.fontSize ?? '')
      const fontWeight = typeof style.fontWeight === 'number' || typeof style.fontWeight === 'string'
        ? String(style.fontWeight)
        : '400'
      const lineHeight = typeof style.lineHeight === 'string' ? style.lineHeight : String(style.lineHeight ?? '100%')
      const letterSpacing =
        typeof style.letterSpacing === 'string' ? style.letterSpacing : String(style.letterSpacing ?? '0')
      const decoration = typeof style.textDecoration === 'string' ? style.textDecoration : 'none'
      vars[`--type-${name}-family`] = family
      vars[`--type-${name}-size`] = fontSize
      vars[`--type-${name}-weight`] = fontWeight
      vars[`--type-${name}-line-height`] = lineHeight
      vars[`--type-${name}-letter-spacing`] = letterSpacing
      vars[`--type-${name}-decoration`] = decoration
      if (typeof style.textTransform === 'string') vars[`--type-${name}-transform`] = style.textTransform
      if (typeof style.margin === 'string') vars[`--type-${name}-margin`] = style.margin
      if (typeof style.padding === 'string') vars[`--type-${name}-padding`] = style.padding
      vars[`--type-${name}`] = `${fontWeight} ${fontSize}/${lineHeight} ${family}`
      if (Array.isArray(style.responsive)) {
        for (const item of style.responsive) {
          const bp = asRecord(item)
          if (bp && typeof bp.breakpoint === 'string' && typeof bp.fontSize === 'string') {
            vars[`--type-${name}-size-${bp.breakpoint}`] = bp.fontSize
          }
        }
      }
    }
  }

  const icons = asRecord(typography?.icons)
  if (icons) {
    for (const [name, raw] of Object.entries(icons)) {
      const entry = asRecord(raw)
      const fontSize =
        (entry && typeof entry.fontSize === 'string' && entry.fontSize) ||
        (typeof raw === 'string' ? raw : undefined)
      if (fontSize) vars[iconVarName(name)] = fontSize
    }
  }

  return vars
}

export function cssVarsToStylesheet(vars: StringRecord): string {
  const body = Object.entries(vars)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join('\n')
  return `:root {\n${body}\n}\n`
}
