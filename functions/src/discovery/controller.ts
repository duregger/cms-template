import { Request, Response } from 'express'
import * as admin from 'firebase-admin'
import { publicPagesCollection } from '../pages/public-pages'
import { isLiveBlogPost, type PublicBlogPost } from '../posts/live'

const META_DOCS = new Set(['_order', '_sections'])
const DEFAULT_SITE = 'https://www.curbside.org'

type PageSeo = {
  canonical?: string
  noIndex?: boolean
}

type PageFaq = {
  question?: string
  answer?: string
}

type PageAeo = {
  speakable?: string
  faqs?: PageFaq[]
}

type PageDoc = {
  slug?: string
  title?: string
  seo?: PageSeo
  aeo?: PageAeo
}

function publicCache(res: Response) {
  res.set('Cache-Control', 'public, max-age=60, s-maxage=300')
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function trimSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

function siteOrigin(siteUrl?: string): string {
  const raw = siteUrl?.trim() || DEFAULT_SITE
  try {
    const parsed = new URL(raw)
    const path = parsed.pathname.replace(/\/+$/, '')
    return `${parsed.origin}${path}`
  } catch {
    return trimSlash(raw)
  }
}

function pageLoc(siteUrl: string, slug: string, canonical?: string): string {
  const fromSeo = canonical?.trim()
  if (fromSeo) return fromSeo
  if (slug === 'home') return `${siteUrl}/`
  return `${siteUrl}/${slug}`
}

async function webPages() {
  const col = await publicPagesCollection('web')
  const snap = await col.get()
  return snap.docs
    .filter((d) => !META_DOCS.has(d.id))
    .map((d) => ({ id: d.id, ...(d.data() as PageDoc) }))
}

type BlogSpaceDef = { id?: string }

async function projectBrand(): Promise<{
  brandName: string
  siteUrl: string
  blogSpaces: string[]
}> {
  const snap = await admin.firestore().doc('settings/project').get()
  const data = (snap.data() ?? {}) as { brandName?: string; siteUrl?: string; blogSpaces?: BlogSpaceDef[] }
  return {
    brandName: data.brandName?.trim() || 'Curbside',
    siteUrl: siteOrigin(data.siteUrl),
    blogSpaces: (data.blogSpaces ?? []).map((b) => b.id?.trim() ?? '').filter(Boolean),
  }
}

async function liveBlogUrls(siteUrl: string, blogSpaces: string[]): Promise<{ loc: string; title: string }[]> {
  if (blogSpaces.length === 0) return []
  const now = Date.now()
  const groups = await Promise.all(
    blogSpaces.map(async (space) => {
      const snap = await admin.firestore().collection(`spaces/${space}/published-posts`).get()
      return snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as PublicBlogPost) }))
        .filter((post) => isLiveBlogPost(post, now))
        .map((post) => {
          const slug = post.slug?.trim() || post.id
          return {
            loc: `${siteUrl}/${space}/${slug}`,
            title: post.title?.trim() || slug,
          }
        })
    }),
  )
  return groups.flat()
}

export async function getSitemap(_req: Request, res: Response) {
  try {
    const [{ siteUrl, blogSpaces }, pages] = await Promise.all([projectBrand(), webPages()])
    const urls = pages
      .filter((page) => !page.seo?.noIndex)
      .map((page) => pageLoc(siteUrl, page.slug || page.id, page.seo?.canonical))
    const blogUrls = await liveBlogUrls(siteUrl, blogSpaces)
    urls.push(...blogUrls.map((item) => item.loc))

    const body = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...urls.map((loc) => `  <url>\n    <loc>${xmlEscape(loc)}</loc>\n  </url>`),
      '</urlset>',
      '',
    ].join('\n')

    publicCache(res)
    res.status(200).type('application/xml').send(body)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).type('text/plain').send(message)
  }
}

export async function getLlmsTxt(_req: Request, res: Response) {
  try {
    const col = await publicPagesCollection('web')
    const [{ brandName, siteUrl, blogSpaces }, homeSnap] = await Promise.all([
      projectBrand(),
      col.doc('home').get(),
    ])
    const home = (homeSnap.data() ?? {}) as PageDoc
    const speakable = home.aeo?.speakable?.trim() ?? ''
    const faqs = (home.aeo?.faqs ?? []).filter((faq) => faq.question?.trim() || faq.answer?.trim())

    const lines = [`# ${brandName}`, '']
    if (speakable) {
      lines.push(speakable, '')
    }
    if (faqs.length > 0) {
      lines.push('## FAQ', '')
      for (const faq of faqs) {
        const question = faq.question?.trim()
        const answer = faq.answer?.trim()
        if (question) lines.push(`### ${question}`, '')
        if (answer) lines.push(answer, '')
      }
    }
    const blogPosts = await liveBlogUrls(siteUrl, blogSpaces)
    if (blogPosts.length > 0) {
      lines.push('## Blog', '')
      for (const post of blogPosts) {
        lines.push(`- [${post.title}](${post.loc})`)
      }
      lines.push('')
    }

    publicCache(res)
    res.status(200).type('text/plain').send(lines.join('\n'))
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).type('text/plain').send(message)
  }
}
