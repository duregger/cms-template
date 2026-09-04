export type ProjectSettings = {
  brandName: string
  clientDomain: string
  siteUrl: string
  logoUrl?: string
  faviconUrl?: string
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
