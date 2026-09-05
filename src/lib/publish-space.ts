import { getDocs, writeBatch, type WriteBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { spaceCollection, spaceDoc } from '@/lib/firestore-paths'
import type { CmsSpace } from '@/types/cms'

export const PUBLISHED_PAGES = 'published-pages'
export const RELEASES = 'releases'
export const CURRENT_RELEASE = 'current'
export const PUBLISH_LOG = 'publish-log'

const META = new Set(['_order', '_sections'])
const BATCH_LIMIT = 400

export type PublishedPageRef = {
  slug: string
  title?: string
}

export type PublishLogEntry = {
  id: string
  space: CmsSpace
  publishedAt: number
  publishedAtIso: string
  publishedBy: string | null
  pages: PublishedPageRef[]
  pageCount: number
}

/**
 * Copy the space's editor pages onto the published snapshot the public API reads.
 * Appends an immutable log row: who, which pages, and when.
 * Tokens stay on their own Design System publish.
 */
export async function publishSpacePages(space: CmsSpace, email?: string): Promise<PublishLogEntry> {
  const [draftSnap, liveSnap] = await Promise.all([
    getDocs(spaceCollection(space, 'pages')),
    getDocs(spaceCollection(space, PUBLISHED_PAGES)),
  ])
  const draftIds = new Set(draftSnap.docs.map((d) => d.id))
  const ops: Array<(batch: WriteBatch) => void> = []

  for (const d of draftSnap.docs) {
    const id = d.id
    ops.push((batch) => batch.set(spaceDoc(space, PUBLISHED_PAGES, id), d.data()))
  }
  for (const d of liveSnap.docs) {
    if (!draftIds.has(d.id)) {
      const id = d.id
      ops.push((batch) => batch.delete(spaceDoc(space, PUBLISHED_PAGES, id)))
    }
  }

  const pages: PublishedPageRef[] = draftSnap.docs
    .filter((d) => !META.has(d.id))
    .map((d) => {
      const data = d.data() as { slug?: string; title?: string }
      return {
        slug: typeof data.slug === 'string' && data.slug ? data.slug : d.id,
        ...(typeof data.title === 'string' && data.title.trim() ? { title: data.title.trim() } : {}),
      }
    })
    .sort((a, b) => a.slug.localeCompare(b.slug))

  const publishedAt = Date.now()
  const entry: PublishLogEntry = {
    id: crypto.randomUUID(),
    space,
    publishedAt,
    publishedAtIso: new Date(publishedAt).toISOString(),
    publishedBy: email ?? null,
    pages,
    pageCount: pages.length,
  }

  ops.push((batch) => batch.set(spaceDoc(space, PUBLISH_LOG, entry.id), entry))
  ops.push((batch) =>
    batch.set(spaceDoc(space, RELEASES, CURRENT_RELEASE), {
      logId: entry.id,
      publishedAt: entry.publishedAt,
      publishedAtIso: entry.publishedAtIso,
      publishedBy: entry.publishedBy,
      pageCount: entry.pageCount,
      slugs: pages.map((p) => p.slug),
    }),
  )

  for (let i = 0; i < ops.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db)
    for (const apply of ops.slice(i, i + BATCH_LIMIT)) apply(batch)
    await batch.commit()
  }

  return entry
}
