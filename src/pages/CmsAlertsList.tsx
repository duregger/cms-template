import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useSpace } from '@/contexts/SpaceContext'
import { useCmsAlertsContext } from '@/contexts/CmsAlertsContext'
import { CMS_NOTIFICATION_CATEGORIES } from '@/types/cms'
import type { CmsNotification, CmsAlertStyle } from '@/types/cms'
import type { User } from 'firebase/auth'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-hairline-soft text-text-muted',
  published: 'bg-green-100 text-green-700',
  archived: 'bg-stone-100 text-stone-500',
}

function formatDate(ts?: number | string) {
  if (!ts) return ''
  const d = new Date(typeof ts === 'string' ? ts : ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function CmsAlertsList({ user }: { user: User }) {
  const space = useSpace()
  const navigate = useNavigate()
  const location = useLocation()
  const { alertType } = useParams<{ alertType?: string }>()

  const { notifications } = useCmsAlertsContext()

  const isAnnouncementBars = location.pathname.includes('/announcement-bars')

  const filtered = isAnnouncementBars
    ? notifications.filter((n) => n.type === 'announcement_bar')
    : notifications.filter(
        (n) => n.type === 'alert' && n.alert_type === (alertType as CmsAlertStyle),
      )

  const category = isAnnouncementBars
    ? CMS_NOTIFICATION_CATEGORIES.find((c) => c.id === 'announcement_bar')
    : CMS_NOTIFICATION_CATEGORIES.find((c) => c.id === alertType)

  const title = category?.label ?? 'Notifications'
  const description = category?.description ?? ''

  const published = filtered.filter((n) => n.status === 'published')
  const drafts = filtered.filter((n) => n.status === 'draft')
  const archived = filtered.filter((n) => n.status === 'archived')

  const renderCard = (n: CmsNotification) => (
    <button
      key={n.id}
      type="button"
      onClick={() => navigate(`/${space}/notifications/${n.id}`)}
      className="flex items-center gap-3 rounded-control border border-hairline bg-surface px-4 py-3 text-left transition-shadow duration-state hover:shadow-card"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-brand-ink">{n.title}</span>
        {n.body && (
          <span className="mt-0.5 block truncate text-xs text-text-muted">{n.body}</span>
        )}
      </span>
      {n.priority > 0 && (
        <span className="shrink-0 rounded-pill bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
          P{n.priority}
        </span>
      )}
      <span className={`shrink-0 rounded-pill px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[n.status] ?? ''}`}>
        {n.status}
      </span>
      <span className="shrink-0 text-xs text-text-subtle">
        {formatDate(n.updated_at)}
      </span>
    </button>
  )

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-headline text-2xl text-brand-ink">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-text-muted">{description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => navigate(`/${space}/notifications/new`)}
          className="rounded-control bg-brand-primary px-5 py-2 font-button text-xs text-brand-on shadow-button transition-colors duration-state hover:bg-brand-wash hover:text-brand-ink-on-tint"
        >
          + New
        </button>
      </div>

      {filtered.length === 0 && (
        <div className="rounded-card border border-dashed border-hairline bg-surface px-6 py-16 text-center">
          <p className="text-sm text-text-muted">
            No {title.toLowerCase()} yet. Create one to get started.
          </p>
        </div>
      )}

      {published.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-green-600">
            Published ({published.length})
          </h2>
          <div className="flex flex-col gap-2">
            {published.map(renderCard)}
          </div>
        </section>
      )}

      {drafts.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-text-muted">
            Drafts ({drafts.length})
          </h2>
          <div className="flex flex-col gap-2">
            {drafts.map(renderCard)}
          </div>
        </section>
      )}

      {archived.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-text-subtle">
            Archived ({archived.length})
          </h2>
          <div className="flex flex-col gap-2">
            {archived.map(renderCard)}
          </div>
        </section>
      )}
    </div>
  )
}
