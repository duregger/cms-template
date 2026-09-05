import { useEffect, useMemo, useState } from 'react'
import type { TokenEditTarget } from '@/components/TokenVariablesEditor'
import {
  contrastOn,
  fontFamilyNames,
  groupSemantic,
  orderedScales,
  sortScaleSteps,
  titleFromKey,
  tokenInventory,
} from '@/lib/token-preview'
import type { BrandTokens, ColorScale, TypeStyle } from '@/types/tokens'

const EDIT_HIT =
  'text-start transition-[box-shadow,transform] duration-state hover:ring-2 hover:ring-brand-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary'

function EditHit({
  label,
  className,
  style,
  onEdit,
  children,
}: {
  label: string
  className?: string
  style?: React.CSSProperties
  onEdit: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={`Edit ${label}`}
      onClick={onEdit}
      style={style}
      className={`${EDIT_HIT} ${className ?? ''}`}
    >
      {children}
    </button>
  )
}

type NavItem = { id: string; label: string; children?: { id: string; label: string }[] }

function usePreviewFonts(tokens: BrandTokens) {
  useEffect(() => {
    const families = fontFamilyNames(tokens)
    if (families.length === 0) return
    const id = 'ds-preview-fonts'
    const href = `https://fonts.googleapis.com/css2?${families
      .map((name) => `family=${encodeURIComponent(name)}:wght@400;500;600;700`)
      .join('&')}&display=swap`
    let link = document.getElementById(id) as HTMLLinkElement | null
    if (!link) {
      link = document.createElement('link')
      link.id = id
      link.rel = 'stylesheet'
      document.head.appendChild(link)
    }
    if (link.href !== href) link.href = href
  }, [tokens])
}

function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0] ?? '')

  useEffect(() => {
    if (ids.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]?.target.id) setActive(visible[0].target.id)
      },
      { rootMargin: '-20% 0px -65% 0px', threshold: [0, 0.15] },
    )
    for (const id of ids) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [ids])

  return active
}

function jumpTo(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
}

function ScaleColumn({
  name,
  ramp,
  onEdit,
}: {
  name: string
  ramp: ColorScale
  onEdit: (target: TokenEditTarget) => void
}) {
  const steps = Object.entries(ramp).sort(([a], [b]) => sortScaleSteps(a, b))
  return (
    <div className="min-w-[8.5rem]">
      <h4 className="mb-2 truncate font-label text-sm text-brand-ink">{titleFromKey(name)}</h4>
      <div className="overflow-hidden rounded-tile shadow-panel">
        {steps.map(([step, value]) => (
          <EditHit
            key={step}
            label={`${name} ${step}`}
            className="flex h-11 w-full items-center justify-between px-2.5"
            style={{ backgroundColor: value, color: contrastOn(value) }}
            onEdit={() => onEdit({ panel: 'colors', fieldId: `scale-${name}-${step}` })}
          >
            <span className="font-mono text-[10px]">{step}</span>
            <span className="font-mono text-[10px] opacity-80">{value}</span>
          </EditHit>
        ))}
      </div>
    </div>
  )
}

