import type { BlogSpaceDef, CmsSpace } from '@/types/cms'

export type ProjectSettings = {
  brandName: string
  clientDomain: string
  siteUrl: string
  /** Dark-colored mark for light backgrounds. Also written to `logoUrl`. */
  darkLogoUrl?: string
  /** Light-colored mark for dark backgrounds. */
  lightLogoUrl?: string
  /** @deprecated Use `darkLogoUrl`. Kept so older records still resolve. */
  logoUrl?: string
  faviconUrl?: string
  /** Optional spaces (Apps, Kiosk) shown to every editor once published. */
  publishedSpaces?: CmsSpace[]
  /** Blog spaces created in Client Setup. Visible immediately, before Alerts. */
  blogSpaces?: BlogSpaceDef[]
  setupComplete: boolean
  updatedAt?: number
  updatedBy?: string
}

export const EMPTY_PROJECT_SETTINGS: ProjectSettings = {
  brandName: '',
  clientDomain: '',
  siteUrl: '',
  setupComplete: false,
}

export function resolveClientLogos(settings: ProjectSettings | null | undefined) {
  const dark = settings?.darkLogoUrl || settings?.logoUrl
  const light = settings?.lightLogoUrl
  return {
    dark: dark || light,
    light: light || dark,
  }
}

export function hasClientLogo(settings: ProjectSettings | null | undefined) {
  return Boolean(settings?.lightLogoUrl || settings?.darkLogoUrl || settings?.logoUrl)
}
