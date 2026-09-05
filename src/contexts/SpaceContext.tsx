import { createContext, useContext, useMemo } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import type { CmsSpace } from '@/types/cms'
import { CMS_SPACES, isReservedSpace } from '@/types/cms'
import { useProjectSettings } from '@/hooks/useProjectSettings'

type SpaceContextValue = {
  space: CmsSpace
}

export const SpaceContext = createContext<SpaceContextValue | null>(null)

const VALID_RESERVED = new Set<string>(CMS_SPACES.map((s) => s.id))

export function SpaceProvider({ children }: { children: React.ReactNode }) {
  const { space } = useParams<{ space: string }>()
  const { settings, loading } = useProjectSettings()

  const value = useMemo(() => {
    if (!space) return null
    if (VALID_RESERVED.has(space) || isReservedSpace(space)) {
      return { space }
    }
    if (settings?.blogSpaces?.some((b) => b.id === space)) {
      return { space }
    }
    if (loading) return undefined
    return null
  }, [space, settings?.blogSpaces, loading])

  if (value === undefined) return null
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
