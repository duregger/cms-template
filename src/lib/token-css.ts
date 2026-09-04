import type { BrandTokens } from '@/types/tokens'

/**
 * Flatten a `BrandTokens` set into CSS custom properties.
 *
 * This is the shared "consume" contract, identical to what the BG-web consumer
 * emits. The CMS preview panel applies these to a scoped container; the site
 * applies the same map to `:root`. Keys are emitted as:
 *   --color-<scale>-<step>          e.g. --color-primary-500
 *   --color-semantic-<name>         e.g. --color-semantic-fontColor
 *   --space-<key> / --radius-<key> / --stroke-<key> / --elevation-<key> / --layout-<key>
 *   --font-family-<role>            e.g. --font-family-regular
 */
export function brandTokensToCssVars(tokens: BrandTokens): Record<string, string> {
  const vars: Record<string, string> = {}

  for (const [scale, ramp] of Object.entries(tokens.colors.scales)) {
    for (const [step, value] of Object.entries(ramp)) {
      vars[`--color-${scale}-${step}`] = value
    }
  }
  for (const [name, value] of Object.entries(tokens.colors.semanticResolved)) {
    vars[`--color-semantic-${name}`] = value
  }

  const sizingGroups: [keyof BrandTokens['sizing'], string][] = [
    ['spacing', 'space'],
    ['borderRadius', 'radius'],
    ['stroke', 'stroke'],
    ['elevation', 'elevation'],
    ['layout', 'layout'],
  ]
  for (const [group, prefix] of sizingGroups) {
    const record = tokens.sizing[group]
    if (!record) continue
    for (const [key, value] of Object.entries(record)) {
      vars[`--${prefix}-${key}`] = value
    }
  }

  for (const [role, def] of Object.entries(tokens.typography.fontFamilies)) {
    vars[`--font-family-${role}`] = def.stack
  }

  return vars
}
