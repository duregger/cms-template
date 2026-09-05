import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { User } from 'firebase/auth'
import { useSpace } from '@/contexts/SpaceContext'
import { useCmsBlogPosts } from '@/hooks/useCmsBlogPosts'
import { useProjectSettings } from '@/hooks/useProjectSettings'
import { slugifySpaceId } from '@/lib/blog-space'
import { saveBlogPost } from '@/lib/publish-blog'
import { spaceLabel } from '@/types/cms'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-hairline-soft text-text-muted',
  scheduled: 'bg-amber-100 text-amber-800',
  published: 'bg-green-100 text-green-700',
}

function formatDate(ts?: number) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function CmsBlogPostsList({ user }: { user: User }) {
  const space = useSpace()
  const navigate = useNavigate()
  const { settings } = useProjectSettings()
  const { posts, refresh } = useCmsBlogPosts(space)
  const [title, setTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const slug = slugifySpaceId(title)
    if (!slug) {
      setError('Enter a title to create a post.')
      return
    }
    if (posts.some((p) => p.slug === slug)) {
      setError(`A post with slug “${slug}” already exists.`)
      return
    }
    setCreating(true)
    setError(null)
    try {
      await saveBlogPost(space, {
        slug,
        title: title.trim(),
        bodyHtml: '<p></p>',
        bodyMode: 'editor',
        status: 'draft',
        categories: [],
      }, user.email ?? undefined)
      await refresh()
      setTitle('')
      navigate(`/${space}/posts/${slug}`, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create post.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-headline text-2xl text-brand-ink">
        {spaceLabel(space, settings?.blogSpaces)} posts
      </h1>
      <p className="mt-1 text-sm text-text-muted">
        Save drafts here. Publish a post or use the header Publish to copy live posts and generate OG images.
      </p>

      <form onSubmit={handleCreate} className="mt-8 rounded-panel bg-surface p-6 shadow-panel">
        {error && (
          <p className="mb-4 rounded-control bg-danger-tint px-4 py-2 text-sm text-danger-strong">{error}</p>
        )}
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-text-muted">New post title</span>
          <div className="flex gap-3">
            <input
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError(null) }}
              placeholder="e.g. Summer menu notes"
              className="flex-1 rounded-control border-hairline px-4 py-2 text-sm border-2 focus:border-brand-primary focus:outline-none focus-visible:ring-0"
            />
            <button
              type="submit"
              disabled={creating || !title.trim()}
              className="rounded-control bg-brand-primary px-6 py-2 font-button text-xs text-brand-on shadow-button transition-colors duration-state hover:bg-brand-wash hover:text-brand-ink-on-tint disabled:opacity-50"
            >
              {creating ? 'Creating…' : 'Create'}
            </button>
          </div>
        </label>
      </form>

      <ul className="mt-8 space-y-2">
        {posts.map((post) => (
          <li key={post.slug}>
            <button
              type="button"
              onClick={() => navigate(`/${space}/posts/${post.slug}`)}
              className="flex w-full items-center gap-3 rounded-control border border-hairline bg-surface px-4 py-3 text-left transition-shadow duration-state hover:shadow-card"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-brand-ink">{post.title || post.slug}</span>
                <span className="mt-0.5 block truncate text-xs text-text-muted">/{space}/{post.slug}</span>
              </span>
              <span className={`shrink-0 rounded-pill px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[post.status] ?? ''}`}>
                {post.status}
              </span>
              <span className="shrink-0 text-xs text-text-subtle">{formatDate(post.updatedAt)}</span>
            </button>
          </li>
        ))}
        {posts.length === 0 && (
          <li className="rounded-control border border-dashed border-hairline px-4 py-6 text-center text-sm text-text-muted">
            No posts yet.
          </li>
        )}
      </ul>
    </div>
  )
}
