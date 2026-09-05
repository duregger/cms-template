import { useEffect, useState } from 'react'
import { auth } from '@/lib/firebase'
import { useSpace } from '@/contexts/SpaceContext'
import { CMS_SPACES } from '@/types/cms'
import { useBrandTokens } from '@/hooks/useBrandTokens'
import { importBrandTokens } from '@/lib/token-import'
import { emptyBrandTokens } from '@/lib/token-edit'
import { uploadRawTokenJson } from '@/lib/storage'
import { DesignSystemGallery } from '@/components/DesignSystemGallery'
import { TokenVariablesEditor, type TokenEditTarget } from '@/components/TokenVariablesEditor'
import type { BrandTokens, BrandTokensSourceFormat } from '@/types/tokens'

type PageMode = 'view' | 'edit'

type FormatChoice = 'auto' | BrandTokensSourceFormat

function spaceLabel(id: string): string {
  return CMS_SPACES.find((s) => s.id === id)?.label ?? id
}

export function CmsDesignSystem() {
  const space = useSpace()
  const { published, draft, loading, saveDraft, publish } = useBrandTokens(space)

  const [working, setWorking] = useState<BrandTokens | null>(null)
  const [format, setFormat] = useState<FormatChoice>('auto')
  const [errors, setErrors] = useState<string[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [rawJson, setRawJson] = useState<string | null>(null)
  const [rawFilename, setRawFilename] = useState<string>('tokens.json')
  const [busy, setBusy] = useState<'idle' | 'saving' | 'publishing'>('idle')
  const [status, setStatus] = useState<string | null>(null)
  const [mode, setMode] = useState<PageMode>('view')
  const [editTarget, setEditTarget] = useState<TokenEditTarget | null>(null)

  const openEdit = (target?: TokenEditTarget) => {
    setEditTarget(target ?? null)
    setMode('edit')
  }

  useEffect(() => {
    if (loading) return
    setWorking(draft ?? published ?? emptyBrandTokens(space))
  }, [loading, draft, published, space])

  const handleFile = async (file: File) => {
    setStatus(null)
    const text = await file.text()
    setRawFilename(file.name)
    setRawJson(text)
    const result = importBrandTokens(text, space, format === 'auto' ? undefined : format)
    if (result.ok) {
      setWorking(result.tokens)
      setErrors([])
      setWarnings(result.warnings)
      setFormat(result.format)
    } else {
      setErrors(result.errors)
      setWarnings(result.warnings)
    }
  }

  const handleSaveDraft = async () => {
    if (!working) return
    setBusy('saving')
    setStatus(null)
    try {
      let tokens = working
      if (rawJson) {
        const { path } = await uploadRawTokenJson(space, rawJson, rawFilename)
        tokens = { ...working, meta: { ...working.meta, rawStoragePath: path } }
      }
      await saveDraft(tokens, auth.currentUser?.email ?? undefined)
      setStatus('Draft saved')
    } catch (e) {
      setErrors([`Failed to save draft: ${e instanceof Error ? e.message : String(e)}`])
    } finally {
      setBusy('idle')
    }
  }

  const handlePublish = async () => {
    if (!working) return
    setBusy('publishing')
    setStatus(null)
    try {
      let tokens = working
      if (rawJson) {
        const { path } = await uploadRawTokenJson(space, rawJson, rawFilename)
        tokens = { ...working, meta: { ...working.meta, rawStoragePath: path } }
      }
      await publish(tokens, auth.currentUser?.email ?? undefined)
      setStatus('Published')
      setRawJson(null)
    } catch (e) {
      setErrors([`Failed to publish: ${e instanceof Error ? e.message : String(e)}`])
    } finally {
      setBusy('idle')
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="font-body text-sm text-text-muted">Loading brand tokens…</p>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[96rem] px-6 py-8 xl:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-label text-xl text-brand-ink">Design System</h1>
          <p className="mt-1 text-sm text-text-muted">
            Preview the <strong>{spaceLabel(space)}</strong> system, then click a token to open it in edit view.
            Publish updates <span className="font-mono">GET /api/tokens/{space}</span> for the live site.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-control bg-hairline-soft p-0.5" role="group" aria-label="Design system mode">
            <button
              type="button"
              aria-pressed={mode === 'view'}
              onClick={() => setMode('view')}
              className={`rounded-control px-3 py-1.5 text-xs font-medium transition-colors duration-state ${
                mode === 'view' ? 'bg-surface text-brand-ink shadow-button' : 'text-text-muted hover:text-brand-ink'
              }`}
            >
              View
            </button>
            <button
              type="button"
              aria-pressed={mode === 'edit'}
              onClick={() => openEdit()}
              className={`rounded-control px-3 py-1.5 text-xs font-medium transition-colors duration-state ${
                mode === 'edit' ? 'bg-surface text-brand-ink shadow-button' : 'text-text-muted hover:text-brand-ink'
              }`}
            >
              Edit
            </button>
          </div>
          {status && <span className="text-xs font-medium text-brand-success">{status}</span>}
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={!working || busy !== 'idle'}
            className="rounded-pill border border-hairline px-4 py-2 text-xs font-medium text-text-muted transition-colors duration-state hover:bg-hairline-soft disabled:opacity-40"
          >
            {busy === 'saving' ? 'Saving…' : 'Save Draft'}
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={!working || busy !== 'idle'}
            className="rounded-control bg-brand-primary shadow-button px-6 py-2 font-button text-xs text-brand-on transition-colors duration-state hover:bg-brand-wash hover:text-brand-ink-on-tint disabled:opacity-40"
          >
            {busy === 'publishing' ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      </div>

      <section className="mt-6 rounded-panel bg-surface p-5 shadow-panel">
        <div className="flex flex-wrap items-center gap-4">
          <label className="cursor-pointer rounded-control bg-brand-ink px-5 py-2 text-xs font-medium text-surface shadow-button transition-[filter] duration-state hover:brightness-110">
            Choose JSON file…
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void handleFile(f)
                e.target.value = ''
              }}
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-text-muted">
            Format
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as FormatChoice)}
              className="rounded border border-hairline px-2 py-1 text-xs"
            >
              <option value="auto">Auto-detect</option>
              <option value="web-v1">web-v1 (rich / semantic refs)</option>
              <option value="app-v1">app-v1 (simple / resolved)</option>
            </select>
          </label>
          {rawJson && <span className="font-mono text-[11px] text-text-subtle">{rawFilename}</span>}
        </div>

        <p className="mt-3 text-xs text-text-subtle">
          Draft is CMS-only. Publish copies to <span className="font-mono">spaces/{space}/design-tokens/published</span>,
          which is what <span className="font-mono">/api/tokens/{space}</span> and{' '}
          <span className="font-mono">?format=css</span> serve.
        </p>
      </section>

      {errors.length > 0 && (
        <div className="mt-4 rounded-card border border-danger bg-danger-tint p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-danger-strong">Import errors</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-danger-strong">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="mt-4 rounded-card border border-amber-200 bg-amber-50 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-700">Warnings</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-amber-700">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {working && mode === 'view' && (
        <DesignSystemGallery tokens={working} onEdit={openEdit} />
      )}

      {working && mode === 'edit' && (
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-text-muted">
              Editing variables. Save a draft or publish when you are done.
            </p>
            <button
              type="button"
              onClick={() => setMode('view')}
              className="rounded-pill border border-hairline px-4 py-2 text-xs font-medium text-text-muted transition-colors duration-state hover:bg-hairline-soft hover:text-brand-ink"
            >
              Back to preview
            </button>
          </div>
          <TokenVariablesEditor tokens={working} onChange={setWorking} target={editTarget} />
        </div>
      )}
    </div>
  )
}