function SemanticCard({
  label,
  entries,
  dark,
  onEdit,
}: {
  label: string
  entries: [string, string][]
  dark?: boolean
  onEdit: (target: TokenEditTarget) => void
}) {
  const compact = entries.length > 16
  return (
    <div className={`rounded-panel p-4 shadow-panel ${dark ? 'bg-[#101828] text-white' : 'bg-surface'}`}>
      <h4 className={`mb-3 text-xs font-medium uppercase tracking-wider ${dark ? 'text-white/60' : 'text-text-subtle'}`}>
        {label}
        <span className="ms-2 font-mono normal-case tracking-normal opacity-70">{entries.length}</span>
      </h4>
      {compact ? (
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 xl:grid-cols-4">
          {entries.map(([name, value]) => (
            <EditHit
              key={name}
              label={name}
              className="flex h-10 min-w-0 items-end rounded-tile px-2 py-1"
              style={{ backgroundColor: value, color: contrastOn(value) }}
              onEdit={() => onEdit({ panel: 'colors', fieldId: `sem-${name}` })}
            >
              <span className="truncate font-mono text-[9px]">{name}</span>
            </EditHit>
          ))}
        </div>
      ) : (
        <ul className="space-y-1">
          {entries.map(([name, value]) => (
            <li key={name}>
              <EditHit
                label={name}
                className="flex w-full items-center gap-2 rounded-tile px-1 py-0.5"
                onEdit={() => onEdit({ panel: 'colors', fieldId: `sem-${name}` })}
              >
                <span
                  className="h-7 w-7 shrink-0 rounded-tile border border-black/10"
                  style={{ backgroundColor: value }}
                />
                <span className={`min-w-0 flex-1 truncate font-mono text-[11px] ${dark ? 'text-white/80' : 'text-brand-ink'}`}>
                  {name}
                </span>
                <span className={`shrink-0 font-mono text-[10px] ${dark ? 'text-white/45' : 'text-text-subtle'}`}>
                  {value}
                </span>
              </EditHit>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function TypographyPreview({
  tokens,
  onEdit,
}: {
  tokens: BrandTokens
  onEdit: (target: TokenEditTarget) => void
}) {
  const familyStack = (style: TypeStyle): string =>
    tokens.typography.fontFamilies[style.fontFamily]?.stack ?? 'inherit'

  return (
    <div className="space-y-8">
      <div id="ds-families" className="scroll-mt-24">
        <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-text-subtle">Font families</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {Object.entries(tokens.typography.fontFamilies).map(([role, def]) => (
            <EditHit
              key={role}
              label={role}
              className="rounded-panel bg-surface px-4 py-3 shadow-panel"
              onEdit={() => onEdit({ panel: 'typography', fieldId: `ff-${role}` })}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs text-text-muted">{role}</span>
                <span className="rounded bg-hairline-soft px-2 py-0.5 font-mono text-[10px] text-text-muted">
                  {def.source}
                </span>
              </div>
              <p style={{ fontFamily: def.stack }} className="mt-2 text-2xl text-brand-ink">
                {titleFromKey(role)}
              </p>
              <p className="mt-1 font-mono text-[11px] text-text-subtle">{def.stack}</p>
            </EditHit>
          ))}
        </div>
      </div>

      <div id="ds-type-scale" className="scroll-mt-24">
        <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-text-subtle">Type scale</h3>
        <div className="space-y-4">
          {Object.entries(tokens.typography.scale).map(([name, style]) => (
            <EditHit
              key={name}
              label={name}
              className="block w-full rounded-panel bg-surface px-5 py-4 shadow-panel"
              onEdit={() => onEdit({ panel: 'typography', fieldId: `type-${name}` })}
            >
              <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-mono text-[11px] text-text-muted">{name}</span>
                <span className="font-mono text-[10px] text-text-subtle">
                  {style.fontFamily} · {style.fontSize} · {style.fontWeight} · {style.lineHeight}
                  {style.letterSpacing !== '0' ? ` · ${style.letterSpacing}` : ''}
                </span>
              </div>
              <p
                style={{
                  fontFamily: familyStack(style),
                  fontSize: style.fontSize,
                  fontWeight: style.fontWeight,
                  lineHeight: style.lineHeight,
                  letterSpacing: style.letterSpacing,
                  textDecoration: style.textDecoration,
                  textTransform: style.textTransform as React.CSSProperties['textTransform'],
                }}
                className="text-brand-ink"
              >
                The quick brown fox jumps over the lazy dog
              </p>
            </EditHit>
          ))}
        </div>
      </div>

      {Object.keys(tokens.typography.icons).length > 0 && (
        <div id="ds-icons" className="scroll-mt-24">
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-text-subtle">Icon sizes</h3>
          <div className="flex flex-wrap items-end gap-6">
            {Object.entries(tokens.typography.icons).map(([name, { fontSize }]) => (
              <EditHit
                key={name}
                label={name}
                className="flex flex-col items-center gap-2 rounded-tile p-1"
                onEdit={() => onEdit({ panel: 'typography', fieldId: `icon-${name}` })}
              >
                <div
                  className="rounded-tile bg-brand-primary/20"
                  style={{ width: fontSize, height: fontSize }}
                />
                <span className="font-mono text-[10px] text-text-muted">{name}</span>
                <span className="font-mono text-[10px] text-text-subtle">{fontSize}</span>
              </EditHit>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SizingPreview({
  tokens,
  onEdit,
}: {
  tokens: BrandTokens
  onEdit: (target: TokenEditTarget) => void
}) {
  const { spacing, borderRadius, stroke, elevation, layout } = tokens.sizing
  const columns = Number(layout?.['grid-columns'] ?? 0)

  return (
    <div className="space-y-10">
      {spacing && (
        <div id="ds-spacing" className="scroll-mt-24">
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-text-subtle">Spacing</h3>
          <div className="columns-1 gap-x-10 sm:columns-2">
            {Object.entries(spacing).map(([k, v]) => (
              <EditHit
                key={k}
                label={`spacing ${k}`}
                className="mb-1.5 flex w-full break-inside-avoid items-center gap-3 rounded-tile px-1"
                onEdit={() => onEdit({ panel: 'sizing', fieldId: `size-spacing-${k}` })}
              >
                <span className="w-12 shrink-0 font-mono text-xs text-text-muted">{k}</span>
                <div className="h-3 max-w-[12rem] rounded bg-brand-primary/35" style={{ width: v }} />
                <span className="font-mono text-xs text-text-subtle">{v}</span>
              </EditHit>
            ))}
          </div>
        </div>
      )}

      {borderRadius && (
        <div id="ds-radius" className="scroll-mt-24">
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-text-subtle">Border radius</h3>
          <div className="flex flex-wrap gap-5">
            {Object.entries(borderRadius).map(([k, v]) => (
              <EditHit
                key={k}
                label={`radius ${k}`}
                className="flex flex-col items-center gap-1.5 rounded-tile p-1"
                onEdit={() => onEdit({ panel: 'sizing', fieldId: `size-borderRadius-${k}` })}
              >
                <div
                  className="h-16 w-[4.5rem] border-2 border-brand-primary/40 bg-brand-primary/5"
                  style={{ borderRadius: v }}
                />
                <span className="font-mono text-[10px] text-text-muted">{k}</span>
                <span className="font-mono text-[10px] text-text-subtle">{v}</span>
              </EditHit>
            ))}
          </div>
        </div>
      )}

      {stroke && (
        <div id="ds-stroke" className="scroll-mt-24">
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-text-subtle">Stroke</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Object.entries(stroke).map(([k, v]) => (
              <EditHit
                key={k}
                label={`stroke ${k}`}
                className="flex items-center gap-3 rounded-panel bg-surface px-3 py-2 shadow-panel"
                onEdit={() => onEdit({ panel: 'sizing', fieldId: `size-stroke-${k}` })}
              >
                <div
                  className="h-8 w-8 shrink-0 rounded-tile border-brand-ink"
                  style={{ borderWidth: v }}
                />
                <div className="min-w-0">
                  <div className="truncate font-mono text-[11px] text-brand-ink">{k}</div>
                  <div className="font-mono text-[10px] text-text-subtle">{v}</div>
                </div>
              </EditHit>
            ))}
          </div>
        </div>
      )}

      {elevation && Object.keys(elevation).length > 0 && (
        <div id="ds-elevation" className="scroll-mt-24">
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-text-subtle">Elevation</h3>
          <div className="flex flex-wrap gap-6 py-2">
            {Object.entries(elevation).map(([k, v]) => (
              <EditHit
                key={k}
                label={`elevation ${k}`}
                className="flex flex-col items-center gap-2 rounded-tile p-1"
                onEdit={() => onEdit({ panel: 'sizing', fieldId: `size-elevation-${k}` })}
              >
                <div className="h-14 w-14 rounded-tile bg-surface" style={{ filter: v }} />
                <span className="font-mono text-[10px] text-text-muted">{k}</span>
              </EditHit>
            ))}
          </div>
        </div>
      )}

      {layout && (
        <div id="ds-layout" className="scroll-mt-24">
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-text-subtle">Layout</h3>
          {columns > 0 && (
            <div
              className="mb-4 grid gap-1"
              style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: columns }, (_, i) => (
                <div key={i} className="h-10 rounded-tile bg-brand-primary/15" />
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
            {Object.entries(layout).map(([k, v]) => (
              <EditHit
                key={k}
                label={`layout ${k}`}
                className="flex items-center justify-between gap-3 rounded-panel bg-surface px-3 py-2 shadow-panel"
                onEdit={() => onEdit({ panel: 'sizing', fieldId: `size-layout-${k}` })}
              >
                <span className="truncate font-mono text-[11px] text-text-muted">{k}</span>
                <span className="shrink-0 font-mono text-[11px] text-brand-ink">{v}</span>
              </EditHit>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ColorsPreview({
  tokens,
  onEdit,
}: {
  tokens: BrandTokens
  onEdit: (target: TokenEditTarget) => void
}) {
  const scales = orderedScales(tokens.colors.scales)
  const groups = groupSemantic(tokens.colors.semanticResolved)
  const light = groups.filter((g) => !g.key.startsWith('dark-'))
  const dark = groups.filter((g) => g.key.startsWith('dark-'))

  return (
    <div className="space-y-10">
      {scales.length > 0 && (
        <div id="ds-scales" className="scroll-mt-24">
          <h3 className="mb-4 text-xs font-medium uppercase tracking-wider text-text-subtle">
            Scales
            <span className="ms-2 font-mono normal-case tracking-normal text-text-subtle/80">{scales.length}</span>
          </h3>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8">
            {scales.map(([name, ramp]) => (
              <ScaleColumn key={name} name={name} ramp={ramp} onEdit={onEdit} />
            ))}
          </div>
        </div>
      )}

      {light.length > 0 && (
        <div id="ds-semantic" className="scroll-mt-24">
          <h3 className="mb-4 text-xs font-medium uppercase tracking-wider text-text-subtle">Semantic</h3>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {light.map((group) => (
              <SemanticCard key={group.key} label={group.label} entries={group.entries} onEdit={onEdit} />
            ))}
          </div>
        </div>
      )}

      {dark.length > 0 && (
        <div id="ds-semantic-dark" className="scroll-mt-24">
          <h3 className="mb-4 text-xs font-medium uppercase tracking-wider text-text-subtle">Dark semantic</h3>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {dark.map((group) => (
              <SemanticCard key={group.key} label={group.label} entries={group.entries} dark onEdit={onEdit} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SectionNav({ items, active }: { items: NavItem[]; active: string }) {
  const isActive = (id: string, children?: NavItem['children']) =>
    active === id || Boolean(children?.some((child) => child.id === active))

  return (
    <nav aria-label="Design system sections">
      <p className="mb-2 px-2 text-[10px] font-medium uppercase tracking-wider text-text-subtle">On this page</p>
      <ul className="space-y-0.5">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault()
                jumpTo(item.id)
              }}
              className={`block rounded-control px-2 py-1.5 text-sm transition-colors duration-state hover:bg-brand-hover ${
                isActive(item.id, item.children)
                  ? 'bg-brand-rest font-medium text-brand-ink-on-tint'
                  : 'text-brand-ink'
              }`}
            >
              {item.label}
            </a>
            {item.children && item.children.length > 0 && (
              <ul className="ms-2 mt-0.5 space-y-0.5 border-s border-hairline ps-2">
                {item.children.map((child) => (
                  <li key={child.id}>
                    <a
                      href={`#${child.id}`}
                      onClick={(e) => {
                        e.preventDefault()
                        jumpTo(child.id)
                      }}
                      className={`block rounded-control px-2 py-1 text-xs transition-colors duration-state hover:bg-brand-hover ${
                        active === child.id ? 'font-medium text-brand-ink' : 'text-text-muted'
                      }`}
                    >
                      {child.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function DesignSystemGallery({
  tokens,
  onEdit,
}: {
  tokens: BrandTokens
  onEdit: (target: TokenEditTarget) => void
}) {
  usePreviewFonts(tokens)
  const inventory = tokenInventory(tokens)
  const hasColors = inventory.scales > 0 || inventory.semantic > 0
  const hasSizing = inventory.sizing > 0
  const hasType = inventory.type > 0 || inventory.families > 0

  const navItems = useMemo<NavItem[]>(() => {
    const items: NavItem[] = []
    if (hasColors) {
      const children: { id: string; label: string }[] = []
      if (inventory.scales > 0) children.push({ id: 'ds-scales', label: 'Scales' })
      if (inventory.semantic > 0) children.push({ id: 'ds-semantic', label: 'Semantic' })
      if (Object.keys(tokens.colors.semanticResolved).some((k) => k.startsWith('dark-'))) {
        children.push({ id: 'ds-semantic-dark', label: 'Dark' })
      }
      items.push({ id: 'ds-colors', label: 'Colors', children })
    }
    if (hasSizing) {
      const children: { id: string; label: string }[] = []
      if (tokens.sizing.spacing) children.push({ id: 'ds-spacing', label: 'Spacing' })
      if (tokens.sizing.borderRadius) children.push({ id: 'ds-radius', label: 'Radius' })
      if (tokens.sizing.stroke) children.push({ id: 'ds-stroke', label: 'Stroke' })
      if (tokens.sizing.layout) children.push({ id: 'ds-layout', label: 'Layout' })
      if (tokens.sizing.elevation && Object.keys(tokens.sizing.elevation).length > 0) {
        children.push({ id: 'ds-elevation', label: 'Elevation' })
      }
      items.push({ id: 'ds-sizing', label: 'Sizing', children })
    }
    if (hasType) {
      items.push({
        id: 'ds-type',
        label: 'Typography',
        children: [
          { id: 'ds-families', label: 'Families' },
          { id: 'ds-type-scale', label: 'Scale' },
          ...(inventory.icons > 0 ? [{ id: 'ds-icons', label: 'Icons' }] : []),
        ],
      })
    }
    return items
  }, [hasColors, hasSizing, hasType, inventory, tokens])

  const observeIds = useMemo(
    () => navItems.flatMap((item) => [item.id, ...(item.children?.map((c) => c.id) ?? [])]),
    [navItems],
  )
  const active = useActiveSection(observeIds)

  return (
    <div className="mt-8 lg:flex lg:items-start lg:gap-8">
      <aside className="z-20 mb-6 lg:order-2 lg:sticky lg:top-20 lg:mb-0 lg:w-44 lg:shrink-0">
        <div className="rounded-panel bg-surface p-3 shadow-panel lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
          <div className="mb-3 hidden flex-wrap gap-1 px-2 font-mono text-[10px] text-text-subtle lg:flex">
            {inventory.scales > 0 && <span>{inventory.scales} scales</span>}
            {inventory.semantic > 0 && <span>· {inventory.semantic} semantic</span>}
            {inventory.type > 0 && <span>· {inventory.type} type</span>}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 lg:block lg:overflow-visible lg:pb-0">
            <div className="min-w-max lg:min-w-0">
              <SectionNav items={navItems} active={active} />
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1 lg:order-1">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-text-muted">
          <span className="rounded bg-hairline-soft px-2 py-0.5 font-mono">{tokens.meta.sourceFormat}</span>
          {tokens.meta.updatedAt > 0 && tokens.meta.updatedBy && (
            <span>last saved by {tokens.meta.updatedBy}</span>
          )}
          <span className="text-text-subtle">Click a token to edit it</span>
        </div>

        {hasColors && (
          <section id="ds-colors" className="scroll-mt-24">
            <h2 className="mb-5 font-label text-lg text-brand-ink">Colors</h2>
            <ColorsPreview tokens={tokens} onEdit={onEdit} />
          </section>
        )}

        {hasSizing && (
          <section id="ds-sizing" className="mt-14 scroll-mt-24">
            <h2 className="mb-5 font-label text-lg text-brand-ink">Sizing</h2>
            <SizingPreview tokens={tokens} onEdit={onEdit} />
          </section>
        )}

        {hasType && (
          <section id="ds-type" className="mt-14 scroll-mt-24">
            <h2 className="mb-5 font-label text-lg text-brand-ink">Typography</h2>
            <TypographyPreview tokens={tokens} onEdit={onEdit} />
          </section>
        )}
      </div>
    </div>
  )
}
