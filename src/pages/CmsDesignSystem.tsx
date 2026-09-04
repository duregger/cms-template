import { useEffect, useMemo, useState } from 'react'
import { auth } from '@/lib/firebase'
import { useSpace } from '@/contexts/SpaceContext'
import { CMS_SPACES } from '@/types/cms'
import { useBrandTokens } from '@/hooks/useBrandTokens'
import { importBrandTokens } from '@/lib/token-import'
import { brandTokensToCssVars } from '@/lib/token-css'
import { uploadRawTokenJson } from '@/lib/storage'
import type { BrandTokens, BrandTokensSourceFormat, TypeStyle } from '@/types/tokens'

type FormatChoice = 'auto' | BrandTokensSourceFormat

function contrastColor(hex: string): string {
  const c = hex.replace('#', '')
  const full = c.length === 3 ? c.split('').map((ch) => ch + ch).join('') : c
  if (full.length < 6) return '#000000'
  const r = parseInt(full.substring(0, 2), 16)
  const g = parseInt(full.substring(2, 4), 16)
  const b = parseInt(full.substring(4, 6), 16)
  return r * 0.299 + g * 0.587 + b * 0.114 > 150 ? '#000000' : '#ffffff'
}

function spaceLabel(id: string): string {
  return CMS_SPACES.find((s) => s.id === id)?.label ?? id
}

function Swatch({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="flex h-12 w-full items-center justify-center rounded-tile border border-hairline"
        style={{ backgroundColor: value }}
      >
        <span className="font-mono text-[9px]" style={{ color: contrastColor(value) }}>
          {label}
        </span>
      </div>
      <span className="font-mono text-[9px] text-text-subtle">{value}</span>
    </div>
  )
}

