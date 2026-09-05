import { resolveSemanticTokens } from '@/lib/token-resolve'
import type { CmsSpace } from '@/types/cms'
import type {
  BrandTokens,
  BrandTokensSizing,
  FontFamilyDef,
  SemanticToken,
  TypeStyle,
} from '@/types/tokens'

export function emptyBrandTokens(space: CmsSpace): BrandTokens {
  return {
    version: 1,
    colors: { scales: {}, semantic: {}, semanticResolved: {} },
    sizing: {},
    typography: { fontFamilies: {}, scale: {}, icons: {} },
    meta: {
      space,
      sourceFormat: 'web-v1',
      updatedAt: 0,
      updatedBy: '',
      warnings: [],
    },
  }
}

export function reResolve(tokens: BrandTokens): BrandTokens {
  const { resolved } = resolveSemanticTokens(tokens.colors.semantic, tokens.colors.scales)
  return {
    ...tokens,
    colors: { ...tokens.colors, semanticResolved: resolved },
  }
}

function sanitizeKey(raw: string): string {
  return raw.trim().replace(/\s+/g, '-')
}

export function setScaleValue(
  tokens: BrandTokens,
  scale: string,
  step: string,
  value: string,
): BrandTokens {
  const ramp = { ...(tokens.colors.scales[scale] ?? {}), [step]: value }
  return reResolve({
    ...tokens,
    colors: {
      ...tokens.colors,
      scales: { ...tokens.colors.scales, [scale]: ramp },
    },
  })
}

export function removeScaleValue(tokens: BrandTokens, scale: string, step: string): BrandTokens {
  const ramp = { ...(tokens.colors.scales[scale] ?? {}) }
  delete ramp[step]
  const scales = { ...tokens.colors.scales }
  if (Object.keys(ramp).length === 0) delete scales[scale]
  else scales[scale] = ramp
  return reResolve({ ...tokens, colors: { ...tokens.colors, scales } })
}

function nearestScaleColor(ramp: Record<string, string>, step: string): string {
  const entries = Object.entries(ramp)
  if (entries.length === 0) return '#000000'
  const target = Number(step)
  if (Number.isNaN(target)) return entries[0]?.[1] ?? '#000000'
  let best = entries[0]?.[1] ?? '#000000'
  let bestDist = Number.POSITIVE_INFINITY
  for (const [key, value] of entries) {
    const n = Number(key)
    const dist = Number.isNaN(n) ? Number.POSITIVE_INFINITY : Math.abs(n - target)
    if (dist < bestDist) {
      bestDist = dist
      best = value
    }
  }
  return best
}

export function addScaleValue(tokens: BrandTokens, scale: string, step: string): BrandTokens {
  const s = sanitizeKey(scale)
  const st = sanitizeKey(step)
  if (!s || !st || tokens.colors.scales[s]?.[st] !== undefined) return tokens
  const seed = nearestScaleColor(tokens.colors.scales[s] ?? {}, st)
  return setScaleValue(tokens, s, st, seed)
}

export function setSemanticToken(
  tokens: BrandTokens,
  name: string,
  token: SemanticToken,
): BrandTokens {
  return reResolve({
    ...tokens,
    colors: {
      ...tokens.colors,
      semantic: { ...tokens.colors.semantic, [name]: token },
    },
  })
}

export function addSemanticToken(tokens: BrandTokens, name: string): BrandTokens {
  const key = sanitizeKey(name)
  if (!key || tokens.colors.semantic[key]) return tokens
  return setSemanticToken(tokens, key, { type: 'value', value: '#000000' })
}

export function removeSemanticToken(tokens: BrandTokens, name: string): BrandTokens {
  const semantic = { ...tokens.colors.semantic }
  delete semantic[name]
  return reResolve({ ...tokens, colors: { ...tokens.colors, semantic } })
}

export function setSizingValue(
  tokens: BrandTokens,
  group: keyof BrandTokensSizing,
  key: string,
  value: string,
): BrandTokens {
  return {
    ...tokens,
    sizing: {
      ...tokens.sizing,
      [group]: { ...(tokens.sizing[group] ?? {}), [key]: value },
    },
  }
}

