import { useEffect, useId, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deleteDoc, getDoc } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { BlogBodyEditor, type BlogBodyEditorHandle } from '@/components/BlogBodyEditor'
import { useSpace } from '@/contexts/SpaceContext'
import { useCmsBlogCategories } from '@/hooks/useCmsBlogCategories'
import { slugifySpaceId } from '@/lib/blog-space'
import { spaceDoc } from '@/lib/firestore-paths'
import { normalizeBlogBodyHtml } from '@/lib/blog-paste'
import { markdownToHtml } from '@/lib/markdown-to-html'
import { publishBlogPost, saveBlogPost } from '@/lib/publish-blog'
import { uploadCmsAsset } from '@/lib/storage'
import {
  normalizeBlogStatus,
  type CmsBlogBodyMode,
  type CmsBlogCategory,
  type CmsBlogPost,
  type CmsBlogPostStatus,
} from '@/types/blog'

function normalizePostCategories(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      if (typeof item === 'string' && item.trim()) return [item.trim()]
      if (item && typeof item === 'object' && 'id' in item) {
        const id = (item as { id?: unknown }).id
        return typeof id === 'string' && id.trim() ? [id.trim()] : []
      }
      return []
    })
  }
  if (typeof value === 'string' && value.trim()) return [value.trim()]
  return []
}

function categorySelected(ids: string[], cat: CmsBlogCategory) {
  return ids.some((id) => (
    id === cat.id
    || id === cat.slug
    || id.toLowerCase() === cat.name.toLowerCase()
  ))
}

