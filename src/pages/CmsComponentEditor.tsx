import { useEffect, useLayoutEffect, useState, useCallback, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useCmsComponentsContext } from '@/contexts/CmsComponentsContext'
import { useSpace } from '@/contexts/SpaceContext'
import type { User } from 'firebase/auth'
import type {
  CmsComponent,
  CmsComponentVariable,
} from '@/types/cms'
import { VariableEditSheet } from '@/components/VariableEditSheet'
import { ChevronDown } from '@/components/icons/ChevronDown'

type VariableMenu = {
  idx: number
  panel: 'actions' | 'copy' | 'move'
}

const SAVE_BAR_PX = 80

function emptyVariable(): CmsComponentVariable {
  return {
    id: crypto.randomUUID(),
    key: '',
    label: '',
    fields: [],
    hidden: false,
  }
}

function uniqueKey(preferred: string, existingKeys: string[]): string {
  const keys = new Set(existingKeys)
  if (!keys.has(preferred)) return preferred
  let n = 2
  let candidate = `${preferred}_${n}`
  while (keys.has(candidate)) {
    n += 1
    candidate = `${preferred}_${n}`
  }
  return candidate
}

function cloneVariable(
  source: CmsComponentVariable,
  existingKeys: string[],
): CmsComponentVariable {
  const rawKey = source.key ? `${source.key}_copy` : 'variable_copy'
  return {
    ...structuredClone(source),
    id: crypto.randomUUID(),
    key: uniqueKey(rawKey, existingKeys),
    label: source.label ? `${source.label} (Copy)` : '',
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

function MoveVariableModal({
  sourceName,
  destName,
  variableLabel,
  busy,
  onConfirm,
  onCancel,
}: {
  sourceName: string
  destName: string
  variableLabel: string
  busy: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [busy, onCancel])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => {
          if (!busy) onCancel()
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="move-variable-title"
        className="relative w-full max-w-sm rounded-panel bg-surface p-8 shadow-overlay"
      >
        <h2 id="move-variable-title" className="font-cabin text-xl font-bold text-brand-ink">
          Move variable
        </h2>
        <p className="mt-2 text-sm text-text-muted">
          Remove{' '}
          <strong className="text-brand-ink">{variableLabel}</strong> from{' '}
          <strong className="text-brand-ink">{sourceName}</strong>? Pages that
          use it here will no longer see it. It will be added to{' '}
          <strong className="text-brand-ink">{destName}</strong>.
        </p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-control border border-hairline px-5 py-2 text-xs font-medium text-text-muted transition-colors duration-state hover:bg-hairline-soft disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-control bg-danger px-5 py-2 font-button text-xs text-surface shadow-button transition-colors duration-state hover:bg-danger-strong disabled:opacity-50"
          >
            {busy ? 'Moving…' : 'Move'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function CmsComponentEditor({ user }: { user: User }) {
  const { id } = useParams<{ id: string }>()
  const space = useSpace()
  const { components, getComponent, updateComponent } =
    useCmsComponentsContext()
  const [component, setComponent] = useState<CmsComponent | null>(null)
  const [editingVariableIndex, setEditingVariableIndex] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [menu, setMenu] = useState<VariableMenu | null>(null)
  const [moveConfirm, setMoveConfirm] = useState<{ idx: number; dest: CmsComponent } | null>(null)
  const [notice, setNotice] = useState<{ destId: string; destName: string; mode: 'copy' | 'move' } | null>(null)
  const [transferring, setTransferring] = useState(false)
  const [menuDropUp, setMenuDropUp] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

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

  useLayoutEffect(() => {
    if (!menu || !pickerRef.current) {
      setMenuDropUp(false)
      return
    }
    const rect = pickerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom - SAVE_BAR_PX
    const spaceAbove = rect.top
    const needed = menu.panel === 'actions' ? 200 : 260
    setMenuDropUp(spaceBelow < needed && spaceAbove >= spaceBelow)
  }, [menu])

  useEffect(() => {
    if (!menu) return
    const onPointer = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setMenu(null)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setMenu((cur) => {
        if (!cur) return null
        if (cur.panel !== 'actions') return { idx: cur.idx, panel: 'actions' }
        return null
      })
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [menu])

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
    const clone = cloneVariable(
      source,
      component.variables.map((v) => v.key),
    )
    const next = [...component.variables]
    next.splice(idx + 1, 0, clone)
    setComponent({ ...component, variables: next })
  }

  const persistFields = (c: CmsComponent) => ({
    name: c.name,
    displayName: c.displayName,
    kind: c.kind ?? '',
    variables: c.variables,
  })

  const transferVariable = async (idx: number, dest: CmsComponent, mode: 'copy' | 'move') => {
    if (!component) return
    const source = component.variables[idx]
    if (!source) return
    const latestDest = components.find((c) => c.id === dest.id) ?? dest
    const destVars = (latestDest.variables ?? []).map(migrateVariable)
    const clone = cloneVariable(
      source,
      destVars.map((v) => v.key),
    )
    const nextSource: CmsComponent =
      mode === 'move'
        ? { ...component, variables: component.variables.filter((_, i) => i !== idx) }
        : component

    setTransferring(true)
    setError(null)
    try {
      await updateComponent(
        dest.id,
        { variables: [...destVars, clone] },
        user.email ?? undefined,
      )
      await updateComponent(
        nextSource.id,
        persistFields(nextSource),
        user.email ?? undefined,
      )
      setComponent(nextSource)
      if (mode === 'move') {
        setEditingVariableIndex((cur) => {
          if (cur === null) return null
          if (cur === idx) return null
          return cur > idx ? cur - 1 : cur
        })
      }
      setNotice({
        destId: dest.id,
        destName: dest.displayName || dest.name,
        mode,
      })
      setMenu(null)
      setMoveConfirm(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[CmsComponentEditor] Transfer variable failed:', msg, err)
      setError(msg)
    } finally {
      setTransferring(false)
    }
  }

  const otherComponents = components.filter((c) => c.id !== component?.id)

  const pickDestination = (dest: CmsComponent) => {
    if (!menu || menu.panel === 'actions') return
    if (menu.panel === 'move') {
      setMoveConfirm({ idx: menu.idx, dest })
      setMenu(null)
      return
    }
    void transferVariable(menu.idx, dest, 'copy')
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

        <section className="mb-8 rounded-panel bg-surface p-6 shadow-panel">
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
                className="w-full rounded-control border-hairline px-3 py-2 text-sm border-2 focus:border-brand-primary focus:outline-none focus-visible:ring-0"
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
                className="w-full rounded-control border-hairline px-3 py-2 text-sm border-2 focus:border-brand-primary focus:outline-none focus-visible:ring-0"
              />
            </label>
          </div>
        </section>

        <section className="mb-8 rounded-panel bg-surface p-6 shadow-panel">
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
            Reorder with ▲▼. Use More to duplicate here, or copy / move a variable to another component.
          </p>

          {error && (
            <p className="mb-4 rounded-control bg-danger-tint px-4 py-2 text-sm text-danger-strong">
              {error}
            </p>
          )}

          {notice && (
            <p className="mb-4 rounded-control bg-brand-rest px-4 py-2 text-sm text-brand-ink-on-tint">
              {notice.mode === 'move' ? 'Moved' : 'Copied'} to{' '}
              <Link
                to={`/${space}/components/${notice.destId}`}
                className="font-medium underline underline-offset-2 hover:text-brand-ink"
              >
                {notice.destName}
              </Link>
              .
            </p>
          )}

          <div className="flex flex-col gap-3">
            {component.variables.map((v, idx) => {
              if (v.hidden && !showArchived) return null
              return (
                <div
                  key={v.id}
                  className={`flex flex-wrap items-center gap-2 rounded-control border p-4 ${
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
                  <div
                    className="relative shrink-0"
                    ref={menu?.idx === idx ? pickerRef : undefined}
                  >
                    <button
                      type="button"
                      aria-haspopup="menu"
                      aria-expanded={menu?.idx === idx}
                      aria-label={`More actions for ${v.label || v.key || 'variable'}`}
                      disabled={transferring}
                      onClick={() =>
                        setMenu((cur) =>
                          cur?.idx === idx ? null : { idx, panel: 'actions' },
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-pill border border-hairline px-3 py-1.5 text-xs font-medium text-text-muted transition-colors duration-state hover:bg-hairline-soft disabled:opacity-40"
                    >
                      More
                      <ChevronDown
                        className={`h-3 w-3 transition-transform duration-state ${
                          menu?.idx === idx ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {menu?.idx === idx && (
                      <div
                        role="menu"
                        aria-label="Variable actions"
                        className={`absolute right-0 z-50 max-h-[min(20rem,calc(100vh-8rem))] min-w-[13.5rem] overflow-y-auto rounded-control border border-hairline bg-surface py-1 shadow-overlay ${
                          menuDropUp ? 'bottom-full mb-1' : 'top-full mt-1'
                        }`}
                      >
                        {menu.panel === 'actions' ? (
                          <>
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                duplicateVariable(idx)
                                setMenu(null)
                              }}
                              className="block w-full px-3 py-2 text-left text-xs font-medium text-brand-ink transition-colors duration-state hover:bg-brand-hover"
                            >
                              Duplicate on this component
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              disabled={otherComponents.length === 0}
                              onClick={() => setMenu({ idx, panel: 'copy' })}
                              className="block w-full px-3 py-2 text-left text-xs font-medium text-brand-ink transition-colors duration-state hover:bg-brand-hover disabled:text-text-subtle disabled:hover:bg-transparent"
                            >
                              Copy to…
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              disabled={otherComponents.length === 0}
                              onClick={() => setMenu({ idx, panel: 'move' })}
                              className="block w-full px-3 py-2 text-left text-xs font-medium text-brand-ink transition-colors duration-state hover:bg-brand-hover disabled:text-text-subtle disabled:hover:bg-transparent"
                            >
                              Move to…
                            </button>
                            {otherComponents.length === 0 && (
                              <p className="px-3 py-1.5 text-[10px] text-text-subtle">
                                Create another component to copy or move.
                              </p>
                            )}
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                updateVariable(idx, { hidden: !v.hidden })
                                setMenu(null)
                              }}
                              className="mt-1 block w-full border-t border-hairline px-3 py-2 text-left text-xs font-medium text-brand-ink transition-colors duration-state hover:bg-brand-hover"
                            >
                              {v.hidden ? 'Unarchive' : 'Archive'}
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => setMenu({ idx, panel: 'actions' })}
                              className="block w-full px-3 py-1.5 text-left text-[10px] font-medium text-text-muted transition-colors duration-state hover:bg-hairline-soft"
                            >
                              ← Back
                            </button>
                            <p className="px-3 pb-1 text-[10px] font-medium uppercase tracking-wider text-text-subtle">
                              {menu.panel === 'move' ? 'Move to' : 'Copy to'}
                            </p>
                            {otherComponents.map((dest) => (
                              <button
                                key={dest.id}
                                type="button"
                                role="menuitem"
                                disabled={transferring}
                                onClick={() => pickDestination(dest)}
                                className="block w-full px-3 py-2 text-left text-xs font-medium text-brand-ink transition-colors duration-state hover:bg-brand-hover disabled:opacity-50"
                              >
                                {dest.displayName || dest.name}
                              </button>
                            ))}
                          </>
                        )}
                      </div>
                    )}
                  </div>
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

          {moveConfirm && (
            <MoveVariableModal
              sourceName={component.displayName || component.name}
              destName={moveConfirm.dest.displayName || moveConfirm.dest.name}
              variableLabel={
                component.variables[moveConfirm.idx]?.label
                || component.variables[moveConfirm.idx]?.key
                || 'this variable'
              }
              busy={transferring}
              onConfirm={() => {
                void transferVariable(moveConfirm.idx, moveConfirm.dest, 'move')
              }}
              onCancel={() => setMoveConfirm(null)}
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
