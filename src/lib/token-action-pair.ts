import { contrastRatio, meetsWcagAa, WCAG_AA_NORMAL } from '@/lib/token-contrast'
import { reResolve } from '@/lib/token-edit'
import type { BrandTokens, SemanticToken } from '@/types/tokens'

const FILL = 'surface-action-primary'
const TEXT_ON = 'text-on-action'
const ICON_ON = 'icon-on-action'
const TITLE = 'text-title'
const DARK_FILL = 'dark-surface-action-primary'
const DARK_TEXT_ON = 'dark-text-on-action'
const DARK_ICON_ON = 'dark-icon-on-action'
const WHITE = '#FFFFFF'
const BLACK = '#000000'

export type ActionPairStatus = {
  fillName: string
  fill: string | null
  inkName: string
  ink: string | null
  ratio: number | null
  passes: boolean
}

function resolvedHex(tokens: BrandTokens, name: string): string | undefined {
  return tokens.colors.semanticResolved[name]
}

function scaleHex(tokens: BrandTokens, scale: string, step: string): string | undefined {
  return tokens.colors.scales[scale]?.[step]
}

function pickOnActionInk(fill: string, titleInk?: string): { token: SemanticToken; hex: string } {
  const candidates: { token: SemanticToken; hex: string }[] = []
  if (titleInk) candidates.push({ token: { type: 'ref', ref: TITLE }, hex: titleInk })
  candidates.push({ token: { type: 'value', value: BLACK }, hex: BLACK })
  candidates.push({ token: { type: 'value', value: WHITE }, hex: WHITE })

  const passing = candidates.filter((c) => meetsWcagAa(c.hex, fill))
  if (passing[0]) return passing[0]

  let best = candidates[candidates.length - 1]!
  let bestRatio = contrastRatio(best.hex, fill) ?? 0
  for (const c of candidates) {
    const ratio = contrastRatio(c.hex, fill) ?? 0
    if (ratio > bestRatio) {
      best = c
      bestRatio = ratio
    }
  }
  return best
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

function linkFillToPrimary(tokens: BrandTokens, fillName: string): BrandTokens {
  const primary500 = scaleHex(tokens, 'primary', '500')
  const current = tokens.colors.semantic[fillName]
  if (!primary500) {
    if (current) return tokens
    return setSemantic(tokens, fillName, { type: 'ref', ref: 'primary.500' })
  }
  if (!current) return setSemantic(tokens, fillName, { type: 'ref', ref: 'primary.500' })
  if (current.type === 'ref' && (current.ref === 'primary.500' || current.ref === 'primary')) {
    return tokens
  }
  const resolved = resolvedHex(tokens, fillName)
  if (current.type === 'value' && resolved && resolved.toLowerCase() === primary500.toLowerCase()) {
    return setSemantic(tokens, fillName, { type: 'ref', ref: 'primary.500' })
  }
  return tokens
}

function applyOnePair(
  tokens: BrandTokens,
  fillName: string,
  textName: string,
  iconName: string,
): BrandTokens {
  let next = linkFillToPrimary(tokens, fillName)
  next = reResolve(next)
  const fill = resolvedHex(next, fillName) ?? scaleHex(next, 'primary', '500')
  if (!fill) return next

  const ink = pickOnActionInk(fill, resolvedHex(next, TITLE))
  next = setSemantic(next, textName, ink.token)
  next = setSemantic(next, iconName, { type: 'ref', ref: textName })
  return reResolve(next)
}

/**
 * Keep the public action fill and on-action ink as a token pair.
 * Fill tracks primary 500 when it already matches. Ink is the first
 * existing token (title ink, then black, then white) that clears 4.5:1.
 */
export function applyActionContrastPair(tokens: BrandTokens): BrandTokens {
  let next = applyOnePair(tokens, FILL, TEXT_ON, ICON_ON)
  if (next.colors.semantic[DARK_FILL] || next.colors.semantic[DARK_TEXT_ON]) {
    next = applyOnePair(next, DARK_FILL, DARK_TEXT_ON, DARK_ICON_ON)
  }
  return next
}

export function actionPairStatus(tokens: BrandTokens): ActionPairStatus {
  const fill = resolvedHex(tokens, FILL) ?? scaleHex(tokens, 'primary', '500') ?? null
  const ink = resolvedHex(tokens, TEXT_ON) ?? null
  const ratio = fill && ink ? contrastRatio(ink, fill) : null
  return {
    fillName: FILL,
    fill,
    inkName: TEXT_ON,
    ink,
    ratio,
    passes: ratio !== null && ratio >= WCAG_AA_NORMAL,
  }
}