function formatDateInput(ms?: number) {
  const date = ms ? new Date(ms) : new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function emptyPost(slug = ''): CmsBlogPost {
  return {
    slug,
    title: '',
    subtitle: '',
    excerpt: '',
    heroImage: '',
    heroVideo: '',
    bodyHtml: '<p></p>',
    bodyMode: 'editor',
    markdownSource: '',
    categories: [],
    status: 'draft',
    seoTitle: '',
    seoDescription: '',
  }
}

export function CmsBlogPostEditor({ user }: { user: User }) {
  const space = useSpace()
  const { slug: routeSlug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { categories, createCategory, error: categoriesError } = useCmsBlogCategories(space)
  const bodyRef = useRef<BlogBodyEditorHandle>(null)

  const [post, setPost] = useState<CmsBlogPost>(emptyPost(routeSlug ?? ''))
  const [publishedLocal, setPublishedLocal] = useState(formatDateInput())
  const [desiredStatus, setDesiredStatus] = useState<CmsBlogPostStatus>('draft')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [note, setNote] = useState<{ text: string; error?: boolean } | null>(null)
  const [newCat, setNewCat] = useState('')
  const [catOpen, setCatOpen] = useState(false)
  const [addingCat, setAddingCat] = useState(false)
  const [slugLocked, setSlugLocked] = useState(false)
  const catMenuRef = useRef<HTMLDivElement>(null)
  const catMenuId = useId()

  useEffect(() => {
    if (!note) return
    const t = setTimeout(() => setNote(null), 3500)
    return () => clearTimeout(t)
  }, [note])

  useEffect(() => {
    if (!catOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCatOpen(false)
    }
    const onPointer = (e: PointerEvent) => {
      if (!catMenuRef.current?.contains(e.target as Node)) setCatOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [catOpen])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!routeSlug) {
        setPost(emptyPost())
        setLoading(false)
        return
      }
      const snap = await getDoc(spaceDoc(space, 'posts', routeSlug))
      if (cancelled) return
      if (!snap.exists()) {
        setPost(emptyPost(routeSlug))
        setSlugLocked(false)
        setLoading(false)
        return
      }
      const data = { ...(snap.data() as CmsBlogPost), slug: routeSlug }
      setPost({
        ...emptyPost(routeSlug),
        ...data,
        bodyHtml: normalizeBlogBodyHtml(data.bodyHtml || '<p></p>'),
        categories: normalizePostCategories(data.categories),
      })
      setDesiredStatus(data.status)
      setPublishedLocal(formatDateInput(data.publishedAt))
      setSlugLocked(true)
      setLoading(false)
    }
    setLoading(true)
    load().catch((err) => {
      console.error(err)
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [space, routeSlug])

  const patch = (partial: Partial<CmsBlogPost>) => setPost((p) => ({ ...p, ...partial }))

  const resolveBody = (): Pick<CmsBlogPost, 'bodyHtml' | 'markdownSource' | 'bodyMode'> => {
    const mode = post.bodyMode ?? 'editor'
    if (mode === 'markdown') {
      return { bodyMode: mode, bodyHtml: markdownToHtml(post.markdownSource ?? ''), markdownSource: post.markdownSource }
    }
    return {
      bodyMode: mode,
      bodyHtml: bodyRef.current?.getHtml() ?? post.bodyHtml,
    }
  }

  const buildPost = (status: CmsBlogPostStatus): CmsBlogPost | null => {
    const slug = slugifySpaceId(post.slug || post.title)
    if (!slug) {
      setNote({ text: 'Add a title or slug.', error: true })
      return null
    }
    if (!post.title.trim()) {
      setNote({ text: 'Title is required.', error: true })
      return null
    }
    const publishedAt = new Date(publishedLocal).getTime()
    const normalized = normalizeBlogStatus(status, Number.isNaN(publishedAt) ? undefined : publishedAt)
    return {
      ...post,
      ...resolveBody(),
      slug,
      title: post.title.trim(),
      subtitle: post.subtitle?.trim() || undefined,
      excerpt: post.excerpt?.trim() || undefined,
      heroImage: post.heroImage?.trim() || undefined,
      heroVideo: post.heroVideo?.trim() || undefined,
      seoTitle: post.seoTitle?.trim() || undefined,
      seoDescription: post.seoDescription?.trim() || undefined,
      status: normalized,
      publishedAt: normalized === 'draft' ? post.publishedAt : (Number.isNaN(publishedAt) ? Date.now() : publishedAt),
      categories: normalizePostCategories(post.categories),
    }
  }

  const handleSave = async () => {
    const next = buildPost(desiredStatus === 'published' || desiredStatus === 'scheduled' ? desiredStatus : 'draft')
    if (!next) return
    setSaving(true)
    try {
      const saved = await saveBlogPost(space, next, user.email ?? undefined)
      setPost(saved)
      setSlugLocked(true)
      if (routeSlug !== saved.slug) navigate(`/${space}/posts/${saved.slug}`, { replace: true })
      setNote({ text: 'Saved' })
    } catch (err) {
      setNote({ text: err instanceof Error ? err.message : 'Save failed', error: true })
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    const next = buildPost(desiredStatus === 'draft' ? 'published' : desiredStatus)
    if (!next) return
    setPublishing(true)
    try {
      const { post: saved } = await publishBlogPost(space, next, user.email ?? undefined)
      setPost(saved)
      setDesiredStatus(saved.status)
      setSlugLocked(true)
      if (routeSlug !== saved.slug) navigate(`/${space}/posts/${saved.slug}`, { replace: true })
      setNote({ text: saved.status === 'scheduled' ? 'Scheduled' : 'Published' })
    } catch (err) {
      setNote({ text: err instanceof Error ? err.message : 'Publish failed', error: true })
    } finally {
      setPublishing(false)
    }
  }

  const handleDelete = async () => {
    if (!post.slug || !confirm('Delete this post?')) return
    await deleteDoc(spaceDoc(space, 'posts', post.slug))
    await deleteDoc(spaceDoc(space, 'published-posts', post.slug)).catch(() => undefined)
    navigate(`/${space}`, { replace: true })
  }

  const selectedCategoryIds = normalizePostCategories(post.categories)
  const selectedCategoryNames = categories
    .filter((cat) => categorySelected(selectedCategoryIds, cat))
    .map((cat) => cat.name)

  const toggleCategory = (id: string) => {
    setPost((p) => {
      const current = normalizePostCategories(p.categories)
      const next = current.includes(id)
        ? current.filter((c) => c !== id)
        : [...current, id]
      return { ...p, categories: next }
    })
  }

  const addCategory = async () => {
    if (!newCat.trim() || addingCat) return
    setAddingCat(true)
    try {
      const created = await createCategory(newCat)
      setPost((p) => {
        const current = normalizePostCategories(p.categories)
        if (current.includes(created.id)) return p
        return { ...p, categories: [...current, created.id] }
      })
      setNewCat('')
    } catch (err) {
      setNote({ text: err instanceof Error ? err.message : 'Could not add category', error: true })
    } finally {
      setAddingCat(false)
    }
  }

  const modes: { id: CmsBlogBodyMode; label: string }[] = [
    { id: 'editor', label: 'Editor' },
    { id: 'markdown', label: 'Markdown' },
    { id: 'html', label: 'HTML' },
  ]

  if (loading) {
    return <div className="px-6 py-12 text-sm text-text-muted">Loading…</div>
  }

  const inputClass =
    'font-emoji rounded-control border-hairline bg-surface px-3 py-2 text-sm text-brand-ink border-2 focus:border-brand-primary focus:outline-none focus-visible:ring-0'

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 pb-28">
      <div className="mb-6 flex items-center justify-between">
        <Link to={`/${space}`} className="text-sm font-medium text-brand-primary hover:underline">
          ← Posts
        </Link>
        {note && (
          <span className={`text-xs font-medium ${note.error ? 'text-danger' : 'text-brand-success'}`}>{note.text}</span>
        )}
      </div>

      <div className="space-y-5">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-text-muted">Title</span>
          <input
            className={inputClass}
            value={post.title}
            onChange={(e) => {
              const title = e.target.value
              patch({ title, slug: slugLocked ? post.slug : slugifySpaceId(title) })
            }}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-text-muted">Subtitle</span>
          <input className={inputClass} value={post.subtitle ?? ''} onChange={(e) => patch({ subtitle: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-text-muted">Slug</span>
          <input
            className={inputClass}
            value={post.slug}
            onChange={(e) => { setSlugLocked(true); patch({ slug: slugifySpaceId(e.target.value) }) }}
          />
          <span className="text-xs text-text-subtle">/{space}/{post.slug || 'slug'}</span>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-text-muted">Excerpt</span>
          <textarea
            className={inputClass}
            rows={3}
            value={post.excerpt ?? ''}
            onChange={(e) => patch({ excerpt: e.target.value })}
          />
        </label>

        <div>
          <span className="text-xs font-medium text-text-muted" id={`${catMenuId}-label`}>
            Categories
          </span>
          <div ref={catMenuRef} className="relative mt-1">
            <button
              type="button"
              className={`${inputClass} flex w-full items-center justify-between text-left`}
              aria-labelledby={`${catMenuId}-label`}
              aria-haspopup="listbox"
              aria-expanded={catOpen}
              aria-controls={catMenuId}
              onClick={() => setCatOpen((open) => !open)}
            >
              <span className={selectedCategoryIds.length ? 'text-brand-ink' : 'text-text-muted'}>
                {selectedCategoryNames.length
                  ? selectedCategoryNames.join(', ')
                  : selectedCategoryIds.length
                    ? `${selectedCategoryIds.length} selected`
                    : 'Select a category…'}
              </span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0 opacity-40">
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {catOpen && (
              <div
                id={catMenuId}
                role="listbox"
                aria-labelledby={`${catMenuId}-label`}
                aria-multiselectable="true"
                className="absolute left-0 right-0 z-30 mt-1 overflow-hidden rounded-control border border-hairline bg-surface shadow-panel"
              >
                <ul className="max-h-48 overflow-auto py-1">
                  {categories.map((cat) => {
                    const on = categorySelected(selectedCategoryIds, cat)
                    return (
                      <li key={cat.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={on}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => toggleCategory(cat.id)}
                          className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${
                            on ? 'bg-brand-rest text-brand-ink-on-tint' : 'text-brand-ink hover:bg-hairline-soft'
                          }`}
                        >
                          {cat.name}
                          {on && <span aria-hidden="true">✓</span>}
                        </button>
                      </li>
                    )
                  })}
                  {categories.length === 0 && (
                    <li className="px-3 py-2 text-sm text-text-muted">No categories yet.</li>
                  )}
                </ul>
                <div className="flex gap-2 border-t border-hairline p-2">
                  <input
                    className={`${inputClass} min-w-0 flex-1 py-1.5`}
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        void addCategory()
                      }
                    }}
                    placeholder="Add category"
                    aria-label="New category name"
                    disabled={addingCat}
                  />
                  <button
                    type="button"
                    onClick={() => void addCategory()}
                    disabled={addingCat || !newCat.trim()}
                    className="rounded-control px-3 py-1.5 text-xs font-medium text-brand-primary hover:bg-hairline-soft disabled:opacity-50"
                  >
                    {addingCat ? 'Adding…' : 'Add'}
                  </button>
                </div>
              </div>
            )}
          </div>
          {categoriesError && (
            <p className="mt-2 text-xs text-danger">{categoriesError.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-text-muted">Hero image</span>
          {post.heroImage && (
            <img src={post.heroImage} alt="" className="max-h-40 w-auto rounded-control object-cover" />
          )}
          <input
            className={inputClass}
            value={post.heroImage ?? ''}
            onChange={(e) => patch({ heroImage: e.target.value })}
            placeholder="https://…"
          />
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (!file) return
              const url = await uploadCmsAsset(file, 'hero-image')
              patch({ heroImage: url })
            }}
            className="text-sm text-text-muted file:mr-3 file:rounded-control file:border-0 file:bg-brand-rest file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-brand-ink-on-tint"
          />
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-text-muted">Hero video URL (optional)</span>
          <input
            className={inputClass}
            type="url"
            value={post.heroVideo ?? ''}
            onChange={(e) => patch({ heroVideo: e.target.value })}
            placeholder="https://www.youtube.com/watch?v=…"
          />
        </label>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-text-muted">Body</span>
            <div className="flex rounded-control bg-hairline-soft p-0.5">
              {modes.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => patch({ bodyMode: m.id })}
                  className={`rounded-control px-2.5 py-1 text-[11px] font-medium ${
                    (post.bodyMode ?? 'editor') === m.id
                      ? 'bg-surface text-brand-primary shadow-card'
                      : 'text-text-muted hover:text-brand-ink'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <BlogBodyEditor
            ref={bodyRef}
            mode={post.bodyMode ?? 'editor'}
            html={post.bodyHtml}
            markdown={post.markdownSource ?? ''}
            onHtmlChange={(bodyHtml) => patch({ bodyHtml })}
            onMarkdownChange={(markdownSource) => patch({ markdownSource })}
            onHeroFromHtml={(url) => {
              if (!post.heroImage?.trim()) patch({ heroImage: url })
            }}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-text-muted">Status</span>
            <select
              className={inputClass}
              value={desiredStatus}
              onChange={(e) => setDesiredStatus(e.target.value as CmsBlogPostStatus)}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-text-muted">Publish date</span>
            <input
              className={inputClass}
              type="datetime-local"
              value={publishedLocal}
              onChange={(e) => setPublishedLocal(e.target.value)}
            />
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-text-muted">SEO title</span>
          <input className={inputClass} value={post.seoTitle ?? ''} onChange={(e) => patch({ seoTitle: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-text-muted">SEO description</span>
          <textarea
            className={inputClass}
            rows={2}
            value={post.seoDescription ?? ''}
            onChange={(e) => patch({ seoDescription: e.target.value })}
          />
        </label>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-hairline bg-surface px-6 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <button type="button" onClick={handleDelete} className="text-xs font-medium text-danger hover:underline">
            Delete
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || publishing}
              className="rounded-control border border-hairline px-5 py-1.5 font-button text-xs text-brand-ink hover:bg-hairline-soft disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={saving || publishing}
              className="rounded-control bg-brand-primary px-5 py-1.5 font-button text-xs text-brand-on shadow-button hover:bg-brand-wash hover:text-brand-ink-on-tint disabled:opacity-50"
            >
              {publishing ? 'Publishing…' : 'Publish'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
