const HEX6 = /^#([0-9a-fA-F]{6})([0-9a-fA-F]{2})?$/
const HEX3 = /^#([0-9a-fA-F]{3})$/

/** WCAG 2 AA for normal text. */
export const WCAG_AA_NORMAL = 4.5

export function parseHex(value: string): [number, number, number] | null {
  const raw = value.trim()
  const short = raw.match(HEX3)
  if (short?.[1]) {
    const [r, g, b] = [...short[1]].map((c) => parseInt(c + c, 16))
    if (r === undefined || g === undefined || b === undefined) return null
    return [r, g, b]
  }
  const full = raw.match(HEX6)
  if (!full?.[1]) return null
  const h = full[1]
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

function linearize(channel: number): number {
  const v = channel / 255
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}

export function relativeLuminance(hex: string): number | null {
  const rgb = parseHex(hex)
  if (!rgb) return null
  const [r, g, b] = rgb
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)
}

/** WCAG 2 contrast ratio for a foreground on a background. */
export function contrastRatio(foreground: string, background: string): number | null {
  const fg = relativeLuminance(foreground)
  const bg = relativeLuminance(background)
  if (fg === null || bg === null) return null
  const [hi, lo] = fg > bg ? [fg, bg] : [bg, fg]
  return (hi + 0.05) / (lo + 0.05)
}

export function meetsWcagAa(foreground: string, background: string, min = WCAG_AA_NORMAL): boolean {
  const ratio = contrastRatio(foreground, background)
  return ratio !== null && ratio >= min
}

export function formatContrast(ratio: number | null): string {
  if (ratio === null) return '—'
  return `${ratio.toFixed(2)}:1`
}
