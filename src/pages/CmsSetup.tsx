import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setDoc } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { ADMIN_DOMAINS, CMS_NAME, CMS_SHORT_NAME, escapeRulesDomain } from '@/lib/brand'
import { uploadCmsAsset } from '@/lib/storage'
import { PROJECT_SETTINGS_REF } from '@/hooks/useProjectSettings'
import { Button } from '@/components/Button'
import { EMPTY_PROJECT_SETTINGS, type ProjectSettings } from '@/types/settings'

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
  'rounded-control border border-hairline bg-surface px-3 py-2 text-sm text-brand-ink focus:border-brand-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1'

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
  accept,
  previewUrl,
  onFile,
}: {
  label: string
  accept: string
  previewUrl?: string
  onFile: (file: File) => Promise<void>
}) {
  const [busy, setBusy] = useState(false)

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-text-muted">{label}</span>
      {previewUrl && (
        <img
          src={previewUrl}
          alt=""
          className="h-12 w-auto max-w-[180px] object-contain"
        />
      )}
      <input
        type="file"
        accept={accept}
        disabled={busy}
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
    try {
      const payload: ProjectSettings = {
        ...form,
        brandName: form.brandName.trim(),
        clientDomain: form.clientDomain.trim().toLowerCase().replace(/^@/, ''),
        siteUrl: form.siteUrl.trim(),
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
      <p className="text-xs font-medium uppercase tracking-wider text-text-subtle">{CMS_NAME}</p>
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

      <div className="mt-6 space-y-5 rounded-panel border border-hairline-soft bg-surface p-5 shadow-panel">
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
            <FilePicker
              label="Logo"
              accept="image/svg+xml,image/png,image/webp"
              previewUrl={form.logoUrl}
              onFile={async (file) => {
                const url = await uploadCmsAsset(file, 'logo')
                patch({ logoUrl: url })
              }}
            />
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
          onClick={() => setStep(STEPS[stepIndex - 1].id)}
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
            <Button type="button" onClick={() => setStep(STEPS[stepIndex + 1].id)}>
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
