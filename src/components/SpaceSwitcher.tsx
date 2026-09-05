import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setDoc } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { isBeginAdmin } from '@/lib/brand'
import { PROJECT_SETTINGS_REF, useProjectSettings } from '@/hooks/useProjectSettings'
import {
  OPTIONAL_SPACES,
  isSpacePublished,
  spaceLabel,
  visibleSwitcherSpaces,
  type CmsSpace,
} from '@/types/cms'

export function SpaceSwitcher({
  activeSpace,
  user,
}: {
  activeSpace: CmsSpace
  user: User
}) {
  const navigate = useNavigate()
  const { settings } = useProjectSettings()
  const published = settings?.publishedSpaces
  const admin = isBeginAdmin(user.email)
  const tabs = visibleSwitcherSpaces(published, admin ? activeSpace : undefined)
  const unpublished = OPTIONAL_SPACES.filter((id) => !isSpacePublished(id, published))
  const showAdd = admin && unpublished.length > 0
  const canPublish = admin && OPTIONAL_SPACES.includes(activeSpace) && !isSpacePublished(activeSpace, published)

  const [menuOpen, setMenuOpen] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    const onPointer = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [menuOpen])

  const publishSpace = async () => {
    setPublishing(true)
    try {
      const next = [...new Set([...(published ?? []), activeSpace])]
      await setDoc(PROJECT_SETTINGS_REF(), { publishedSpaces: next }, { merge: true })
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        <div
          role="tablist"
          aria-label="Spaces"
          className="flex min-w-0 flex-1 gap-0.5 rounded-control bg-hairline-soft p-0.5"
        >
          {tabs.map((id) => {
            const selected = activeSpace === id
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => navigate(`/${id}`)}
                className={`min-h-8 min-w-0 flex-1 rounded-control px-2 py-1.5 text-[11px] font-medium transition-colors duration-state ${
                  selected
                    ? 'bg-surface text-brand-primary shadow-card'
                    : 'text-text-muted hover:text-brand-ink'
                }`}
              >
                {spaceLabel(id)}
              </button>
            )
          })}
        </div>

        {showAdd && (
          <div ref={menuRef} className="relative shrink-0">
            <button
              type="button"
              aria-label="Add space"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-controls={menuId}
              onClick={() => setMenuOpen((o) => !o)}
              className="flex h-8 w-8 items-center justify-center rounded-control text-brand-primary transition-colors duration-state hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
            {menuOpen && (
              <ul
                id={menuId}
                role="menu"
                className="absolute right-0 z-20 mt-1 min-w-[8.5rem] rounded-control bg-surface py-1 shadow-panel"
              >
                {unpublished.map((id) => (
                  <li key={id} role="none">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false)
                        navigate(`/${id}`)
                      }}
                      className="block w-full px-3 py-2 text-left text-xs font-medium text-brand-ink hover:bg-brand-hover"
                    >
                      {spaceLabel(id)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {canPublish && (
        <button
          type="button"
          disabled={publishing}
          onClick={publishSpace}
          className="w-full rounded-control px-2 py-1.5 text-left text-[11px] font-medium text-brand-primary hover:bg-brand-hover disabled:opacity-50"
        >
          {publishing ? 'Publishing…' : `Publish ${spaceLabel(activeSpace)}`}
        </button>
      )}
    </div>
  )
}
