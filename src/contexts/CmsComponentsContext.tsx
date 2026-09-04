import { createContext, useContext } from 'react'
import { useCmsComponents } from '@/hooks/useCmsComponents'
import { useSpace } from '@/contexts/SpaceContext'

type CmsComponentsContextValue = ReturnType<typeof useCmsComponents>

const CmsComponentsContext = createContext<CmsComponentsContextValue | null>(null)

export function CmsComponentsProvider({ children }: { children: React.ReactNode }) {
  const space = useSpace()
  const value = useCmsComponents(space)
  return (
    <CmsComponentsContext.Provider value={value}>
      {children}
    </CmsComponentsContext.Provider>
  )
}

export function useCmsComponentsContext() {
  const ctx = useContext(CmsComponentsContext)
  if (!ctx) throw new Error('useCmsComponentsContext must be used within CmsComponentsProvider')
  return ctx
}

/** Returns components or empty array when not in provider (avoids crash during HMR) */
export function useOptionalCmsComponents() {
  const ctx = useContext(CmsComponentsContext)
  return ctx?.components ?? []
}
