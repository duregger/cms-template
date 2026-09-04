import { createContext, useContext } from 'react'
import { useCmsPages } from '@/hooks/useCmsPages'
import { useSpace } from '@/contexts/SpaceContext'
import type { CmsPageSummary, CmsSidebarSection } from '@/hooks/useCmsPages'

type CmsPagesContextValue = {
  pages: CmsPageSummary[]
  sections: CmsSidebarSection[]
  refresh: () => Promise<void>
  reorder: (slugs: string[]) => Promise<void>
  saveSections: (sections: CmsSidebarSection[]) => Promise<void>
  error: Error | null
}

const CmsPagesContext = createContext<CmsPagesContextValue | null>(null)

export function CmsPagesProvider({ children }: { children: React.ReactNode }) {
  const space = useSpace()
  const { pages, sections, refresh, reorder, saveSections, error } = useCmsPages(space)
  return (
    <CmsPagesContext.Provider value={{ pages, sections, refresh, reorder, saveSections, error }}>
      {children}
    </CmsPagesContext.Provider>
  )
}

export function useCmsPagesContext() {
  const ctx = useContext(CmsPagesContext)
  if (!ctx) throw new Error('useCmsPagesContext must be used within CmsPagesProvider')
  return ctx
}
