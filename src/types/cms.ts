export type CmsSpace = 'web' | 'mobile-apps' | 'kiosk' | 'alerts'

export type CmsNotificationType = 'announcement_bar' | 'alert'

export type CmsAlertStyle = 'announcement' | 'image' | 'illustration' | 'new_location'

export type CmsNotificationStatus = 'draft' | 'published' | 'archived'

export type CmsNotificationTrigger = 'page_load' | 'delay_5s' | 'scroll_50' | 'exit_intent'

export type CmsNotificationFrequency = 'once' | 'once_per_session' | 'always'

export type CmsGeoTarget = {
  lat: number
  lng: number
  radius_miles: number
}

export type CmsNotification = {
  id: string
  type: CmsNotificationType
  alert_type?: CmsAlertStyle
  title: string
  body?: string
  image?: string
  image_alt?: string
  illustration?: string
  illustration_alt?: string
  icon?: string
  chips?: string[]
  primary_action_label?: string
  primary_action_url?: string
  secondary_action_label?: string
  dismissable: boolean
  trigger: CmsNotificationTrigger
  frequency: CmsNotificationFrequency
  priority: number
  target_pages?: string[]
  geo_target?: CmsGeoTarget
  start_date?: string
  end_date?: string
  status: CmsNotificationStatus
  created_at: number
  updated_at: number
  created_by?: string
  updated_by?: string
}

export const CMS_SPACES: { id: CmsSpace; label: string }[] = [
  { id: 'web', label: 'Web' },
  { id: 'mobile-apps', label: 'Apps' },
  { id: 'kiosk', label: 'Kiosk' },
  { id: 'alerts', label: 'Alerts' },
]

export const DEFAULT_SPACES: CmsSpace[] = ['web', 'alerts']
export const OPTIONAL_SPACES: CmsSpace[] = ['mobile-apps', 'kiosk']

export function spaceLabel(id: CmsSpace): string {
  return CMS_SPACES.find((s) => s.id === id)?.label ?? id
}

export function isDefaultSpace(id: CmsSpace): boolean {
  return id === 'web' || id === 'alerts'
}

export function isSpacePublished(id: CmsSpace, published?: CmsSpace[] | null): boolean {
  return isDefaultSpace(id) || (published ?? []).includes(id)
}

export function visibleSwitcherSpaces(published?: CmsSpace[] | null, active?: CmsSpace): CmsSpace[] {
  const extras = CMS_SPACES
    .map((s) => s.id)
    .filter((id) => OPTIONAL_SPACES.includes(id) && (
      (published ?? []).includes(id) || id === active
    ))
  return ['web', 'alerts', ...extras]
}

export const CMS_NOTIFICATION_CATEGORIES: { id: string; label: string; description: string }[] = [
  { id: 'announcement_bar', label: 'Announcement Bars', description: 'Sitewide banners above the nav' },
  { id: 'announcement', label: 'Announcements', description: 'Centered text modals for promos & CTAs' },
  { id: 'image', label: 'Image Alerts', description: 'Photo-driven modals for campaigns' },
  { id: 'illustration', label: 'Illustration Alerts', description: 'Illustrated modals for brand moments' },
  { id: 'new_location', label: 'New Locations', description: 'Store opening announcements' },
]

export const CMS_TRIGGERS: { id: CmsNotificationTrigger; label: string }[] = [
  { id: 'page_load', label: 'Page Load' },
  { id: 'delay_5s', label: '5 Second Delay' },
  { id: 'scroll_50', label: 'Scroll 50%' },
  { id: 'exit_intent', label: 'Exit Intent' },
]

export const CMS_FREQUENCIES: { id: CmsNotificationFrequency; label: string }[] = [
  { id: 'once', label: 'Once ever' },
  { id: 'once_per_session', label: 'Once per session' },
  { id: 'always', label: 'Every page load' },
]

export type CmsComponentVariableType =
  | 'text'
  | 'longform'
  | 'hexcode'
  | 'image'
  | 'video'
  | 'url'

export type CmsVariableField = {
  id: string
  key: string
  /** Field ID (slug) – use for matching when present */
  slug?: string
  label: string
  type: CmsComponentVariableType | ''
  options?: string[]
  defaultValue?: string
  /** Design-system text color for text / longform fields. CSS var or hex. */
  color?: string
}

export type CmsComponentVariable = {
  id: string
  key: string
  label: string
  fields: CmsVariableField[]
  hidden?: boolean
}

export type CmsComponent = {
  id: string
  name: string
  displayName: string
  kind: string
  variables: CmsComponentVariable[]
  updatedAt?: number
  updatedBy?: string
}

/** Hero variable = layout variant (e.g. Split — Copy Left, Image Right) */
export type CmsHeroSlide = {
  id: string
  component: string
  componentId?: string
  /** Selected variable/variant key (e.g. brand-primary-tear-right) */
  variable?: string
  variableOrder?: string[]
  hiddenVariables?: string[]
  headline?: string
  subheader?: string
  h2?: string
  image?: { url: string; alt: string }
  centered_image?: { url: string; alt: string }
  background_color?: string
  paper_tear?: { url: string }
  button_text?: string
  button_url?: string
  layout?: string
  text_alignment?: string
  button_color?: string
  headline_color?: string
  subheader_color?: string
  h2_color?: string
}

export type CmsCategoryCard = {
  id: string
  title: string
  image?: { url: string; alt: string }
  url: string
}

export type CmsContentBlock = {
  id: string
  tagline?: string
  tagline_color?: string
  headline: string
  body: string
  button_text: string
  button_url: string
  image?: { url: string; alt: string }
  background_color?: string
  headline_color?: string
  body_color?: string
  button_bg_color?: string
  button_text_color?: string
  layout?: 'image-left' | 'image-right' | 'full-image' | 'image-above'
  image_style?: 'full-bleed' | 'framed'
  accent_color?: string
  decoration?: string
  container_radius?: string
  container_padding?: string
  image_radius?: string
  cta_radius?: string
}

export type CmsPageSectionItem = {
  id: string
  componentId: string
  variable?: string
}

export type CmsPageSection = {
  id: string
  name: string
  items: CmsPageSectionItem[]
}

export type CmsPageSeo = {
  title?: string
  description?: string
  keywords?: string[]
  canonical?: string
  noIndex?: boolean
  /** Optional search/share image. Falls back to the first hero image. */
  image?: string
}

export type CmsPageOpenGraph = {
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  ogType?: string
}

/** Generative Engine Optimization — facts for AI overviews and citations. */
export type CmsPageGeo = {
  entityName?: string
  entityType?: string
  summary?: string
  topics?: string[]
  locality?: string
  sameAs?: string[]
}

export type CmsPageFaq = {
  id: string
  question: string
  answer: string
}

/** Answer Engine Optimization — FAQPage / speakable schema. */
export type CmsPageAeo = {
  speakable?: string
  faqs?: CmsPageFaq[]
}

export type CmsPage = {
  slug: string
  /** Sidebar / editor label. Falls back to a title-cased slug when omitted. */
  title?: string
  parentSlug?: string
  sections: CmsPageSection[]
  seo?: CmsPageSeo
  openGraph?: CmsPageOpenGraph
  geo?: CmsPageGeo
  aeo?: CmsPageAeo
  /** @deprecated legacy hero array — migrated to sections on load */
  hero?: CmsHeroSlide[]
  /** @deprecated legacy categories — migrated to sections on load */
  categories?: CmsCategoryCard[]
  updatedAt?: number
  updatedBy?: string
}
