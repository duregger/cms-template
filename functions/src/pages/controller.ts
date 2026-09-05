import { Request, Response } from 'express'
import { publicPagesCollection } from './public-pages'

const VALID_SPACES = ['web', 'mobile-apps', 'kiosk', 'alerts'] as const
type CmsSpace = (typeof VALID_SPACES)[number]

const META_DOCS = new Set(['_order', '_sections'])

function paramString(val: string | string[]): string {
  return Array.isArray(val) ? val[0] : val
}

function isSpace(value: string): value is CmsSpace {
  return (VALID_SPACES as readonly string[]).includes(value)
}

export async function listPages(req: Request, res: Response) {
  try {
    const space = paramString(req.params.space)
    if (!isSpace(space)) {
      res.status(400).json({
        success: false,
        error: `Unknown space "${space}". Expected one of: ${VALID_SPACES.join(', ')}.`,
      })
      return
    }

    const col = await publicPagesCollection(space)
    const [pagesSnap, orderSnap, sectionsSnap] = await Promise.all([
      col.get(),
      col.doc('_order').get(),
      col.doc('_sections').get(),
    ])

    const order = (orderSnap.data()?.slugs as string[] | undefined) ?? []
    const sections = (sectionsSnap.data()?.sections as { id?: string; name?: string; pages?: string[] }[] | undefined) ?? []
    const byId = new Map(
      pagesSnap.docs
        .filter((d) => !META_DOCS.has(d.id))
        .map((d) => [d.id, { id: d.id, ...d.data() }]),
    )
    const pages: Array<{ id: string } & Record<string, unknown>> = []
    for (const slug of order) {
      const page = byId.get(slug)
      if (page) {
        pages.push(page)
        byId.delete(slug)
      }
    }
    pages.push(...byId.values())

    res.json({
      success: true,
      space,
      data: {
        pages,
        order: order.length > 0 ? order : pages.map((p) => p.id),
        sections,
      },
      count: pages.length,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ success: false, error: message })
  }
}

export async function getPage(req: Request, res: Response) {
  try {
    const space = paramString(req.params.space)
    const slug = paramString(req.params.slug)
    if (!isSpace(space)) {
      res.status(400).json({
        success: false,
        error: `Unknown space "${space}". Expected one of: ${VALID_SPACES.join(', ')}.`,
      })
      return
    }
    if (!slug || META_DOCS.has(slug)) {
      res.status(400).json({ success: false, error: 'A page slug is required.' })
      return
    }

    const snap = await (await publicPagesCollection(space)).doc(slug).get()
    if (!snap.exists) {
      res.status(404).json({ success: false, error: `Page "${slug}" was not found in ${space}.` })
      return
    }

    res.json({ success: true, space, slug, data: { id: snap.id, ...snap.data() } })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ success: false, error: message })
  }
}
