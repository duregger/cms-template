import { logger } from 'firebase-functions'

const WEB_SYNC_URL = (
  process.env.WEB_SYNC_URL ||
  'https://us-central1-curbside-web.cloudfunctions.net/updatesPostHtml'
).replace(/\/$/, '')
const BLOG_SPACE = 'updates'

export async function notifyWebPostHtml(space: string, slug: string): Promise<void> {
  if (space !== BLOG_SPACE || !slug) return

  const res = await fetch(WEB_SYNC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ space, slug }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    logger.error('Web post HTML sync failed', { slug, status: res.status, body })
    throw new Error(`Web post HTML sync failed for ${slug} (${res.status}).`)
  }

  logger.info('Web post HTML synced', { slug, status: res.status })
}
