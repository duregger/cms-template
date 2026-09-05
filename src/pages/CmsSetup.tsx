import { useEffect, useId, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setDoc } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { ADMIN_DOMAINS, CMS_SHORT_NAME, escapeRulesDomain } from '@/lib/brand'
import { uploadCmsAsset } from '@/lib/storage'
import { PROJECT_SETTINGS_REF } from '@/hooks/useProjectSettings'
import { Button } from '@/components/Button'
import {
  EMPTY_PROJECT_SETTINGS,
  hasClientLogo,
  type ProjectSettings,
} from '@/types/settings'

const STEPS = [
  { id: 'brand', label: 'Brand' },
  { id: 'auth', label: 'Auth' },
  { id: 'review', label: 'Review' },
] as const

type StepId = (typeof STEPS)[number]['id']

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-text-muted">{label}</span>
      {children}
      {hint && <span className="text-xs text-text-subtle">{hint}</span>}
    </label>
  )
}

const inputClass =
  'rounded-control border-hairline bg-surface px-3 py-2 text-sm text-brand-ink border-2 focus:border-brand-primary focus:outline-none focus-visible:ring-0'

function Snippet({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      // ignore
    }
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-text-muted">{label}</span>
        <button
          type="button"
          onClick={copy}
          className="text-xs font-medium text-brand-primary hover:underline"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto rounded-lg bg-neutral-900 p-4 text-xs leading-relaxed text-neutral-200">
        <code>{value}</code>
      </pre>
    </div>
  )
}

function FilePicker({
  label,
  hint,
  accept,
  previewUrl,
  previewSurface = 'light',
  onFile,
}: {
  label: string
  hint?: string
  accept: string
  previewUrl?: string
  previewSurface?: 'light' | 'dark'
  onFile: (file: File) => Promise<void>
}) {
  const [busy, setBusy] = useState(false)
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-xs font-medium text-text-muted">
        {label}
      </label>
      {hint && (
        <p id={hintId} className="text-xs text-text-subtle">
          {hint}
        </p>
      )}
      <div
        className={`flex h-20 items-center justify-center rounded-control px-4 ${
          previewSurface === 'dark'
            ? 'bg-brand-ink outline outline-1 outline-white/10'
            : 'bg-hairline-soft outline outline-1 outline-black/10'
        }`}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="" className="h-10 w-auto max-w-full object-contain" />
        ) : (
          <span className={`text-xs ${previewSurface === 'dark' ? 'text-white/40' : 'text-text-subtle'}`}>
            SVG or PNG
          </span>
        )}
      </div>
      <input
        id={id}
        type="file"
        accept={accept}
        disabled={busy}
        aria-describedby={hintId}
        aria-busy={busy}
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (!file) return
          setBusy(true)
          try {
            await onFile(file)
          } finally {
            setBusy(false)
            e.target.value = ''
          }
        }}
        className="text-sm text-text-muted file:mr-3 file:rounded-control file:border-0 file:bg-brand-rest file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-brand-ink-on-tint"
      />
      {busy && <span className="text-xs text-text-subtle">Uploading…</span>}
    </div>
  )
}

