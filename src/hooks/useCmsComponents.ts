import { useState, useEffect, useCallback } from 'react'
import { getDoc, getDocs, setDoc, deleteDoc } from 'firebase/firestore'
import type { CmsComponent, CmsSpace } from '@/types/cms'
import { spaceCollection, spaceDoc } from '@/lib/firestore-paths'

const SUB = 'components'
const ORDER_DOC_ID = '_order'

function sortByOrder<T extends { id: string }>(list: T[], order: string[]): T[] {
  const byId = new Map(list.map((c) => [c.id, c]))
  const ordered: T[] = []
  for (const id of order) {
    const c = byId.get(id)
    if (c) {
      ordered.push(c)
      byId.delete(id)
    }
  }
  ordered.push(...byId.values())
  return ordered
}

/** Firestore rejects undefined; strip it from objects before saving */
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

type CmsComponentsState = {
  components: CmsComponent[]
  error: Error | null
}

export function useCmsComponents(space: CmsSpace) {
  const [state, setState] = useState<CmsComponentsState>({
    components: [],
    error: null,
  })

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, error: null }))
    try {
      const [snap, orderSnap] = await Promise.all([
        getDocs(spaceCollection(space, SUB)),
        getDoc(spaceDoc(space, SUB, ORDER_DOC_ID)),
      ])
      const list = snap.docs
        .filter((d) => d.id !== ORDER_DOC_ID)
        .map((d) => ({
          id: d.id,
          ...(d.data() as Omit<CmsComponent, 'id'>),
        }))
      const order = (orderSnap.data()?.ids as string[] | undefined) ?? []
      setState({ components: sortByOrder(list, order), error: null })
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setState({ components: [], error })
      throw err
    }
  }, [space])

  const createComponent = useCallback(
    async (
      data: Omit<CmsComponent, 'id' | 'updatedAt' | 'updatedBy'>,
      userEmail?: string,
    ) => {
      const id = crypto.randomUUID()
      const component: CmsComponent = {
        ...data,
        id,
        updatedAt: Date.now(),
        updatedBy: userEmail,
      }
      await setDoc(spaceDoc(space, SUB, id), stripUndefined(component))
      const ids = [...state.components.map((c) => c.id), id]
      await setDoc(spaceDoc(space, SUB, ORDER_DOC_ID), { ids })
      setState((s) => ({
        ...s,
        components: [...s.components, component],
        error: null,
      }))
      return id
    },
    [space, state.components],
  )

  const updateComponent = useCallback(
    async (
      id: string,
      data: Partial<Omit<CmsComponent, 'id'>>,
      userEmail?: string,
    ) => {
      const existing = state.components.find((c) => c.id === id)
      if (!existing) throw new Error(`Component ${id} not found`)
      const updated: CmsComponent = {
        ...existing,
        ...data,
        id,
        updatedAt: Date.now(),
        updatedBy: userEmail,
      }
      await setDoc(spaceDoc(space, SUB, id), stripUndefined(updated))
      setState((s) => ({
        ...s,
        components: s.components.map((c) => (c.id === id ? updated : c)),
        error: null,
      }))
    },
    [space, state.components],
  )

  const deleteComponent = useCallback(async (id: string) => {
    await deleteDoc(spaceDoc(space, SUB, id))
    const ids = state.components.filter((c) => c.id !== id).map((c) => c.id)
    await setDoc(spaceDoc(space, SUB, ORDER_DOC_ID), { ids })
    setState((s) => ({
      ...s,
      components: s.components.filter((c) => c.id !== id),
      error: null,
    }))
  }, [space, state.components])

  const reorder = useCallback(async (ids: string[]) => {
    setState((s) => ({
      ...s,
      components: sortByOrder(s.components, ids),
      error: null,
    }))
    try {
      await setDoc(spaceDoc(space, SUB, ORDER_DOC_ID), { ids })
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setState((s) => ({ ...s, error }))
      await refresh()
      throw err
    }
  }, [space, refresh])

  const getComponent = useCallback(
    async (id: string): Promise<CmsComponent | null> => {
      const cached = state.components.find((c) => c.id === id)
      if (cached) return cached
      const snap = await getDoc(spaceDoc(space, SUB, id))
      if (!snap.exists()) return null
      return { id: snap.id, ...(snap.data() as Omit<CmsComponent, 'id'>) }
    },
    [space, state.components],
  )

  useEffect(() => {
    refresh().catch((err) => {
      console.error('[useCmsComponents] Initial load failed', err)
    })
  }, [refresh])

  return {
    components: state.components,
    refresh,
    createComponent,
    updateComponent,
    deleteComponent,
    reorder,
    getComponent,
    error: state.error,
  }
}
