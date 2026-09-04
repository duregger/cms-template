import { useState, useRef } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import type { User } from 'firebase/auth'
import { useCmsPagesContext } from '@/contexts/CmsPagesContext'
import { useCmsComponentsContext } from '@/contexts/CmsComponentsContext'
import { useSpace } from '@/contexts/SpaceContext'
import { CMS_SPACES, CMS_NOTIFICATION_CATEGORIES } from '@/types/cms'
import type { CmsSpace } from '@/types/cms'
import type { CmsSidebarSection } from '@/hooks/useCmsPages'
import { AccountSheet, initials, type ProfilePatch } from '@/components/AccountSheet'
import { CMS_NAME } from '@/lib/brand'

function pageDisplayName(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function PageLink({ slug, space, size = 'md' }: { slug: string; space: CmsSpace; size?: 'md' | 'sm' }) {
  return (
    <NavLink
      to={`/${space}/pages/${slug}`}
      className={({ isActive }) =>
        `min-w-0 flex-1 rounded-control transition-colors duration-state hover:bg-brand-hover ${
          size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-3 py-2 text-sm'
        } font-medium ${
          isActive ? 'bg-brand-rest text-brand-ink-on-tint' : size === 'sm' ? 'text-text-muted' : 'text-brand-ink'
        }`
      }
    >
      {pageDisplayName(slug)}
    </NavLink>
  )
}

function SpaceSwitcher({ activeSpace }: { activeSpace: CmsSpace }) {
  const navigate = useNavigate()

  return (
    <div className="flex gap-0.5 rounded-control bg-hairline-soft p-0.5">
      {CMS_SPACES.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => navigate(`/${s.id}`)}
          className={`flex-1 rounded-control px-2 py-1.5 text-[11px] font-medium transition ${
            activeSpace === s.id
              ? 'bg-surface text-brand-primary shadow-card'
              : 'text-text-muted hover:text-brand-ink'
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  )
}

function AlertsSidebar({ space }: { space: CmsSpace }) {
  const barCategory = CMS_NOTIFICATION_CATEGORIES.find((c) => c.id === 'announcement_bar')!
  const alertCategories = CMS_NOTIFICATION_CATEGORIES.filter((c) => c.id !== 'announcement_bar')

  return (
    <>
      <div className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-text-muted">
        Announcements
      </div>
      <ul className="space-y-0.5">
        <li>
          <NavLink
            to={`/${space}/announcement-bars`}
            className={({ isActive }) =>
              `block rounded-control px-3 py-2 text-sm font-medium transition-colors duration-state hover:bg-brand-hover ${
                isActive ? 'bg-brand-rest text-brand-ink-on-tint' : 'text-brand-ink'
              }`
            }
          >
            {barCategory.label}
          </NavLink>
        </li>
      </ul>

      <div className="mb-2 mt-5 px-2 text-xs font-medium uppercase tracking-wider text-text-muted">
        Alerts
      </div>
      <ul className="space-y-0.5">
        {alertCategories.map((c) => (
          <li key={c.id}>
            <NavLink
              to={`/${space}/alerts/${c.id}`}
              className={({ isActive }) =>
                `block rounded-control px-3 py-2 text-sm font-medium transition-colors duration-state hover:bg-brand-hover ${
                  isActive ? 'bg-brand-rest text-brand-ink-on-tint' : 'text-brand-ink'
                }`
              }
            >
              {c.label}
            </NavLink>
          </li>
        ))}
      </ul>

      <NavLink
        to={`/${space}/notifications/new`}
        className={({ isActive }) =>
          `mt-4 flex items-center gap-2 rounded-control px-3 py-2 text-sm font-medium transition-colors duration-state hover:bg-brand-hover ${
            isActive ? 'bg-brand-rest text-brand-ink-on-tint' : 'text-brand-primary'
          }`
        }
      >
        <span className="text-lg">+</span>
        Create Notification
      </NavLink>
    </>
  )
}

export function CmsLayout({ user }: { user: User }) {
  const space = useSpace()
  const isAlerts = space === 'alerts'

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [addingSectionName, setAddingSectionName] = useState('')
  const [showAddSection, setShowAddSection] = useState(false)
  const [manageSections, setManageSections] = useState(false)
  const { pages, sections, saveSections, error } = useCmsPagesContext()
  const { components } = useCmsComponentsContext()
  const draggingSlug = useRef<string | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null)

  const [accountOpen, setAccountOpen] = useState(false)
  const [profile, setProfile] = useState<ProfilePatch>({
    displayName: user.displayName ?? undefined,
    photoURL: user.photoURL ?? undefined,
  })
  const displayUser = { ...user, ...profile } as User
  const handleProfileChange = (patch: ProfilePatch) => setProfile((prev) => ({ ...prev, ...patch }))

  const childrenOf = (parentSlug: string) =>
    pages.filter((p) => p.parentSlug === parentSlug)

  const sectionedSlugs = new Set(sections.flatMap((s) => s.pages))
  const unsectionedPages = pages.filter((p) => !p.parentSlug && !sectionedSlugs.has(p.slug))

  const handleDragStart = (slug: string) => (e: React.DragEvent) => {
    draggingSlug.current = slug
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', slug)
  }

  const handleDragOver = (sectionId: string) => (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropTarget(sectionId)
  }

  const handleDragLeave = () => {
    setDropTarget(null)
  }

  const handleDrop = (sectionId: string) => async (e: React.DragEvent) => {
    e.preventDefault()
    setDropTarget(null)
    const slug = draggingSlug.current
    draggingSlug.current = null
    if (!slug) return

    const updated = sections.map((s) => ({
      ...s,
      pages: s.pages.filter((p) => p !== slug),
    }))

    if (sectionId === '__unsectioned') {
      await saveSections(updated)
      return
    }

    await saveSections(
      updated.map((s) =>
        s.id === sectionId ? { ...s, pages: [...s.pages, slug] } : s,
      ),
    )
    setExpanded((prev) => new Set(prev).add(sectionId))
  }

  const handleDragEnd = () => {
    draggingSlug.current = null
    setDropTarget(null)
  }

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const addSection = async () => {
    const name = addingSectionName.trim()
    if (!name) return
    const section: CmsSidebarSection = {
      id: crypto.randomUUID(),
      name,
      pages: [],
    }
    await saveSections([...sections, section])
    setAddingSectionName('')
    setShowAddSection(false)
    setExpanded((prev) => new Set(prev).add(section.id))
  }

  const removeSection = async (id: string) => {
    await saveSections(sections.filter((s) => s.id !== id))
  }

  const renameSection = async (id: string, name: string) => {
    await saveSections(sections.map((s) => (s.id === id ? { ...s, name } : s)))
  }

  const addPageToSection = async (sectionId: string, slug: string) => {
    await saveSections(
      sections.map((s) =>
        s.id === sectionId ? { ...s, pages: [...s.pages, slug] } : s,
      ),
    )
  }

  const removePageFromSection = async (sectionId: string, slug: string) => {
    await saveSections(
      sections.map((s) =>
        s.id === sectionId
          ? { ...s, pages: s.pages.filter((p) => p !== slug) }
          : s,
      ),
    )
  }

  const renderPageWithChildren = (slug: string, size: 'md' | 'sm' = 'md') => {
    const children = childrenOf(slug)
    if (children.length === 0) {
      return (
        <li
          key={slug}
          className="flex items-center cursor-grab active:cursor-grabbing"
          draggable
          onDragStart={handleDragStart(slug)}
          onDragEnd={handleDragEnd}
        >
          <PageLink slug={slug} space={space} size={size} />
        </li>
      )
    }
    const isExp = expanded.has(`page:${slug}`)
    return (
      <li
        key={slug}
        draggable
        onDragStart={handleDragStart(slug)}
        onDragEnd={handleDragEnd}
        className="cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => toggle(`page:${slug}`)}
            className="shrink-0 rounded p-1 text-text-muted transition hover:bg-hairline-soft"
          >
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2"
              className={`transition-transform ${isExp ? 'rotate-90' : ''}`}
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
          <PageLink slug={slug} space={space} size={size} />
        </div>
        {isExp && (
          <ul className="ml-5 space-y-0.5 border-l border-hairline pl-1">
            {children.map((child) => (
              <li key={child.slug} className="flex items-center">
                <PageLink slug={child.slug} space={space} size="sm" />
              </li>
            ))}
          </ul>
        )}
      </li>
    )
  }

  return (
    <div className="flex min-h-screen bg-page font-body">
      <aside
        className={`flex shrink-0 flex-col border-r border-hairline bg-brand-rail transition-[width] duration-200 ${
          sidebarOpen ? 'w-56' : 'w-14'
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b border-hairline px-3">
          {sidebarOpen && (
            <span className="font-label text-sm text-brand-ink">CMS</span>
          )}
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="rounded p-2 text-text-muted transition hover:bg-hairline-soft hover:text-brand-ink"
            title={sidebarOpen ? 'Collapse menu' : 'Expand menu'}
          >
            <svg
              width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2"
              className={`transition-transform ${sidebarOpen ? '' : 'rotate-180'}`}
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {error && (
            <div className="mx-2 mb-2 rounded-control bg-danger-tint px-3 py-2 text-xs text-danger-strong">
              {error.message}
            </div>
          )}
          {sidebarOpen && (
            <div className="px-2">
              {/* Space Switcher */}
              <div className="mb-4">
                <SpaceSwitcher activeSpace={space} />
              </div>

              {isAlerts ? (
                /* Alerts space sidebar */
                <AlertsSidebar space={space} />
              ) : (
                /* Pages/Components sidebar (web, mobile, apps) */
                <>
                  {/* Unsectioned pages */}
                  <div
                    onDragOver={handleDragOver('__unsectioned')}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop('__unsectioned')}
                    className={`rounded-control transition ${
                      dropTarget === '__unsectioned' ? 'bg-brand-rest ring-2 ring-brand-primary/30' : ''
                    }`}
                  >
                    <div className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-text-muted">
                      Pages
                    </div>
                    <ul className="space-y-0.5">
                      {unsectionedPages.map((p) => renderPageWithChildren(p.slug))}
                      {unsectionedPages.length === 0 && dropTarget === '__unsectioned' && (
                        <li className="rounded-control border border-dashed border-brand-primary/30 px-3 py-2 text-center text-xs text-text-muted">
                          Drop here
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Sections */}
                  {sections.map((section) => {
                    const isExp = expanded.has(section.id)
                    const sectionPages = section.pages
                      .map((slug) => pages.find((p) => p.slug === slug))
                      .filter(Boolean) as typeof pages
                    return (
                      <div
                        key={section.id}
                        className={`mt-4 rounded-control transition ${
                          dropTarget === section.id ? 'bg-brand-rest ring-2 ring-brand-primary/30' : ''
                        }`}
                        onDragOver={handleDragOver(section.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop(section.id)}
                      >
                        <button
                          type="button"
                          onClick={() => toggle(section.id)}
                          className="group flex w-full items-center gap-1 px-2 text-xs font-medium uppercase tracking-wider text-text-muted transition hover:text-text-muted"
                        >
                          <svg
                            width="10" height="10" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2"
                            className={`shrink-0 transition-transform ${isExp ? 'rotate-90' : ''}`}
                          >
                            <path d="M9 18l6-6-6-6" />
                          </svg>
                          {manageSections ? (
                            <input
                              type="text"
                              defaultValue={section.name}
                              onClick={(e) => e.stopPropagation()}
                              onBlur={(e) => renameSection(section.id, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                              }}
                              className="min-w-0 flex-1 rounded border border-hairline bg-surface px-1 py-0.5 text-xs font-medium uppercase tracking-wider text-text-muted focus:border-brand-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1"
                            />
                          ) : (
                            <span className="min-w-0 flex-1 text-left">{section.name}</span>
                          )}
                          {manageSections && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeSection(section.id)
                              }}
                              className="shrink-0 rounded p-0.5 text-text-subtle opacity-0 transition-colors duration-state hover:text-danger group-hover:opacity-100"
                              title="Remove section"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </button>
                        {isExp && (
                          <ul className="mt-0.5 space-y-0.5">
                            {sectionPages.map((p) => (
                              <li key={p.slug} className="group/item flex items-center">
                                {renderPageWithChildren(p.slug)}
                                {manageSections && (
                                  <button
                                    type="button"
                                    onClick={() => removePageFromSection(section.id, p.slug)}
                                    className="shrink-0 rounded p-1 text-text-muted opacity-0 transition-colors duration-state hover:text-danger group-hover/item:opacity-100"
                                    title="Remove from section"
                                  >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                  </button>
                                )}
                              </li>
                            ))}
                            {sectionPages.length === 0 && (
                              <li className="px-3 py-2 text-xs text-text-muted">No pages</li>
                            )}
                          </ul>
                        )}
                        {isExp && manageSections && unsectionedPages.length > 0 && (
                          <select
                            value=""
                            onChange={(e) => {
                              if (e.target.value) addPageToSection(section.id, e.target.value)
                            }}
                            className="mt-1 ml-2 w-[calc(100%-8px)] rounded border border-dashed border-hairline bg-surface px-2 py-1 text-xs text-text-muted focus:border-brand-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1"
                          >
                            <option value="">+ Add page...</option>
                            {unsectionedPages.map((p) => (
                              <option key={p.slug} value={p.slug}>
                                {pageDisplayName(p.slug)}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    )
                  })}

                  {/* Section management */}
                  <div className="mt-3 flex flex-col gap-1">
                    {showAddSection ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={addingSectionName}
                          onChange={(e) => setAddingSectionName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addSection()}
                          placeholder="Section name"
                          className="min-w-0 flex-1 rounded border border-hairline px-2 py-1 text-xs focus:border-brand-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={addSection}
                          disabled={!addingSectionName.trim()}
                          className="rounded-control bg-brand-primary px-2 py-1 text-[10px] font-medium text-brand-on shadow-button transition-colors duration-state hover:bg-brand-wash hover:text-brand-ink-on-tint disabled:opacity-50"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowAddSection(false); setAddingSectionName('') }}
                          className="rounded px-1.5 py-1 text-[10px] text-text-muted hover:bg-hairline-soft"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => setShowAddSection(true)}
                          className="flex-1 rounded-control px-3 py-1.5 text-left text-xs font-medium text-text-muted transition hover:bg-hairline-soft hover:text-brand-ink"
                        >
                          + Section
                        </button>
                        {sections.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setManageSections((v) => !v)}
                            className={`rounded-control px-2 py-1.5 text-xs font-medium transition hover:bg-hairline-soft ${
                              manageSections ? 'text-brand-primary' : 'text-text-muted hover:text-brand-ink'
                            }`}
                          >
                            {manageSections ? 'Done' : 'Edit'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <NavLink
                    to={`/${space}`}
                    end
                    className={({ isActive }) =>
                      `mt-2 flex items-center gap-2 rounded-control px-3 py-2 text-sm font-medium transition-colors duration-state hover:bg-brand-hover ${
                        isActive ? 'bg-brand-rest text-brand-ink-on-tint' : 'text-brand-primary'
                      }`
                    }
                  >
                    <span className="text-lg">+</span>
                    Create Page
                  </NavLink>

                  <div className="mb-2 mt-6 px-2 text-xs font-medium uppercase tracking-wider text-text-muted">
                    Components
                  </div>
                  <ul className="space-y-0.5">
                    {components.map((c) => (
                      <li key={c.id}>
                        <NavLink
                          to={`/${space}/components/${c.id}`}
                          className={({ isActive }) =>
                            `block rounded-control px-3 py-2 text-sm font-medium transition-colors duration-state hover:bg-brand-hover ${
                              isActive ? 'bg-brand-rest text-brand-ink-on-tint' : 'text-brand-ink'
                            }`
                          }
                        >
                          {c.displayName || c.name}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                  <NavLink
                    to={`/${space}/components`}
                    end
                    className={({ isActive }) =>
                      `mt-2 flex items-center gap-2 rounded-control px-3 py-2 text-sm font-medium transition-colors duration-state hover:bg-brand-hover ${
                        isActive ? 'bg-brand-rest text-brand-ink-on-tint' : 'text-brand-primary'
                      }`
                    }
                  >
                    <span className="text-lg">+</span>
                    Create Component
                  </NavLink>
                </>
              )}

              {/* Brand — space-scoped design tokens (varies by /{space}/...) */}
              <div className="mb-2 mt-6 px-2 text-xs font-medium uppercase tracking-wider text-text-muted">
                Brand
              </div>
              <NavLink
                to={`/${space}/design-system`}
                end
                className={({ isActive }) =>
                  `block rounded-control px-3 py-2 text-sm font-medium transition-colors duration-state hover:bg-brand-hover ${
                    isActive ? 'bg-brand-rest text-brand-ink-on-tint' : 'text-brand-ink'
                  }`
                }
              >
                Design System
              </NavLink>

              {/* System links — global, not space-scoped */}
              <div className="mb-2 mt-6 border-t border-hairline pt-4 px-2 text-xs font-medium uppercase tracking-wider text-text-muted">
                System
              </div>
              <NavLink
                to="/system/setup"
                className={({ isActive }) =>
                  `block rounded-control px-3 py-2 text-sm font-medium transition-colors duration-state hover:bg-brand-hover ${
                    isActive ? 'bg-brand-rest text-brand-ink-on-tint' : 'text-brand-ink'
                  }`
                }
              >
                Client Setup
              </NavLink>
              <NavLink
                to="/system/release-notes"
                className={({ isActive }) =>
                  `block rounded-control px-3 py-2 text-sm font-medium transition-colors duration-state hover:bg-brand-hover ${
                    isActive ? 'bg-brand-rest text-brand-ink-on-tint' : 'text-brand-ink'
                  }`
                }
              >
                Release Notes
              </NavLink>
              <NavLink
                to="/system/dev-docs"
                className={({ isActive }) =>
                  `block rounded-control px-3 py-2 text-sm font-medium transition-colors duration-state hover:bg-brand-hover ${
                    isActive ? 'bg-brand-rest text-brand-ink-on-tint' : 'text-brand-ink'
                  }`
                }
              >
                Developer Docs
              </NavLink>
            </div>
          )}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-hairline bg-surface px-6 py-3">
          <span className="font-label text-sm text-brand-ink">
            {CMS_NAME}
          </span>
          <button
            type="button"
            onClick={() => setAccountOpen(true)}
            className="rounded-full transition-shadow duration-state focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1"
            aria-label="Account"
          >
            {displayUser.photoURL ? (
              <img
                src={displayUser.photoURL}
                alt=""
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-primary text-xs font-medium text-brand-on">
                {initials(displayUser)}
              </span>
            )}
          </button>
        </header>

        <main className="flex-1 overflow-auto bg-surface">
          <Outlet />
        </main>
      </div>

      <AccountSheet
        user={displayUser}
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        onProfileChange={handleProfileChange}
      />
    </div>
  )
}
