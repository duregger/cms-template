import { deleteDoc, getDoc, setDoc } from 'firebase/firestore'
import { spaceDoc } from '@/lib/firestore-paths'
import type { CmsPage, CmsPageSection, CmsSpace } from '@/types/cms'
import {
  CURBSIDE_GROUP_LABEL,
  CURBSIDE_OBSOLETE_PAGE_SLUGS,
  CURBSIDE_SITE,
  CURBSIDE_SITE_PAGES,
  type SitePageSeed,
} from '@/lib/curbside-site-map'

export { CURBSIDE_SITE_PAGES, type SitePageSeed }

type SidebarSection = { id: string; name: string; pages: string[] }

const META_DOCS = new Set(['_order', '_sections'])

function emptySections(): CmsPageSection[] {
  return [
    { id: crypto.randomUUID(), name: 'Hero', items: [] },
    { id: crypto.randomUUID(), name: 'Content', items: [] },
  ]
}

function pageDoc(seed: SitePageSeed, email: string): CmsPage {
  const canonical = `${CURBSIDE_SITE}${seed.path}`
  return {
    slug: seed.slug,
    title: seed.title,
    ...(seed.parentSlug ? { parentSlug: seed.parentSlug } : {}),
    sections: emptySections(),
    seo: {
      title: seed.title,
      description: seed.description,
      canonical,
    },
    openGraph: {
      ogTitle: seed.title,
      ogDescription: seed.description,
      ogType: 'website',
    },
    updatedAt: Date.now(),
    updatedBy: email,
  }
}

function defaultSidebarSections(): SidebarSection[] {
  return [
    {
      id: crypto.randomUUID(),
      name: CURBSIDE_GROUP_LABEL.site,
      pages: CURBSIDE_SITE_PAGES.filter((p) => !p.parentSlug).map((p) => p.slug),
    },
  ]
}

async function pruneObsoletePages(space: CmsSpace, existingSlugs: string[]): Promise<string[]> {
  const removed: string[] = []
  for (const slug of CURBSIDE_OBSOLETE_PAGE_SLUGS) {
    if (META_DOCS.has(slug) || !existingSlugs.includes(slug)) continue
    await deleteDoc(spaceDoc(space, 'pages', slug))
    removed.push(slug)
  }
  return removed
}

/**
 * Creates any missing Curbside.org pages in the web space and removes
 * slugs that should be components, not pages. Existing page sections are
 * left untouched so editor content is not overwritten.
 */
export async function seedMissingCurbsidePages(
  space: CmsSpace,
  existingSlugs: string[],
  email?: string,
): Promise<string[]> {
  if (space !== 'web') return []

  const existing = new Set(existingSlugs)
  const created: string[] = []
  const updated: string[] = []
  const author = email || 'cms'

  for (const seed of CURBSIDE_SITE_PAGES) {
    const ref = spaceDoc(space, 'pages', seed.slug)
    const snap = await getDoc(ref)
    if (snap.exists()) {
      const data = snap.data() as CmsPage
      if (!data.title?.trim()) {
        await setDoc(ref, { title: seed.title }, { merge: true })
        updated.push(seed.slug)
      }
      existing.add(seed.slug)
      continue
    }
    await setDoc(ref, pageDoc(seed, author))
    created.push(seed.slug)
    existing.add(seed.slug)
  }

  const removed = await pruneObsoletePages(space, [...existing])
  for (const slug of removed) existing.delete(slug)

  if (created.length === 0 && removed.length === 0 && updated.length === 0) return []

  const catalog = CURBSIDE_SITE_PAGES.map((p) => p.slug)
  const extras = [...existing].filter((slug) => !catalog.includes(slug) && !META_DOCS.has(slug))
  await setDoc(spaceDoc(space, 'pages', '_order'), { slugs: [...catalog, ...extras] })

  const sections = defaultSidebarSections()
  if (extras.length > 0) {
    const site = sections.find((s) => s.name === CURBSIDE_GROUP_LABEL.site)
    if (site) site.pages.push(...extras)
  }
  await setDoc(spaceDoc(space, 'pages', '_sections'), { sections })

  return [...created, ...removed, ...updated]
}
