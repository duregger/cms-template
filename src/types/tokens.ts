import type { CmsSpace } from '@/types/cms'

/**
 * Canonical brand-token model ("BrandTokens").
 *
 * This is the frozen contract shared between the CMS (which PRODUCES tokens by
 * importing a brand JSON and publishing) and the consuming sites (which CONSUME
 * the published tokens and apply them as CSS custom properties).
 *
 * Two upload variants are normalized INTO this shape by the importer:
 *   • `web-v1` — rich resolved theme with typed `semantic` ref/value tokens.
 *   • `app-v1` — simpler resolved theme (flat spacing/radius, tuple font sizes).
 */

/** A numeric colour ramp, e.g. `{ "500": "#4f1bbf" }`. Keys are open-ended. */
export type ColorScale = Record<string, string>

/**
 * A semantic colour token is either a reference into a colour scale (or another
 * semantic token) or a literal value. The importer resolves every ref down to a
 * concrete value in `colors.semanticResolved`.
 */
export type SemanticToken =
  | { type: 'ref'; ref: string }
  | { type: 'value'; value: string }

export type ResponsiveFontSize = {
  breakpoint: string
  fontSize: string
}

export type TypeStyle = {
  /** Key into `typography.fontFamilies` (e.g. "regular" | "heading" | "sans"). */
  fontFamily: string
  fontSize: string
  fontWeight: number
  lineHeight: string
  letterSpacing: string
  textDecoration: string
  textTransform?: string
  margin?: string
  padding?: string
  responsive?: ResponsiveFontSize[]
}

/** A single self-hosted font file, used when `FontFamilyDef.source === 'uploaded'`. */
export type FontFace = {
  /** Must match the primary family named in the parent `stack`. */
  family: string
  /** Firebase Storage download URL (woff2 / otf / ttf). */
  url: string
  format?: string
  weight?: string
  style?: 'normal' | 'italic'
  display?: string
}

/**
 * A font family definition supporting BOTH resolution paths:
 *   • name-ref  — the consuming site already loads the family (Google/CDN/system).
 *   • uploaded  — self-hosted files stored in Firebase Storage; the site injects
 *                 an `@font-face` for each entry in `faces` before applying vars.
 */
export type FontFamilyDef = {
  /** CSS font-family value, e.g. "'Montserrat', sans-serif". */
  stack: string
  source: 'system' | 'google' | 'uploaded'
  /** Present only for self-hosted families (`source === 'uploaded'`). */
  faces?: FontFace[]
}

export type BrandTokensColors = {
  /** Numbered colour scales: primary/secondary/tertiary/neutral/error/success/brand. */
  scales: Record<string, ColorScale>
  /** Authored semantic tokens (kept so the editor can round-trip refs). */
  semantic: Record<string, SemanticToken>
  /** Importer output: semantic name → concrete resolved value. */
  semanticResolved: Record<string, string>
}

export type BrandTokensSizing = {
  /** Named layout heights, e.g. `header-height: "89px"`. */
  layout?: Record<string, string>
  spacing?: Record<string, string>
  /** Normalized from the source `border-radius` group. */
  borderRadius?: Record<string, string>
  stroke?: Record<string, string>
  /** CSS `drop-shadow(...)` filter strings, stored verbatim. */
  elevation?: Record<string, string>
}

export type BrandTokensTypography = {
  fontFamilies: Record<string, FontFamilyDef>
  scale: Record<string, TypeStyle>
  icons: Record<string, { fontSize: string }>
}

export type BrandTokensSourceFormat = 'web-v1' | 'app-v1'

export type BrandTokensMeta = {
  space: CmsSpace
  sourceFormat: BrandTokensSourceFormat
  /** Pointer to the raw uploaded JSON in Storage (for re-download / audit). */
  rawStoragePath?: string
  /** Non-fatal import notes surfaced in the CMS preview. */
  warnings?: string[]
  updatedAt: number
  updatedBy: string
}

export type BrandTokens = {
  version: 1
  colors: BrandTokensColors
  sizing: BrandTokensSizing
  typography: BrandTokensTypography
  meta: BrandTokensMeta
}
