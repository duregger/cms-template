import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCmsComponentsContext } from '@/contexts/CmsComponentsContext'
import { useSpace } from '@/contexts/SpaceContext'
import type { User } from 'firebase/auth'
import { defaultContentBlockVariables } from '@/lib/content-block-variables'
import { defaultHeroSliderVariables } from '@/lib/hero-slider-variables'
import type { CmsComponentVariable } from '@/types/cms'

function defaultVariablesForName(name: string): CmsComponentVariable[] {
  const slug = name.toLowerCase().replace(/[\s-]+/g, '_')
  if (slug.includes('hero') || slug.includes('slider')) return defaultHeroSliderVariables()
  if (slug.includes('content_block') || slug.includes('contentblock')) {
    return defaultContentBlockVariables()
  }
  return []
}

export function CmsComponentsList({ user }: { user: User }) {
  const navigate = useNavigate()
  const space = useSpace()
  const { components, createComponent } = useCmsComponentsContext()
  const [displayName, setDisplayName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toSlug = (s: string) =>
    s.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '')

  const handleCreate = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const d = displayName.trim()
    if (!d) {
      setError('Enter a component name')
      return
    }
    const n = toSlug(d)
    if (components.some((c) => c.name === n)) {
      setError(`Component "${n}" already exists`)
      return
    }
    setError(null)
    setCreating(true)
    try {
      const variables = defaultVariablesForName(n)
      const id = await createComponent(
        {
          name: n,
          displayName: d,
          kind: '',
          variables: variables.map((v) => ({ ...v, id: crypto.randomUUID() })),
        },
        user.email ?? undefined,
      )
      navigate(`/${space}/components/${id}`, { replace: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[CmsComponentsList] Create component failed', err)
      setError(msg)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-headline mb-8 text-2xl text-brand-ink">
        Create Component
      </h1>

      <form
        onSubmit={handleCreate}
        className="rounded-panel bg-surface p-6 shadow-panel"
      >
        {error && (
          <p className="mb-4 rounded-control bg-danger-tint px-4 py-2 font-body text-sm text-danger-strong">
            {error}
          </p>
        )}
        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-text-muted">
            Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value)
              setError(null)
            }}
            placeholder="e.g. Rio Red Tear"
            className="w-full rounded-control border-hairline px-4 py-2 font-body text-sm border-2 focus:border-brand-primary focus:outline-none focus-visible:ring-0"
            autoComplete="off"
          />
          {displayName.trim() && (
            <p className="mt-1 text-xs text-text-subtle">
              ID: {toSlug(displayName)}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={creating || !displayName.trim()}
          className="rounded-control bg-brand-primary shadow-button px-6 py-2 font-button text-xs text-brand-on transition-colors duration-state hover:bg-brand-wash hover:text-brand-ink-on-tint disabled:opacity-50"
        >
          {creating ? 'Creating…' : 'Create'}
        </button>
      </form>

      {components.length > 0 && (
        <div className="mt-12">
          <h2 className="font-label mb-4 text-lg text-brand-ink">
            Existing Components
          </h2>
          <ul className="space-y-2">
            {components.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/${space}/components/${c.id}`)}
                  className="w-full rounded-control border border-hairline bg-surface px-4 py-3 text-left text-sm font-medium text-brand-ink transition-colors duration-state hover:bg-brand-hover"
                >
                  {c.displayName || c.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
