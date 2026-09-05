/**
 * Load scratch/vertex.tokens.json into spaces/web/design-tokens/draft.
 * Does not publish.
 *
 *   npx tsx scripts/import-vertex-draft.ts
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

initializeApp({ credential: applicationDefault(), projectId: 'curbside-cms' })
const db = getFirestore()

type SemanticToken = { type: 'ref'; ref: string } | { type: 'value'; value: string }

function resolveSemantic(
  semantic: Record<string, SemanticToken>,
  scales: Record<string, Record<string, string>>,
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [name, token] of Object.entries(semantic)) {
    if (token.type === 'value') {
      out[name] = token.value
      continue
    }
    const dot = token.ref.indexOf('.')
    const scale = scales[token.ref.slice(0, dot)]
    const value = scale?.[token.ref.slice(dot + 1)]
    if (value) out[name] = value
  }
  return out
}

async function main() {
  const rawPath = resolve('scratch/vertex.tokens.json')
  const raw = JSON.parse(readFileSync(rawPath, 'utf8')) as {
    colors: {
      semantic: Record<string, SemanticToken>
      [scale: string]: unknown
    }
    sizing: {
      layout?: Record<string, string>
      spacing?: Record<string, string>
      'border-radius'?: Record<string, string>
      stroke?: Record<string, string>
      elevation?: Record<string, string>
    }
    typography: {
      fontFamilies: Record<string, string>
      scale: Record<string, Record<string, unknown>>
      icons?: Record<string, { fontSize: string }>
    }
  }

  const scales: Record<string, Record<string, string>> = {}
  for (const [name, value] of Object.entries(raw.colors)) {
    if (name === 'semantic' || !value || typeof value !== 'object') continue
    scales[name] = value as Record<string, string>
  }

  const semantic = raw.colors.semantic
  const fontFamilies: Record<string, { stack: string; source: 'google' }> = {}
  for (const [role, stack] of Object.entries(raw.typography.fontFamilies)) {
    fontFamilies[role] = { stack, source: 'google' }
  }

  const payload = {
    version: 1,
    colors: {
      scales,
      semantic,
      semanticResolved: resolveSemantic(semantic, scales),
    },
    sizing: {
      ...(raw.sizing.layout ? { layout: raw.sizing.layout } : {}),
      ...(raw.sizing.spacing ? { spacing: raw.sizing.spacing } : {}),
      ...(raw.sizing['border-radius'] ? { borderRadius: raw.sizing['border-radius'] } : {}),
      ...(raw.sizing.stroke ? { stroke: raw.sizing.stroke } : {}),
      ...(raw.sizing.elevation ? { elevation: raw.sizing.elevation } : {}),
    },
    typography: {
      fontFamilies,
      scale: raw.typography.scale,
      icons: raw.typography.icons ?? {},
    },
    meta: {
      space: 'web',
      sourceFormat: 'web-v1',
      updatedAt: Date.now(),
      updatedBy: 'import-vertex-draft',
      warnings: [],
    },
  }

  await db.doc('spaces/web/design-tokens/draft').set(payload)
  console.log(
    `draft updated: ${Object.keys(scales).length} scales, ${Object.keys(semantic).length} semantic, ${Object.keys(raw.typography.scale).length} type styles`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