export function addSizingValue(
  tokens: BrandTokens,
  group: keyof BrandTokensSizing,
  key: string,
): BrandTokens {
  const k = sanitizeKey(key)
  if (!k || tokens.sizing[group]?.[k] !== undefined) return tokens
  return setSizingValue(tokens, group, k, '0px')
}

export function removeSizingValue(
  tokens: BrandTokens,
  group: keyof BrandTokensSizing,
  key: string,
): BrandTokens {
  const next = { ...(tokens.sizing[group] ?? {}) }
  delete next[key]
  const sizing = { ...tokens.sizing }
  if (Object.keys(next).length === 0) delete sizing[group]
  else sizing[group] = next
  return { ...tokens, sizing }
}

export function setFontFamilyStack(
  tokens: BrandTokens,
  role: string,
  stack: string,
): BrandTokens {
  const existing = tokens.typography.fontFamilies[role]
  const next: FontFamilyDef = existing
    ? { ...existing, stack }
    : { stack, source: 'google' }
  return {
    ...tokens,
    typography: {
      ...tokens.typography,
      fontFamilies: { ...tokens.typography.fontFamilies, [role]: next },
    },
  }
}

export function addFontFamily(tokens: BrandTokens, role: string): BrandTokens {
  const key = sanitizeKey(role)
  if (!key || tokens.typography.fontFamilies[key]) return tokens
  return setFontFamilyStack(tokens, key, 'sans-serif')
}

export function removeFontFamily(tokens: BrandTokens, role: string): BrandTokens {
  const fontFamilies = { ...tokens.typography.fontFamilies }
  delete fontFamilies[role]
  return { ...tokens, typography: { ...tokens.typography, fontFamilies } }
}

export function setTypeStyle(
  tokens: BrandTokens,
  name: string,
  patch: Partial<TypeStyle>,
): BrandTokens {
  const current = tokens.typography.scale[name]
  if (!current) return tokens
  return {
    ...tokens,
    typography: {
      ...tokens.typography,
      scale: { ...tokens.typography.scale, [name]: { ...current, ...patch } },
    },
  }
}

export function addTypeStyle(tokens: BrandTokens, name: string): BrandTokens {
  const key = sanitizeKey(name)
  if (!key || tokens.typography.scale[key]) return tokens
  const family = Object.keys(tokens.typography.fontFamilies)[0] ?? 'regular'
  const style: TypeStyle = {
    fontFamily: family,
    fontSize: '16px',
    fontWeight: 400,
    lineHeight: '24px',
    letterSpacing: '0',
    textDecoration: 'none',
  }
  return {
    ...tokens,
    typography: {
      ...tokens.typography,
      scale: { ...tokens.typography.scale, [key]: style },
    },
  }
}

export function removeTypeStyle(tokens: BrandTokens, name: string): BrandTokens {
  const scale = { ...tokens.typography.scale }
  delete scale[name]
  return { ...tokens, typography: { ...tokens.typography, scale } }
}

export function setIconSize(tokens: BrandTokens, name: string, fontSize: string): BrandTokens {
  return {
    ...tokens,
    typography: {
      ...tokens.typography,
      icons: { ...tokens.typography.icons, [name]: { fontSize } },
    },
  }
}

export function addIconSize(tokens: BrandTokens, name: string): BrandTokens {
  const key = sanitizeKey(name)
  if (!key || tokens.typography.icons[key]) return tokens
  return setIconSize(tokens, key, '16px')
}

export function removeIconSize(tokens: BrandTokens, name: string): BrandTokens {
  const icons = { ...tokens.typography.icons }
  delete icons[name]
  return { ...tokens, typography: { ...tokens.typography, icons } }
}

const HEX6 = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/
const HEX3 = /^#([0-9a-fA-F]{3})$/

export function isHexColor(value: string): boolean {
  return HEX6.test(value.trim()) || HEX3.test(value.trim())
}

export function hexForPicker(value: string): string {
  const v = value.trim()
  const short = v.match(HEX3)
  if (short?.[1]) {
    const hex = short[1]
    const a = hex[0]
    const b = hex[1]
    const c = hex[2]
    if (!a || !b || !c) return '#000000'
    return `#${a}${a}${b}${b}${c}${c}`
  }
  if (HEX6.test(v)) return v.slice(0, 7)
  return '#000000'
}
