import { useCallback, useEffect, useState } from 'react'
import { getDocs } from 'firebase/firestore'
import { spaceCollection } from '@/lib/firestore-paths'
import type { CmsBlogPost } from '@/types/blog'
import type { CmsSpace } from '@/types/cms'

function asPost(id: string, data: Record<string, unknown>): CmsBlogPost {
  return {
    ...(data as CmsBlogPost),
    slug: typeof data.slug === 'string' && data.slug ? data.slug : id,
  }
}

export function useCmsBlogPosts(space: CmsSpace) {
  const [posts, setPosts] = useState<CmsBlogPost[]>([])
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async () => {
    setError(null)
    try {
      const snap = await getDocs(spaceCollection(space, 'posts'))
      const list = snap.docs
        .map((d) => asPost(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
      setPosts(list)
    } catch (err) {
      const next = err instanceof Error ? err : new Error(String(err))
      setPosts([])
      setError(next)
      throw err
    }
  }, [space])

  useEffect(() => {
    refresh().catch((err) => {
      console.error('[useCmsBlogPosts] Initial load failed', err)
    })
  }, [refresh])

  return { posts, refresh, error }
}
