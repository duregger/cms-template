import { useState, useEffect, useRef } from 'react'

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'spaces', label: 'Spaces' },
  { id: 'data-model', label: 'Data Model' },
  { id: 'pages', label: 'Pages & Sections' },
  { id: 'components', label: 'Components' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'api', label: 'API Reference' },
  { id: 'integration', label: 'Integration' },
] as const

function Code({ children, className = '' }: { children: string; className?: string }) {
  return (
    <pre className={`my-3 overflow-x-auto rounded-lg bg-neutral-900 p-4 text-xs leading-relaxed text-neutral-200 ${className}`}>
      <code>{children}</code>
    </pre>
  )
}

function InlineCode({ children }: { children: string }) {
  return <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[11px] text-brand-primary">{children}</code>
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="my-3 overflow-x-auto rounded-panel border border-hairline">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-hairline-soft">
            {headers.map((h, i) => (
              <th key={i} className="px-3 py-2 text-left font-semibold text-brand-ink whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-t border-hairline">
              {row.map((c, ci) => (
                <td key={ci} className="px-3 py-2 text-neutral-700 whitespace-nowrap">{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="mb-3 mt-10 scroll-mt-20 border-b border-hairline pb-2 font-label text-base text-brand-ink first:mt-0">
      {children}
    </h2>
  )
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-2 mt-6 text-sm font-semibold text-brand-ink">{children}</h3>
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="my-2 text-sm leading-relaxed text-neutral-700">{children}</p>
}

function OverviewSection() {
  return (
    <>
      <SectionHeading id="overview">Overview</SectionHeading>
      <P>
        BEGIN the work CMS is a standalone content management system that serves content to multiple platforms. It is organized into <strong>Spaces</strong> — isolated content domains that scope pages, components, and features to a specific platform or function.
      </P>
      <P>
        The CMS uses Firebase Firestore as its data layer. Consumer applications (web, mobile, kiosk) read CMS data via a secondary Firebase app connection — Firestore handles cross-project reads natively, so no REST API is needed for content. The Alerts space additionally exposes a REST API via Firebase Cloud Functions for notification management.
      </P>
      <Table
        headers={['Layer', 'Technology']}
        rows={[
          ['Frontend', 'React 18 + TypeScript + Tailwind CSS'],
          ['Data', 'Firebase Firestore (space-scoped subcollections)'],
          ['Auth', 'Firebase Auth (Google Sign-In, domain allowlist)'],
          ['Assets', 'Firebase Storage'],
          ['API', 'Firebase Cloud Functions (Express.js)'],
          ['Hosting', 'Firebase Hosting'],
        ]}
      />
      <SubHeading>Security model</SubHeading>
      <Table
        headers={['Access', 'Rule']}
        rows={[
          ['Reads', 'Public — consumer apps need to display content'],
          ['Writes', 'Authenticated editors with @beginthework.com, plus an optional client domain'],
          ['Auth', 'Google Sign-In with email domain whitelist, enforced via Firestore security rules'],
        ]}
      />
    </>
  )
}

function SpacesSection() {
  return (
    <>
      <SectionHeading id="spaces">Spaces</SectionHeading>
      <P>
        Every piece of CMS content belongs to a <strong>Space</strong>. Spaces are the top-level organizational unit and determine both the Firestore data path and the CMS admin UI.
      </P>
      <Table
        headers={['Space ID', 'Label', 'Purpose', 'Content Types']}
        rows={[
          ['web', 'Web', 'Consumer website content', 'Pages, Components'],
          ['mobile-apps', 'Apps', 'iOS & Android app content', 'Pages, Components'],
          ['kiosk', 'Kiosk', 'In-store kiosk UI content', 'Pages, Components'],
          ['alerts', 'Alerts', 'Cross-platform notifications', 'Announcement Bars, Alert Modals'],
        ]}
      />
      <SubHeading>Firestore path structure</SubHeading>
      <P>
        All space data lives under <InlineCode>{'spaces/{spaceId}/'}</InlineCode> in Firestore. Each space has its own isolated subcollections.
      </P>
      <Code>{`spaces/
├── web/
│   ├── pages/{slug}          # Page documents
│   ├── pages/_order          # Page ordering
│   ├── pages/_sections       # Sidebar section groupings
│   └── components/{id}       # Reusable components
├── mobile-apps/
│   ├── pages/{slug}
│   └── components/{id}
├── kiosk/
│   ├── pages/{slug}
│   └── components/{id}
└── alerts/
    └── notifications/{id}    # Announcement bars + alert modals`}</Code>
      <SubHeading>Space context in the CMS</SubHeading>
      <P>
        The active space is read from the URL parameter (<InlineCode>{'/:space/*'}</InlineCode>) and provided via React Context. All hooks and components access it through <InlineCode>{'useSpace()'}</InlineCode>. Firestore paths are constructed with the <InlineCode>{'spaceCollection(space, subcollection)'}</InlineCode> and <InlineCode>{'spaceDoc(space, subcollection, docId)'}</InlineCode> helpers.
      </P>
    </>
  )
}

function DataModelSection() {
  return (
    <>
      <SectionHeading id="data-model">Data Model</SectionHeading>
      <P>
        This section describes the Firestore document schemas for each collection. All paths are relative to <InlineCode>{'spaces/{spaceId}/'}</InlineCode>.
      </P>

      <SubHeading>Design tokens</SubHeading>
      <P>
        Design tokens are now <strong>per-space</strong> (not global). Each space owns two token documents — a <InlineCode>draft</InlineCode> for work-in-progress edits and a <InlineCode>published</InlineCode> document that consuming sites actually read.
      </P>
      <Code>{`spaces/{space}/design-tokens/draft       # Work-in-progress — edited but not live
spaces/{space}/design-tokens/published   # Live tokens consumed by the site`}</Code>
      <P>
        Spaces with tokens include <InlineCode>web</InlineCode>, <InlineCode>mobile-apps</InlineCode>, <InlineCode>kiosk</InlineCode>, and <InlineCode>alerts</InlineCode>. The token UI lives at the per-space route <InlineCode>{'/{space}/design-system'}</InlineCode> (the Design System page).
      </P>

      <SubHeading>Draft → publish flow</SubHeading>
      <P>
        Editing or uploading tokens writes to the <InlineCode>draft</InlineCode> document. <strong>Publishing</strong> copies <InlineCode>draft</InlineCode> → <InlineCode>published</InlineCode>; the <InlineCode>published</InlineCode> document is the one consuming sites read. This keeps in-progress changes isolated until they are explicitly promoted.
      </P>
      <Code>{`edit / upload  →  draft        (not yet live)
publish        →  published    (copies draft → published; consumed by sites)`}</Code>

      <SubHeading>Authoring via brand JSON import</SubHeading>
      <P>
        Tokens can be authored by uploading a brand JSON that is normalized into a canonical <InlineCode>BrandTokens</InlineCode> shape. Two importer variants exist:
      </P>
      <Table
        headers={['Importer', 'Description']}
        rows={[
          ['web-v1', 'Rich, resolved theme with a semantic ref/value layer'],
          ['app-v1', 'Simple / adapted variant'],
        ]}
      />
      <P>
        The importer validates and previews the result before saving a <InlineCode>draft</InlineCode>.
      </P>

      <SubHeading>Canonical BrandTokens shape</SubHeading>
      <P>Path: <InlineCode>{'spaces/{space}/design-tokens/{draft|published}'}</InlineCode></P>
      <Code>{`interface BrandTokens {
  colors: {
    // Named brand colors plus numbered scales
    "brand-primary": "#F93A26",
    "brand-cloud": "#FFF8F0",
    "brand-ink": "#1A1A1A",
    "neutral-50": "...",   // numbered scales
    "neutral-900": "...",
    // ...
  }
  sizing: {
    spacing: Record<string, string>          // spacing scale
    borderRadius: Record<string, string>     // radii
    stroke: Record<string, string>           // border/stroke widths
    elevation: Record<string, string>        // drop-shadow definitions
    layoutHeights: Record<string, string>    // named layout heights
  }
  typography: {
    fontFamilies: Record<string, FontFamilyDef>
    typeScale: Record<string, string>        // responsive type scale
    iconSizes: Record<string, string>
  }
  updatedAt: number
  updatedBy: string
}

interface FontFamilyDef {
  stack: string                              // CSS font-family stack
  source: 'system' | 'google' | 'uploaded'
  faces?: FontFace[]                         // for uploaded fonts
}`}</Code>

      <SubHeading>Fonts</SubHeading>
      <P>
        Uploaded fonts are stored under Storage <InlineCode>{'cms/fonts/{space}/…'}</InlineCode> and injected as <InlineCode>@font-face</InlineCode> rules at runtime. <InlineCode>google</InlineCode> and <InlineCode>system</InlineCode> font families simply set <InlineCode>{'--font-*'}</InlineCode> CSS variables without any face injection.
      </P>

      <SubHeading>Consumption</SubHeading>
      <P>
        Published tokens are applied to consuming sites as CSS custom properties (<InlineCode>{'--...'}</InlineCode>) — colors, sizing, and typography all resolve to <InlineCode>{'--'}</InlineCode> variables the site reads at render time.
      </P>
      <P>
        <strong>Legacy:</strong> the old global <InlineCode>{'design-tokens/current'}</InlineCode> document is kept temporarily as a backward-compatible fallback and will be migrated away.
      </P>
    </>
  )
}

function PagesSection() {
  return (
    <>
      <SectionHeading id="pages">Pages &amp; Sections</SectionHeading>
      <P>
        Pages are the primary content unit for the Web, Apps, and Kiosk spaces. Each page is a Firestore document identified by its slug.
      </P>

      <SubHeading>Page document</SubHeading>
      <P>Path: <InlineCode>{'spaces/{spaceId}/pages/{slug}'}</InlineCode></P>
      <Code>{`interface CmsPage {
  slug: string
  parentSlug?: string           // For nested URLs (e.g. /parent/child)
  sections: CmsPageSection[]
  seo?: {
    title?: string
    description?: string
    canonical?: string
    noIndex?: boolean
  }
  openGraph?: {
    ogTitle?: string
    ogDescription?: string
    ogImage?: string
    ogType?: string
  }
  updatedAt?: number
  updatedBy?: string
}

interface CmsPageSection {
  id: string
  name: string                  // Display name in the editor
  items: CmsPageSectionItem[]
}

interface CmsPageSectionItem {
  id: string
  componentId: string           // Reference to components/{id}
  variable?: string             // Specific variant key, or all if omitted
}`}</Code>

      <SubHeading>Page ordering</SubHeading>
      <P>Path: <InlineCode>{'spaces/{spaceId}/pages/_order'}</InlineCode></P>
      <Code>{`{ slugs: ["home", "about", "catering", ...] }`}</Code>

      <SubHeading>Sidebar sections</SubHeading>
      <P>Path: <InlineCode>{'spaces/{spaceId}/pages/_sections'}</InlineCode></P>
      <P>Used by the CMS admin to organize pages into named groups in the sidebar. Not consumed by client apps.</P>
      <Code>{`{
  sections: [
    { id: "uuid", name: "Landing Pages", pages: ["home", "catering"] },
    { id: "uuid", name: "Legal", pages: ["privacy", "terms"] }
  ]
}`}</Code>

      <SubHeading>Content resolution flow</SubHeading>
      <P>
        Consumer apps resolve page content by fetching each section item's component and mapping variable fields to renderable data:
      </P>
      <Code>{`page.sections[]
  → for each item, fetch components/{item.componentId}
  → if item.variable is set, use only that variant
  → otherwise use all non-hidden variables
  → map variable fields (via defaultValue) to hero slides, category cards, or content blocks
  → render with the appropriate component`}</Code>

      <Table
        headers={['Component name starts with', 'Resolved as', 'Renderer']}
        rows={[
          ['hero (case-insensitive)', 'Hero slides', 'HeroCarousel'],
          ['content-block / content_block', 'Content blocks', 'ContentBlock'],
          ['Anything else', 'Category cards', 'MenuCategories'],
        ]}
      />
    </>
  )
}

function ComponentsSection() {
  return (
    <>
      <SectionHeading id="components">Components</SectionHeading>
      <P>
        Components are reusable content building blocks with a variable/variant system. Each component defines a schema (variables with typed fields); editors populate field values to create variants.
      </P>

      <SubHeading>Component document</SubHeading>
      <P>Path: <InlineCode>{'spaces/{spaceId}/components/{id}'}</InlineCode></P>
      <Code>{`interface CmsComponent {
  id: string
  name: string                    // Slug ID (e.g. "brand-primary-tear")
  displayName: string             // Human-readable name
  kind: string                    // Category label
  variables: CmsComponentVariable[]
  updatedAt?: number
  updatedBy?: string
}

interface CmsComponentVariable {
  id: string
  key: string                     // Normalized key
  label: string                   // Display label
  fields: CmsVariableField[]
  hidden?: boolean                // Archived — hidden from pages by default
}

interface CmsVariableField {
  id: string
  key: string
  label: string
  type: "text" | "longform" | "hexcode" | "image" | "video" | "url" | ""
  options?: string[]              // Predefined choices (e.g. color swatches)
  defaultValue?: string           // The actual content value
}`}</Code>

      <SubHeading>Field types</SubHeading>
      <Table
        headers={['Type', 'Editor', 'Value format']}
        rows={[
          ['text', 'Single-line input', 'Plain string'],
          ['longform', 'Multi-line textarea', 'Plain string (may contain line breaks)'],
          ['hexcode', 'Color picker + design system swatches', 'Hex color (e.g. #F93A26)'],
          ['image', 'URL input + upload', 'URL string'],
          ['video', 'URL input', 'URL string'],
          ['url', 'URL input', 'URL string'],
        ]}
      />

      <SubHeading>Variable field mapping</SubHeading>
      <P>
        When resolving components for rendering, the consumer app maps field keys to properties. This mapping is handled by <InlineCode>{'cms-adapter.ts'}</InlineCode> in the consumer app.
      </P>
      <Table
        headers={['Field key(s)', 'Maps to']}
        rows={[
          ['headline, title, main_headline', 'Headline text'],
          ['subheader', 'Subheader text'],
          ['body, description, text', 'Body copy'],
          ['button_text, cta_text', 'CTA button label'],
          ['button_url, button_link, cta_url', 'CTA link target'],
          ['image, photo (type: image)', 'Primary image { url, alt }'],
          ['background_color, bg_color', 'Section background color'],
          ['layout', '"image-left" or "image-right"'],
        ]}
      />
    </>
  )
}

function NotificationsSection() {
  return (
    <>
      <SectionHeading id="notifications">Notifications</SectionHeading>
      <P>
        The Alerts space manages two notification surfaces: <strong>Announcement Bars</strong> (sitewide banners) and <strong>Alert Modals</strong> (overlay dialogs). All notification documents live in a single collection.
      </P>

      <SubHeading>Collection</SubHeading>
      <P>Path: <InlineCode>{'spaces/alerts/notifications/{id}'}</InlineCode></P>

      <SubHeading>Notification document</SubHeading>
      <Code>{`interface CmsNotification {
  id: string
  type: "announcement_bar" | "alert"
  alert_type?: "announcement" | "image" | "illustration" | "new_location"
  title: string
  body?: string

  // Media (conditional by alert_type)
  image?: string                  // Image alerts: hero photo URL
  image_alt?: string              // Image alerts: accessibility text
  illustration?: string           // Illustration alerts: illustration URL
  illustration_alt?: string       // Illustration alerts: accessibility text
  icon?: string                   // Announcement/new_location: 40px icon URL

  // Interactive elements
  chips?: string[]                // Chip labels (announcement + new_location)
  primary_action_label?: string   // Primary CTA button text
  primary_action_url?: string     // Primary CTA destination
  secondary_action_label?: string // Secondary button text

  // Display behavior
  dismissable: boolean            // Default true
  trigger: "page_load" | "delay_5s" | "scroll_50" | "exit_intent"
  frequency: "once" | "once_per_session" | "always"
  priority: number                // Higher = higher priority
  target_pages?: string[]         // Restrict to specific page paths
  geo_target?: {                  // New location alerts only
    lat: number
    lng: number
    radius_miles: number
  }

  // Scheduling
  start_date?: string             // ISO datetime — activation
  end_date?: string               // ISO datetime — expiration
  status: "draft" | "published" | "archived"

  // Metadata
  created_at: number
  updated_at: number
  created_by?: string
  updated_by?: string
}`}</Code>

      <SubHeading>Notification types</SubHeading>
      <Table
        headers={['type', 'alert_type', 'Surface', 'Media', 'Use case']}
        rows={[
          ['announcement_bar', '—', 'Sticky banner above nav', 'None', 'Promos, operational notices, campaigns'],
          ['alert', 'announcement', 'Centered modal', '40px icon (optional)', 'General promos, reward prompts'],
          ['alert', 'image', 'Modal with hero photo', '297px tall image', 'Seasonal menus, food photography campaigns'],
          ['alert', 'illustration', 'Modal with illustration', '180px illustration', 'Brand moments, app features, engagement'],
          ['alert', 'new_location', 'Centered modal + map pin', '40px map pin icon', 'Store opening announcements'],
        ]}
      />

      <SubHeading>Display rules</SubHeading>
      <ul className="my-2 space-y-1 text-sm text-neutral-700">
        <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary/40" />Only one announcement bar renders at a time (highest priority wins)</li>
        <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary/40" />Only one alert modal renders at a time (highest priority wins)</li>
        <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary/40" />A bar and a modal can display simultaneously (independent surfaces)</li>
        <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary/40" />Page targeting narrows scope — alerts targeted to /menu won't conflict with /locations</li>
        <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary/40" />Frequency tracking uses localStorage (once) or sessionStorage (once_per_session)</li>
      </ul>
    </>
  )
}

function ApiSection() {
  return (
    <>
      <SectionHeading id="api">API Reference</SectionHeading>
      <P>
        The Alerts space exposes a REST API via Firebase Cloud Functions. All endpoints are prefixed with <InlineCode>{'/api/notifications'}</InlineCode>.
      </P>

      <SubHeading>Endpoints</SubHeading>
      <Table
        headers={['Method', 'Path', 'Description']}
        rows={[
          ['GET', '/api/notifications', 'List notifications (filterable)'],
          ['GET', '/api/notifications/:id', 'Get a single notification'],
          ['POST', '/api/notifications', 'Create a notification'],
          ['PUT', '/api/notifications/:id', 'Update a notification'],
          ['DELETE', '/api/notifications/:id', 'Delete a notification'],
          ['POST', '/api/notifications/:id/publish', 'Set status to published'],
        ]}
      />

      <SubHeading>Query parameters (GET /)</SubHeading>
      <Table
        headers={['Parameter', 'Type', 'Description']}
        rows={[
          ['type', 'string', '"announcement_bar" or "alert"'],
          ['alert_type', 'string', '"announcement", "image", "illustration", or "new_location"'],
          ['status', 'string', '"draft", "published", or "archived"'],
        ]}
      />

      <SubHeading>Example: List published alerts</SubHeading>
      <Code>{`GET /api/notifications?type=alert&status=published

Response:
{
  "success": true,
  "data": [ ...CmsNotification[] ],
  "count": 3
}`}</Code>

      <SubHeading>Example: Create an announcement bar</SubHeading>
      <Code>{`POST /api/notifications
Content-Type: application/json

{
  "type": "announcement_bar",
  "title": "Free delivery on orders over $25!",
  "body": "Limited time offer. Order now.",
  "status": "draft",
  "priority": 10,
  "target_pages": ["/", "/menu"],
  "end_date": "2026-06-01T00:00:00Z"
}`}</Code>

      <SubHeading>Content data (pages, components)</SubHeading>
      <P>
        Pages and components do <em>not</em> use a REST API. Consumer apps read them directly from Firestore via the Firebase SDK. See the <a href="#integration" className="text-brand-primary hover:underline">Integration</a> section for setup.
      </P>
    </>
  )
}

function IntegrationSection() {
  return (
    <>
      <SectionHeading id="integration">Integration</SectionHeading>
      <P>
        Consumer apps read CMS data by initializing a <strong>secondary Firebase app</strong> that points to the CMS Firebase project. Firestore handles cross-project reads natively — no API layer needed.
      </P>

      <SubHeading>Setup in the consumer app</SubHeading>
      <P>Add a secondary Firebase app in the consumer's <InlineCode>{'firebase.ts'}</InlineCode>:</P>
      <Code>{`import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

// Consumer app's own Firebase
const app = initializeApp({ /* consumer config */ })

// CMS Firebase (secondary app for reading CMS data)
const cmsApp = initializeApp({ /* CMS config */ }, 'cms')
export const cmsDb = getFirestore(cmsApp)`}</Code>

      <SubHeading>Reading space-scoped data</SubHeading>
      <P>All CMS data lives under <InlineCode>{'spaces/{spaceId}/'}</InlineCode>. Use the space ID that matches your platform:</P>
      <Code>{`import { collection, doc, getDoc, getDocs } from 'firebase/firestore'
import { cmsDb } from './firebase'

// Fetch a page for the web space
const pageRef = doc(cmsDb, 'spaces', 'web', 'pages', 'home')
const pageSnap = await getDoc(pageRef)

// Fetch all components for the web space
const componentsRef = collection(cmsDb, 'spaces', 'web', 'components')
const componentsSnap = await getDocs(componentsRef)

// Fetch published notifications
const notificationsRef = collection(cmsDb, 'spaces', 'alerts', 'notifications')
const q = query(notificationsRef, where('status', '==', 'published'))
const notificationsSnap = await getDocs(q)`}</Code>

      <SubHeading>Platform mapping</SubHeading>
      <Table
        headers={['Consumer app', 'Space ID', 'What to read']}
        rows={[
          ['Consumer website', 'web', 'pages, components, notifications'],
          ['iOS / Android app', 'mobile-apps', 'pages, components, notifications'],
          ['In-store kiosk', 'kiosk', 'pages, components, notifications'],
        ]}
      />
      <P>
        Notifications from the <InlineCode>alerts</InlineCode> space are shared across all platforms. Each consumer app should fetch published notifications and filter by <InlineCode>target_pages</InlineCode> and <InlineCode>geo_target</InlineCode> at render time.
      </P>
    </>
  )
}

export function CmsDevDocs() {
  const [activeSection, setActiveSection] = useState<string>(SECTIONS[0].id)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = contentRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
            break
          }
        }
      },
      { root: container, rootMargin: '-20% 0px -60% 0px', threshold: 0 },
    )

    for (const section of SECTIONS) {
      const el = container.querySelector(`#${section.id}`)
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [])

  const scrollTo = (id: string) => {
    const el = contentRef.current?.querySelector(`#${id}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="flex h-[calc(100vh-57px)] font-body">
      {/* Docs sidebar nav */}
      <nav className="hidden w-48 shrink-0 border-r border-hairline bg-surface p-4 lg:block">
        <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-text-subtle">
          Documentation
        </h2>
        <ul className="space-y-0.5">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => scrollTo(s.id)}
                className={`w-full rounded-control px-2.5 py-1.5 text-left text-xs font-medium transition-colors duration-state ${
                  activeSection === s.id
                    ? 'bg-brand-rest text-brand-ink-on-tint'
                    : 'text-text-muted hover:bg-hairline-soft hover:text-brand-ink'
                }`}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Content */}
      <div ref={contentRef} className="flex-1 overflow-y-auto bg-surface">
        <div className="mx-auto max-w-3xl px-6 py-8 pb-32">
          <h1 className="font-label text-xl text-brand-ink">Developer Documentation</h1>
          <p className="mt-1 mb-6 text-sm text-text-muted">
            Technical reference for the CMS data model, Spaces architecture, and platform integration.
          </p>

          <OverviewSection />
          <SpacesSection />
          <DataModelSection />
          <PagesSection />
          <ComponentsSection />
          <NotificationsSection />
          <ApiSection />
          <IntegrationSection />
        </div>
      </div>
    </div>
  )
}
