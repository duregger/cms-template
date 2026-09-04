import { createContext, useContext, useMemo } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import type { CmsSpace } from '@/types/cms'
import { CMS_SPACES } from '@/types/cms'

type SpaceContextValue = {
  space: CmsSpace
}

export const SpaceContext = createContext<SpaceContextValue | null>(null)

const VALID_SPACES = new Set<string>(CMS_SPACES.map((s) => s.id))

export function SpaceProvider({ children }: { children: React.ReactNode }) {
  const { space } = useParams<{ space: string }>()

  const value = useMemo(() => {
    if (!space || !VALID_SPACES.has(space)) return null
    return { space: space as CmsSpace }
  }, [space])

  if (!value) return <Navigate to="/web" replace />

  return (
    <SpaceContext.Provider value={value}>
      {children}
    </SpaceContext.Provider>
  )
}

export function useSpace(): CmsSpace {
  const ctx = useContext(SpaceContext)
  if (!ctx) throw new Error('useSpace must be used within SpaceProvider')
  return ctx.space
}
