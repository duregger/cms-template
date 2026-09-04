import type {
  BrandTokens,
  BrandTokensSourceFormat,
  ColorScale,
  FontFamilyDef,
  ResponsiveFontSize,
  SemanticToken,
  TypeStyle,
} from '@/types/tokens'
import type { CmsSpace } from '@/types/cms'
import { resolveSemanticTokens } from '@/lib/token-resolve'

export type ImportSuccess = {
  ok: true
  format: BrandTokensSourceFormat
  tokens: BrandTokens
  warnings: string[]
}

export type ImportFailure = {
  ok: false
  format: BrandTokensSourceFormat | null
  errors: string[]
  warnings: string[]
}

export type ImportResult = ImportSuccess | ImportFailure

// ---------------------------------------------------------------------------
// Guards & small helpers
// ---------------------------------------------------------------------------

type Raw = Record<string, unknown>

function isObject(v: unknown): v is Raw {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function coerceStringRecord(v: unknown, path: string, errors: string[]): Record<string, string> {
  const out: Record<string, string> = {}
  if (!isObject(v)) {
    errors.push(`${path} must be an object.`)
    return out
  }
  for (const [k, val] of Object.entries(v)) {
    if (typeof val === 'string') out[k] = val
    else if (typeof val === 'number') out[k] = String(val)
    else errors.push(`${path}.${k} must be a string (got ${typeof val}).`)
  }
  return out
}

function toScaleName(prefix: string, key: string): string {
  const camel = key.replace(/[^a-zA-Z0-9]+(.)?/g, (_m, c: string | undefined) =>
    c ? c.toUpperCase() : '',
  )
  return prefix + camel.charAt(0).toUpperCase() + camel.slice(1)
}

// ---------------------------------------------------------------------------
// Shared field parsers
// ---------------------------------------------------------------------------

function parseColorScales(colors: Raw, path: string, errors: string[]): Record<string, ColorScale> {
  const scales: Record<string, ColorScale> = {}
  for (const [name, value] of Object.entries(colors)) {
    if (name === 'semantic') continue
    scales[name] = coerceStringRecord(value, `${path}.${name}`, errors)
  }
  return scales
}

function parseSemantic(v: unknown, path: string, errors: string[]): Record<string, SemanticToken> {
  const out: Record<string, SemanticToken> = {}
  if (!isObject(v)) {
    errors.push(`${path} must be an object.`)
    return out
  }
  for (const [name, token] of Object.entries(v)) {
    if (!isObject(token)) {
      errors.push(`${path}.${name} must be an object with a "type" field.`)
      continue
    }
    if (token.type === 'ref' && typeof token.ref === 'string') {
      out[name] = { type: 'ref', ref: token.ref }
    } else if (token.type === 'value' && typeof token.value === 'string') {
      out[name] = { type: 'value', value: token.value }
    } else {
      errors.push(
        `${path}.${name} must be either { type: "ref", ref } or { type: "value", value }.`,
      )
    }
  }
  return out
}

function parseResponsive(v: unknown, path: string, errors: string[]): ResponsiveFontSize[] | undefined {
  if (v === undefined) return undefined
  if (!Array.isArray(v)) {
    errors.push(`${path} must be an array.`)
    return undefined
  }
  const out: ResponsiveFontSize[] = []
  v.forEach((item, i) => {
    if (isObject(item) && typeof item.breakpoint === 'string' && typeof item.fontSize === 'string') {
      out.push({ breakpoint: item.breakpoint, fontSize: item.fontSize })
    } else {
      errors.push(`${path}[${i}] must be { breakpoint: string, fontSize: string }.`)
    }
  })
  return out
}

function parseTypeStyle(
  v: unknown,
  path: string,
  defaultFamily: string,
  errors: string[],
): TypeStyle | null {
  if (!isObject(v)) {
    errors.push(`${path} must be an object.`)
    return null
  }

  const fontFamily = typeof v.fontFamily === 'string' && v.fontFamily ? v.fontFamily : defaultFamily

  let fontSize = ''
  if (typeof v.fontSize === 'string') fontSize = v.fontSize
  else if (typeof v.fontSize === 'number') fontSize = `${v.fontSize}px`
  else errors.push(`${path}.fontSize is required.`)

  let fontWeight = 400
  if (typeof v.fontWeight === 'number') fontWeight = v.fontWeight
  else if (typeof v.fontWeight === 'string' && v.fontWeight.trim() !== '') fontWeight = Number(v.fontWeight)

  const lineHeight = typeof v.lineHeight === 'string' ? v.lineHeight : String(v.lineHeight ?? '100%')
  const letterSpacing =
    typeof v.letterSpacing === 'string' ? v.letterSpacing : String(v.letterSpacing ?? '0')
  const textDecoration = typeof v.textDecoration === 'string' ? v.textDecoration : 'none'

  const style: TypeStyle = {
    fontFamily,
    fontSize,
    fontWeight,
    lineHeight,
    letterSpacing,
    textDecoration,
  }
  if (typeof v.textTransform === 'string') style.textTransform = v.textTransform
  if (typeof v.margin === 'string') style.margin = v.margin
  if (typeof v.padding === 'string') style.padding = v.padding
  const responsive = parseResponsive(v.responsive, `${path}.responsive`, errors)
  if (responsive && responsive.length > 0) style.responsive = responsive

  return style
}

function parseIcons(v: unknown, path: string, errors: string[]): Record<string, { fontSize: string }> {
  const out: Record<string, { fontSize: string }> = {}
  if (v === undefined) return out
  if (!isObject(v)) {
    errors.push(`${path} must be an object.`)
    return out
  }
  for (const [name, entry] of Object.entries(v)) {
    if (isObject(entry) && typeof entry.fontSize === 'string') {
      out[name] = { fontSize: entry.fontSize }
    } else if (typeof entry === 'string') {
      out[name] = { fontSize: entry }
    } else {
      errors.push(`${path}.${name} must be { fontSize: string }.`)
    }
  }
  return out
}

// ---------------------------------------------------------------------------
// web-v1 normalizer (rich resolved theme with semantic ref/value tokens)
// ---------------------------------------------------------------------------

function normalizeWebV1(
  raw: Raw,
  space: CmsSpace,
  errors: string[],
  warnings: string[],
): BrandTokens {
  const colorsRaw = isObject(raw.colors) ? raw.colors : {}
  if (!isObject(raw.colors)) errors.push('colors must be an object.')

  const scales = parseColorScales(colorsRaw, 'colors', errors)
  const semantic = parseSemantic(colorsRaw.semantic, 'colors.semantic', errors)
  const { resolved: semanticResolved, errors: refErrors } = resolveSemanticTokens(semantic, scales)
  errors.push(...refErrors)

  const sizingRaw = isObject(raw.sizing) ? raw.sizing : {}
  if (!isObject(raw.sizing)) errors.push('sizing must be an object.')
  const sizing: BrandTokens['sizing'] = {}
  if (sizingRaw.layout !== undefined) sizing.layout = coerceStringRecord(sizingRaw.layout, 'sizing.layout', errors)
  if (sizingRaw.spacing !== undefined) sizing.spacing = coerceStringRecord(sizingRaw.spacing, 'sizing.spacing', errors)
  if (sizingRaw['border-radius'] !== undefined)
    sizing.borderRadius = coerceStringRecord(sizingRaw['border-radius'], 'sizing.border-radius', errors)
  if (sizingRaw.stroke !== undefined) sizing.stroke = coerceStringRecord(sizingRaw.stroke, 'sizing.stroke', errors)
  if (sizingRaw.elevation !== undefined)
    sizing.elevation = coerceStringRecord(sizingRaw.elevation, 'sizing.elevation', errors)

  const typographyRaw = isObject(raw.typography) ? raw.typography : {}
  if (!isObject(raw.typography)) errors.push('typography must be an object.')

  const fontFamilies: Record<string, FontFamilyDef> = {}
  if (isObject(typographyRaw.fontFamilies)) {
    for (const [name, stack] of Object.entries(typographyRaw.fontFamilies)) {
      if (typeof stack === 'string') {
        // Name-ref default: the consuming site loads these (Google / CDN).
        fontFamilies[name] = { stack, source: 'google' }
      } else {
        errors.push(`typography.fontFamilies.${name} must be a string.`)
      }
    }
  } else {
    errors.push('typography.fontFamilies must be an object.')
  }

  const scale: Record<string, TypeStyle> = {}
  if (isObject(typographyRaw.scale)) {
    for (const [name, entry] of Object.entries(typographyRaw.scale)) {
      const parsed = parseTypeStyle(entry, `typography.scale.${name}`, 'regular', errors)
      if (parsed) scale[name] = parsed
    }
  } else {
    errors.push('typography.scale must be an object.')
  }

  const icons = parseIcons(typographyRaw.icons, 'typography.icons', errors)

  return {
    version: 1,
    colors: { scales, semantic, semanticResolved },
    sizing,
    typography: { fontFamilies, scale, icons },
    meta: {
      space,
      sourceFormat: 'web-v1',
      warnings,
      updatedAt: Date.now(),
      updatedBy: '',
    },
  }
}

// ---------------------------------------------------------------------------
// app-v1 normalizer (simple resolved theme — adapted into the canonical shape)
// ---------------------------------------------------------------------------

/** Semantic layer synthesized for app-v1 inputs, which ship no semantic tokens. */
const APP_SEMANTIC_DEFAULTS: Record<string, SemanticToken> = {
  primary: { type: 'ref', ref: 'primary.500' },
  secondary: { type: 'ref', ref: 'secondary.500' },
  error: { type: 'ref', ref: 'error.500' },
  success: { type: 'ref', ref: 'success.500' },
  fontColor: { type: 'ref', ref: 'neutral.1000' },
  background: { type: 'ref', ref: 'neutral.0' },
  white: { type: 'value', value: '#fff' },
  black: { type: 'value', value: '#000' },
}

function nestedFontFamily(typography: Raw, role: string): string | undefined {
  const roleObj = typography[role]
  if (!isObject(roleObj)) return undefined
  const regular = roleObj.regular
  if (!isObject(regular)) return undefined
  return typeof regular.fontFamily === 'string' ? regular.fontFamily : undefined
}

function normalizeAppV1(
  raw: Raw,
  space: CmsSpace,
  errors: string[],
  warnings: string[],
): BrandTokens {
  const colorsRaw = isObject(raw.colors) ? raw.colors : {}
  if (!isObject(raw.colors)) errors.push('colors must be an object.')
  const scales = parseColorScales(colorsRaw, 'colors', errors)

  // Synthesize a semantic layer (app-v1 has none), then resolve against scales.
  const semantic: Record<string, SemanticToken> = { ...APP_SEMANTIC_DEFAULTS }
  const { resolved: semanticResolved, errors: refErrors } = resolveSemanticTokens(semantic, scales)
  // Only keep resolvable defaults; downgrade unresolved synthesized refs to warnings.
  const keptSemantic: Record<string, SemanticToken> = {}
  for (const [name, token] of Object.entries(semantic)) {
    if (name in semanticResolved) keptSemantic[name] = token
    else warnings.push(`Synthesized semantic "${name}" skipped — its target is missing in this token set.`)
  }
  void refErrors // synthesized refs are advisory, not fatal

  const sizing: BrandTokens['sizing'] = {}
  if (raw.spacing !== undefined) sizing.spacing = coerceStringRecord(raw.spacing, 'spacing', errors)
  if (raw.borderRadius !== undefined) sizing.borderRadius = coerceStringRecord(raw.borderRadius, 'borderRadius', errors)

  // components.button.borderRadius may carry a Tailwind class string.
  if (isObject(raw.components) && isObject(raw.components.button)) {
    const br = raw.components.button.borderRadius
    if (typeof br === 'string') {
      if (br === 'rounded-none') {
        sizing.borderRadius = { ...(sizing.borderRadius ?? {}), button: '0px' }
        warnings.push('Mapped components.button.borderRadius "rounded-none" → "0px".')
      } else {
        warnings.push(
          `components.button.borderRadius "${br}" is a Tailwind class and was not converted to a value; ignored.`,
        )
      }
    }
  }

  const typographyRaw = isObject(raw.typography) ? raw.typography : {}
  const fontFamilies: Record<string, FontFamilyDef> = {}
  const regularFamily = nestedFontFamily(typographyRaw, 'primary')
  const secondaryFamily = nestedFontFamily(typographyRaw, 'secondary')
  if (regularFamily) {
    fontFamilies.regular = { stack: `'${regularFamily}', sans-serif`, source: 'system' }
    // heading mirrors regular so scale entries referencing "heading" still resolve.
    fontFamilies.heading = { stack: `'${regularFamily}', sans-serif`, source: 'system' }
    warnings.push(
      `Font family "${regularFamily}" imported as a name-ref (source: system). Upload a font file if the site doesn't already load it.`,
    )
  } else {
    errors.push('typography.primary.regular.fontFamily is required for app-v1.')
  }
  if (secondaryFamily) {
    // Decision: app "secondary" maps to the canonical "sans" role.
    fontFamilies.sans = { stack: `'${secondaryFamily}', sans-serif`, source: 'system' }
    warnings.push(
      `Font family "${secondaryFamily}" imported as a name-ref (source: system). Upload a font file if the site doesn't already load it.`,
    )
  }

  const scale: Record<string, TypeStyle> = {}
  if (isObject(raw.fontSizes)) {
    for (const [key, tuple] of Object.entries(raw.fontSizes)) {
      if (!Array.isArray(tuple) || tuple.length < 1) {
        errors.push(`fontSizes.${key} must be a [size, options?] tuple.`)
        continue
      }
      const size = tuple[0]
      const opts = tuple[1]
      const fontSize = typeof size === 'string' ? size : typeof size === 'number' ? `${size}px` : ''
      if (!fontSize) {
        errors.push(`fontSizes.${key}[0] must be a size string.`)
        continue
      }
      const lineHeight = isObject(opts) && typeof opts.lineHeight === 'string' ? opts.lineHeight : '100%'
      const letterSpacing = isObject(opts) && typeof opts.letterSpacing === 'string' ? opts.letterSpacing : '0'
      scale[toScaleName('body', key)] = {
        fontFamily: 'regular',
        fontSize,
        fontWeight: 400,
        lineHeight,
        letterSpacing,
        textDecoration: 'none',
      }
    }
  } else {
    errors.push('fontSizes must be an object for app-v1.')
  }

  return {
    version: 1,
    colors: { scales, semantic: keptSemantic, semanticResolved },
    sizing,
    typography: { fontFamilies, scale, icons: {} },
    meta: {
      space,
      sourceFormat: 'app-v1',
      warnings,
      updatedAt: Date.now(),
      updatedBy: '',
    },
  }
}

// ---------------------------------------------------------------------------
// Detection, final validation, public entry point
// ---------------------------------------------------------------------------

export function detectFormat(raw: unknown): BrandTokensSourceFormat | null {
  if (!isObject(raw)) return null
  if (isObject(raw.colors) && isObject(raw.colors.semantic) && isObject(raw.sizing)) return 'web-v1'
  if (isObject(raw.fontSizes) || isObject(raw.components) || (isObject(raw.spacing) && isObject(raw.borderRadius)))
    return 'app-v1'
  return null
}

/** Cross-checks that every type style references a defined font family. */
function validateBrandTokens(tokens: BrandTokens, errors: string[], warnings: string[]): void {
  if (Object.keys(tokens.colors.scales).length === 0) errors.push('No colour scales were parsed.')
  if (Object.keys(tokens.typography.fontFamilies).length === 0) errors.push('No font families were parsed.')

  for (const [name, style] of Object.entries(tokens.typography.scale)) {
    if (!(style.fontFamily in tokens.typography.fontFamilies)) {
      warnings.push(
        `typography.scale.${name} references font family "${style.fontFamily}", which is not defined; it will fall back at runtime.`,
      )
    }
  }
}

/**
 * Import & normalize a raw brand JSON (string or parsed object) into a validated
 * `BrandTokens` for the given space.
 */
export function importBrandTokens(
  input: unknown,
  space: CmsSpace,
  forcedFormat?: BrandTokensSourceFormat,
): ImportResult {
  let raw: unknown = input
  if (typeof input === 'string') {
    try {
      raw = JSON.parse(input)
    } catch (e) {
      return {
        ok: false,
        format: null,
        errors: [`Invalid JSON: ${e instanceof Error ? e.message : String(e)}`],
        warnings: [],
      }
    }
  }

  const format = forcedFormat ?? detectFormat(raw)
  if (!format) {
    return {
      ok: false,
      format: null,
      errors: [
        'Unrecognized token format. Expected a web-v1 file (colors.semantic + sizing) or an app-v1 file (fontSizes / spacing + borderRadius).',
      ],
      warnings: [],
    }
  }
  if (!isObject(raw)) {
    return { ok: false, format, errors: ['Top-level token JSON must be an object.'], warnings: [] }
  }

  const errors: string[] = []
  const warnings: string[] = []
  const tokens =
    format === 'web-v1'
      ? normalizeWebV1(raw, space, errors, warnings)
      : normalizeAppV1(raw, space, errors, warnings)

  validateBrandTokens(tokens, errors, warnings)
  tokens.meta.warnings = warnings

  if (errors.length > 0) {
    return { ok: false, format, errors, warnings }
  }
  return { ok: true, format, tokens, warnings }
}