function ColorsPreview({ tokens }: { tokens: BrandTokens }) {
  const scales = Object.entries(tokens.colors.scales)
  const semantic = Object.entries(tokens.colors.semanticResolved)
  return (
    <div className="space-y-5">
      {semantic.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-text-subtle">Semantic</h4>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-6">
            {semantic.map(([name, value]) => (
              <Swatch key={name} label={name} value={value} />
            ))}
          </div>
        </div>
      )}
      {scales.map(([scale, ramp]) => (
        <div key={scale}>
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-text-subtle">{scale}</h4>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-9">
            {Object.entries(ramp).map(([step, value]) => (
              <Swatch key={step} label={step} value={value} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function SizingPreview({ tokens }: { tokens: BrandTokens }) {
  const { spacing, borderRadius, stroke, elevation, layout } = tokens.sizing
  return (
    <div className="space-y-5">
      {spacing && (
        <div>
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-text-subtle">Spacing</h4>
          <div className="space-y-1.5">
            {Object.entries(spacing).map(([k, v]) => (
              <div key={k} className="flex items-center gap-3">
                <span className="w-12 font-mono text-xs text-text-muted">{k}</span>
                <div className="h-3 rounded bg-brand-primary/30" style={{ width: v }} />
                <span className="font-mono text-xs text-text-subtle">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {borderRadius && (
        <div>
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-text-subtle">Border Radius</h4>
          <div className="flex flex-wrap gap-4">
            {Object.entries(borderRadius).map(([k, v]) => (
              <div key={k} className="flex flex-col items-center gap-1">
                <div
                  className="h-14 w-16 border-2 border-brand-primary/40 bg-brand-primary/5"
                  style={{ borderRadius: v }}
                />
                <span className="font-mono text-[10px] text-text-muted">{k}</span>
                <span className="font-mono text-[10px] text-text-subtle">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {stroke && (
        <div>
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-text-subtle">Stroke</h4>
          <div className="flex flex-wrap gap-4">
            {Object.entries(stroke).map(([k, v]) => (
              <div key={k} className="flex flex-col items-center gap-1">
                <div className="w-16 border-b border-brand-ink" style={{ borderBottomWidth: v }} />
                <span className="font-mono text-[10px] text-text-muted">{k} · {v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {elevation && (
        <div>
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-text-subtle">Elevation</h4>
          <div className="flex flex-wrap gap-6 py-2">
            {Object.entries(elevation).map(([k, v]) => (
              <div key={k} className="flex flex-col items-center gap-2">
                <div className="h-14 w-14 rounded-tile bg-surface" style={{ filter: v }} />
                <span className="font-mono text-[10px] text-text-muted">{k}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {layout && (
        <div>
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-text-subtle">Layout</h4>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {Object.entries(layout).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between rounded bg-hairline-soft px-2 py-1">
                <span className="font-mono text-[10px] text-text-muted">{k}</span>
                <span className="font-mono text-[10px] text-text-subtle">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function TypographyPreview({ tokens }: { tokens: BrandTokens }) {
  const familyStack = (style: TypeStyle): string =>
    tokens.typography.fontFamilies[style.fontFamily]?.stack ?? 'inherit'

  return (
    <div className="space-y-5">
      <div>
        <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-text-subtle">Font Families</h4>
        <div className="space-y-1.5">
          {Object.entries(tokens.typography.fontFamilies).map(([role, def]) => (
            <div key={role} className="flex items-center justify-between rounded bg-hairline-soft px-3 py-2">
              <span style={{ fontFamily: def.stack }} className="text-sm text-brand-ink">
                {role} — {def.stack}
              </span>
              <span className="rounded bg-hairline-soft px-2 py-0.5 font-mono text-[10px] text-text-muted">
                {def.source}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-text-subtle">Type Scale</h4>
        <div className="space-y-3">
          {Object.entries(tokens.typography.scale).map(([name, style]) => (
            <div key={name} className="rounded-panel border border-hairline-soft bg-surface p-3 shadow-panel">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="font-mono text-[11px] text-text-muted">{name}</span>
                <span className="font-mono text-[10px] text-text-subtle">
                  {style.fontSize} · {style.fontWeight} · lh {style.lineHeight}
                  {style.responsive?.length ? ` · +${style.responsive.length} bp` : ''}
                </span>
              </div>
              <div
                style={{
                  fontFamily: familyStack(style),
                  fontSize: style.fontSize,
                  fontWeight: style.fontWeight,
                  lineHeight: style.lineHeight,
                  letterSpacing: style.letterSpacing,
                  textDecoration: style.textDecoration,
                  textTransform: style.textTransform as React.CSSProperties['textTransform'],
                }}
                className="truncate text-brand-ink"
              >
                The quick brown fox
              </div>
            </div>
          ))}
        </div>
      </div>
      {Object.keys(tokens.typography.icons).length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-text-subtle">Icon Sizes</h4>
          <div className="flex flex-wrap items-end gap-4">
            {Object.entries(tokens.typography.icons).map(([name, { fontSize }]) => (
              <div key={name} className="flex flex-col items-center gap-1">
                <div className="rounded bg-brand-primary/20" style={{ width: fontSize, height: fontSize }} />
                <span className="font-mono text-[10px] text-text-muted">{name}</span>
                <span className="font-mono text-[10px] text-text-subtle">{fontSize}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
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

  // Seed the working copy from draft, falling back to published.
  useEffect(() => {
    if (loading) return
    setWorking(draft ?? published ?? null)
  }, [loading, draft, published])

  const previewVars = useMemo(
    () => (working ? (brandTokensToCssVars(working) as React.CSSProperties) : undefined),
    [working],
  )

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
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-label text-xl text-brand-ink">Design System</h1>
          <p className="mt-1 text-sm text-text-muted">
            Upload a brand token JSON for the <strong>{spaceLabel(space)}</strong> space, preview it, then publish.
          </p>
        </div>
        <div className="flex items-center gap-3">
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

      {/* Upload */}
      <section className="mt-6 rounded-panel border border-hairline-soft bg-surface p-5 shadow-panel">
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
          Firestore: <span className="font-mono">spaces/{space}/design-tokens/draft</span> →{' '}
          <span className="font-mono">…/published</span>
        </p>
      </section>

      {/* Errors */}
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

      {/* Warnings */}
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

      {!working && errors.length === 0 && (
        <div className="mt-6 rounded-card border border-dashed border-hairline p-10 text-center">
          <p className="text-sm text-text-muted">
            No tokens yet for the {spaceLabel(space)} space. Upload a JSON file to get started.
          </p>
        </div>
      )}

      {working && (
        <div style={previewVars}>
          <div className="mt-6 flex items-center gap-3 text-xs text-text-muted">
            <span className="rounded bg-hairline-soft px-2 py-0.5 font-mono">{working.meta.sourceFormat}</span>
            {working.meta.updatedAt > 0 && working.meta.updatedBy && (
              <span>
                last saved by {working.meta.updatedBy}
              </span>
            )}
          </div>

          <section className="mt-4">
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-text-subtle">Colors</h2>
            <ColorsPreview tokens={working} />
          </section>

          <section className="mt-8">
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-text-subtle">Sizing</h2>
            <SizingPreview tokens={working} />
          </section>

          <section className="mt-8">
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-text-subtle">Typography</h2>
            <TypographyPreview tokens={working} />
          </section>
        </div>
      )}
    </div>
  )
}
