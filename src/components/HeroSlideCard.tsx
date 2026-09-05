import type { CmsHeroSlide, CmsComponent } from '@/types/cms'

export type HeroSlideCardProps = {
  slide: CmsHeroSlide
  heroComponents: CmsComponent[]
  updateSlide: (id: string, patch: Partial<CmsHeroSlide>) => void
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
  canMoveUp: boolean
  canMoveDown: boolean
}

export function HeroSlideCard({
  slide,
  heroComponents,
  updateSlide,
  onMoveUp,
  onMoveDown,
  onRemove,
  canMoveUp,
  canMoveDown,
}: HeroSlideCardProps) {
  const comp = heroComponents.find((c) => c.id === slide.componentId)

  return (
    <div className="rounded-card border border-hairline bg-surface px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={slide.componentId ?? ''}
          onChange={(e) => {
            const cid = e.target.value
            if (!cid) {
              updateSlide(slide.id, { componentId: undefined, component: '', variable: undefined })
            } else {
              const c = heroComponents.find((x) => x.id === cid)
              updateSlide(slide.id, { componentId: cid, component: c?.name ?? '' })
            }
          }}
          className="rounded-control border-hairline bg-surface px-3 py-2 text-sm font-medium text-brand-ink border-2 focus:border-brand-primary focus:outline-none focus-visible:ring-0"
        >
          <option value="">- Add Component -</option>
          {heroComponents.map((c) => (
            <option key={c.id} value={c.id}>
              {c.displayName || c.name}
            </option>
          ))}
        </select>

        {slide.componentId && comp && comp.variables.length > 0 && (
          <select
            value={slide.variable ?? ''}
            onChange={(e) => updateSlide(slide.id, { variable: e.target.value || undefined })}
            className="rounded-control border-hairline bg-surface px-3 py-2 text-sm font-medium text-brand-ink border-2 focus:border-brand-primary focus:outline-none focus-visible:ring-0"
          >
            <option value="">- Choose Variable -</option>
            {comp.variables.map((v) => (
              <option key={v.id} value={v.key}>
                {v.label || v.key}
              </option>
            ))}
          </select>
        )}

        <div className="ml-auto flex items-center gap-1">
          <button onClick={onMoveUp} disabled={!canMoveUp} className="rounded px-2 py-1 text-xs text-text-muted hover:bg-hairline-soft disabled:opacity-30" title="Move up">
            ▲
          </button>
          <button onClick={onMoveDown} disabled={!canMoveDown} className="rounded px-2 py-1 text-xs text-text-muted hover:bg-hairline-soft disabled:opacity-30" title="Move down">
            ▼
          </button>
          <button onClick={onRemove} className="ml-2 rounded px-2 py-1 text-xs text-danger hover:bg-danger-tint">
            Remove
          </button>
        </div>
      </div>
    </div>
  )
}
