import { useEffect, useState, useRef } from 'react'
import type {
  CmsComponentVariable,
  CmsVariableField,
  CmsComponentVariableType,
} from '@/types/cms'
import { uploadCmsAsset } from '@/lib/storage'
import { useBrandTokens } from '@/hooks/useBrandTokens'
import { useDesignTokens } from '@/hooks/useDesignTokens'
import { useSpace } from '@/contexts/SpaceContext'
import {
  chromeRoleOptions,
  colorRoleOptions,
  matchColorOption,
  previewColor,
  textColorOptions,
  type ColorTokenOption,
} from '@/lib/token-color-options'
import { fieldUsesTextColor } from '@/lib/variable-field'

const VARIABLE_TYPES: CmsComponentVariableType[] = [
  'text',
  'longform',
  'hexcode',
  'image',
  'video',
  'url',
]

function emptyField(): CmsVariableField {
  return {
    id: crypto.randomUUID(),
    key: '',
    label: '',
    type: '',
  }
}

function toSlug(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

function TypeDefaultVideo({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadCmsAsset(file, 'video')
      onChange(url)
    } catch (err) {
      console.error('Video upload failed', err)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }
  return (
    <label className="flex w-fit max-w-full flex-col gap-1">
      <span className="text-xs font-medium text-text-muted">
        Default value (YouTube URL or upload)
      </span>
      <div className="flex gap-2">
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-[200px] max-w-md rounded-control border-hairline px-3 py-2 text-sm border-2 focus:border-brand-primary focus:outline-none focus-visible:ring-0"
        />
        <label className="flex cursor-pointer items-center rounded-control border border-hairline bg-hairline-soft px-4 py-2 text-xs font-medium text-text-muted transition-colors duration-state hover:bg-hairline-soft">
          {uploading ? 'Uploading…' : 'Upload'}
          <input
            type="file"
            accept="video/*"
            className="sr-only"
            onChange={handleFile}
            disabled={uploading}
          />
        </label>
      </div>
    </label>
  )
}

function TypeDefaultImage({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadCmsAsset(file, 'image')
      onChange(url)
    } catch (err) {
      console.error('Image upload failed', err)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }
  return (
    <label className="flex w-fit max-w-full flex-col gap-1">
      <span className="text-xs font-medium text-text-muted">
        Default value (Firebase URL or upload)
      </span>
      <div className="flex gap-2">
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-[200px] max-w-md rounded-control border-hairline px-3 py-2 text-sm border-2 focus:border-brand-primary focus:outline-none focus-visible:ring-0"
        />
        <label className="flex cursor-pointer items-center rounded-control border border-hairline bg-hairline-soft px-4 py-2 text-xs font-medium text-text-muted transition-colors duration-state hover:bg-hairline-soft">
          {uploading ? 'Uploading…' : 'Upload'}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleFile}
            disabled={uploading}
          />
        </label>
      </div>
    </label>
  )
}

function contrastText(hex: string): string {
  const c = hex.replace('#', '')
  if (c.length < 6) return '#000'
  const r = parseInt(c.substring(0, 2), 16)
  const g = parseInt(c.substring(2, 4), 16)
  const b = parseInt(c.substring(4, 6), 16)
  return r * 0.299 + g * 0.587 + b * 0.114 > 150 ? '#000000' : '#ffffff'
}

