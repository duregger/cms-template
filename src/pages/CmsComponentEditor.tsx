import { useEffect, useState, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useCmsComponentsContext } from '@/contexts/CmsComponentsContext'
import { useSpace } from '@/contexts/SpaceContext'
import type { User } from 'firebase/auth'
import type {
  CmsComponent,
  CmsComponentVariable,
} from '@/types/cms'
import { VariableEditSheet } from '@/components/VariableEditSheet'

function emptyVariable(): CmsComponentVariable {
  return {
    id: crypto.randomUUID(),
    key: '',
    label: '',
    fields: [],
    hidden: false,
  }
}

function migrateVariable(v: CmsComponentVariable & { type?: string; options?: string[] }): CmsComponentVariable {
  if (v.fields && Array.isArray(v.fields)) return v as CmsComponentVariable
  const old = v as unknown as { type?: string; options?: string[]; key: string; label: string }
  return {
    id: v.id,
    key: v.key,
    label: v.label,
    hidden: v.hidden ?? false,
    fields: [{
      id: crypto.randomUUID(),
      key: '',
      label: '',
      type: '',
      options: old.options,
    }],
  }
}

export function CmsComponentEditor({ user }: { user: User }) {
  const { id } = useParams<{ id: string }>()
  const space = useSpace()
  const { getComponent, updateComponent } =
    useCmsComponentsContext()
  const [component, setComponent] = useState<CmsComponent | null>(null)
  const [editingVariableIndex, setEditingVariableIndex] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const c = await getComponent(id)
      const migrated = c ? { ...c, variables: (c.variables ?? []).map(migrateVariable) } : null
      setComponent(migrated ?? null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[CmsComponentEditor] Load failed', err)
      setError(msg)
      setComponent(null)
    } finally {
      setLoading(false)
    }
  }, [id, getComponent])

  useEffect(() => {
    load()
  }, [load])

  const update = (patch: Partial<CmsComponent>) => {
    if (!component) return
    setComponent({ ...component, ...patch })
  }

  const updateVariable = (idx: number, patch: Partial<CmsComponentVariable>) => {
    if (!component) return
    const next = [...component.variables]
    next[idx] = { ...next[idx]!, ...patch }
    setComponent({ ...component, variables: next })
  }

  const addVariable = () => {
    if (!component) return
    const newIdx = component.variables.length
    setComponent({
      ...component,
      variables: [...component.variables, emptyVariable()],
    })
    setEditingVariableIndex(newIdx)
  }

  const moveVariable = (idx: number, dir: -1 | 1) => {
    if (!component) return
    const target = idx + dir
    if (target < 0 || target >= component.variables.length) return
    const next = [...component.variables]
    ;[next[idx], next[target]] = [next[target]!, next[idx]!]
    setComponent({ ...component, variables: next })
  }

  const duplicateVariable = (idx: number) => {
    if (!component) return
    const source = component.variables[idx]!
    const clone: CmsComponentVariable = {
      ...structuredClone(source),
      id: crypto.randomUUID(),
      key: `${source.key}_copy`,
      label: `${source.label} (Copy)`,
    }
    const next = [...component.variables]
    next.splice(idx + 1, 0, clone)
    setComponent({ ...component, variables: next })
  }

  const deleteVariable = (idx: number) => {
    if (!component) return
    const next = component.variables.filter((_, i) => i !== idx)
    setComponent({ ...component, variables: next })
    setEditingVariableIndex(null)
  }

  const save = async () => {
    if (!component) return
    setSaving(true)
    setError(null)
    try {
      await updateComponent(
        component.id,
        {
          name: component.name,
          displayName: component.displayName,
          kind: component.kind ?? '',
          variables: component.variables,
        },
        user.email ?? undefined,
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[CmsComponentEditor] Save failed:', msg, err)
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center font-body text-text-muted">
        Loading…
      </div>
    )
  }

  if (!component) {
    return (
      <div className="mx-auto w-3/4 px-6 py-12">
        <p className="font-body text-danger">Component not found.</p>
        <Link
          to={`/${space}/components`}
          className="mt-4 inline-block text-sm text-brand-primary hover:underline"
        >
          ← Back to Components
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-surface font-body pb-24">
      <div className="mx-auto w-3/4 px-6 py-8">
        <nav className="mb-4 flex items-center gap-2 text-sm text-text-muted">
          <Link to={`/${space}/components`} className="hover:text-brand-ink">
            Components
          </Link>
          <span>›</span>
          <span className="font-medium text-brand-ink">
            {component.displayName || component.name}
          </span>
        </nav>

        <section className="mb-8 rounded-panel border border-hairline-soft bg-surface p-6 shadow-panel">
          <h2 className="font-label mb-4 text-lg text-brand-ink">
            Component Details
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-text-muted">
                Display Name
              </span>
              <input
                type="text"
                value={component.displayName}
                onChange={(e) => update({ displayName: e.target.value })}
                className="w-full rounded-control border border-hairline px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-text-muted">
                ID
              </span>
              <input
                type="text"
                value={component.name}
                onChange={(e) => update({ name: e.target.value })}
                className="w-full rounded-control border border-hairline px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1"
              />
            </label>
          </div>
        </section>

        <section className="mb-8 rounded-panel border border-hairline-soft bg-surface p-6 shadow-panel">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-label text-lg text-brand-ink">
              Variables
            </h2>
            <div className="flex items-center gap-3">
              {component.variables.some((v) => v.hidden) && (
                <button
                  type="button"
                  onClick={() => setShowArchived((v) => !v)}
                  className={`rounded-pill border px-3 py-1.5 text-xs font-medium transition-colors duration-state ${
                    showArchived
                      ? 'border-brand-primary bg-brand-primary/5 text-brand-primary'
                      : 'border-hairline text-text-muted hover:bg-hairline-soft'
                  }`}
                >
                  {showArchived ? 'Hide' : 'Show'} Archived ({component.variables.filter((v) => v.hidden).length})
                </button>
              )}
              <button
                type="button"
                onClick={addVariable}
                className="rounded-control bg-brand-primary shadow-button px-4 py-2 font-button text-xs text-brand-on transition-colors duration-state hover:bg-brand-wash hover:text-brand-ink-on-tint"
              >
                + Add Variable
              </button>
            </div>
          </div>
          <p className="mb-4 text-xs text-text-muted">
            Reorder with ▲▼. Archive variables to hide them from pages by default.
          </p>

          {error && (
            <p className="mb-4 rounded-control bg-danger-tint px-4 py-2 text-sm text-danger-strong">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-3">
            {component.variables.map((v, idx) => {
              if (v.hidden && !showArchived) return null
              return (
                <div
                  key={v.id}
                  className={`flex items-center gap-2 rounded-control border p-4 ${
                    v.hidden
                      ? 'border-hairline bg-hairline-soft opacity-60'
                      : 'border-hairline bg-surface'
                  }`}
                >
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => moveVariable(idx, -1)}
                      disabled={idx === 0}
                      className="rounded px-2 py-1 text-xs text-text-muted hover:bg-hairline-soft disabled:opacity-30"
                      title="Move up"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => moveVariable(idx, 1)}
                      disabled={idx === component.variables.length - 1}
                      className="rounded px-2 py-1 text-xs text-text-muted hover:bg-hairline-soft disabled:opacity-30"
                      title="Move down"
                    >
                      ▼
                    </button>
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-brand-ink">
                      {v.label || v.key || 'Unnamed variable'}
                    </span>
                    {v.key && (
                      <span className="ml-2 text-xs text-text-muted">
                        ({v.key})
                      </span>
                    )}
                    {(v.fields?.length ?? 0) > 0 && (
                      <span className="ml-2 text-xs text-text-subtle">
                        · {(v.fields?.length ?? 0)} field{(v.fields?.length ?? 0) === 1 ? '' : 's'}
                      </span>
                    )}
                    {v.hidden && (
                      <span className="ml-2 rounded bg-hairline-soft px-1.5 py-0.5 text-[10px] font-medium text-text-muted">
                        Archived
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => duplicateVariable(idx)}
                    className="shrink-0 rounded-pill border border-hairline px-3 py-1.5 text-xs font-medium text-text-muted transition-colors duration-state hover:bg-hairline-soft"
                    title="Duplicate variable"
                  >
                    Duplicate
                  </button>
                  <button
                    type="button"
                    onClick={() => updateVariable(idx, { hidden: !v.hidden })}
                    className={`shrink-0 rounded-pill border px-3 py-1.5 text-xs font-medium transition-colors duration-state ${
                      v.hidden
                        ? 'border-brand-success/30 text-brand-success hover:bg-green-50'
                        : 'border-hairline text-text-muted hover:bg-hairline-soft'
                    }`}
                    title={v.hidden ? 'Unarchive' : 'Archive'}
                  >
                    {v.hidden ? 'Unarchive' : 'Archive'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingVariableIndex(idx)}
                    className="rounded-control bg-brand-primary shadow-button px-4 py-2 font-button text-xs text-brand-on transition-colors duration-state hover:bg-brand-wash hover:text-brand-ink-on-tint"
                  >
                    Edit
                  </button>
                </div>
              )
            })}
          </div>

          {editingVariableIndex !== null && component.variables[editingVariableIndex] && (
            <VariableEditSheet
              variable={component.variables[editingVariableIndex]!}
              variableIndex={editingVariableIndex}
              onUpdate={updateVariable}
              onDelete={deleteVariable}
              onClose={() => setEditingVariableIndex(null)}
              isOpen={true}
            />
          )}
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-hairline bg-surface px-6 py-3">
        <div className="mx-auto flex w-3/4 items-center justify-end">
          <button
            onClick={save}
            disabled={saving}
            className="rounded-control bg-brand-primary shadow-button px-10 py-3 font-button text-sm text-brand-on transition-colors duration-state hover:bg-brand-wash hover:text-brand-ink-on-tint disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
