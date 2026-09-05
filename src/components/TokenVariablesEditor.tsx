import { useEffect, useState } from 'react'
import type { BrandTokens, BrandTokensSizing, ColorScale, SemanticToken, TypeStyle } from '@/types/tokens'
import { actionPairStatus } from '@/lib/token-action-pair'
import { formatContrast } from '@/lib/token-contrast'
import { semanticContrastIssues } from '@/lib/token-semantic-contrast'
import { sortScaleSteps, titleFromKey } from '@/lib/token-preview'
import {
  addFontFamily,
  addIconSize,
  addScaleValue,
  addSemanticToken,
  addSizingValue,
  addTypeStyle,
  hexForPicker,
  isHexColor,
  removeFontFamily,
  removeIconSize,
  removeScaleValue,
  removeSemanticToken,
  removeSizingValue,
  removeTypeStyle,
  setFontFamilyStack,
  setIconSize,
  setScaleValue,
  setSemanticToken,
  setSizingValue,
  setTypeStyle,
} from '@/lib/token-edit'

const FIELD =
  'min-w-0 rounded-control border-2 border-hairline bg-surface px-3 py-2 font-mono text-sm text-brand-ink focus:border-brand-primary focus:outline-none focus-visible:ring-0'
const ADD_FIELD =
  'min-w-0 rounded-control border-2 border-hairline bg-surface px-3 py-2 text-sm text-brand-ink focus:border-brand-primary focus:outline-none focus-visible:ring-0'

export type TokenEditPanel = 'colors' | 'sizing' | 'typography'

export type TokenEditTarget = {
  panel: TokenEditPanel
  fieldId: string
}

type Panel = TokenEditPanel

const FOCUS_RING = 'rounded-control ring-2 ring-brand-primary ring-offset-2'

const PANELS: { id: Panel; label: string }[] = [
  { id: 'colors', label: 'Colors' },
  { id: 'sizing', label: 'Sizing' },
  { id: 'typography', label: 'Typography' },
]

const SIZING_GROUPS: { key: keyof BrandTokensSizing; label: string }[] = [
  { key: 'spacing', label: 'Spacing' },
  { key: 'borderRadius', label: 'Radius' },
  { key: 'stroke', label: 'Stroke' },
  { key: 'layout', label: 'Layout' },
  { key: 'elevation', label: 'Elevation' },
]

