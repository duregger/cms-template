import { useCallback, useEffect, useState } from 'react'
import { getDocs, setDoc } from 'firebase/firestore'
import { slugifySpaceId } from '@/lib/blog-space'
import { spaceCollection, spaceDoc } from '@/lib/firestore-paths'
import type { CmsBlogCategory } from '@/types/blog'
import type { CmsSpace } from '@/types/cms'

export function useCmsBlogCategories(space: CmsSpace) {
  const [categories, setCategories] = useState<CmsBlogCategory[]>([])
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async () => {
    setError(null)
    try {
      const snap = await getDocs(spaceCollection(space, 'categories'))
      const list = snap.docs
        .map((d) => {
          const data = d.data() as Partial<CmsBlogCategory>
          return {
            id: d.id,
            name: data.name?.trim() || d.id,
            slug: data.slug?.trim() || d.id,
          } satisfies CmsBlogCategory
        })
        .sort((a, b) => a.name.localeCompare(b.name))
      setCategories(list)
    } catch (err) {
      const next = err instanceof Error ? err : new Error(String(err))
      setCategories([])
      setError(next)
      throw err
    }
  }, [space])

  const createCategory = useCallback(async (name: string) => {
    const slug = slugifySpaceId(name)
    if (!slug) throw new Error('Enter a category name.')
    const next: CmsBlogCategory = { id: slug, name: name.trim(), slug }
    await setDoc(spaceDoc(space, 'categories', slug), next)
    setCategories((prev) => {
      if (prev.some((c) => c.id === slug)) return prev
      return [...prev, next].sort((a, b) => a.name.localeCompare(b.name))
    })
    return next
  }, [space])

  useEffect(() => {
    refresh().catch((err) => {
      console.error('[useCmsBlogCategories] Initial load failed', err)
    })
  }, [refresh])

  return { categories, refresh, createCategory, error }
}
