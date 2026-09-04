export type CmsNotificationType = 'announcement_bar' | 'alert'

export type CmsAlertStyle = 'announcement' | 'image' | 'illustration' | 'new_location'

export type CmsNotificationStatus = 'draft' | 'published' | 'archived'

export type CmsNotificationTrigger = 'page_load' | 'delay_5s' | 'scroll_50' | 'exit_intent'

export type CmsNotificationFrequency = 'once' | 'once_per_session' | 'always'

export interface CmsGeoTarget {
  lat: number
  lng: number
  radius_miles: number
}

export interface CmsNotification {
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

export const VALID_NOTIFICATION_TYPES: CmsNotificationType[] = ['announcement_bar', 'alert']
export const VALID_ALERT_STYLES: CmsAlertStyle[] = ['announcement', 'image', 'illustration', 'new_location']
export const VALID_STATUSES: CmsNotificationStatus[] = ['draft', 'published', 'archived']
export const VALID_TRIGGERS: CmsNotificationTrigger[] = ['page_load', 'delay_5s', 'scroll_50', 'exit_intent']
export const VALID_FREQUENCIES: CmsNotificationFrequency[] = ['once', 'once_per_session', 'always']
