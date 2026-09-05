import { useEffect, useState, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useSpace } from '@/contexts/SpaceContext'
import { useCmsAlertsContext } from '@/contexts/CmsAlertsContext'
import {
  CMS_NOTIFICATION_CATEGORIES,
  CMS_TRIGGERS,
  CMS_FREQUENCIES,
} from '@/types/cms'
import type {
  CmsNotification,
  CmsNotificationType,
  CmsAlertStyle,
  CmsNotificationStatus,
  CmsNotificationTrigger,
  CmsNotificationFrequency,
} from '@/types/cms'
import type { User } from 'firebase/auth'
import { uploadCmsAsset } from '@/lib/storage'

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
        type === 'success' ? 'bg-brand-success text-surface' : 'bg-danger text-surface'
      }`}
    >
      {message}
    </div>
  )
}

function FieldLabel({
  label,
  required,
  hint,
  children,
  className = '',
}: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 flex items-baseline gap-1 text-xs font-medium text-text-muted">
        {label}
        {required && <span className="text-danger">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-text-subtle">{hint}</span>}
    </label>
  )
}

function ChipInput({
  value,
  onChange,
  placeholder = 'Add chip...',
}: {
  value: string[]
  onChange: (v: string[]) => void
  placeholder?: string
}) {
  const [input, setInput] = useState('')

  const add = () => {
    const v = input.trim()
    if (v && !value.includes(v)) {
      onChange([...value, v])
      setInput('')
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {value.map((chip) => (
          <span
            key={chip}
            className="inline-flex items-center gap-1 rounded-pill bg-hairline-soft px-2.5 py-1 text-xs font-medium text-brand-ink"
          >
            {chip}
            <button
              type="button"
              onClick={() => onChange(value.filter((c) => c !== chip))}
              className="ml-0.5 text-text-subtle hover:text-danger"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={placeholder}
          className="flex-1 rounded-control border-hairline px-3 py-1.5 text-sm border-2 focus:border-brand-primary focus:outline-none focus-visible:ring-0"
        />
        <button
          type="button"
          onClick={add}
          disabled={!input.trim()}
          className="rounded-control bg-hairline-soft px-3 py-1.5 text-xs font-medium text-text-muted transition-colors duration-state hover:bg-hairline disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  )
}

const DEFAULT_NOTIFICATION: Omit<CmsNotification, 'id' | 'created_at' | 'updated_at'> = {
  type: 'announcement_bar',
  title: '',
  body: '',
  dismissable: true,
  trigger: 'page_load',
  frequency: 'once_per_session',
  priority: 0,
  status: 'draft',
}

type CategoryOption = { value: string; label: string; notifType: CmsNotificationType; alertType?: CmsAlertStyle }

const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: 'announcement_bar', label: 'Announcement Bar', notifType: 'announcement_bar' },
  { value: 'announcement', label: 'Announcement Alert', notifType: 'alert', alertType: 'announcement' },
  { value: 'image', label: 'Image Alert', notifType: 'alert', alertType: 'image' },
  { value: 'illustration', label: 'Illustration Alert', notifType: 'alert', alertType: 'illustration' },
  { value: 'new_location', label: 'New Location Alert', notifType: 'alert', alertType: 'new_location' },
]

function getCategoryValue(n: CmsNotification | typeof DEFAULT_NOTIFICATION): string {
  if (n.type === 'announcement_bar') return 'announcement_bar'
  return n.alert_type ?? 'announcement'
}

export function CmsAlertEditor({ user }: { user: User }) {
  const { id } = useParams<{ id: string }>()
  const space = useSpace()
  const navigate = useNavigate()
  const {
    getNotification,
    createNotification,
    updateNotification,
    deleteNotification,
  } = useCmsAlertsContext()

  const isNew = !id
  const [form, setForm] = useState<Omit<CmsNotification, 'id' | 'created_at' | 'updated_at'>>(DEFAULT_NOTIFICATION)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [existingId, setExistingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const n = await getNotification(id)
      if (n) {
        setExistingId(n.id)
        const { id: _, created_at: __, updated_at: ___, ...rest } = n
        setForm(rest)
      }
    } catch {
      // notification not found
    } finally {
      setLoading(false)
    }
  }, [id, getNotification])

  useEffect(() => {
    load()
  }, [load])

  const patch = (updates: Partial<typeof form>) => {
    setForm((prev) => ({ ...prev, ...updates }))
  }

  const setCategory = (val: string) => {
    const opt = CATEGORY_OPTIONS.find((o) => o.value === val)
    if (!opt) return
    patch({
      type: opt.notifType,
      alert_type: opt.alertType,
      image: undefined,
      image_alt: undefined,
      illustration: undefined,
      illustration_alt: undefined,
      icon: undefined,
      chips: undefined,
      geo_target: undefined,
    })
  }

  const categoryValue = getCategoryValue(form)
  const isBar = form.type === 'announcement_bar'
  const isAlert = form.type === 'alert'
  const alertType = form.alert_type

  const save = async () => {
    if (!form.title.trim()) {
      setToast({ message: 'Title is required', type: 'error' })
      return
    }
    setSaving(true)
    try {
      if (isNew) {
        const newId = await createNotification(
          { ...form, title: form.title.trim() },
          user.email ?? undefined,
        )
        setToast({ message: 'Created!', type: 'success' })
        navigate(`/${space}/notifications/${newId}`, { replace: true })
      } else if (existingId) {
        await updateNotification(existingId, form, user.email ?? undefined)
        setToast({ message: 'Saved!', type: 'success' })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setToast({ message: `Failed: ${msg}`, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!existingId) return
    if (!confirm('Delete this notification permanently?')) return
    setDeleting(true)
    try {
      await deleteNotification(existingId)
      navigate(`/${space}/announcement-bars`, { replace: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setToast({ message: `Delete failed: ${msg}`, type: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center font-body text-text-muted">
        Loading...
      </div>
    )
  }

  if (!isNew && !existingId) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12 font-body">
        <p className="text-danger">Notification not found.</p>
        <Link
          to={`/${space}/announcement-bars`}
          className="mt-4 inline-block text-sm text-brand-primary hover:underline"
        >
          &larr; Back
        </Link>
      </div>
    )
  }

  const backPath = isBar
    ? `/${space}/announcement-bars`
    : `/${space}/alerts/${alertType ?? 'announcement'}`

  const backLabel = CMS_NOTIFICATION_CATEGORIES.find(
    (c) => c.id === (isBar ? 'announcement_bar' : alertType),
  )?.label ?? 'Back'

  return (
    <div className="bg-surface font-body pb-24">
      <div className="mx-auto max-w-3xl px-6 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-text-muted">
          <Link to={backPath} className="hover:text-brand-ink">
            {backLabel}
          </Link>
          <span>&rsaquo;</span>
          <span className="font-medium text-brand-ink">
            {isNew ? 'New Notification' : form.title || 'Untitled'}
          </span>
        </nav>

        {/* Type selector */}
        <section className="mb-6 rounded-panel bg-surface p-6 shadow-panel">
          <h2 className="font-label mb-4 text-lg text-brand-ink">Notification Type</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {CATEGORY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setCategory(opt.value)}
                className={`rounded-control border px-3 py-2.5 text-xs font-medium transition-colors duration-state ${
                  categoryValue === opt.value
                    ? 'border-brand-primary bg-brand-primary/5 text-brand-primary'
                    : 'border-hairline text-text-muted hover:bg-hairline-soft'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* Core fields */}
        <section className="mb-6 rounded-panel bg-surface p-6 shadow-panel">
          <h2 className="font-label mb-4 text-lg text-brand-ink">Content</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldLabel
              label="Title"
              required
              hint={isBar ? 'Keep under 60 characters for mobile.' : 'Keep under 40 characters.'}
              className="sm:col-span-2"
            >
              <input
                type="text"
                value={form.title}
                onChange={(e) => patch({ title: e.target.value })}
                className="w-full rounded-control border-hairline px-3 py-2 text-sm border-2 focus:border-brand-primary focus:outline-none focus-visible:ring-0"
              />
            </FieldLabel>

            <FieldLabel
              label="Body"
              hint="Keep under 120 characters."
              className="sm:col-span-2"
            >
              <textarea
                rows={3}
                value={form.body ?? ''}
                onChange={(e) => patch({ body: e.target.value || undefined })}
                className="w-full rounded-control border-hairline px-3 py-2 text-sm border-2 focus:border-brand-primary focus:outline-none focus-visible:ring-0"
              />
            </FieldLabel>

            {/* URL — announcement bar only */}
            {isBar && (
              <FieldLabel
                label="Link URL"
                hint="Optional. If set, the bar becomes clickable."
                className="sm:col-span-2"
              >
                <input
                  type="url"
                  value={form.primary_action_url ?? ''}
                  onChange={(e) => patch({ primary_action_url: e.target.value || undefined })}
                  placeholder="https://..."
                  className="w-full rounded-control border-hairline px-3 py-2 text-sm border-2 focus:border-brand-primary focus:outline-none focus-visible:ring-0"
                />
              </FieldLabel>
            )}

            {/* Icon — announcement bar, announcement alerts, new_location alerts */}
            {(isBar || (isAlert && (alertType === 'announcement' || alertType === 'new_location'))) && (
              <FieldLabel
                label="Icon"
                hint={isBar ? 'Displays to the left of the title. Leave empty to hide.' : '40×40 SVG preferred. Transparent background.'}
                className="sm:col-span-2"
              >
                <div className="flex items-center gap-3">
                  {form.icon && (
                    <div className="flex items-center gap-2 rounded-tile border border-hairline bg-hairline-soft p-2">
                      <img src={form.icon} alt="" className="h-8 w-8 object-contain" />
                      <button
                        type="button"
                        onClick={() => patch({ icon: undefined })}
                        className="rounded p-0.5 text-text-subtle hover:text-danger"
                        title="Remove icon"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                  <label className="cursor-pointer rounded-control border border-dashed border-hairline px-4 py-2 text-xs font-medium text-text-muted transition-colors duration-state hover:bg-hairline-soft hover:text-brand-ink">
                    {form.icon ? 'Replace' : 'Upload icon'}
                    <input
                      type="file"
                      accept="image/svg+xml,image/png,image/webp,image/jpeg"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        try {
                          const url = await uploadCmsAsset(file, 'icon')
                          patch({ icon: url })
                        } catch (err) {
                          console.error('Icon upload failed', err)
                        }
                        e.target.value = ''
                      }}
                    />
                  </label>
                </div>
              </FieldLabel>
            )}

            {/* Image — image alerts */}
            {isAlert && alertType === 'image' && (
              <>
                <FieldLabel
                  label="Image"
                  required
                  hint="680×594 (2x), max 400KB, WebP preferred."
                  className="sm:col-span-2"
                >
                  {form.image && (
                    <div className="mb-2 flex items-start gap-2 rounded-tile border border-hairline bg-hairline-soft p-2">
                      <img src={form.image} alt={form.image_alt ?? ''} className="h-24 rounded object-cover" />
                      <button
                        type="button"
                        onClick={() => patch({ image: undefined })}
                        className="rounded p-0.5 text-text-subtle hover:text-danger"
                        title="Remove image"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer rounded-control border border-dashed border-hairline px-4 py-2 text-xs font-medium text-text-muted transition-colors duration-state hover:bg-hairline-soft hover:text-brand-ink">
                      {form.image ? 'Replace' : 'Upload image'}
                      <input
                        type="file"
                        accept="image/webp,image/jpeg,image/png"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          try {
                            const url = await uploadCmsAsset(file, 'image')
                            patch({ image: url })
                          } catch (err) {
                            console.error('Image upload failed', err)
                          }
                          e.target.value = ''
                        }}
                      />
                    </label>
                    <span className="text-xs text-text-subtle">or</span>
                    <input
                      type="text"
                      value={form.image ?? ''}
                      onChange={(e) => patch({ image: e.target.value || undefined })}
                      placeholder="Paste URL..."
                      className="flex-1 rounded-control border-hairline px-3 py-2 text-sm border-2 focus:border-brand-primary focus:outline-none focus-visible:ring-0"
                    />
                  </div>
                </FieldLabel>
                <FieldLabel label="Image Alt Text" required className="sm:col-span-2">
                  <input
                    type="text"
                    value={form.image_alt ?? ''}
                    onChange={(e) => patch({ image_alt: e.target.value || undefined })}
                    className="w-full rounded-control border-hairline px-3 py-2 text-sm border-2 focus:border-brand-primary focus:outline-none focus-visible:ring-0"
                  />
                </FieldLabel>
              </>
            )}

            {/* Illustration — illustration alerts */}
            {isAlert && alertType === 'illustration' && (
              <>
                <FieldLabel
                  label="Illustration"
                  required
                  hint="360×360 (2x), SVG or WebP. Transparent background."
                  className="sm:col-span-2"
                >
                  {form.illustration && (
                    <div className="mb-2 flex items-start gap-2 rounded-tile border border-hairline bg-hairline-soft p-2">
                      <img src={form.illustration} alt={form.illustration_alt ?? ''} className="h-24 object-contain" />
                      <button
                        type="button"
                        onClick={() => patch({ illustration: undefined })}
                        className="rounded p-0.5 text-text-subtle hover:text-danger"
                        title="Remove illustration"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer rounded-control border border-dashed border-hairline px-4 py-2 text-xs font-medium text-text-muted transition-colors duration-state hover:bg-hairline-soft hover:text-brand-ink">
                      {form.illustration ? 'Replace' : 'Upload illustration'}
                      <input
                        type="file"
                        accept="image/svg+xml,image/webp,image/png"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          try {
                            const url = await uploadCmsAsset(file, 'image')
                            patch({ illustration: url })
                          } catch (err) {
                            console.error('Illustration upload failed', err)
                          }
                          e.target.value = ''
                        }}
                      />
                    </label>
                    <span className="text-xs text-text-subtle">or</span>
                    <input
                      type="text"
                      value={form.illustration ?? ''}
                      onChange={(e) => patch({ illustration: e.target.value || undefined })}
                      placeholder="Paste URL..."
                      className="flex-1 rounded-control border-hairline px-3 py-2 text-sm border-2 focus:border-brand-primary focus:outline-none focus-visible:ring-0"
                    />
                  </div>
                </FieldLabel>
                <FieldLabel label="Illustration Alt Text" required className="sm:col-span-2">
                  <input
                    type="text"
                    value={form.illustration_alt ?? ''}
                    onChange={(e) => patch({ illustration_alt: e.target.value || undefined })}
                    className="w-full rounded-control border-hairline px-3 py-2 text-sm border-2 focus:border-brand-primary focus:outline-none focus-visible:ring-0"
                  />
                </FieldLabel>
              </>
            )}

            {/* Chips — announcement & new_location */}
            {isAlert && (alertType === 'announcement' || alertType === 'new_location') && (
              <FieldLabel
                label={alertType === 'new_location' ? 'Amenity Chips' : 'Chips'}
                hint={alertType === 'new_location' ? 'e.g. Dine-in, Drive-thru, Catering' : 'Rendered as chip components below the title.'}
                className="sm:col-span-2"
              >
                <ChipInput
                  value={form.chips ?? []}
                  onChange={(chips) => patch({ chips: chips.length ? chips : undefined })}
                  placeholder={alertType === 'new_location' ? 'Add amenity...' : 'Add chip...'}
                />
              </FieldLabel>
            )}
          </div>
        </section>

        {/* Actions (CTAs) — alerts only */}
        {isAlert && (
          <section className="mb-6 rounded-panel bg-surface p-6 shadow-panel">
            <h2 className="font-label mb-4 text-lg text-brand-ink">Call to Action</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldLabel label="Primary Button Label">
                <input
                  type="text"
                  value={form.primary_action_label ?? ''}
                  onChange={(e) => patch({ primary_action_label: e.target.value || undefined })}
                  placeholder='e.g. "Order Now"'
                  className="w-full rounded-control border-hairline px-3 py-2 text-sm border-2 focus:border-brand-primary focus:outline-none focus-visible:ring-0"
                />
              </FieldLabel>
              <FieldLabel label="Primary Button URL">
                <input
                  type="url"
                  value={form.primary_action_url ?? ''}
                  onChange={(e) => patch({ primary_action_url: e.target.value || undefined })}
                  placeholder="https://..."
                  className="w-full rounded-control border-hairline px-3 py-2 text-sm border-2 focus:border-brand-primary focus:outline-none focus-visible:ring-0"
                />
              </FieldLabel>
              <FieldLabel label="Secondary Button Label" className="sm:col-span-2">
                <input
                  type="text"
                  value={form.secondary_action_label ?? ''}
                  onChange={(e) => patch({ secondary_action_label: e.target.value || undefined })}
                  placeholder='e.g. "Maybe Later"'
                  className="w-full rounded-control border-hairline px-3 py-2 text-sm border-2 focus:border-brand-primary focus:outline-none focus-visible:ring-0"
                />
              </FieldLabel>
            </div>
          </section>
        )}

        {/* Geo Targeting — new_location only */}
        {isAlert && alertType === 'new_location' && (
          <section className="mb-6 rounded-panel bg-surface p-6 shadow-panel">
            <h2 className="font-label mb-4 text-lg text-brand-ink">Geo Targeting</h2>
            <p className="mb-4 text-xs text-text-muted">
              Only show this alert to users within a radius of the location.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <FieldLabel label="Latitude">
                <input
                  type="number"
                  step="any"
                  value={form.geo_target?.lat ?? ''}
                  onChange={(e) => {
                    const lat = e.target.value ? parseFloat(e.target.value) : undefined
                    if (lat === undefined) {
                      patch({ geo_target: undefined })
                    } else {
                      patch({
                        geo_target: {
                          lat,
                          lng: form.geo_target?.lng ?? 0,
                          radius_miles: form.geo_target?.radius_miles ?? 25,
                        },
                      })
                    }
                  }}
                  className="w-full rounded-control border-hairline px-3 py-2 text-sm border-2 focus:border-brand-primary focus:outline-none focus-visible:ring-0"
                />
              </FieldLabel>
              <FieldLabel label="Longitude">
                <input
                  type="number"
                  step="any"
                  value={form.geo_target?.lng ?? ''}
                  onChange={(e) => {
                    const lng = e.target.value ? parseFloat(e.target.value) : undefined
                    if (lng === undefined) return
                    patch({
                      geo_target: {
                        lat: form.geo_target?.lat ?? 0,
                        lng,
                        radius_miles: form.geo_target?.radius_miles ?? 25,
                      },
                    })
                  }}
                  className="w-full rounded-control border-hairline px-3 py-2 text-sm border-2 focus:border-brand-primary focus:outline-none focus-visible:ring-0"
                />
              </FieldLabel>
              <FieldLabel label="Radius (miles)">
                <input
                  type="number"
                  min={1}
                  value={form.geo_target?.radius_miles ?? ''}
                  onChange={(e) => {
                    const radius = e.target.value ? parseInt(e.target.value, 10) : undefined
                    if (radius === undefined) return
                    patch({
                      geo_target: {
                        lat: form.geo_target?.lat ?? 0,
                        lng: form.geo_target?.lng ?? 0,
                        radius_miles: radius,
                      },
                    })
                  }}
                  className="w-full rounded-control border-hairline px-3 py-2 text-sm border-2 focus:border-brand-primary focus:outline-none focus-visible:ring-0"
                />
              </FieldLabel>
            </div>
          </section>
        )}

        {/* Display & Targeting */}
        <section className="mb-6 rounded-panel bg-surface p-6 shadow-panel">
          <h2 className="font-label mb-4 text-lg text-brand-ink">Display &amp; Targeting</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldLabel label="Status" required>
              <select
                value={form.status}
                onChange={(e) => patch({ status: e.target.value as CmsNotificationStatus })}
                className="w-full rounded-control border-hairline bg-surface px-3 py-2 text-sm border-2 focus:border-brand-primary focus:outline-none focus-visible:ring-0"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </FieldLabel>

            <FieldLabel label="Priority" hint="Higher number = higher priority.">
              <input
                type="number"
                min={0}
                value={form.priority}
                onChange={(e) => patch({ priority: parseInt(e.target.value, 10) || 0 })}
                className="w-full rounded-control border-hairline px-3 py-2 text-sm border-2 focus:border-brand-primary focus:outline-none focus-visible:ring-0"
              />
            </FieldLabel>

            <label className="flex items-center gap-2 self-end pb-2">
              <input
                type="checkbox"
                checked={form.dismissable}
                onChange={(e) => patch({ dismissable: e.target.checked })}
                className="h-4 w-4 rounded border-hairline text-brand-primary focus:ring-brand-primary"
              />
              <span className="text-xs font-medium text-text-muted">Dismissable</span>
            </label>

            {isAlert && (
              <FieldLabel label="Trigger">
                <select
                  value={form.trigger}
                  onChange={(e) => patch({ trigger: e.target.value as CmsNotificationTrigger })}
                  className="w-full rounded-control border-hairline bg-surface px-3 py-2 text-sm border-2 focus:border-brand-primary focus:outline-none focus-visible:ring-0"
                >
                  {CMS_TRIGGERS.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </FieldLabel>
            )}

            <FieldLabel label="Frequency" hint={isBar ? 'How often to show after dismissal.' : undefined}>
              <select
                value={form.frequency}
                onChange={(e) => patch({ frequency: e.target.value as CmsNotificationFrequency })}
                className="w-full rounded-control border-hairline bg-surface px-3 py-2 text-sm border-2 focus:border-brand-primary focus:outline-none focus-visible:ring-0"
              >
                {CMS_FREQUENCIES.map((f) => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </select>
            </FieldLabel>

            <FieldLabel label="Start Date">
              <input
                type="datetime-local"
                value={form.start_date ?? ''}
                onChange={(e) => patch({ start_date: e.target.value || undefined })}
                className="w-full rounded-control border-hairline px-3 py-2 text-sm border-2 focus:border-brand-primary focus:outline-none focus-visible:ring-0"
              />
            </FieldLabel>

            <FieldLabel label="End Date">
              <input
                type="datetime-local"
                value={form.end_date ?? ''}
                onChange={(e) => patch({ end_date: e.target.value || undefined })}
                className="w-full rounded-control border-hairline px-3 py-2 text-sm border-2 focus:border-brand-primary focus:outline-none focus-visible:ring-0"
              />
            </FieldLabel>

            <FieldLabel
              label="Target Pages"
              hint='Restrict to specific page paths. All pages if empty.'
              className="sm:col-span-2"
            >
              <ChipInput
                value={form.target_pages ?? []}
                onChange={(pages) => patch({ target_pages: pages.length ? pages : undefined })}
                placeholder='e.g. "/menu"'
              />
            </FieldLabel>
          </div>
        </section>

        {/* Delete zone */}
        {!isNew && existingId && (
          <section className="rounded-card border border-danger bg-danger-tint p-6">
            <h2 className="font-label mb-2 text-sm text-danger-strong">Danger Zone</h2>
            <p className="mb-4 text-xs text-danger-strong">
              This action is permanent and cannot be undone.
            </p>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-pill border border-danger bg-surface px-5 py-2 text-xs font-medium text-danger transition-colors duration-state hover:bg-danger-tint disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete Notification'}
            </button>
          </section>
        )}
      </div>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-hairline bg-surface px-6 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-end gap-3">
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
              {saving ? 'Saving...' : isNew ? 'Create' : 'Save'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
