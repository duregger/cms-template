import type { BrandTokens, ColorScale } from '@/types/tokens'

const ROLE_SCALES = [
  'primary',
  'secondary',
  'tertiary',
  'vertexBrand',
  'neutral',
  'success',
  'information',
  'warning',
  'error',
]

const SCALE_LABELS: Record<string, string> = {
  vertexBrand: 'Secondary Color',
  secondary: 'Secondary Color',
}

export function titleFromKey(key: string): string {
  return (
    SCALE_LABELS[key] ??
    key
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
  )
}

export function sortScaleSteps(a: string, b: string): number {
  const na = Number(a)
  const nb = Number(b)
  if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb
  return a.localeCompare(b, undefined, { numeric: true })
}

export function orderedScales(scales: Record<string, ColorScale>): [string, ColorScale][] {
  const names = Object.keys(scales)
  const ranked = ROLE_SCALES.filter((name) => names.includes(name))
  const rest = names.filter((name) => !ROLE_SCALES.includes(name)).sort((a, b) => a.localeCompare(b))
  return [...ranked, ...rest].flatMap((name) => {
    const ramp = scales[name]
    return ramp ? [[name, ramp] as [string, ColorScale]] : []
  })
}

export function semanticGroup(name: string): string {
  if (name.startsWith('dark-')) {
    const rest = name.slice(5)
    const prefix = rest.split('-')[0] ?? rest
    return `dark-${prefix}`
  }
  if (!name.includes('-')) return 'other'
  return name.split('-')[0] ?? 'other'
}

export function groupSemantic(
  semantic: Record<string, string>,
): { key: string; label: string; entries: [string, string][] }[] {
  const buckets = new Map<string, [string, string][]>()
  for (const [name, value] of Object.entries(semantic)) {
    const key = semanticGroup(name)
    const list = buckets.get(key) ?? []
    list.push([name, value])
    buckets.set(key, list)
  }
  const order = [
    'surface',
    'text',
    'icon',
    'border',
    'badges',
    'tooltip',
    'other',
  ]
  const keys = [...buckets.keys()].sort((a, b) => {
    const darkA = a.startsWith('dark-')
    const darkB = b.startsWith('dark-')
    if (darkA !== darkB) return darkA ? 1 : -1
    const ia = order.indexOf(darkA ? a.slice(5) : a)
    const ib = order.indexOf(darkB ? b.slice(5) : b)
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
    return a.localeCompare(b)
  })
  return keys.map((key) => ({
    key,
    label: titleFromKey(key),
    entries: buckets.get(key) ?? [],
  }))
}

export function contrastOn(value: string): string {
  const raw = value.trim()
  if (raw.startsWith('#') && (raw.length === 7 || raw.length === 9)) {
    const r = parseInt(raw.slice(1, 3), 16)
    const g = parseInt(raw.slice(3, 5), 16)
    const b = parseInt(raw.slice(5, 7), 16)
    if (raw.length === 9 && parseInt(raw.slice(7, 9), 16) < 0x66) return '#111111'
    return r * 0.299 + g * 0.587 + b * 0.114 > 150 ? '#111111' : '#ffffff'
  }
  return '#111111'
}

export function fontFamilyNames(tokens: BrandTokens): string[] {
  const names = new Set<string>()
  for (const def of Object.values(tokens.typography.fontFamilies)) {
    const match = def.stack.match(/['"]([^'"]+)['"]/) ?? def.stack.match(/^([^,]+)/)
    const name = match?.[1]?.trim()
    if (name && !/^(serif|sans-serif|monospace|system-ui)$/i.test(name)) names.add(name)
  }
  return [...names]
}

export function tokenInventory(tokens: BrandTokens) {
  const sizingCount = Object.values(tokens.sizing).reduce(
    (sum, group) => sum + (group ? Object.keys(group).length : 0),
    0,
  )
  return {
    scales: Object.keys(tokens.colors.scales).length,
    semantic: Object.keys(tokens.colors.semanticResolved).length,
    sizing: sizingCount,
    type: Object.keys(tokens.typography.scale).length,
    families: Object.keys(tokens.typography.fontFamilies).length,
    icons: Object.keys(tokens.typography.icons).length,
  }
}
