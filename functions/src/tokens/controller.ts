import { Request, Response } from 'express'
import * as admin from 'firebase-admin'
import { cssVarsToStylesheet, tokensToCssVars } from './css-vars'

const VALID_SPACES = ['web', 'mobile-apps', 'kiosk', 'alerts'] as const
type CmsSpace = (typeof VALID_SPACES)[number]

function paramString(val: string | string[]): string {
  return Array.isArray(val) ? val[0] : val
}

function queryString(val: unknown): string | undefined {
  if (typeof val === 'string') return val
  if (Array.isArray(val) && typeof val[0] === 'string') return val[0]
  return undefined
}

function isSpace(value: string): value is CmsSpace {
  return (VALID_SPACES as readonly string[]).includes(value)
}

function noStore(res: Response) {
  res.set('Cache-Control', 'no-store')
}

export async function getPublishedTokens(req: Request, res: Response) {
  try {
    const space = paramString(req.params.space)
    if (!isSpace(space)) {
      res.status(400).json({
        success: false,
        error: `Unknown space "${space}". Expected one of: ${VALID_SPACES.join(', ')}.`,
      })
      return
    }

    const snap = await admin
      .firestore()
      .doc(`spaces/${space}/design-tokens/published`)
      .get()

    if (!snap.exists) {
      res.status(404).json({
        success: false,
        error: `No published tokens for space "${space}".`,
      })
      return
    }

    const tokens = (snap.data() ?? {}) as Record<string, unknown>
    const format = queryString(req.query.format) ?? 'json'
    noStore(res)

    if (format === 'stylesheet' || format === 'css') {
      const vars = tokensToCssVars(tokens)
      if (format === 'stylesheet') {
        res.type('text/css').send(cssVarsToStylesheet(vars))
        return
      }
      res.json({ success: true, space, data: vars })
      return
    }
    if (format !== 'json') {
      res.status(400).json({
        success: false,
        error: 'format must be "json", "css", or "stylesheet".',
      })
      return
    }

    res.json({ success: true, space, data: tokens })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ success: false, error: message })
  }
}
