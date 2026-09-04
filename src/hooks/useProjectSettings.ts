import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { ProjectSettings } from '@/types/settings'

export const PROJECT_SETTINGS_REF = () => doc(db, 'settings', 'project')

export function useProjectSettings() {
  const [settings, setSettings] = useState<ProjectSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onSnapshot(
      PROJECT_SETTINGS_REF(),
      (snap) => {
        setSettings(snap.exists() ? (snap.data() as ProjectSettings) : null)
        setLoading(false)
      },
      () => {
        setSettings(null)
        setLoading(false)
      },
    )
  }, [])

  return { settings, loading }
}
