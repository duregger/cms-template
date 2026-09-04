import { useState, useEffect, useCallback } from 'react'
import { getDoc, getDocs, setDoc, deleteDoc } from 'firebase/firestore'
import type { CmsNotification } from '@/types/cms'
import { spaceCollection, spaceDoc } from '@/lib/firestore-paths'

const SUB = 'notifications'

function stripUndefined<T>(obj: T): T {
  if (obj === undefined) return obj
  if (obj === null) return obj
  if (Array.isArray(obj)) return obj.map(stripUndefined) as T
  if (typeof obj === 'object') {
    const result = {} as Record<string, unknown>
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) result[k] = stripUndefined(v)
    }
    return result as T
  }
  return obj
}

type CmsAlertsState = {
  notifications: CmsNotification[]
  error: Error | null
}

export function useCmsAlerts() {
  const [state, setState] = useState<CmsAlertsState>({
    notifications: [],
    error: null,
  })

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, error: null }))
    try {
      const snap = await getDocs(spaceCollection('alerts', SUB))
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<CmsNotification, 'id'>),
      }))
      list.sort((a, b) => (b.updated_at ?? 0) - (a.updated_at ?? 0))
      setState({ notifications: list, error: null })
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setState({ notifications: [], error })
      throw err
    }
  }, [])

  const createNotification = useCallback(
    async (
      data: Pick<CmsNotification, 'type' | 'title' | 'status'> &
        Partial<Omit<CmsNotification, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>>,
      userEmail?: string,
    ) => {
      const id = crypto.randomUUID()
      const now = Date.now()
      const notification: CmsNotification = {
        dismissable: true,
        trigger: 'page_load',
        frequency: 'once_per_session',
        priority: 0,
        ...data,
        id,
        created_at: now,
        updated_at: now,
        created_by: userEmail,
        updated_by: userEmail,
      }
      await setDoc(spaceDoc('alerts', SUB, id), stripUndefined(notification))
      setState((s) => ({
        ...s,
        notifications: [notification, ...s.notifications],
        error: null,
      }))
      return id
    },
    [],
  )

  const updateNotification = useCallback(
    async (
      id: string,
      data: Partial<Omit<CmsNotification, 'id' | 'created_at' | 'created_by'>>,
      userEmail?: string,
    ) => {
      const existing = state.notifications.find((n) => n.id === id)
      if (!existing) throw new Error(`Notification ${id} not found`)
      const updated: CmsNotification = {
        ...existing,
        ...data,
        id,
        updated_at: Date.now(),
        updated_by: userEmail,
      }
      await setDoc(spaceDoc('alerts', SUB, id), stripUndefined(updated))
      setState((s) => ({
        ...s,
        notifications: s.notifications.map((n) => (n.id === id ? updated : n)),
        error: null,
      }))
    },
    [state.notifications],
  )

  const deleteNotification = useCallback(async (id: string) => {
    await deleteDoc(spaceDoc('alerts', SUB, id))
    setState((s) => ({
      ...s,
      notifications: s.notifications.filter((n) => n.id !== id),
      error: null,
    }))
  }, [])

  const getNotification = useCallback(
    async (id: string): Promise<CmsNotification | null> => {
      const cached = state.notifications.find((n) => n.id === id)
      if (cached) return cached
      const snap = await getDoc(spaceDoc('alerts', SUB, id))
      if (!snap.exists()) return null
      return { id: snap.id, ...(snap.data() as Omit<CmsNotification, 'id'>) }
    },
    [state.notifications],
  )

  useEffect(() => {
    refresh().catch((err) => {
      console.error('[useCmsAlerts] Initial load failed', err)
    })
  }, [refresh])

  return {
    notifications: state.notifications,
    refresh,
    createNotification,
    updateNotification,
    deleteNotification,
    getNotification,
    error: state.error,
  }
}
