// Accent-derived state colors for the CMS admin chrome.
// The brand primary is a runtime value (Firestore design-tokens/current); every
// hover/rest/text-on-tint state is computed from it rather than hard-coded, so
// retheming the primary retheme the whole admin shell for free.
// Accent scale reduced to a single runtime primary.

const INK_DEEP = '#12100E'
const SURFACE = '#FBFCFD'

const rgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(h.substring(i, i + 2), 16)) as [number, number, number]
}

/** Tint at a given alpha — equivalent to color-mix(in srgb, hex N%, transparent). */
export function tint(hex: string, pct: number): string {
  const [r, g, b] = rgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${pct / 100})`
}

/** Opaque blend toward another hex. Used for text that must clear 4.5:1. */
export function blend(hex: string, into: string, pct: number): string {
  const [ar, ag, ab] = rgb(hex)
  const [br, bg, bb] = rgb(into)
  const t = pct / 100
  const h = (n: number) => Math.round(n).toString(16).padStart(2, '0')
  const mix = (x: number, y: number) => h(x * t + y * (1 - t))
  return '#' + mix(ar, br) + mix(ag, bg) + mix(ab, bb)
}

/** Linearize one sRGB channel (0-255) for relative-luminance math. */
function linearize(channel: number): number {
  const v = channel / 255
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}

/** Foreground for a 100%-fill accent button — flips to ink on light accents. */
export function onAction(hex: string): string {
  const [r, g, b] = rgb(hex)
  const luminance = 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)
  return luminance > 0.42 ? INK_DEEP : SURFACE
}

/**
 * Opaque chrome surface for the nav rail: the accent at a few percent, blended
 * against the surface rather than layered as a transparency, so 13%/26% states
 * on top of it keep their intended strength.
 */
export function chrome(primary: string, pct = 6): string {
  return blend(primary, SURFACE, pct)
}

export interface AccentScale {
  rest: string
  hover: string
  ink: string
  on: string
  rail: string
  wash: string
}

/**
 * The three-register accent scale: 13% resting selection / large-target hover,
 * 26% small-target hover, plus text-safe and on-fill foreground colors, plus
 * the opaque rail chrome and the primary-button hover wash.
 */
export function accentScale(primary: string): AccentScale {
  return {
    rest: tint(primary, 13),
    hover: tint(primary, 26),
    ink: blend(primary, INK_DEEP, 66),
    on: onAction(primary),
    rail: chrome(primary),
    // SURFACE layered at 74% opacity over a 100%-fill button reads as a 26% tint —
    // computed as the opaque equivalent so text (onTint) stays legible.
    wash: blend(SURFACE, primary, 74),
  }
}

/** The design system's preset accent choices. */
export const ACCENT_PRESETS = [
  { name: 'Vermillion', hex: '#FF3219' },
  { name: 'Cobalt', hex: '#2E5EA8' },
  { name: 'Pine', hex: '#16764F' },
  { name: 'Plum', hex: '#6A4A8C' },
  { name: 'Teal', hex: '#17756E' },
  { name: 'Gold', hex: '#BE8A0F' },
] as const
