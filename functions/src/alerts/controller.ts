import { Request, Response } from 'express'
import * as admin from 'firebase-admin'
import {
  CmsNotification,
  CmsNotificationType,
  CmsAlertStyle,
  CmsNotificationStatus,
  VALID_NOTIFICATION_TYPES,
  VALID_ALERT_STYLES,
  VALID_STATUSES,
  VALID_TRIGGERS,
  VALID_FREQUENCIES,
} from './types'

function paramString(val: string | string[]): string {
  return Array.isArray(val) ? val[0] : val
}

function queryString(val: unknown): string | undefined {
  if (typeof val === 'string') return val
  if (Array.isArray(val) && typeof val[0] === 'string') return val[0]
  return undefined
}

const COLLECTION_PATH = 'spaces/alerts/notifications'

function getCollection() {
  return admin.firestore().collection(COLLECTION_PATH)
}

function stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) result[k] = v
  }
  return result
}

export async function listNotifications(req: Request, res: Response) {
  try {
    const type = queryString(req.query.type)
    const alertType = queryString(req.query.alert_type)
    const status = queryString(req.query.status)
    let query: admin.firestore.Query = getCollection()

    if (type && VALID_NOTIFICATION_TYPES.includes(type as CmsNotificationType)) {
      query = query.where('type', '==', type)
    }
    if (alertType && VALID_ALERT_STYLES.includes(alertType as CmsAlertStyle)) {
      query = query.where('alert_type', '==', alertType)
    }
    if (status && VALID_STATUSES.includes(status as CmsNotificationStatus)) {
      query = query.where('status', '==', status)
    }

    const snap = await query.orderBy('updated_at', 'desc').get()
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }))

    res.json({ success: true, data, count: data.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ success: false, error: message })
  }
}

export async function getNotification(req: Request, res: Response) {
  try {
    const id = paramString(req.params.id)
    const doc = await getCollection().doc(id).get()

    if (!doc.exists) {
      res.status(404).json({ success: false, error: 'Notification not found' })
      return
    }

    res.json({ success: true, data: { id: doc.id, ...doc.data() } })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ success: false, error: message })
  }
}

export async function createNotification(req: Request, res: Response) {
  try {
    const {
      type, alert_type, title, body,
      image, image_alt, illustration, illustration_alt, icon,
      chips, primary_action_label, primary_action_url, secondary_action_label,
      dismissable, trigger, frequency, priority,
      target_pages, geo_target, start_date, end_date,
      status, userEmail,
    } = req.body

    if (!type || !VALID_NOTIFICATION_TYPES.includes(type)) {
      res.status(400).json({
        success: false,
        error: `Invalid type. Must be one of: ${VALID_NOTIFICATION_TYPES.join(', ')}`,
      })
      return
    }
    if (type === 'alert' && alert_type && !VALID_ALERT_STYLES.includes(alert_type)) {
      res.status(400).json({
        success: false,
        error: `Invalid alert_type. Must be one of: ${VALID_ALERT_STYLES.join(', ')}`,
      })
      return
    }
    if (!title || typeof title !== 'string') {
      res.status(400).json({ success: false, error: 'Title is required' })
      return
    }
    if (trigger && !VALID_TRIGGERS.includes(trigger)) {
      res.status(400).json({ success: false, error: `Invalid trigger` })
      return
    }
    if (frequency && !VALID_FREQUENCIES.includes(frequency)) {
      res.status(400).json({ success: false, error: `Invalid frequency` })
      return
    }

    const now = Date.now()
    const id = admin.firestore().collection('_').doc().id
    const notification: CmsNotification = {
      id,
      type,
      alert_type: type === 'alert' ? (alert_type ?? 'announcement') : undefined,
      title,
      body,
      image, image_alt, illustration, illustration_alt, icon,
      chips, primary_action_label, primary_action_url, secondary_action_label,
      dismissable: dismissable ?? true,
      trigger: trigger ?? 'page_load',
      frequency: frequency ?? 'once_per_session',
      priority: priority ?? 0,
      target_pages, geo_target, start_date, end_date,
      status: status ?? 'draft',
      created_at: now,
      updated_at: now,
      created_by: userEmail,
      updated_by: userEmail,
    }

    await getCollection().doc(id).set(stripUndefined(notification as unknown as Record<string, unknown>))
    res.status(201).json({ success: true, data: notification })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ success: false, error: message })
  }
}

export async function updateNotification(req: Request, res: Response) {
  try {
    const id = paramString(req.params.id)
    const ref = getCollection().doc(id)
    const doc = await ref.get()

    if (!doc.exists) {
      res.status(404).json({ success: false, error: 'Notification not found' })
      return
    }

    const existing = doc.data() as CmsNotification
    const { userEmail, ...fields } = req.body

    const updated: Record<string, unknown> = {
      ...fields,
      updated_at: Date.now(),
      updated_by: userEmail,
    }

    await ref.update(stripUndefined(updated))
    const merged = { ...existing, ...updated, id }
    res.json({ success: true, data: merged })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ success: false, error: message })
  }
}

export async function deleteNotification(req: Request, res: Response) {
  try {
    const id = paramString(req.params.id)
    const ref = getCollection().doc(id)
    const doc = await ref.get()

    if (!doc.exists) {
      res.status(404).json({ success: false, error: 'Notification not found' })
      return
    }

    await ref.delete()
    res.json({ success: true, message: 'Notification deleted' })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ success: false, error: message })
  }
}

export async function publishNotification(req: Request, res: Response) {
  try {
    const id = paramString(req.params.id)
    const ref = getCollection().doc(id)
    const doc = await ref.get()

    if (!doc.exists) {
      res.status(404).json({ success: false, error: 'Notification not found' })
      return
    }

    await ref.update({ status: 'published', updated_at: Date.now() })
    res.json({ success: true, message: 'Notification published' })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ success: false, error: message })
  }
}