function ColorTokenPicker({
  label,
  value,
  onChange,
  options,
  loading,
  emptyHint,
  allowNone,
  allowTransparent,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: ColorTokenOption[]
  loading?: boolean
  emptyHint?: string
  allowNone?: boolean
  allowTransparent?: boolean
}) {
  const selected = matchColorOption(value, options)
  const isTransparent = allowTransparent && value.trim() === 'transparent'
  const isCustom = Boolean(value) && !selected && !isTransparent
  const [showCustom, setShowCustom] = useState(isCustom)
  const pickerRef = useRef<HTMLInputElement>(null)
  const swatch = isTransparent ? 'transparent' : previewColor(value, options)
  const customHex = isCustom ? swatch : '#000000'
  const none = allowNone && !value

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-text-muted">{label}</span>
      {loading && options.length === 0 ? (
        <p className="text-xs text-text-subtle">Loading design system colors…</p>
      ) : options.length === 0 ? (
        <p className="text-xs text-text-subtle">
          {emptyHint ?? 'No color scales in this space yet. Publish a design system or use Custom.'}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {allowNone && (
          <button
            type="button"
            aria-pressed={none}
            onClick={() => {
              onChange('')
              setShowCustom(false)
            }}
            className={`flex items-center gap-2 rounded-control border px-3 py-2 text-xs transition-colors duration-state ${
              none
                ? 'border-brand-primary ring-1 ring-brand-primary'
                : 'border-hairline hover:bg-hairline-soft'
            }`}
          >
            <span className="h-5 w-5 shrink-0 rounded border border-dashed border-hairline bg-surface" />
            <span className="font-medium text-brand-ink">Inherit</span>
          </button>
        )}
        {allowTransparent && (
          <button
            type="button"
            aria-pressed={isTransparent}
            onClick={() => {
              onChange('transparent')
              setShowCustom(false)
            }}
            className={`flex items-center gap-2 rounded-control border px-3 py-2 text-xs transition-colors duration-state ${
              isTransparent
                ? 'border-brand-primary ring-1 ring-brand-primary'
                : 'border-hairline hover:bg-hairline-soft'
            }`}
          >
            <span className="h-5 w-5 shrink-0 rounded border border-dashed border-hairline bg-[linear-gradient(45deg,#e5e7eb_25%,transparent_25%,transparent_75%,#e5e7eb_75%),linear-gradient(45deg,#e5e7eb_25%,#fff_25%,#fff_75%,#e5e7eb_75%)] bg-[length:10px_10px] bg-[position:0_0,5px_5px]" />
            <span className="font-medium text-brand-ink">None</span>
          </button>
        )}
        {options.map((option) => {
          const active = selected?.token === option.token
          return (
            <button
              key={option.token}
              type="button"
              aria-pressed={active}
              onClick={() => {
                onChange(option.token)
                setShowCustom(false)
              }}
              className={`flex items-center gap-2 rounded-control border px-3 py-2 text-xs transition-colors duration-state ${
                active
                  ? 'border-brand-primary ring-1 ring-brand-primary'
                  : 'border-hairline hover:bg-hairline-soft'
              }`}
            >
              <span
                className="h-5 w-5 shrink-0 rounded border border-hairline"
                style={{ backgroundColor: option.hex }}
              />
              <span className="font-medium text-brand-ink">{option.label}</span>
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => {
            setShowCustom(true)
            if (!isCustom) onChange(selected?.hex ?? customHex)
          }}
          aria-pressed={showCustom || isCustom}
          className={`flex items-center gap-2 rounded-control border px-3 py-2 text-xs transition-colors duration-state ${
            showCustom || isCustom
              ? 'border-brand-primary ring-1 ring-brand-primary'
              : 'border-hairline hover:bg-hairline-soft'
          }`}
        >
          <span className="h-5 w-5 shrink-0 rounded border border-dashed border-hairline bg-gradient-to-br from-red-400 via-yellow-300 to-blue-400" />
          <span className="font-medium text-brand-ink">Custom</span>
        </button>
      </div>
      {(showCustom || isCustom) && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={isCustom ? value : customHex}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#000000"
            className="w-32 rounded-control border-hairline px-3 py-2 font-mono text-sm border-2 focus:border-brand-primary focus:outline-none focus-visible:ring-0"
          />
          <button
            type="button"
            onClick={() => pickerRef.current?.click()}
            className="relative h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded-control border border-hairline"
            style={{ backgroundColor: swatch }}
          >
            <input
              ref={pickerRef}
              type="color"
              value={swatch.length === 7 ? swatch : '#000000'}
              onChange={(e) => onChange(e.target.value)}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </button>
        </div>
      )}
      {value && (
        <div
          className="mt-1 flex h-8 w-full max-w-xs items-center justify-center rounded-control font-mono text-xs"
          style={{ backgroundColor: swatch, color: contrastText(swatch) }}
        >
          {value}
        </div>
      )}
    </div>
  )
}

function TypeDefaultHexcode({
  value,
  onChange,
  allowTransparent,
}: {
  value: string
  onChange: (v: string) => void
  allowTransparent?: boolean
}) {
  const space = useSpace()
  const { draft, published, loading } = useBrandTokens(space)
  const { tokens: chrome } = useDesignTokens()
  const brandOptions = colorRoleOptions(draft ?? published)
  const options = brandOptions.length > 0 ? brandOptions : chromeRoleOptions(chrome.colors)
  return (
    <ColorTokenPicker
      label="Default value"
      value={value}
      onChange={onChange}
      options={options}
      loading={loading}
      allowTransparent={allowTransparent}
    />
  )
}

function TypeTextColor({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const space = useSpace()
  const { draft, published, loading } = useBrandTokens(space)
  const { tokens: chrome } = useDesignTokens()
  const textOptions = textColorOptions(draft ?? published)
  const options = textOptions.length > 0 ? textOptions : chromeRoleOptions(chrome.colors)
  return (
    <ColorTokenPicker
      label="Text color"
      value={value}
      onChange={onChange}
      options={options}
      loading={loading}
      emptyHint="No text roles in this space yet. Publish a design system or use Custom."
      allowNone
    />
  )
}

type VariableEditSheetProps = {
  variable: CmsComponentVariable
  variableIndex: number
  onUpdate: (idx: number, patch: Partial<CmsComponentVariable>) => void
  onDelete?: (idx: number) => void
  onClose: () => void
  isOpen: boolean
}

export function VariableEditSheet({
  variable,
  variableIndex,
  onUpdate,
  onDelete,
  onClose,
  isOpen,
}: VariableEditSheetProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.documentElement.dataset.sheetOpen = 'true'
      document.body.dataset.sheetOpen = 'true'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      delete document.documentElement.dataset.sheetOpen
      delete document.body.dataset.sheetOpen
    }
  }, [isOpen, onClose])

  const updateVariable = (patch: Partial<CmsComponentVariable>) =>
    onUpdate(variableIndex, patch)

  const updateField = (fieldIdx: number, patch: Partial<CmsVariableField>) => {
    const next = [...(variable.fields ?? [])]
    next[fieldIdx] = { ...next[fieldIdx]!, ...patch }
    updateVariable({ fields: next })
  }

  const addField = () => {
    updateVariable({
      fields: [...(variable.fields ?? []), emptyField()],
    })
  }

  const moveField = (fieldIdx: number, dir: -1 | 1) => {
    const fields = [...(variable.fields ?? [])]
    const target = fieldIdx + dir
    if (target < 0 || target >= fields.length) return
    ;[fields[fieldIdx], fields[target]] = [fields[target]!, fields[fieldIdx]!]
    updateVariable({ fields })
  }

  const removeField = (fieldIdx: number) => {
    const next = (variable.fields ?? []).filter((_, i) => i !== fieldIdx)
    updateVariable({ fields: next })
  }

  if (!isOpen) return null

  const fields = variable.fields ?? []

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="fixed inset-x-0 bottom-0 z-50 mx-auto h-[95vh] w-3/4 overflow-hidden rounded-t-2xl bg-surface shadow-overlay transition-transform duration-panel ease-out"
        style={{ transform: isOpen ? 'translateY(0)' : 'translateY(100%)' }}
      >
        <div className="relative flex h-full min-h-0 flex-col">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 shrink-0 rounded p-2 text-text-muted transition-colors duration-state hover:bg-hairline-soft hover:text-brand-ink"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <div className="flex shrink-0 items-center gap-4 border-b border-hairline px-6 py-4 pr-16 lg:px-12 xl:px-16">
            <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-text-muted">
                  Variable Name
                </span>
                <input
                  type="text"
                  value={variable.label}
                  onChange={(e) => {
                    const label = e.target.value
                    updateVariable({
                      label,
                      key: toSlug(label) || variable.key,
                    })
                  }}
                  placeholder="e.g. Hero Headline"
                  className="rounded-control border-hairline px-3 py-2 text-sm font-medium text-brand-ink border-2 focus:border-brand-primary focus:outline-none focus-visible:ring-0"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-text-muted">
                  Variable ID (slug)
                </span>
                <input
                  type="text"
                  value={variable.key}
                  onChange={(e) =>
                    updateVariable({ key: toSlug(e.target.value) || e.target.value })
                  }
                  placeholder="e.g. hero_headline"
                  className="rounded-control border-hairline px-3 py-2 text-sm font-mono text-brand-ink border-2 focus:border-brand-primary focus:outline-none focus-visible:ring-0"
                />
              </label>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 lg:px-12 xl:px-16">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-label text-sm text-brand-ink">Fields</h3>
              <button
                type="button"
                onClick={addField}
                className="rounded-control bg-brand-primary shadow-button px-4 py-2 font-button text-xs text-brand-on transition-colors duration-state hover:bg-brand-wash hover:text-brand-ink-on-tint"
              >
                + Add Field
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {fields.map((f, idx) => (
                <div
                  key={f.id}
                  className="relative flex items-center gap-2 rounded-control border border-hairline bg-hairline-soft p-4"
                >
                  <button
                    type="button"
                    onClick={() => removeField(idx)}
                    className="absolute right-3 top-3 rounded p-1 text-text-subtle transition-colors duration-state hover:bg-hairline-soft hover:text-text-muted"
                    aria-label="Delete field"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => moveField(idx, -1)}
                      disabled={idx === 0}
                      className="rounded px-2 py-1 text-xs text-text-muted hover:bg-hairline-soft disabled:opacity-30"
                      title="Move up"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => moveField(idx, 1)}
                      disabled={idx === fields.length - 1}
                      className="rounded px-2 py-1 text-xs text-text-muted hover:bg-hairline-soft disabled:opacity-30"
                      title="Move down"
                    >
                      ▼
                    </button>
                  </div>
                  <div className="min-w-0 flex-1 flex flex-col gap-4 pr-8">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-text-muted">
                          Field Name
                        </span>
                        <input
                          type="text"
                          value={f.label}
                          onChange={(e) => {
                            const label = e.target.value
                            updateField(idx, {
                              label,
                              key: toSlug(label) || f.key,
                            })
                          }}
                          className="rounded-control border-hairline px-3 py-2 text-sm border-2 focus:border-brand-primary focus:outline-none focus-visible:ring-0"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-text-muted">
                          Field ID (slug)
                        </span>
                        <input
                          type="text"
                          value={f.key}
                          onChange={(e) =>
                            updateField(idx, { key: toSlug(e.target.value) || e.target.value })
                          }
                          className="rounded-control border-hairline px-3 py-2 text-sm border-2 focus:border-brand-primary focus:outline-none focus-visible:ring-0"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-text-muted">
                          Type
                        </span>
                        <select
                          value={f.type}
                          onChange={(e) =>
                            updateField(idx, {
                              type: e.target.value as CmsComponentVariableType | '',
                            })
                          }
                          className="w-full rounded-control border-hairline bg-surface px-3 py-2 text-sm border-2 focus:border-brand-primary focus:outline-none focus-visible:ring-0"
                        >
                          <option value="">- Pick Item -</option>
                          {VARIABLE_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t === 'text'
                                ? 'Text'
                                : t === 'longform'
                                  ? 'Long Form Text'
                                  : t === 'hexcode'
                                    ? 'Hexcode'
                                    : t.charAt(0).toUpperCase() + t.slice(1)}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    {f.type && (
                      <div className="flex w-full flex-col gap-4">
                        {f.type === 'text' && (
                          <label className="flex w-fit flex-col gap-1">
                            <span className="text-xs font-medium text-text-muted">
                              Default value
                            </span>
                            <input
                              type="text"
                              value={f.defaultValue ?? ''}
                              onChange={(e) =>
                                updateField(idx, { defaultValue: e.target.value })
                              }
                              className="min-w-[200px] max-w-md rounded-control border-hairline px-3 py-2 text-sm border-2 focus:border-brand-primary focus:outline-none focus-visible:ring-0"
                            />
                          </label>
                        )}
                        {f.type === 'longform' && (
                          <label className="flex w-fit flex-col gap-1">
                            <span className="text-xs font-medium text-text-muted">
                              Default value
                            </span>
                            <textarea
                              rows={4}
                              value={f.defaultValue ?? ''}
                              onChange={(e) =>
                                updateField(idx, { defaultValue: e.target.value })
                              }
                              className="min-w-[200px] max-w-lg rounded-control border-hairline px-3 py-2 text-sm border-2 focus:border-brand-primary focus:outline-none focus-visible:ring-0"
                            />
                          </label>
                        )}
                        {fieldUsesTextColor(f) && (
                          <TypeTextColor
                            value={f.color ?? ''}
                            onChange={(color) =>
                              updateField(idx, { color: color || undefined })
                            }
                          />
                        )}
                        {f.type === 'hexcode' && (
                          <TypeDefaultHexcode
                            value={f.defaultValue ?? ''}
                            onChange={(v) => updateField(idx, { defaultValue: v })}
                            allowTransparent={/background|bg_/.test(f.key)}
                          />
                        )}
                        {f.type === 'url' && (
                          <label className="flex w-fit flex-col gap-1">
                            <span className="text-xs font-medium text-text-muted">
                              Default value
                            </span>
                            <input
                              type="url"
                              value={f.defaultValue ?? ''}
                              onChange={(e) =>
                                updateField(idx, { defaultValue: e.target.value })
                              }
                              className="min-w-[200px] max-w-md rounded-control border-hairline px-3 py-2 text-sm border-2 focus:border-brand-primary focus:outline-none focus-visible:ring-0"
                            />
                          </label>
                        )}
                        {f.type === 'video' && (
                          <TypeDefaultVideo
                            value={f.defaultValue ?? ''}
                            onChange={(v) => updateField(idx, { defaultValue: v })}
                          />
                        )}
                        {f.type === 'image' && (
                          <TypeDefaultImage
                            value={f.defaultValue ?? ''}
                            onChange={(v) => updateField(idx, { defaultValue: v })}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {fields.length === 0 && (
              <p className="rounded-card border border-dashed border-hairline bg-surface px-4 py-8 text-center text-sm text-text-muted">
                No fields yet. Click &quot;+ Add Field&quot; to add one.
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center justify-between border-t border-hairline px-6 py-4 lg:px-12 xl:px-16">
            {onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(variableIndex)
                  onClose()
                }}
                className="rounded-pill border border-danger bg-surface px-5 py-2 font-button text-xs text-danger transition-colors duration-state hover:bg-danger-tint"
              >
                Delete Variable
              </button>
            ) : (
              <div />
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-control bg-brand-primary shadow-button px-8 py-2 font-button text-xs text-brand-on transition-colors duration-state hover:bg-brand-wash hover:text-brand-ink-on-tint"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
