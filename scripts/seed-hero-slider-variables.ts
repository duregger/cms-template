/**
 * Add Curbside hero layout variants to spaces/web/components Hero_Slider.
 * Keeps existing copy and image on the first variable; adds a button and four layouts.
 *
 *   npx tsx scripts/seed-hero-slider-variables.ts
 */
import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import {
  HERO_SLIDER_VARIABLE_DEFS,
  buildHeroSliderVariable,
  mergeHeroSliderFields,
} from '../src/lib/hero-slider-variables.ts'
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
  const heroDoc = snap.docs.find((d) => {
    const name = String(d.data().name ?? '').toLowerCase()
    const display = String(d.data().displayName ?? '').toLowerCase()
    return name.includes('hero') || display.includes('hero')
  })
  if (!heroDoc) {
    throw new Error('No hero component found in spaces/web/components')
  }

  const data = heroDoc.data() as Omit<CmsComponent, 'id'>
  const existing = (data.variables ?? []) as CmsComponentVariable[]
  const imageUrl = existing
    .flatMap((v) => v.fields ?? [])
    .find((f) => f.key === 'hero_background_image')?.defaultValue

  const byKey = new Map(existing.map((v) => [v.key, v]))
  const next: CmsComponentVariable[] = []

  for (const def of HERO_SLIDER_VARIABLE_DEFS) {
    const template = buildHeroSliderVariable(def, imageUrl)
    const current = byKey.get(def.key)
    if (!current) {
      next.push(template)
      continue
    }
    next.push({
      ...current,
      label: def.label,
      hidden: false,
      fields: mergeHeroSliderFields(current.fields ?? [], template.fields),
    })
  }

  for (const variable of existing) {
    if (!HERO_SLIDER_VARIABLE_DEFS.some((def) => def.key === variable.key)) {
      next.push(variable)
    }
  }

  await heroDoc.ref.set(
    stripUndefined({
      ...data,
      id: heroDoc.id,
      kind: data.kind || 'hero',
      variables: next,
      updatedAt: Date.now(),
      updatedBy: 'seed-hero-slider-variables',
    }),
    { merge: true },
  )

  console.log(`updated ${heroDoc.id} (${data.displayName ?? data.name})`)
  for (const v of next) {
    console.log(` - ${v.key}  ${v.label}  fields=${v.fields?.length ?? 0}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
