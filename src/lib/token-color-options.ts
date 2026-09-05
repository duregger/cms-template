import { orderedScales, sortScaleSteps, titleFromKey } from '@/lib/token-preview'
import type { BrandTokens, ColorScale } from '@/types/tokens'

export type ColorTokenOption = {
  name: string
  label: string
  step: string
  hex: string
  token: string
}

/** Template chrome keys used a leftover "Brand Blue" label for primary. */
const ROLE_LABELS: Record<string, string> = {
  primary: 'Primary',
  secondary: 'Secondary Color',
  vertexbrand: 'Secondary Color',
  'vertex-brand': 'Secondary Color',
  tertiary: 'Tertiary',
  'brand-primary': 'Primary',
  'brand-blue': 'Primary',
  brandblue: 'Primary',
  'brand-cloud': 'Secondary',
  'brand-mist': 'Tertiary',
  'brand-ink': 'Ink',
  'brand-accent': 'Accent',
  'brand-success': 'Success',
  'brand-gray': 'Gray',
  'brand-grey': 'Gray',
}

export function roleLabel(name: string): string {
  const dashed = name.toLowerCase().replace(/_/g, '-')
  const compact = dashed.replace(/-/g, '')
  return ROLE_LABELS[dashed] ?? ROLE_LABELS[compact] ?? titleFromKey(name)
}

/** CMS chrome palette → role chips when the space has no design-system scales yet. */
const CHROME_ROLES: { key: string; name: string; label: string }[] = [
  { key: 'brand-primary', name: 'primary', label: 'Primary' },
  { key: 'brand-cloud', name: 'secondary', label: 'Secondary' },
  { key: 'brand-mist', name: 'tertiary', label: 'Tertiary' },
  { key: 'brand-ink', name: 'ink', label: 'Ink' },
  { key: 'brand-accent', name: 'accent', label: 'Accent' },
  { key: 'brand-success', name: 'success', label: 'Success' },
  { key: 'brand-gray', name: 'gray', label: 'Gray' },
]

export function chromeRoleOptions(colors: Record<string, string> | undefined): ColorTokenOption[] {
  if (!colors) return []
  return CHROME_ROLES.flatMap(({ key, name, label }) => {
    const hex = colors[key]
    if (!hex) return []
    return [{ name, label, step: '500', hex, token: hex }]
  })
}

function preferStep(ramp: ColorScale): string {
  if (ramp['500']) return '500'
  const steps = Object.keys(ramp).sort(sortScaleSteps)
  const mid = steps[Math.floor(steps.length / 2)]
  return mid ?? steps[0] ?? '500'
}

export function cssColorToken(scale: string, step: string): string {
  return `var(--color-${scale}-${step})`
}

const TEXT_ROLE_ORDER = [
  'text-title',
  'text-body',
  'text-description',
  'text-descripion',
  'text-on-action',
  'text-action',
  'text-action-hover',
  'text-action-pressed',
  'text-error',
  'text-error-hover',
  'text-error-pressed',
  'text-warning',
  'text-success',
  'text-information',
  'text-neutral',
  'text-neutral-hover',
  'text-neutral-pressed',
  'text-placeholder',
  'text-disabled',
]

const TEXT_ROLE_LABELS: Record<string, string> = {
  'text-title': 'Title',
  'text-body': 'Body',
  'text-description': 'Description',
  'text-descripion': 'Description',
  'text-on-action': 'On action',
  'text-action': 'Action',
  'text-action-hover': 'Action hover',
  'text-action-pressed': 'Action pressed',
  'text-error': 'Error',
  'text-error-hover': 'Error hover',
  'text-error-pressed': 'Error pressed',
  'text-warning': 'Warning',
  'text-success': 'Success',
  'text-information': 'Information',
  'text-neutral': 'Neutral',
  'text-neutral-hover': 'Neutral hover',
  'text-neutral-pressed': 'Neutral pressed',
  'text-placeholder': 'Placeholder',
  'text-disabled': 'Disabled',
}

export function cssSemanticToken(name: string): string {
  return `var(--color-semantic-${name})`
}

/** Page-readable text roles from the published/draft semantic set. */
export function textColorOptions(tokens: BrandTokens | null | undefined): ColorTokenOption[] {
  if (!tokens) return []
  const entries = Object.entries(tokens.colors.semanticResolved).filter(
    ([name]) => name.startsWith('text-') && !name.startsWith('dark-'),
  )
  entries.sort(([a], [b]) => {
    const ia = TEXT_ROLE_ORDER.indexOf(a)
    const ib = TEXT_ROLE_ORDER.indexOf(b)
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
    return a.localeCompare(b)
  })
  return entries.map(([name, hex]) => ({
    name,
    label: TEXT_ROLE_LABELS[name] ?? titleFromKey(name.replace(/^text-/, '')),
    step: '',
    hex,
    token: cssSemanticToken(name),
  }))
}

export function colorRoleOptions(tokens: BrandTokens | null | undefined): ColorTokenOption[] {
  if (!tokens) return []
  return orderedScales(tokens.colors.scales).flatMap(([name, ramp]) => {
    const step = preferStep(ramp)
    const hex = ramp[step]
    if (!hex) return []
    return [
      {
        name,
        label: roleLabel(name),
        step,
        hex,
        token: cssColorToken(name, step),
      },
    ]
  })
}

export function matchColorOption(
  value: string,
  options: ColorTokenOption[],
): ColorTokenOption | undefined {
  const v = value.trim()
  if (!v) return undefined
  return options.find(
    (option) =>
      option.token === v ||
      option.hex.toLowerCase() === v.toLowerCase() ||
      option.hex.toLowerCase() === `#${v.toLowerCase()}`,
  )
}

export function previewColor(value: string, options: ColorTokenOption[]): string {
  const match = matchColorOption(value, options)
  if (match) return match.hex
  const hex = value.trim()
  if (hex.startsWith('#') && (hex.length === 4 || hex.length === 7 || hex.length === 9)) return hex
  if (/^[0-9a-fA-F]{6}$/.test(hex)) return `#${hex}`
  return '#000000'
}
