import { createContext, useContext } from 'react'
import { useCmsAlerts } from '@/hooks/useCmsAlerts'

type CmsAlertsContextValue = ReturnType<typeof useCmsAlerts>

const CmsAlertsContext = createContext<CmsAlertsContextValue | null>(null)

export function CmsAlertsProvider({ children }: { children: React.ReactNode }) {
  const value = useCmsAlerts()
  return (
    <CmsAlertsContext.Provider value={value}>
      {children}
    </CmsAlertsContext.Provider>
  )
}

export function useCmsAlertsContext() {
  const ctx = useContext(CmsAlertsContext)
  if (!ctx) throw new Error('useCmsAlertsContext must be used within CmsAlertsProvider')
  return ctx
}
