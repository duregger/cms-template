import * as admin from 'firebase-admin'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions'
import sharp from 'sharp'
import { notifyWebPostHtml } from '../notify-web-post'

const OG_WIDTH = 1200
const OG_HEIGHT = 630
const RESERVED = new Set(['web', 'alerts', 'mobile-apps', 'kiosk'])

type OgRequest = {
  space?: string
  slug?: string
}

async function downloadImage(url: string): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new HttpsError('failed-precondition', `Could not download hero image (${res.status}).`)
  }
  return Buffer.from(await res.arrayBuffer())
}

export const generatePostOgImage = onCall(
  { invoker: 'public', memory: '512MiB', timeoutSeconds: 60 },
  async (request) => {
    if (!request.auth?.token?.email) {
      throw new HttpsError('unauthenticated', 'Sign in to generate an OG image.')
    }

    const space = String((request.data as OgRequest)?.space ?? '').trim()
    const slug = String((request.data as OgRequest)?.slug ?? '').trim()
    if (!space || RESERVED.has(space) || !slug) {
      throw new HttpsError('invalid-argument', 'A blog space and post slug are required.')
    }

    const db = admin.firestore()
    const publishedRef = db.doc(`spaces/${space}/published-posts/${slug}`)
    const editorRef = db.doc(`spaces/${space}/posts/${slug}`)
    const published = await publishedRef.get()
    const source = published.exists ? published : await editorRef.get()
    if (!source.exists) {
      throw new HttpsError('not-found', `Post "${slug}" was not found in ${space}.`)
    }

    const heroImage = (source.data()?.heroImage as string | undefined)?.trim()
    const pingWeb = () =>
      notifyWebPostHtml(space, slug).catch((err) => {
        logger.error('notifyWebPostHtml failed', { space, slug, err })
      })

    if (!heroImage) {
      await pingWeb()
      return { ogImage: null as string | null, skipped: true }
    }

    const input = await downloadImage(heroImage)
    const jpeg = await sharp(input)
      .rotate()
      .resize(OG_WIDTH, OG_HEIGHT, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer()

    const path = `cms/og/${space}/${slug}.jpg`
    const file = admin.storage().bucket().file(path)
    await file.save(jpeg, {
      contentType: 'image/jpeg',
      metadata: { cacheControl: 'public, max-age=3600' },
    })
    const bucketName = file.bucket.name
    const ogImage = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(path)}?alt=media`

    await Promise.all([
      publishedRef.set({ ogImage }, { merge: true }),
      editorRef.set({ ogImage }, { merge: true }),
    ])

    await pingWeb()
    return { ogImage, path }
  },
)
