import { Request, Response } from 'express'
import * as admin from 'firebase-admin'

type ProjectSettings = {
  brandName?: string
  siteUrl?: string
  darkLogoUrl?: string
  lightLogoUrl?: string
  logoUrl?: string
  faviconUrl?: string
}

function noStore(res: Response) {
  res.set('Cache-Control', 'no-store')
}

function url(value?: string): string | null {
  return value?.trim() ? value.trim() : null
}

/** Public brand payload for the consumer site. No editor-only fields. */
export async function getProjectSettings(_req: Request, res: Response) {
  try {
    const snap = await admin.firestore().doc('settings/project').get()
    if (!snap.exists) {
      noStore(res)
      res.status(404).json({
        success: false,
        error: 'Project settings have not been saved yet.',
      })
      return
    }

    const settings = (snap.data() ?? {}) as ProjectSettings
    const darkLogoUrl = url(settings.darkLogoUrl) || url(settings.logoUrl)
    const lightLogoUrl = url(settings.lightLogoUrl)
    const logoUrl = url(settings.logoUrl) || darkLogoUrl

    noStore(res)
    res.json({
      success: true,
      data: {
        brandName: settings.brandName ?? '',
        logoUrl,
        darkLogoUrl,
        lightLogoUrl,
        faviconUrl: url(settings.faviconUrl),
        siteUrl: settings.siteUrl ?? '',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ success: false, error: message })
  }
}
