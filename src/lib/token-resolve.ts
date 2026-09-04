import type { ColorScale, SemanticToken } from '@/types/tokens'

export type ResolveResult = {
  resolved: Record<string, string>
  errors: string[]
}

/**
 * Resolve a dotted colour reference (e.g. "primary.500") against the colour
 * scales. Returns the concrete value or `undefined` if the path is unknown.
 */
function lookupScaleRef(
  ref: string,
  scales: Record<string, ColorScale>,
): string | undefined {
  const dot = ref.indexOf('.')
  if (dot === -1) return undefined
  const scaleName = ref.slice(0, dot)
  const step = ref.slice(dot + 1)
  const scale = scales[scaleName]
  if (!scale) return undefined
  return scale[step]
}

/**
 * Resolve every semantic token to a concrete value.
 *
 * A `ref` may point either into a colour scale (`primary.500`) or at another
 * semantic token by name (`fontColor`). Chains are followed with cycle
 * detection; missing targets are reported as errors.
 */
export function resolveSemanticTokens(
  semantic: Record<string, SemanticToken>,
  scales: Record<string, ColorScale>,
): ResolveResult {
  const resolved: Record<string, string> = {}
  const errors: string[] = []

  const resolveOne = (name: string, seen: Set<string>): string | undefined => {
    if (name in resolved) return resolved[name]

    const token = semantic[name]
    if (!token) {
      // Referenced a semantic name that doesn't exist.
      return undefined
    }

    if (token.type === 'value') {
      resolved[name] = token.value
      return token.value
    }

    // token.type === 'ref'
    if (seen.has(name)) {
      errors.push(
        `Cyclic semantic reference detected at "${name}" (chain: ${[...seen, name].join(' → ')}).`,
      )
      return undefined
    }
    seen.add(name)

    const ref = token.ref

    // 1) Try a colour-scale path first (e.g. "primary.500").
    const scaleValue = lookupScaleRef(ref, scales)
    if (scaleValue !== undefined) {
      resolved[name] = scaleValue
      return scaleValue
    }

    // 2) Fall back to another semantic token by name (e.g. "fontColor").
    if (ref in semantic) {
      const chained = resolveOne(ref, seen)
      if (chained !== undefined) {
        resolved[name] = chained
        return chained
      }
      errors.push(`Semantic token "${name}" references "${ref}", which could not be resolved.`)
      return undefined
    }

    errors.push(
      `Semantic token "${name}" references unknown target "${ref}" (no matching colour scale or semantic token).`,
    )
    return undefined
  }

  for (const name of Object.keys(semantic)) {
    resolveOne(name, new Set<string>())
  }

  return { resolved, errors }
}
