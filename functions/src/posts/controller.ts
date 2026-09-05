import { Request, Response } from 'express'
import * as admin from 'firebase-admin'
import { isLiveBlogPost, publicPostPayload, type PublicBlogPost } from './live'

const RESERVED = new Set(['web', 'alerts', 'mobile-apps', 'kiosk'])

function paramString(val: string | string[]): string {
  return Array.isArray(val) ? val[0] : val
}

async function isConfiguredBlogSpace(space: string): Promise<boolean> {
  if (RESERVED.has(space)) return false
  const snap = await admin.firestore().doc('settings/project').get()
  const blogs = (snap.data()?.blogSpaces ?? []) as { id?: string }[]
  return blogs.some((b) => b.id === space)
}

function publishedPosts(space: string) {
  return admin.firestore().collection(`spaces/${space}/published-posts`)
}

export async function listPosts(req: Request, res: Response) {
  try {
    const space = paramString(req.params.space)
    if (!space || !(await isConfiguredBlogSpace(space))) {
      res.status(400).json({ success: false, error: `Unknown blog space "${space}".` })
      return
    }

    const snap = await publishedPosts(space).get()
    const now = Date.now()
    const posts = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as PublicBlogPost) }))
      .filter((post) => isLiveBlogPost(post, now))
      .map((post) => publicPostPayload(post.id, post))
      .sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0))

    res.set('Cache-Control', 'public, max-age=60, s-maxage=300')
    res.json({ success: true, space, data: { posts }, count: posts.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ success: false, error: message })
  }
}

export async function getPost(req: Request, res: Response) {
  try {
    const space = paramString(req.params.space)
    const slug = paramString(req.params.slug)
    if (!space || !(await isConfiguredBlogSpace(space))) {
      res.status(400).json({ success: false, error: `Unknown blog space "${space}".` })
      return
    }
    if (!slug) {
      res.status(400).json({ success: false, error: 'A post slug is required.' })
      return
    }

    const snap = await publishedPosts(space).doc(slug).get()
    const post = snap.exists ? ({ id: snap.id, ...(snap.data() as PublicBlogPost) }) : null
    if (!post || !isLiveBlogPost(post)) {
      res.status(404).json({ success: false, error: `Post "${slug}" was not found in ${space}.` })
      return
    }

    res.set('Cache-Control', 'public, max-age=60, s-maxage=300')
    res.json({ success: true, space, slug, data: publicPostPayload(post.id, post) })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ success: false, error: message })
  }
}
