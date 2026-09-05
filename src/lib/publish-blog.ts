import { deleteDoc, getDocs, setDoc, writeBatch, type WriteBatch } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '@/lib/firebase'
import { spaceCollection, spaceDoc } from '@/lib/firestore-paths'
import { isLiveBlogPost, type CmsBlogPost } from '@/types/blog'

export const PUBLISHED_POSTS = 'published-posts'
export const BLOG_PUBLISH_LOG = 'publish-log'
export const BLOG_RELEASES = 'releases'
export const BLOG_CURRENT_RELEASE = 'current'

const BATCH_LIMIT = 400

export type BlogPublishEntry = {
  id: string
  space: string
  publishedAt: number
  publishedAtIso: string
  publishedBy: string | null
  slugs: string[]
  postCount: number
}

function asPost(id: string, data: Record<string, unknown>): CmsBlogPost {
  return {
    ...(data as CmsBlogPost),
    slug: typeof data.slug === 'string' && data.slug ? data.slug : id,
  }
}

function stripUndefined<T>(value: T): T {
  if (value === undefined || value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(stripUndefined) as T
  const result = {} as Record<string, unknown>
  for (const [key, next] of Object.entries(value)) {
    if (next !== undefined) result[key] = stripUndefined(next)
  }
  return result as T
}

export async function saveBlogPost(space: string, post: CmsBlogPost, email?: string): Promise<CmsBlogPost> {
  const now = Date.now()
  const payload = stripUndefined({
    ...post,
    updatedAt: now,
    updatedBy: email,
    createdAt: post.createdAt ?? now,
    createdBy: post.createdBy ?? email,
  })
  await setDoc(spaceDoc(space, 'posts', post.slug), payload)
  return payload
}

export async function generatePostOgImage(space: string, slug: string): Promise<string | null> {
  const call = httpsCallable<{ space: string; slug: string }, { ogImage?: string }>(
    functions,
    'generatePostOgImage',
  )
  const result = await call({ space, slug })
  return result.data.ogImage ?? null
}

export async function publishBlogPost(
  space: string,
  post: CmsBlogPost,
  email?: string,
): Promise<{ post: CmsBlogPost; ogImage?: string }> {
  const saved = await saveBlogPost(space, post, email)
  if (isLiveBlogPost(saved)) {
    await setDoc(spaceDoc(space, PUBLISHED_POSTS, saved.slug), stripUndefined(saved))
    try {
      const ogImage = await generatePostOgImage(space, saved.slug)
      if (ogImage) {
        const withOg = { ...saved, ogImage }
        await setDoc(spaceDoc(space, 'posts', saved.slug), withOg, { merge: true })
        await setDoc(spaceDoc(space, PUBLISHED_POSTS, saved.slug), { ogImage }, { merge: true })
        return { post: withOg, ogImage }
      }
    } catch {
      // Publish still succeeded; public API falls back to hero.
    }
    return { post: saved }
  }
  await deleteDoc(spaceDoc(space, PUBLISHED_POSTS, saved.slug)).catch(() => undefined)
  return { post: saved }
}

export async function publishBlogSpace(space: string, email?: string): Promise<BlogPublishEntry> {
  const [draftSnap, liveSnap] = await Promise.all([
    getDocs(spaceCollection(space, 'posts')),
    getDocs(spaceCollection(space, PUBLISHED_POSTS)),
  ])

  const livePosts: CmsBlogPost[] = []
  const ops: Array<(batch: WriteBatch) => void> = []
  const liveIds = new Set<string>()

  for (const d of draftSnap.docs) {
    const post = asPost(d.id, d.data() as Record<string, unknown>)
    if (!isLiveBlogPost(post)) continue
    liveIds.add(d.id)
    livePosts.push(post)
    ops.push((batch) => batch.set(spaceDoc(space, PUBLISHED_POSTS, d.id), stripUndefined(post)))
  }
  for (const d of liveSnap.docs) {
    if (!liveIds.has(d.id)) {
      const id = d.id
      ops.push((batch) => batch.delete(spaceDoc(space, PUBLISHED_POSTS, id)))
    }
  }

  livePosts.sort((a, b) => a.slug.localeCompare(b.slug))
  const publishedAt = Date.now()
  const entry: BlogPublishEntry = {
    id: crypto.randomUUID(),
    space,
    publishedAt,
    publishedAtIso: new Date(publishedAt).toISOString(),
    publishedBy: email ?? null,
    slugs: livePosts.map((p) => p.slug),
    postCount: livePosts.length,
  }

  ops.push((batch) => batch.set(spaceDoc(space, BLOG_PUBLISH_LOG, entry.id), entry))
  ops.push((batch) =>
    batch.set(spaceDoc(space, BLOG_RELEASES, BLOG_CURRENT_RELEASE), {
      logId: entry.id,
      publishedAt: entry.publishedAt,
      publishedAtIso: entry.publishedAtIso,
      publishedBy: entry.publishedBy,
      postCount: entry.postCount,
      slugs: entry.slugs,
    }),
  )

  for (let i = 0; i < ops.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db)
    for (const apply of ops.slice(i, i + BATCH_LIMIT)) apply(batch)
    await batch.commit()
  }

  await Promise.allSettled(livePosts.map((p) => generatePostOgImage(space, p.slug)))
  return entry
}
