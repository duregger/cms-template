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

/** Hero variable = variant (e.g. Rio Red Tear Right, Black Bean Full) */
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
  layout?: 'image-left' | 'image-right'
  image_style?: 'full-bleed' | 'framed'
  accent_color?: string
  decoration?: string
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
  canonical?: string
  noIndex?: boolean
}

export type CmsPageOpenGraph = {
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  ogType?: string
}

export type CmsPage = {
  slug: string
  parentSlug?: string
  sections: CmsPageSection[]
  seo?: CmsPageSeo
  openGraph?: CmsPageOpenGraph
  /** @deprecated legacy hero array — migrated to sections on load */
  hero?: CmsHeroSlide[]
  /** @deprecated legacy categories — migrated to sections on load */
  categories?: CmsCategoryCard[]
  updatedAt?: number
  updatedBy?: string
}
