/**
 * Fill spaces/web/components Content_Block with the four layout variants.
 *
 *   npx tsx scripts/seed-content-block-variables.ts
 */
import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import {
  CONTENT_BLOCK_VARIABLE_DEFS,
  buildContentBlockVariable,
  mergeContentBlockFields,
} from '../src/lib/content-block-variables.ts'
import type { CmsComponent, CmsComponentVariable } from '../src/types/cms.ts'

initializeApp({ credential: applicationDefault(), projectId: 'curbside-cms' })
const db = getFirestore()

function stripUndefined<T>(obj: T): T {
  if (obj === undefined || obj === null) return obj
  if (Array.isArray(obj)) return obj.map(stripUndefined) as T
  if (typeof obj === 'object') {
    const result = {} as Record<string, unknown>
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (v !== undefined) result[k] = stripUndefined(v)
    }
    return result as T
  }
  return obj
}

async function main() {
  const snap = await db.collection('spaces/web/components').get()
  const doc = snap.docs.find((d) => {
    const name = String(d.data().name ?? '').toLowerCase().replace(/[\s-]+/g, '_')
    const display = String(d.data().displayName ?? '').toLowerCase()
    return name.startsWith('content_block') || display.includes('content block')
  })
  if (!doc) throw new Error('No Content Block component found')

  const data = doc.data() as Omit<CmsComponent, 'id'>
  const existing = (data.variables ?? []) as CmsComponentVariable[]
  const byKey = new Map(existing.map((v) => [v.key, v]))
  const next: CmsComponentVariable[] = []

  for (const def of CONTENT_BLOCK_VARIABLE_DEFS) {
    const template = buildContentBlockVariable(def)
    const current = byKey.get(def.key)
    if (!current) {
      next.push(template)
      continue
    }
    next.push({
      ...current,
      label: def.label,
      hidden: false,
      fields: mergeContentBlockFields(current.fields ?? [], template.fields),
    })
  }

  for (const variable of existing) {
    if (!CONTENT_BLOCK_VARIABLE_DEFS.some((def) => def.key === variable.key)) {
      next.push(variable)
    }
  }

  await doc.ref.set(
    stripUndefined({
      ...data,
      id: doc.id,
      kind: data.kind || 'content-block',
      variables: next,
      updatedAt: Date.now(),
      updatedBy: 'seed-content-block-variables',
    }),
    { merge: true },
  )

  console.log(`updated ${doc.id} (${data.displayName ?? data.name})`)
  for (const v of next) {
    console.log(` - ${v.key}  ${v.label}  fields=${v.fields?.length ?? 0}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
