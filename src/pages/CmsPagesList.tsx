import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setDoc } from 'firebase/firestore'
import { useCmsPagesContext } from '@/contexts/CmsPagesContext'
import { useSpace } from '@/contexts/SpaceContext'
import { spaceDoc } from '@/lib/firestore-paths'
import type { User } from 'firebase/auth'

function pageDisplayName(slug: string): string {
  return slug.charAt(0).toUpperCase() + slug.slice(1)
}

export function CmsPagesList({ user }: { user: User }) {
  const navigate = useNavigate()
  const space = useSpace()
  const { pages, refresh } = useCmsPagesContext()
  const [createSlug, setCreateSlug] = useState('')
  const [parentSlug, setParentSlug] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const topLevelPages = pages.filter((p) => !p.parentSlug)

  const handleCreatePage = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const slug = createSlug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    if (!slug) {
      setError('Enter a page slug (e.g. home, about)')
      return
    }
    if (pages.some((p) => p.slug === slug)) {
      setError(`Page "${slug}" already exists`)
      return
    }
    setError(null)
    setCreating(true)
    try {
      const pageData: Record<string, unknown> = {
        slug,
        sections: [],
        updatedAt: Date.now(),
        updatedBy: user.email,
      }
      if (parentSlug) {
        pageData.parentSlug = parentSlug
      }
      await setDoc(spaceDoc(space, 'pages', slug), pageData)
      await refresh()
      setCreateSlug('')
      setParentSlug('')
      navigate(`/${space}/pages/${slug}`, { replace: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[CmsPagesList] Create page failed', err)
      setError(msg)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-headline mb-8 text-2xl text-brand-ink">
        Create Page
      </h1>

      <form
        onSubmit={handleCreatePage}
        className="rounded-panel border border-hairline-soft bg-surface p-6 shadow-panel"
      >
        {error && (
          <p className="mb-4 rounded-control bg-danger-tint px-4 py-2 font-body text-sm text-danger-strong">
            {error}
          </p>
        )}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="page-slug" className="text-xs font-medium text-text-muted">
              Page slug
            </label>
            <div className="flex gap-3">
            <input
              id="page-slug"
              type="text"
              value={createSlug}
              onChange={(e) => {
                setCreateSlug(e.target.value)
                setError(null)
              }}
              placeholder="e.g. home, summer-promo"
              className="flex-1 rounded-control border border-hairline px-4 py-2 font-body text-sm focus:border-brand-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={creating || !createSlug.trim()}
              className="rounded-control bg-brand-primary shadow-button px-6 py-2 font-button text-xs text-brand-on transition-[background-color,color,opacity] duration-state hover:bg-brand-wash hover:text-brand-ink-on-tint active:opacity-[0.85] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1 disabled:opacity-50"
            >
              {creating ? 'Creating…' : 'Create'}
            </button>
            </div>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-text-muted">Parent Page (optional — makes this a subpage)</span>
            <select
              value={parentSlug}
              onChange={(e) => setParentSlug(e.target.value)}
              className="rounded-control border border-hairline bg-surface px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1"
            >
              <option value="">None (top-level page)</option>
              {topLevelPages.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {pageDisplayName(p.slug)}
                </option>
              ))}
            </select>
          </label>
          {parentSlug && createSlug.trim() && (
            <p className="text-xs text-text-muted">
              URL: <span className="font-mono">domain.com/{parentSlug}/{createSlug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}</span>
            </p>
          )}
        </div>
      </form>
    </div>
  )
}
