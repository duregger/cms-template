import { useState, useEffect, useCallback } from 'react'
import { getDoc, getDocs, setDoc } from 'firebase/firestore'
import type { CmsPage, CmsSpace } from '@/types/cms'
import { spaceCollection, spaceDoc } from '@/lib/firestore-paths'

export type CmsPageSummary = {
  slug: string
  title?: string
  parentSlug?: string
  updatedAt?: number
}

export type CmsSidebarSection = {
  id: string
  name: string
  pages: string[]
}

const ORDER_DOC_ID = '_order'
const SECTIONS_DOC_ID = '_sections'

type CmsPagesState = {
  pages: CmsPageSummary[]
  sections: CmsSidebarSection[]
  error: Error | null
}

function sortByOrder(
  list: CmsPageSummary[],
  order: string[],
): CmsPageSummary[] {
  const bySlug = new Map(list.map((p) => [p.slug, p]))
  const ordered: CmsPageSummary[] = []
  for (const slug of order) {
    const p = bySlug.get(slug)
    if (p) {
      ordered.push(p)
      bySlug.delete(slug)
    }
  }
  ordered.push(...bySlug.values())
  return ordered
}

export function useCmsPages(space: CmsSpace) {
  const [state, setState] = useState<CmsPagesState>({
    pages: [],
    sections: [],
    error: null,
  })

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, error: null }))
    try {
      const [pagesSnap, orderSnap, sectionsSnap] = await Promise.all([
        getDocs(spaceCollection(space, 'pages')),
        getDoc(spaceDoc(space, 'pages', ORDER_DOC_ID)),
        getDoc(spaceDoc(space, 'pages', SECTIONS_DOC_ID)),
      ])
      const list = pagesSnap.docs
        .filter((d) => d.id !== ORDER_DOC_ID && d.id !== SECTIONS_DOC_ID)
        .map((d) => {
          const data = d.data() as CmsPage
          return {
            slug: d.id,
            title: data.title,
            parentSlug: data.parentSlug,
            updatedAt: data.updatedAt,
          }
        })
      const order = (orderSnap.data()?.slugs as string[] | undefined) ?? []
      const sorted = sortByOrder(list, order)
      const sections = (sectionsSnap.data()?.sections as CmsSidebarSection[] | undefined) ?? []

      setState({ pages: sorted, sections, error: null })
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setState({ pages: [], sections: [], error })
      throw err
    }
  }, [space])

  const reorder = useCallback(async (slugs: string[]) => {
    setState((s) => ({ ...s, error: null }))
    try {
      await setDoc(spaceDoc(space, 'pages', ORDER_DOC_ID), { slugs })
      setState((s) => ({
        ...s,
        pages: sortByOrder(s.pages, slugs),
        error: null,
      }))
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setState((s) => ({ ...s, error }))
      throw err
    }
  }, [space])

  const saveSections = useCallback(async (sections: CmsSidebarSection[]) => {
    await setDoc(spaceDoc(space, 'pages', SECTIONS_DOC_ID), { sections })
    setState((s) => ({ ...s, sections }))
  }, [space])

  useEffect(() => {
    refresh().catch((err) => {
      console.error('[useCmsPages] Initial load failed', err)
    })
  }, [refresh])

  return { pages: state.pages, sections: state.sections, refresh, reorder, saveSections, error: state.error }
}
