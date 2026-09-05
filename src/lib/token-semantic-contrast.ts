import { applyActionContrastPair } from '@/lib/token-action-pair'
import { contrastRatio, formatContrast, WCAG_AA_NORMAL } from '@/lib/token-contrast'
import { reResolve } from '@/lib/token-edit'
import type { BrandTokens, SemanticToken } from '@/types/tokens'

/** WCAG 2 AA for UI / icons / borders. */
export const WCAG_AA_UI = 3

const PAGE_STEPS = ['500', '600', '700', '800', '900', '950'] as const

type ContrastFamily = {
  tokens: string[]
  scale: string
  surfaces: string[]
  min: number
}

/**
 * Text and chrome that sit on the page (or a matching tint).
 * Solid fills use text-on-action, not these tokens.
 */
const READABLE_FAMILIES: ContrastFamily[] = [
  {
    tokens: ['text-action', 'text-action-hover', 'text-action-pressed'],
    scale: 'primary',
    surfaces: ['surface-page', 'surface-action-secondary'],
    min: WCAG_AA_NORMAL,
  },
  {
    tokens: ['text-error', 'text-error-hover', 'text-error-pressed'],
    scale: 'error',
    surfaces: ['surface-page', 'surface-error-secondary'],
    min: WCAG_AA_NORMAL,
  },
  {
    tokens: ['text-warning'],
    scale: 'warning',
    surfaces: ['surface-page', 'surface-warning'],
    min: WCAG_AA_NORMAL,
  },
  {
    tokens: ['text-success'],
    scale: 'success',
    surfaces: ['surface-page', 'surface-success'],
    min: WCAG_AA_NORMAL,
  },
  {
    tokens: ['text-information'],
    scale: 'information',
    surfaces: ['surface-page', 'surface-information'],
    min: WCAG_AA_NORMAL,
  },
  {
    tokens: ['icon-action', 'icon-action-hover', 'icon-action-pressed'],
    scale: 'primary',
    surfaces: ['surface-page'],
    min: WCAG_AA_UI,
  },
  {
    tokens: ['border-action'],
    scale: 'primary',
    surfaces: ['surface-page'],
    min: WCAG_AA_UI,
  },
]

export type SemanticContrastIssue = {
  name: string
  hex: string
  surface: string
  surfaceHex: string
  ratio: number | null
  min: number
  label: string
}

function surfaceHex(tokens: BrandTokens, name: string): string | undefined {
  return tokens.colors.semanticResolved[name] ?? (name === 'surface-page' ? '#FFFFFF' : undefined)
}

function familyFails(tokens: BrandTokens, family: ContrastFamily): boolean {
  const surfaces = family.surfaces
    .map((name) => [name, surfaceHex(tokens, name)] as const)
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
  if (surfaces.length === 0) return false
  return family.tokens.some((name) => {
    const hex = tokens.colors.semanticResolved[name]
    if (!hex) return false
    return surfaces.some(([, bg]) => {
      const ratio = contrastRatio(hex, bg)
      return ratio === null || ratio < family.min
    })
  })
}

function passingSteps(tokens: BrandTokens, family: ContrastFamily): string[] {
  const ramp = tokens.colors.scales[family.scale]
  if (!ramp) return []
  const backgrounds = family.surfaces
    .map((name) => surfaceHex(tokens, name))
    .filter((hex): hex is string => Boolean(hex))
  if (backgrounds.length === 0) return []
  return PAGE_STEPS.filter((step) => {
    const hex = ramp[step]
    if (!hex) return false
    return backgrounds.every((bg) => {
      const ratio = contrastRatio(hex, bg)
      return ratio !== null && ratio >= family.min
    })
  })
}

function setSemantic(tokens: BrandTokens, name: string, token: SemanticToken): BrandTokens {
  return {
    ...tokens,
    colors: {
      ...tokens.colors,
      semantic: { ...tokens.colors.semantic, [name]: token },
    },
  }
}

function applyFamily(tokens: BrandTokens, family: ContrastFamily): BrandTokens {
  const exists = family.tokens.some((name) => name in tokens.colors.semantic)
  if (!exists) return tokens
  if (!familyFails(tokens, family)) return tokens
  const steps = passingSteps(tokens, family)
  if (steps.length === 0) return tokens
  let next = tokens
  family.tokens.forEach((name, i) => {
    if (!(name in next.colors.semantic) && !next.colors.semanticResolved[name]) return
    const step = steps[Math.min(i, steps.length - 1)]
    if (!step) return
    next = setSemantic(next, name, { type: 'ref', ref: `${family.scale}.${step}` })
  })
  return reResolve(next)
}

/** Darken page-readable text / action chrome until each intended surface clears AA. */
export function applyReadableTextTokens(tokens: BrandTokens): BrandTokens {
  return READABLE_FAMILIES.reduce(applyFamily, tokens)
}

/** Publish-time ADA pass: readable text tokens, then the action fill/ink pair. */
export function applyPublishedContrast(tokens: BrandTokens): BrandTokens {
  return applyActionContrastPair(applyReadableTextTokens(tokens))
}

export function semanticContrastIssues(tokens: BrandTokens): SemanticContrastIssue[] {
  const issues: SemanticContrastIssue[] = []
  for (const family of READABLE_FAMILIES) {
    for (const name of family.tokens) {
      const hex = tokens.colors.semanticResolved[name]
      if (!hex) continue
      for (const surface of family.surfaces) {
        const bg = surfaceHex(tokens, surface)
        if (!bg) continue
        const ratio = contrastRatio(hex, bg)
        if (ratio !== null && ratio >= family.min) continue
        issues.push({
          name,
          hex,
          surface,
          surfaceHex: bg,
          ratio,
          min: family.min,
          label: `${name} is ${formatContrast(ratio)} on ${surface}. Needs ${family.min}:1.`,
        })
      }
    }
  }
  return issues
}
