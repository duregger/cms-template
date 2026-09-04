import { useEffect, useState, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import type { User } from 'firebase/auth'
import { getDoc, setDoc, deleteDoc } from 'firebase/firestore'
import type { CmsPageSection, CmsPageSectionItem, CmsPageSeo, CmsPageOpenGraph, CmsPage } from '@/types/cms'
import { useCmsPagesContext } from '@/contexts/CmsPagesContext'
import { useSpace } from '@/contexts/SpaceContext'
import { spaceDoc } from '@/lib/firestore-paths'
import { uploadCmsAsset } from '@/lib/storage'
import { useCmsComponentsContext } from '@/contexts/CmsComponentsContext'
import { ChevronDown } from '@/components/icons/ChevronDown'

function Toast({
  message,
  type,
  onClose,
}: {
  message: string
  type: 'success' | 'error'
  onClose: () => void
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div
      className={`rounded-pill px-10 py-3 font-button text-sm ${
        type === 'success'
          ? 'bg-brand-success text-surface'
          : 'bg-danger text-surface'
      }`}
    >
      {message}
    </div>
  )
}

function pageDisplayName(slug: string): string {
  return slug.charAt(0).toUpperCase() + slug.slice(1)
}

function SectionItemRow({
  item,
  sectionId,
  idx,
  total,
  onMove,
  onRemove,
  onUpdateVariable,
  components,
}: {
  item: CmsPageSectionItem
  sectionId: string
  idx: number
  total: number
  onMove: (sectionId: string, idx: number, dir: -1 | 1) => void
  onRemove: (sectionId: string, itemId: string) => void
  onUpdateVariable: (sectionId: string, itemId: string, variable?: string) => void
  components: ReturnType<typeof useCmsComponentsContext>['components']
}) {
  const space = useSpace()
  const comp = components.find((c) => c.id === item.componentId)
  const visibleVars = comp?.variables.filter((v) => !v.hidden) ?? []

  return (
    <div className="flex items-center gap-2 rounded-control border border-hairline bg-hairline-soft px-4 py-3">
      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          onClick={() => onMove(sectionId, idx, -1)}
          disabled={idx === 0}
          className="rounded px-2 py-1 text-xs text-text-muted hover:bg-hairline-soft disabled:opacity-30"
          title="Move up"
        >
          ▲
        </button>
        <button
          type="button"
          onClick={() => onMove(sectionId, idx, 1)}
          disabled={idx === total - 1}
          className="rounded px-2 py-1 text-xs text-text-muted hover:bg-hairline-soft disabled:opacity-30"
          title="Move down"
        >
          ▼
        </button>
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-sm font-medium text-brand-ink">
          {comp?.displayName || comp?.name || 'Unknown'}
        </span>
      </div>
      {visibleVars.length > 0 && (
        <select
          value={item.variable ?? ''}
          onChange={(e) =>
            onUpdateVariable(
              sectionId,
              item.id,
              e.target.value || undefined,
            )
          }
          className="shrink-0 rounded-control border border-hairline bg-surface px-3 py-1.5 text-xs text-brand-ink focus:border-brand-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1"
        >
          <option value="">All variables ({visibleVars.length})</option>
          {visibleVars.map((v) => (
            <option key={v.id} value={v.key}>
              {v.label || v.key}
            </option>
          ))}
        </select>
      )}
      <Link
        to={`/${space}/components/${item.componentId}`}
        className="shrink-0 rounded-pill border border-hairline px-3 py-1.5 text-xs font-medium text-brand-ink transition-colors duration-state hover:bg-hairline-soft"
      >
        Edit
      </Link>
      <button
        type="button"
        onClick={() => onRemove(sectionId, item.id)}
        className="shrink-0 rounded px-2 py-1 text-xs text-danger hover:bg-danger-tint"
      >
        Remove
      </button>
    </div>
  )
}

function ConfirmDeleteModal({
  sectionName,
  onConfirm,
  onCancel,
}: {
  sectionName: string
  onConfirm: () => void
  onCancel: () => void
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onCancel])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-sm rounded-panel bg-surface p-8 shadow-overlay">
        <button
          onClick={onCancel}
          className="absolute right-4 top-4 rounded-full p-2 text-text-subtle transition-colors duration-state hover:bg-hairline-soft hover:text-brand-ink"
          aria-label="Close"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M15 5L5 15M5 5l10 10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <h2 className="font-cabin text-xl font-bold text-brand-ink">
          Delete Section
        </h2>
        <p className="mt-2 text-sm text-text-muted">
          Are you sure you want to remove{' '}
          <strong className="text-brand-ink">{sectionName}</strong> from
          this page? This won&apos;t delete the components themselves.
        </p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-control border border-hairline px-5 py-2 text-xs font-medium text-text-muted transition-colors duration-state hover:bg-hairline-soft"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-control bg-danger px-5 py-2 font-button text-xs text-surface shadow-button transition-colors duration-state hover:bg-danger-strong"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export function CmsPageEditor({ user }: { user: User }) {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const space = useSpace()
  const pageSlug = slug ?? 'home'
  const { components } = useCmsComponentsContext()

  const [sections, setSections] = useState<CmsPageSection[]>([])
  const [deletingSectionId, setDeletingSectionId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error'
  } | null>(null)

  const [addSectionName, setAddSectionName] = useState('')
  const [addSectionOpen, setAddSectionOpen] = useState(false)

  const [addItemDropdown, setAddItemDropdown] = useState<string | null>(null)

  const [seo, setSeo] = useState<CmsPageSeo>({})
  const [openGraph, setOpenGraph] = useState<CmsPageOpenGraph>({ ogType: 'website' })
  const [seoOpen, setSeoOpen] = useState(false)

  const [pageParentSlug, setPageParentSlug] = useState<string>('')
  const { pages } = useCmsPagesContext()
  const topLevelPages = pages.filter((p) => !p.parentSlug && p.slug !== pageSlug)

  const [editingSlug, setEditingSlug] = useState(false)
  const [draftSlug, setDraftSlug] = useState(pageSlug)
  const [renaming, setRenaming] = useState(false)

  useEffect(() => {
    setDraftSlug(pageSlug)
    setEditingSlug(false)
  }, [pageSlug])

  const sanitizeSlug = (s: string) =>
    s.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  const handleRenameSlug = async () => {
    const newSlug = sanitizeSlug(draftSlug)
    if (!newSlug || newSlug === pageSlug) {
      setDraftSlug(pageSlug)
      setEditingSlug(false)
      return
    }
    setRenaming(true)
    try {
      const existing = await getDoc(spaceDoc(space, 'pages', newSlug))
      if (existing.exists()) {
        setToast({ message: `Page "${newSlug}" already exists`, type: 'error' })
        setDraftSlug(pageSlug)
        setEditingSlug(false)
        setRenaming(false)
        return
      }
      const oldSnap = await getDoc(spaceDoc(space, 'pages', pageSlug))
      const oldData = oldSnap.exists() ? oldSnap.data() : {}
      await setDoc(spaceDoc(space, 'pages', newSlug), {
        ...oldData,
        slug: newSlug,
        sections,
        updatedAt: Date.now(),
        updatedBy: user.email,
      })
      await deleteDoc(spaceDoc(space, 'pages', pageSlug))
      setEditingSlug(false)
      navigate(`/${space}/pages/${newSlug}`, { replace: true })
      setToast({ message: `Renamed to "${newSlug}"`, type: 'success' })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setToast({ message: `Rename failed: ${msg}`, type: 'error' })
      setDraftSlug(pageSlug)
      setEditingSlug(false)
    } finally {
      setRenaming(false)
    }
  }

  const loadContent = useCallback(async () => {
    setLoadError(null)
    try {
      const snap = await getDoc(spaceDoc(space, 'pages', pageSlug))
      if (snap.exists()) {
        const data = snap.data()
        if (Array.isArray(data.sections) && data.sections.length > 0 && data.sections[0]?.items) {
          setSections(data.sections)
        } else {
          const migrated: CmsPageSection[] = []
          if (Array.isArray(data.hero) && data.hero.length > 0) {
            migrated.push({
              id: crypto.randomUUID(),
              name: 'Hero Slides',
              items: data.hero.map((h: Record<string, unknown>) => ({
                id: (h.id as string) || crypto.randomUUID(),
                componentId: (h.componentId as string) || '',
                variable: (h.variable as string) || undefined,
              })),
            })
          }
          setSections(migrated)
        }
        if (data.seo) setSeo(data.seo)
        if (data.openGraph) setOpenGraph({ ogType: 'website', ...data.openGraph })
        setPageParentSlug((data as CmsPage).parentSlug ?? '')
      } else {
        setSections([])
        setSeo({})
        setOpenGraph({ ogType: 'website' })
        setPageParentSlug('')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('Failed to load CMS content', err)
      setLoadError(msg)
    }
  }, [pageSlug])

  useEffect(() => {
    loadContent()
  }, [loadContent])

  const closeDropdowns = useCallback(() => {
    setAddItemDropdown(null)
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        slug: pageSlug,
        sections,
        seo,
        openGraph,
        updatedAt: Date.now(),
        updatedBy: user.email,
      }
      payload.parentSlug = pageParentSlug || ''
      await setDoc(spaceDoc(space, 'pages', pageSlug), payload, { merge: true })
      setToast({ message: 'Saved successfully!', type: 'success' })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[CmsPageEditor] Save failed:', msg, err)
      setToast({ message: `Save failed: ${msg}`, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const addSection = () => {
    const name = addSectionName.trim()
    if (!name) return
    setSections((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name, items: [] },
    ])
    setAddSectionName('')
    setAddSectionOpen(false)
  }

  const removeSection = (id: string) => {
    setSections((prev) => prev.filter((s) => s.id !== id))
    setDeletingSectionId(null)
  }

  const moveSection = (idx: number, dir: -1 | 1) => {
    setSections((prev) => {
      const target = idx + dir
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[idx], next[target]] = [next[target]!, next[idx]!]
      return next
    })
  }

  const renameSection = (id: string, name: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name } : s)),
    )
  }

  const addItem = (sectionId: string, componentId: string) => {
    const item: CmsPageSectionItem = {
      id: crypto.randomUUID(),
      componentId,
    }
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, items: [...s.items, item] } : s,
      ),
    )
    setAddItemDropdown(null)
  }

  const updateItemVariable = (
    sectionId: string,
    itemId: string,
    variable?: string,
  ) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              items: s.items.map((i) =>
                i.id === itemId ? { ...i, variable } : i,
              ),
            }
          : s,
      ),
    )
  }

  const removeItem = (sectionId: string, itemId: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, items: s.items.filter((i) => i.id !== itemId) }
          : s,
      ),
    )
  }

  const moveItem = (sectionId: string, idx: number, dir: -1 | 1) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s
        const target = idx + dir
        if (target < 0 || target >= s.items.length) return s
        const next = [...s.items]
        ;[next[idx], next[target]] = [next[target]!, next[idx]!]
        return { ...s, items: next }
      }),
    )
  }

  const pageName = pageDisplayName(pageSlug)

  return (
    <div className="bg-surface font-body pb-24">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6 flex items-center gap-3">
          <nav className="flex items-center gap-2 text-sm text-text-muted">
            <Link to={`/${space}`} className="hover:text-brand-ink">
              Pages
            </Link>
            <span>›</span>
          </nav>
          {editingSlug ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={draftSlug}
                onChange={(e) => setDraftSlug(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSlug()
                  if (e.key === 'Escape') {
                    setDraftSlug(pageSlug)
                    setEditingSlug(false)
                  }
                }}
                disabled={renaming}
                className="rounded-control border border-brand-primary px-3 py-1.5 font-label text-lg text-brand-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1"
                autoFocus
              />
              <button
                type="button"
                onClick={handleRenameSlug}
                disabled={renaming || !draftSlug.trim()}
                className="rounded-control bg-brand-primary shadow-button px-4 py-1.5 text-xs font-medium text-brand-on transition-colors duration-state hover:bg-brand-wash hover:text-brand-ink-on-tint disabled:opacity-50"
              >
                {renaming ? 'Renaming…' : 'Rename'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraftSlug(pageSlug)
                  setEditingSlug(false)
                }}
                disabled={renaming}
                className="rounded-pill border border-hairline px-4 py-1.5 text-xs font-medium text-text-muted transition-colors duration-state hover:bg-hairline-soft"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditingSlug(true)}
              className="group flex items-center gap-2 rounded-control border border-transparent px-3 py-1.5 font-label text-lg text-brand-ink transition-colors duration-state hover:border-hairline"
            >
              {pageName}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-text-subtle opacity-0 transition-colors duration-state group-hover:opacity-100"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          )}
        </div>

        {loadError && (
          <div className="mb-6 rounded-control border border-danger bg-danger-tint px-4 py-3 font-body text-sm text-danger-strong">
            <strong>Load failed:</strong> {loadError}
            <button
              type="button"
              onClick={() => loadContent()}
              className="ml-4 text-danger underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        <section className="mb-8 flex items-center gap-4 rounded-panel border border-hairline-soft bg-surface px-6 py-4 shadow-panel">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-text-muted">Parent Page</span>
            <select
              value={pageParentSlug}
              onChange={(e) => setPageParentSlug(e.target.value)}
              className="rounded-control border border-hairline bg-surface px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1"
            >
              <option value="">None (top-level)</option>
              {topLevelPages.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.slug.charAt(0).toUpperCase() + p.slug.slice(1)}
                </option>
              ))}
            </select>
          </label>
          <span className="pt-5 text-xs text-text-muted">
            URL: <span className="font-mono">{pageParentSlug ? `domain.com/${pageParentSlug}/${pageSlug}` : `domain.com/${pageSlug}`}</span>
          </span>
        </section>

        <section className="mb-8 rounded-panel border border-hairline-soft bg-surface shadow-panel">
          <button
            type="button"
            onClick={() => setSeoOpen((p) => !p)}
            className="flex w-full items-center justify-between px-6 py-4"
          >
            <h2 className="font-label text-sm text-brand-ink">SEO &amp; Open Graph</h2>
            <ChevronDown className={`h-4 w-4 text-text-subtle transition ${seoOpen ? 'rotate-180' : ''}`} />
          </button>

          {seoOpen && (
            <div className="border-t border-hairline px-6 pb-6 pt-4">
              <div className="mb-5">
                <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-text-subtle">SEO</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-text-muted">Page Title</span>
                    <input
                      type="text"
                      value={seo.title ?? ''}
                      onChange={(e) => setSeo((s) => ({ ...s, title: e.target.value }))}
                      placeholder="e.g. Northstar Coffee — Neighborhood Roastery"
                      className="rounded-control border border-hairline px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-text-muted">Canonical URL</span>
                    <input
                      type="url"
                      value={seo.canonical ?? ''}
                      onChange={(e) => setSeo((s) => ({ ...s, canonical: e.target.value }))}
                      placeholder="https://www.client.com/page"
                      className="rounded-control border border-hairline px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1"
                    />
                  </label>
                  <label className="flex flex-col gap-1 sm:col-span-2">
                    <span className="text-xs font-medium text-text-muted">Meta Description</span>
                    <textarea
                      rows={2}
                      value={seo.description ?? ''}
                      onChange={(e) => setSeo((s) => ({ ...s, description: e.target.value }))}
                      placeholder="A brief description for search engine results (150–160 characters)"
                      className="rounded-control border border-hairline px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1"
                    />
                    <span className="text-xs text-text-subtle">
                      {(seo.description ?? '').length}/160 characters
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={seo.noIndex ?? false}
                      onChange={(e) => setSeo((s) => ({ ...s, noIndex: e.target.checked }))}
                      className="h-4 w-4 rounded border-hairline text-brand-primary focus:ring-brand-primary"
                    />
                    <span className="text-xs font-medium text-text-muted">noindex (hide from search engines)</span>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-text-subtle">Open Graph</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-text-muted">OG Title</span>
                    <input
                      type="text"
                      value={openGraph.ogTitle ?? ''}
                      onChange={(e) => setOpenGraph((o) => ({ ...o, ogTitle: e.target.value }))}
                      placeholder={seo.title || 'Falls back to page title'}
                      className="rounded-control border border-hairline px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-text-muted">OG Type</span>
                    <select
                      value={openGraph.ogType ?? 'website'}
                      onChange={(e) => setOpenGraph((o) => ({ ...o, ogType: e.target.value }))}
                      className="rounded-control border border-hairline bg-surface px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1"
                    >
                      <option value="website">website</option>
                      <option value="article">article</option>
                      <option value="restaurant">restaurant</option>
                      <option value="product">product</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 sm:col-span-2">
                    <span className="text-xs font-medium text-text-muted">OG Description</span>
                    <textarea
                      rows={2}
                      value={openGraph.ogDescription ?? ''}
                      onChange={(e) => setOpenGraph((o) => ({ ...o, ogDescription: e.target.value }))}
                      placeholder={seo.description || 'Falls back to meta description'}
                      className="rounded-control border border-hairline px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1"
                    />
                  </label>
                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <span className="text-xs font-medium text-text-muted">OG Image</span>
                    <div className="flex items-center gap-3">
                      <input
                        type="url"
                        value={openGraph.ogImage ?? ''}
                        onChange={(e) => setOpenGraph((o) => ({ ...o, ogImage: e.target.value }))}
                        placeholder="https://..."
                        className="min-w-0 flex-1 rounded-control border border-hairline px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1"
                      />
                      <label className="flex shrink-0 cursor-pointer items-center rounded-control border border-hairline bg-hairline-soft px-4 py-2 text-xs font-medium text-text-muted transition-colors duration-state hover:bg-hairline-soft">
                        Upload
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            try {
                              const url = await uploadCmsAsset(file, 'og')
                              setOpenGraph((o) => ({ ...o, ogImage: url }))
                            } catch (err) {
                              console.error('OG image upload failed', err)
                            }
                            e.target.value = ''
                          }}
                        />
                      </label>
                    </div>
                    {openGraph.ogImage && (
                      <img
                        src={openGraph.ogImage}
                        alt="OG preview"
                        className="mt-2 h-32 w-auto rounded-tile border border-hairline object-cover"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {sections.map((section, sIdx) => (
          <section
            key={section.id}
            className="mb-8 rounded-panel border border-hairline-soft bg-surface p-6 shadow-panel"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={section.name}
                  onChange={(e) => renameSection(section.id, e.target.value)}
                  className="rounded-control border border-transparent px-2 py-1 font-label text-lg text-brand-ink hover:border-hairline focus:border-brand-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1"
                />
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveSection(sIdx, -1)}
                  disabled={sIdx === 0}
                  className="rounded px-2 py-1 text-xs text-text-muted hover:bg-hairline-soft disabled:opacity-30"
                  title="Move up"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => moveSection(sIdx, 1)}
                  disabled={sIdx === sections.length - 1}
                  className="rounded px-2 py-1 text-xs text-text-muted hover:bg-hairline-soft disabled:opacity-30"
                  title="Move down"
                >
                  ▼
                </button>
                <button
                  type="button"
                  onClick={() => setDeletingSectionId(section.id)}
                  className="ml-2 rounded px-2 py-1 text-xs text-danger hover:bg-danger-tint"
                >
                  Remove
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {section.items.map((item, iIdx) => (
                <SectionItemRow
                  key={item.id}
                  item={item}
                  sectionId={section.id}
                  idx={iIdx}
                  total={section.items.length}
                  onMove={moveItem}
                  onRemove={removeItem}
                  onUpdateVariable={updateItemVariable}
                  components={components}
                />
              ))}

              {section.items.length === 0 && (
                <p className="rounded-panel border border-dashed border-hairline bg-hairline-soft px-4 py-6 text-center text-sm text-text-muted">
                  No components yet. Add one below.
                </p>
              )}
            </div>

            <div className="relative mt-4">
              <button
                type="button"
                onClick={() => {
                  if (addItemDropdown === section.id) {
                    closeDropdowns()
                  } else {
                    setAddItemDropdown(section.id)
                  }
                }}
                className="flex items-center gap-1 rounded-control bg-brand-primary shadow-button px-4 py-2 font-button text-xs text-brand-on transition-colors duration-state hover:bg-brand-wash hover:text-brand-ink-on-tint"
              >
                + Add Component
                <ChevronDown className="h-3.5 w-3.5" />
              </button>

              {addItemDropdown === section.id && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={closeDropdowns}
                  />
                  <div className="absolute left-0 top-full z-40 mt-1 min-w-[220px] rounded-card border border-hairline bg-surface py-1 shadow-overlay">
                    {components.length > 0 ? (
                      components.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => addItem(section.id, c.id)}
                          className="block w-full px-4 py-2 text-left text-sm text-brand-ink hover:bg-hairline-soft"
                        >
                          {c.displayName || c.name}
                        </button>
                      ))
                    ) : (
                      <p className="px-4 py-3 text-sm text-text-muted">
                        No components built yet.
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </section>
        ))}

        <div className="mb-8">
          {addSectionOpen ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={addSectionName}
                onChange={(e) => setAddSectionName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSection()}
                placeholder="Section name, e.g. Hero Slides"
                className="rounded-control border border-hairline px-4 py-2 text-sm focus:border-brand-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1"
                autoFocus
              />
              <button
                type="button"
                onClick={addSection}
                disabled={!addSectionName.trim()}
                className="rounded-control bg-brand-primary shadow-button px-4 py-2 font-button text-xs text-brand-on transition-colors duration-state hover:bg-brand-wash hover:text-brand-ink-on-tint disabled:opacity-50"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddSectionOpen(false)
                  setAddSectionName('')
                }}
                className="rounded-pill border border-hairline px-4 py-2 text-xs font-medium text-text-muted transition-colors duration-state hover:bg-hairline-soft"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddSectionOpen(true)}
              className="rounded-control bg-brand-primary shadow-button px-4 py-2 font-button text-xs text-brand-on transition-colors duration-state hover:bg-brand-wash hover:text-brand-ink-on-tint"
            >
              + Add Section
            </button>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-hairline bg-surface px-6 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-end">
          {toast ? (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          ) : (
            <button
              onClick={save}
              disabled={saving}
              className="rounded-control bg-brand-primary shadow-button px-10 py-3 font-button text-sm text-brand-on transition-colors duration-state hover:bg-brand-wash hover:text-brand-ink-on-tint disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          )}
        </div>
      </div>

      {deletingSectionId && (() => {
        const section = sections.find((s) => s.id === deletingSectionId)
        if (!section) return null
        return (
          <ConfirmDeleteModal
            sectionName={section.name || 'Untitled Section'}
            onConfirm={() => removeSection(deletingSectionId)}
            onCancel={() => setDeletingSectionId(null)}
          />
        )
      })()}
    </div>
  )
}
