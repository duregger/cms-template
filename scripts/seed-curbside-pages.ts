/**
 * Sync curbside.org page shells into spaces/web/pages.
 * Renames first-pass slugs, creates missing pages, deletes obsolete ones.
 * Existing sections on the destination slug are not overwritten.
 *
 *   npx tsx scripts/seed-curbside-pages.ts
 */
import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import {
  CURBSIDE_GROUP_LABEL,
  CURBSIDE_OBSOLETE_PAGE_SLUGS,
  CURBSIDE_SITE,
  CURBSIDE_SITE_PAGES,
} from '../src/lib/curbside-site-map.ts'

initializeApp({ credential: applicationDefault(), projectId: 'curbside-cms' })
const db = getFirestore()

/** First-pass slugs that should become the current sitemap pages. */
const SLUG_ALIASES: Record<string, string> = {
  about: 'about-us',
  programs: 'our-programs',
  contact: 'contact-us',
  donate: 'donate-now',
  chronicle: 'the-curbside-chronicle',
  flowers: 'curbside-flowers',
  apparel: 'curbside-apparel',
  sasquatch: 'sasquatch-shaved-ice',
}

const META_DOCS = new Set(['_order', '_sections'])

function emptySections() {
  return [
    { id: crypto.randomUUID(), name: 'Hero', items: [] },
    { id: crypto.randomUUID(), name: 'Content', items: [] },
  ]
}

async function main() {
  const now = Date.now()
  const created: string[] = []
  const renamed: string[] = []
  const titled: string[] = []
  const removed: string[] = []

  for (const [from, to] of Object.entries(SLUG_ALIASES)) {
    const fromRef = db.doc(`spaces/web/pages/${from}`)
    const toRef = db.doc(`spaces/web/pages/${to}`)
    const [fromSnap, toSnap] = await Promise.all([fromRef.get(), toRef.get()])
    if (!fromSnap.exists || toSnap.exists) continue
    const data = fromSnap.data() ?? {}
    const seed = CURBSIDE_SITE_PAGES.find((p) => p.slug === to)
    await toRef.set({
      ...data,
      slug: to,
      title: seed?.title ?? data.title,
      ...(seed?.parentSlug ? { parentSlug: seed.parentSlug } : { parentSlug: '' }),
      updatedAt: now,
      updatedBy: 'seed-curbside-pages',
    })
    await fromRef.delete()
    renamed.push(`${from} → ${to}`)
    console.log(`move  ${from} → ${to}`)
  }

  for (const seed of CURBSIDE_SITE_PAGES) {
    const ref = db.doc(`spaces/web/pages/${seed.slug}`)
    const snap = await ref.get()
    const canonical = `${CURBSIDE_SITE}${seed.path}`
    if (!snap.exists) {
      await ref.set({
        slug: seed.slug,
        title: seed.title,
        ...(seed.parentSlug ? { parentSlug: seed.parentSlug } : {}),
        sections: emptySections(),
        seo: { title: seed.title, description: seed.description, canonical },
        openGraph: { ogTitle: seed.title, ogDescription: seed.description, ogType: 'website' },
        updatedAt: now,
        updatedBy: 'seed-curbside-pages',
      })
      created.push(seed.slug)
      console.log(`add   ${seed.slug}`)
      continue
    }

    const data = snap.data() ?? {}
    const patch: Record<string, unknown> = {
      title: seed.title,
      updatedAt: now,
      updatedBy: 'seed-curbside-pages',
    }
    if (seed.parentSlug) patch.parentSlug = seed.parentSlug
    else if (data.parentSlug) patch.parentSlug = ''
    const seo = (data.seo as Record<string, unknown> | undefined) ?? {}
    if (!seo.title) {
      patch.seo = { ...seo, title: seed.title, description: seo.description ?? seed.description, canonical: seo.canonical ?? canonical }
    }
    await ref.set(patch, { merge: true })
    titled.push(seed.slug)
    console.log(`keep  ${seed.slug}`)
  }

  for (const slug of CURBSIDE_OBSOLETE_PAGE_SLUGS) {
    if (META_DOCS.has(slug)) continue
    const ref = db.doc(`spaces/web/pages/${slug}`)
    const snap = await ref.get()
    if (!snap.exists) continue
    await ref.delete()
    removed.push(slug)
    console.log(`del   ${slug}`)
  }

  const catalog = CURBSIDE_SITE_PAGES.map((p) => p.slug)
  const pagesSnap = await db.collection('spaces/web/pages').get()
  const extras = pagesSnap.docs
    .map((d) => d.id)
    .filter((id) => !META_DOCS.has(id) && !catalog.includes(id))
  await db.doc('spaces/web/pages/_order').set({ slugs: [...catalog, ...extras] })

  const sections = [
    {
      id: crypto.randomUUID(),
      name: CURBSIDE_GROUP_LABEL.site,
      pages: CURBSIDE_SITE_PAGES.filter((p) => !p.parentSlug).map((p) => p.slug),
    },
  ]
  if (extras.length > 0) {
    sections[0].pages.push(...extras)
  }
  await db.doc('spaces/web/pages/_sections').set({ sections })

  console.log(`\ndone. created ${created.length}, renamed ${renamed.length}, removed ${removed.length}`)
  if (renamed.length) console.log(`  renamed: ${renamed.join(', ')}`)
  if (created.length) console.log(`  created: ${created.join(', ')}`)
  if (removed.length) console.log(`  removed: ${removed.join(', ')}`)
  if (titled.length) console.log(`  titled: ${titled.join(', ')}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
