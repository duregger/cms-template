import { useState } from 'react'
import { useCmsBlogCategories } from '@/hooks/useCmsBlogCategories'
import { useSpace } from '@/contexts/SpaceContext'

export function CmsBlogCategories() {
  const space = useSpace()
  const { categories, createCategory, error } = useCmsBlogCategories(space)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const handleCreate = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setLocalError(null)
    try {
      await createCategory(name)
      setName('')
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Could not save category.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-headline text-2xl text-brand-ink">Categories</h1>
      <p className="mt-1 text-sm text-text-muted">
        Tag posts so the consumer site can filter and list them.
      </p>

      <form onSubmit={handleCreate} className="mt-8 rounded-panel bg-surface p-6 shadow-panel">
        {(localError || error) && (
          <p className="mb-4 rounded-control bg-danger-tint px-4 py-2 text-sm text-danger-strong">
            {localError || error?.message}
          </p>
        )}
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-text-muted">New category</span>
          <div className="flex gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Recipes"
              className="flex-1 rounded-control border-hairline px-4 py-2 text-sm border-2 focus:border-brand-primary focus:outline-none focus-visible:ring-0"
            />
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="rounded-control bg-brand-primary px-6 py-2 font-button text-xs text-brand-on shadow-button disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Add'}
            </button>
          </div>
        </label>
      </form>

      <ul className="mt-6 space-y-2">
        {categories.map((cat) => (
          <li key={cat.id} className="rounded-control border border-hairline bg-surface px-4 py-3 text-sm text-brand-ink">
            {cat.name}
            <span className="ml-2 text-xs text-text-subtle">{cat.slug}</span>
          </li>
        ))}
        {categories.length === 0 && (
          <li className="text-sm text-text-muted">No categories yet.</li>
        )}
      </ul>
    </div>
  )
}