function ColorValue({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: string
  onChange: (next: string) => void
}) {
  const hex = isHexColor(value)
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      {hex && (
        <input
          type="color"
          aria-label={`${label} color`}
          value={hexForPicker(value)}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-9 shrink-0 cursor-pointer rounded-control border-2 border-hairline bg-surface p-0.5"
        />
      )}
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${FIELD} flex-1`}
        spellCheck={false}
      />
    </div>
  )
}

const STANDARD_SCALE_STEPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']

function ScaleStepAdd({
  scale,
  ramp,
  onAdd,
}: {
  scale: string
  ramp: ColorScale
  onAdd: (step: string) => void
}) {
  const [step, setStep] = useState('')
  const missing = STANDARD_SCALE_STEPS.filter((s) => ramp[s] === undefined)

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {missing.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onAdd(s)}
          className="rounded-pill border border-hairline px-2.5 py-1 text-xs font-medium text-text-muted transition-colors duration-state hover:bg-hairline-soft hover:text-brand-ink"
        >
          Add {s}
        </button>
      ))}
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (!step.trim()) return
          onAdd(step)
          setStep('')
        }}
      >
        <input
          type="text"
          value={step}
          onChange={(e) => setStep(e.target.value)}
          placeholder="Step"
          aria-label={`Add a step to ${scale}`}
          className={`${ADD_FIELD} w-20`}
        />
        <button
          type="submit"
          className="rounded-control border-2 border-hairline px-3 py-2 text-xs font-medium text-text-muted transition-colors duration-state hover:bg-hairline-soft hover:text-brand-ink"
        >
          Add step
        </button>
      </form>
    </div>
  )
}

function AddRow({
  label,
  placeholder,
  onAdd,
}: {
  label: string
  placeholder: string
  onAdd: (name: string) => void
}) {
  const [name, setName] = useState('')
  return (
    <form
      className="mt-3 flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        if (!name.trim()) return
        onAdd(name)
        setName('')
      }}
    >
      <label className="flex min-w-[10rem] flex-1 flex-col gap-1">
        <span className="text-xs font-medium text-text-muted">{label}</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={placeholder}
          className={ADD_FIELD}
        />
      </label>
      <button
        type="submit"
        className="rounded-control border-2 border-hairline px-3 py-2 text-xs font-medium text-text-muted transition-colors duration-state hover:bg-hairline-soft hover:text-brand-ink"
      >
        Add
      </button>
    </form>
  )
}

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="shrink-0 rounded-control px-2 py-2 text-xs text-text-subtle transition-colors duration-state hover:bg-danger-tint hover:text-danger"
    >
      Remove
    </button>
  )
}

function ColorsPanel({
  tokens,
  onChange,
  focusId,
}: {
  tokens: BrandTokens
  onChange: (next: BrandTokens) => void
  focusId?: string
}) {
  const [newScale, setNewScale] = useState('')
  const [newStep, setNewStep] = useState('')

  const pair = actionPairStatus(tokens)
  const contrastIssues = semanticContrastIssues(tokens)

  return (
    <div className="space-y-8">
      <fieldset>
        <legend className="mb-3 text-xs font-medium uppercase tracking-wider text-text-subtle">
          Semantic
        </legend>
        {pair.fill && pair.ink && (
          <p
            className={`mb-3 text-xs ${
              pair.passes ? 'text-text-muted' : 'text-danger-strong'
            }`}
          >
            {pair.inkName} is {formatContrast(pair.ratio)} on {pair.fillName}.
            {pair.passes
              ? ' Passes WCAG AA for normal text.'
              : ' Needs 4.5:1. Publish will set on-action ink from title ink or black.'}
          </p>
        )}
        {contrastIssues.length > 0 && (
          <ul className="mb-3 list-disc space-y-1 pl-5 text-xs text-danger-strong">
            {contrastIssues.map((issue) => (
              <li key={`${issue.name}-${issue.surface}`}>{issue.label} Publish will use a darker scale step.</li>
            ))}
          </ul>
        )}
        <div className="space-y-2">
          {Object.entries(tokens.colors.semantic).map(([name, token]) => {
            const resolved = tokens.colors.semanticResolved[name]
            return (
              <div
                key={name}
                className={`flex flex-wrap items-center gap-2 ${focusId === `sem-${name}` ? FOCUS_RING : ''}`}
              >
                <label className="w-28 shrink-0 font-mono text-xs text-text-muted" htmlFor={`sem-${name}`}>
                  {name}
                </label>
                <select
                  aria-label={`${name} token type`}
                  value={token.type}
                  onChange={(e) => {
                    const type = e.target.value as SemanticToken['type']
                    onChange(
                      setSemanticToken(
                        tokens,
                        name,
                        type === 'ref'
                          ? { type: 'ref', ref: token.type === 'ref' ? token.ref : 'primary.500' }
                          : { type: 'value', value: resolved ?? '#000000' },
                      ),
                    )
                  }}
                  className="rounded-control border-2 border-hairline bg-surface px-2 py-2 text-xs text-brand-ink focus:border-brand-primary focus:outline-none focus-visible:ring-0"
                >
                  <option value="value">Value</option>
                  <option value="ref">Reference</option>
                </select>
                {token.type === 'ref' ? (
                  <input
                    id={`sem-${name}`}
                    type="text"
                    value={token.ref}
                    onChange={(e) =>
                      onChange(setSemanticToken(tokens, name, { type: 'ref', ref: e.target.value }))
                    }
                    className={`${FIELD} flex-1`}
                    spellCheck={false}
                  />
                ) : (
                  <ColorValue
                    id={`sem-${name}`}
                    label={name}
                    value={token.value}
                    onChange={(value) =>
                      onChange(setSemanticToken(tokens, name, { type: 'value', value }))
                    }
                  />
                )}
                {resolved && (
                  <span
                    className="h-9 w-9 shrink-0 rounded-control border-2 border-hairline"
                    style={{ backgroundColor: resolved }}
                    title={resolved}
                  />
                )}
                <RemoveButton
                  label={`Remove ${name}`}
                  onClick={() => onChange(removeSemanticToken(tokens, name))}
                />
              </div>
            )
          })}
        </div>
        <AddRow
          label="New semantic name"
          placeholder="e.g. primary"
          onAdd={(name) => onChange(addSemanticToken(tokens, name))}
        />
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-xs font-medium uppercase tracking-wider text-text-subtle">
          Scales
        </legend>
        <div className="space-y-5">
          {Object.entries(tokens.colors.scales).map(([scale, ramp]) => (
            <div key={scale}>
              <h4 className="mb-2 font-mono text-xs text-text-muted">{titleFromKey(scale)}</h4>
              <div className="space-y-2">
                {Object.entries(ramp)
                  .sort(([a], [b]) => sortScaleSteps(a, b))
                  .map(([step, value]) => (
                  <div
                    key={step}
                    className={`flex flex-wrap items-center gap-2 ${
                      focusId === `scale-${scale}-${step}` ? FOCUS_RING : ''
                    }`}
                  >
                    <label
                      className="w-16 shrink-0 font-mono text-xs text-text-muted"
                      htmlFor={`scale-${scale}-${step}`}
                    >
                      {step}
                    </label>
                    <ColorValue
                      id={`scale-${scale}-${step}`}
                      label={`${scale} ${step}`}
                      value={value}
                      onChange={(next) => onChange(setScaleValue(tokens, scale, step, next))}
                    />
                    <RemoveButton
                      label={`Remove ${scale} ${step}`}
                      onClick={() => onChange(removeScaleValue(tokens, scale, step))}
                    />
                  </div>
                ))}
                <ScaleStepAdd
                  scale={scale}
                  ramp={ramp}
                  onAdd={(step) => onChange(addScaleValue(tokens, scale, step))}
                />
              </div>
            </div>
          ))}
        </div>
        <form
          className="mt-3 flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (!newScale.trim() || !newStep.trim()) return
            onChange(addScaleValue(tokens, newScale, newStep))
            setNewScale('')
            setNewStep('')
          }}
        >
          <label className="flex min-w-[8rem] flex-1 flex-col gap-1">
            <span className="text-xs font-medium text-text-muted">Scale</span>
            <input
              type="text"
              value={newScale}
              onChange={(e) => setNewScale(e.target.value)}
              placeholder="e.g. primary"
              className={ADD_FIELD}
            />
          </label>
          <label className="flex min-w-[6rem] flex-1 flex-col gap-1">
            <span className="text-xs font-medium text-text-muted">Step</span>
            <input
              type="text"
              value={newStep}
              onChange={(e) => setNewStep(e.target.value)}
              placeholder="e.g. 500"
              className={ADD_FIELD}
            />
          </label>
          <button
            type="submit"
            className="rounded-control border-2 border-hairline px-3 py-2 text-xs font-medium text-text-muted transition-colors duration-state hover:bg-hairline-soft hover:text-brand-ink"
          >
            Add
          </button>
        </form>
      </fieldset>
    </div>
  )
}

function SizingPanel({
  tokens,
  onChange,
  focusId,
}: {
  tokens: BrandTokens
  onChange: (next: BrandTokens) => void
  focusId?: string
}) {
  return (
    <div className="space-y-8">
      {SIZING_GROUPS.map(({ key, label }) => {
        const entries = Object.entries(tokens.sizing[key] ?? {})
        return (
          <fieldset key={key}>
            <legend className="mb-3 text-xs font-medium uppercase tracking-wider text-text-subtle">
              {label}
            </legend>
            <div className="space-y-2">
              {entries.map(([name, value]) => (
                <div
                  key={name}
                  className={`flex flex-wrap items-center gap-2 ${
                    focusId === `size-${key}-${name}` ? FOCUS_RING : ''
                  }`}
                >
                  <label
                    className="w-36 shrink-0 truncate font-mono text-xs text-text-muted"
                    htmlFor={`size-${key}-${name}`}
                  >
                    {name}
                  </label>
                  <input
                    id={`size-${key}-${name}`}
                    type="text"
                    value={value}
                    onChange={(e) => onChange(setSizingValue(tokens, key, name, e.target.value))}
                    className={`${FIELD} flex-1`}
                    spellCheck={false}
                  />
                  <RemoveButton
                    label={`Remove ${name}`}
                    onClick={() => onChange(removeSizingValue(tokens, key, name))}
                  />
                </div>
              ))}
            </div>
            <AddRow
              label={`New ${label.toLowerCase()} name`}
              placeholder="e.g. 4"
              onAdd={(name) => onChange(addSizingValue(tokens, key, name))}
            />
          </fieldset>
        )
      })}
    </div>
  )
}

function TypeStyleFields({
  name,
  style,
  families,
  onChange,
}: {
  name: string
  style: TypeStyle
  families: string[]
  onChange: (patch: Partial<TypeStyle>) => void
}) {
  const familyOptions = families.includes(style.fontFamily)
    ? families
    : [style.fontFamily, ...families]
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-text-muted">Family</span>
        <select
          value={style.fontFamily}
          onChange={(e) => onChange({ fontFamily: e.target.value })}
          className={ADD_FIELD}
        >
          {familyOptions.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-text-muted">Size</span>
        <input
          type="text"
          value={style.fontSize}
          onChange={(e) => onChange({ fontSize: e.target.value })}
          className={FIELD}
          spellCheck={false}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-text-muted">Weight</span>
        <input
          type="number"
          min={100}
          max={900}
          step={100}
          value={style.fontWeight}
          onChange={(e) => onChange({ fontWeight: Number(e.target.value) || 400 })}
          className={FIELD}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-text-muted">Line height</span>
        <input
          type="text"
          value={style.lineHeight}
          onChange={(e) => onChange({ lineHeight: e.target.value })}
          className={FIELD}
          spellCheck={false}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-text-muted">Letter spacing</span>
        <input
          type="text"
          value={style.letterSpacing}
          onChange={(e) => onChange({ letterSpacing: e.target.value })}
          className={FIELD}
          spellCheck={false}
        />
      </label>
      <div className="col-span-2 sm:col-span-3">
        <span className="text-xs font-medium text-text-muted">Responsive sizes</span>
        <div className="mt-1 space-y-2">
          {(style.responsive ?? []).map((row, i) => (
            <div key={`${row.breakpoint}-${i}`} className="flex gap-2">
              <input
                type="text"
                aria-label={`${name} breakpoint ${i + 1}`}
                value={row.breakpoint}
                onChange={(e) => {
                  const responsive = [...(style.responsive ?? [])]
                  const current = responsive[i]
                  if (!current) return
                  responsive[i] = { ...current, breakpoint: e.target.value }
                  onChange({ responsive })
                }}
                className={`${FIELD} w-24`}
              />
              <input
                type="text"
                aria-label={`${name} size at ${row.breakpoint}`}
                value={row.fontSize}
                onChange={(e) => {
                  const responsive = [...(style.responsive ?? [])]
                  const current = responsive[i]
                  if (!current) return
                  responsive[i] = { ...current, fontSize: e.target.value }
                  onChange({ responsive })
                }}
                className={`${FIELD} flex-1`}
              />
              <RemoveButton
                label={`Remove ${name} ${row.breakpoint} size`}
                onClick={() => {
                  const responsive = (style.responsive ?? []).filter((_, idx) => idx !== i)
                  onChange({ responsive: responsive.length ? responsive : undefined })
                }}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              onChange({
                responsive: [...(style.responsive ?? []), { breakpoint: 'md', fontSize: style.fontSize }],
              })
            }
            className="text-xs font-medium text-brand-primary hover:underline"
          >
            Add breakpoint
          </button>
        </div>
      </div>
    </div>
  )
}

function TypographyPanel({
  tokens,
  onChange,
  focusId,
}: {
  tokens: BrandTokens
  onChange: (next: BrandTokens) => void
  focusId?: string
}) {
  const families = Object.keys(tokens.typography.fontFamilies)
  return (
    <div className="space-y-8">
      <fieldset>
        <legend className="mb-3 text-xs font-medium uppercase tracking-wider text-text-subtle">
          Font families
        </legend>
        <div className="space-y-2">
          {Object.entries(tokens.typography.fontFamilies).map(([role, def]) => (
            <div
              key={role}
              className={`flex flex-wrap items-center gap-2 ${focusId === `ff-${role}` ? FOCUS_RING : ''}`}
            >
              <label className="w-24 shrink-0 font-mono text-xs text-text-muted" htmlFor={`ff-${role}`}>
                {role}
              </label>
              <input
                id={`ff-${role}`}
                type="text"
                value={def.stack}
                onChange={(e) => onChange(setFontFamilyStack(tokens, role, e.target.value))}
                className={`${FIELD} flex-1`}
                spellCheck={false}
              />
              <span className="font-mono text-[10px] text-text-subtle">{def.source}</span>
              <RemoveButton
                label={`Remove ${role} font`}
                onClick={() => onChange(removeFontFamily(tokens, role))}
              />
            </div>
          ))}
        </div>
        <AddRow
          label="New family role"
          placeholder="e.g. heading"
          onAdd={(name) => onChange(addFontFamily(tokens, name))}
        />
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-xs font-medium uppercase tracking-wider text-text-subtle">
          Type scale
        </legend>
        <div className="space-y-4">
          {Object.entries(tokens.typography.scale).map(([name, style]) => (
            <div
              key={name}
              id={`type-${name}`}
              tabIndex={-1}
              className={`rounded-control border-2 border-hairline p-3 ${
                focusId === `type-${name}` ? FOCUS_RING : ''
              }`}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <h4 className="font-mono text-xs text-text-muted">{name}</h4>
                <RemoveButton
                  label={`Remove ${name}`}
                  onClick={() => onChange(removeTypeStyle(tokens, name))}
                />
              </div>
              <TypeStyleFields
                name={name}
                style={style}
                families={families}
                onChange={(patch) => onChange(setTypeStyle(tokens, name, patch))}
              />
            </div>
          ))}
        </div>
        <AddRow
          label="New type style"
          placeholder="e.g. heading1"
          onAdd={(name) => onChange(addTypeStyle(tokens, name))}
        />
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-xs font-medium uppercase tracking-wider text-text-subtle">
          Icon sizes
        </legend>
        <div className="space-y-2">
          {Object.entries(tokens.typography.icons).map(([name, { fontSize }]) => (
            <div
              key={name}
              className={`flex flex-wrap items-center gap-2 ${focusId === `icon-${name}` ? FOCUS_RING : ''}`}
            >
              <label className="w-28 shrink-0 font-mono text-xs text-text-muted" htmlFor={`icon-${name}`}>
                {name}
              </label>
              <input
                id={`icon-${name}`}
                type="text"
                value={fontSize}
                onChange={(e) => onChange(setIconSize(tokens, name, e.target.value))}
                className={`${FIELD} flex-1`}
                spellCheck={false}
              />
              <RemoveButton
                label={`Remove ${name}`}
                onClick={() => onChange(removeIconSize(tokens, name))}
              />
            </div>
          ))}
        </div>
        <AddRow
          label="New icon size"
          placeholder="e.g. iconMedium"
          onAdd={(name) => onChange(addIconSize(tokens, name))}
        />
      </fieldset>
    </div>
  )
}

export function TokenVariablesEditor({
  tokens,
  onChange,
  target,
}: {
  tokens: BrandTokens
  onChange: (next: BrandTokens) => void
  target?: TokenEditTarget | null
}) {
  const [panel, setPanel] = useState<Panel>(target?.panel ?? 'colors')

  useEffect(() => {
    if (target?.panel) setPanel(target.panel)
  }, [target])

  useEffect(() => {
    if (!target?.fieldId || panel !== target.panel) return
    const frame = window.requestAnimationFrame(() => {
      const el = document.getElementById(target.fieldId)
      if (!el) return
      el.scrollIntoView({ block: 'center', behavior: 'smooth' })
      if (el instanceof HTMLElement) {
        const focusable =
          el instanceof HTMLInputElement || el instanceof HTMLSelectElement
            ? el
            : el.querySelector<HTMLElement>('input, select, textarea, button')
        focusable?.focus()
      }
    })
    return () => window.cancelAnimationFrame(frame)
  }, [target, panel])

  const focusId = target?.fieldId

  return (
    <section className="rounded-panel bg-surface p-5 shadow-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-label text-sm text-brand-ink">Edit variables</h2>
          <p className="mt-1 text-xs text-text-muted">
            Changes stay in draft until you publish. The website reads the published set.
          </p>
        </div>
        <div className="flex rounded-control bg-hairline-soft p-0.5" role="group" aria-label="Variable groups">
          {PANELS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={panel === item.id}
              onClick={() => setPanel(item.id)}
              className={`rounded-control px-3 py-1.5 text-xs font-medium transition-colors duration-state ${
                panel === item.id
                  ? 'bg-surface text-brand-ink shadow-button'
                  : 'text-text-muted hover:text-brand-ink'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        {panel === 'colors' && <ColorsPanel tokens={tokens} onChange={onChange} focusId={focusId} />}
        {panel === 'sizing' && <SizingPanel tokens={tokens} onChange={onChange} focusId={focusId} />}
        {panel === 'typography' && (
          <TypographyPanel tokens={tokens} onChange={onChange} focusId={focusId} />
        )}
      </div>
    </section>
  )
}