export function CmsSetup({ user, initial }: { user: User; initial: ProjectSettings | null }) {
  const navigate = useNavigate()
  const [step, setStep] = useState<StepId>('brand')
  const [form, setForm] = useState<ProjectSettings>(initial ?? EMPTY_PROJECT_SETTINGS)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initial) setForm(initial)
  }, [initial])

  const patch = (partial: Partial<ProjectSettings>) => {
    setForm((f) => ({ ...f, ...partial }))
  }

  const rulesSnippet = useMemo(() => {
    const client = form.clientDomain ? `|${escapeRulesDomain(form.clientDomain)}` : '|CLIENT_DOMAIN'
    return [
      `// firestore.rules + storage.rules — replace isCmsEditor() email match with:`,
      `request.auth.token.email.matches('.*@(beginthework\\\\.com${client})$');`,
    ].join('\n')
  }, [form.clientDomain])

  const envDomainSnippet = useMemo(
    () => `VITE_ALLOWED_DOMAINS=${form.clientDomain || 'client.com'}`,
    [form.clientDomain],
  )

  const save = async (complete: boolean) => {
    setSaving(true)
    setError(null)
    if (complete && !hasClientLogo(form)) {
      setError('Upload a light or dark logo.')
      setStep('brand')
      setSaving(false)
      return
    }
    try {
      const darkLogoUrl = form.darkLogoUrl || form.logoUrl
      const payload: ProjectSettings = {
        ...form,
        brandName: form.brandName.trim(),
        clientDomain: form.clientDomain.trim().toLowerCase().replace(/^@/, ''),
        siteUrl: form.siteUrl.trim(),
        darkLogoUrl,
        lightLogoUrl: form.lightLogoUrl,
        logoUrl: darkLogoUrl,
        setupComplete: complete,
        updatedAt: Date.now(),
        updatedBy: user.email ?? user.uid,
      }
      await setDoc(PROJECT_SETTINGS_REF(), payload, { merge: true })
      setForm(payload)
      if (complete) navigate('/web', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save setup.')
    } finally {
      setSaving(false)
    }
  }

  const stepIndex = STEPS.findIndex((s) => s.id === step)

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <p className="text-xs font-medium uppercase tracking-wider text-text-subtle">CMS</p>
      <h1 className="mt-1 font-label text-xl text-brand-ink">Client setup</h1>
      <p className="mt-2 text-sm text-text-muted">
        Record this client’s brand and who else may sign in. {CMS_SHORT_NAME} stays admin.
        Firebase is already running — that work lives in AGENT-HANDOFF.md, before this screen.
      </p>

      <ol className="mt-6 flex gap-2">
        {STEPS.map((s, i) => (
          <li key={s.id} className="flex-1">
            <button
              type="button"
              onClick={() => setStep(s.id)}
              className={`w-full rounded-control px-2 py-2 text-xs font-medium ${
                s.id === step
                  ? 'bg-brand-rest text-brand-ink-on-tint'
                  : 'bg-hairline-soft text-text-muted hover:text-brand-ink'
              }`}
            >
              {i + 1}. {s.label}
            </button>
          </li>
        ))}
      </ol>

      <div className="mt-6 space-y-5 rounded-panel bg-surface p-5 shadow-panel">
        {step === 'brand' && (
          <>
            <Field label="Client brand name">
              <input
                className={inputClass}
                value={form.brandName}
                onChange={(e) => patch({ brandName: e.target.value })}
                placeholder="e.g. Northstar Coffee"
              />
            </Field>
            <Field label="Consumer site URL">
              <input
                className={inputClass}
                type="url"
                value={form.siteUrl}
                onChange={(e) => patch({ siteUrl: e.target.value })}
                placeholder="https://www.client.com"
              />
            </Field>
            <div>
              <p className="text-xs font-medium text-text-muted">Logos</p>
              <p className="mt-1 text-xs text-text-subtle">
                Upload a light or dark logo. The other is optional.
              </p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <FilePicker
                  label="Light logo"
                  hint="Use on dark backgrounds"
                  accept="image/svg+xml,image/png,image/webp"
                  previewSurface="dark"
                  previewUrl={form.lightLogoUrl}
                  onFile={async (file) => {
                    const url = await uploadCmsAsset(file, 'logo-light')
                    patch({ lightLogoUrl: url })
                  }}
                />
                <FilePicker
                  label="Dark logo"
                  hint="Use on light backgrounds"
                  accept="image/svg+xml,image/png,image/webp"
                  previewSurface="light"
                  previewUrl={form.darkLogoUrl || form.logoUrl}
                  onFile={async (file) => {
                    const url = await uploadCmsAsset(file, 'logo-dark')
                    patch({ darkLogoUrl: url, logoUrl: url })
                  }}
                />
              </div>
            </div>
            <FilePicker
              label="Favicon"
              accept="image/png,image/x-icon,image/svg+xml,.ico"
              previewUrl={form.faviconUrl}
              onFile={async (file) => {
                const url = await uploadCmsAsset(file, 'favicon')
                patch({ faviconUrl: url })
              }}
            />
          </>
        )}

        {step === 'auth' && (
          <>
            <Field label="Always-admin domain" hint="Locked. Every @beginthework.com account can sign in.">
              <input className={inputClass} value={ADMIN_DOMAINS[0]} readOnly />
            </Field>
            <Field
              label="Client login domain"
              hint="Editors at this Google Workspace domain can sign in. Do not include @. Add the same domain to VITE_ALLOWED_DOMAINS and security rules."
            >
              <input
                className={inputClass}
                value={form.clientDomain}
                onChange={(e) => patch({ clientDomain: e.target.value })}
                placeholder="client.com"
              />
            </Field>
          </>
        )}

        {step === 'review' && (
          <>
            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="text-xs text-text-subtle">Brand</dt>
                <dd className="text-brand-ink">{form.brandName || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-text-subtle">Site</dt>
                <dd className="text-brand-ink">{form.siteUrl || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-text-subtle">Logos</dt>
                <dd className="mt-2 grid gap-3 sm:grid-cols-2">
                  {(['light', 'dark'] as const).map((tone) => {
                    const url = tone === 'light' ? form.lightLogoUrl : form.darkLogoUrl || form.logoUrl
                    return (
                      <div key={tone}>
                        <p className="mb-1 text-xs text-text-muted">
                          {tone === 'light' ? 'Light' : 'Dark'}
                        </p>
                        <div
                          className={`flex h-16 items-center justify-center rounded-control px-3 ${
                            tone === 'light'
                              ? 'bg-brand-ink outline outline-1 outline-white/10'
                              : 'bg-hairline-soft outline outline-1 outline-black/10'
                          }`}
                        >
                          {url ? (
                            <img src={url} alt="" className="h-8 w-auto max-w-full object-contain" />
                          ) : (
                            <span className={`text-xs ${tone === 'light' ? 'text-white/40' : 'text-text-subtle'}`}>
                              —
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-text-subtle">Editors</dt>
                <dd className="text-brand-ink">
                  @{ADMIN_DOMAINS[0]}
                  {form.clientDomain ? ` and @${form.clientDomain}` : ''}
                </dd>
              </div>
            </dl>
            {form.clientDomain && (
              <>
                <Snippet label="Add to .env" value={envDomainSnippet} />
                <Snippet label="Security rules email match" value={rulesSnippet} />
              </>
            )}
          </>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-6 flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={stepIndex === 0 || saving}
          onClick={() => {
            const prev = STEPS[stepIndex - 1]
            if (prev) setStep(prev.id)
          }}
        >
          Back
        </Button>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={saving}
            onClick={() => save(false)}
          >
            {saving ? 'Saving…' : 'Save draft'}
          </Button>
          {step !== 'review' ? (
            <Button type="button" onClick={() => {
              const next = STEPS[stepIndex + 1]
              if (next) setStep(next.id)
            }}>
              Continue
            </Button>
          ) : (
            <Button type="button" disabled={saving} onClick={() => save(true)}>
              {saving ? 'Saving…' : 'Finish setup'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
