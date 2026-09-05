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
        This CMS is a standalone content management system that serves content to connected platforms. It is organized into <strong>Spaces</strong> — isolated content domains that scope pages, components, and features to a specific platform or function.
      </P>
      <P>
        The CMS uses Firebase Firestore as its data layer. Consumer applications can read content from Firestore via a secondary Firebase app, or over REST for pages, published tokens, and notifications.
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
      <P>
        The switcher always shows <strong>Web</strong> and <strong>Alerts</strong>. Extra spaces (Apps, Kiosk) stay hidden until a <InlineCode>@beginthework.com</InlineCode> admin publishes them. That admin sees a <strong>+</strong> to open an unpublished space and work on it first.
      </P>
      <Table
        headers={['Space ID', 'Label', 'Visibility', 'Content Types']}
        rows={[
          ['web', 'Web', 'Always on', 'Pages, Components'],
          ['alerts', 'Alerts', 'Always on', 'Announcement Bars, Alert Modals'],
          ['mobile-apps', 'Apps', 'Optional — hidden until published', 'Pages, Components'],
          ['kiosk', 'Kiosk', 'Optional — hidden until published', 'Pages, Components'],
        ]}
      />
      <SubHeading>Firestore path structure</SubHeading>
      <P>
        All space data lives under <InlineCode>{'spaces/{spaceId}/'}</InlineCode> in Firestore. Each space has its own isolated subcollections. <strong>Web</strong> and <strong>Alerts</strong> are always present. Additional spaces are optional — a <InlineCode>@beginthework.com</InlineCode> admin adds them with <strong>+</strong> and they only appear in the switcher after publish.
      </P>
      <Code>{`spaces/
├── web/                              # always on
│   ├── pages/{slug}                  # Page documents
│   ├── pages/_order                  # Page ordering
│   ├── pages/_sections               # Sidebar section groupings
│   ├── components/{id}               # Reusable components
│   └── components/_order             # Sidebar component order
├── alerts/                           # always on
│   └── notifications/{id}            # Announcement bars + alert modals
│
└── + additional space (optional)
    ├── mobile-apps/                  # same shape as web
    │   ├── pages/{slug}
    │   ├── pages/_order
    │   ├── pages/_sections
    │   ├── components/{id}
    │   └── components/_order
    └── kiosk/                        # same shape as web
        ├── pages/{slug}
        ├── pages/_order
        ├── pages/_sections
        ├── components/{id}
        └── components/_order`}</Code>
      <SubHeading>Space context in the CMS</SubHeading>
      <P>
        The active space is read from the URL parameter (<InlineCode>{'/:space/*'}</InlineCode>) and provided via React Context. All hooks and components access it through <InlineCode>{'useSpace()'}</InlineCode>. Firestore paths are constructed with the <InlineCode>{'spaceCollection(space, subcollection)'}</InlineCode> and <InlineCode>{'spaceDoc(space, subcollection, docId)'}</InlineCode> helpers. Published extras are stored on <InlineCode>settings/project.publishedSpaces</InlineCode>.
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
        Tokens are per space. Web and Alerts are always available; Apps and Kiosk get a token set once an admin opens them. The token UI lives at <InlineCode>{'/{space}/design-system'}</InlineCode>.
      </P>

      <SubHeading>Draft → publish flow</SubHeading>
      <P>
        Editing or uploading tokens writes to the <InlineCode>draft</InlineCode> document. <strong>Publishing</strong> copies <InlineCode>draft</InlineCode> → <InlineCode>published</InlineCode>; the <InlineCode>published</InlineCode> document is the one consuming sites read. This keeps in-progress changes isolated until they are explicitly promoted.
      </P>
      <Code>{`edit / upload  →  draft        (not yet live)
publish        →  published    (copies draft → published; consumed by sites)`}</Code>
      <P>
        Publish also stores ADA-safe semantic pairs. <InlineCode>surface-action-primary</InlineCode> is the fill
        (linked to <InlineCode>primary.500</InlineCode> when they match).
        <InlineCode>text-on-action</InlineCode> and <InlineCode>icon-on-action</InlineCode> are the
        foreground on that fill — title ink when it clears 4.5:1, otherwise black or white.
        Page-readable tokens (<InlineCode>text-action</InlineCode>, <InlineCode>text-error</InlineCode>,
        <InlineCode>text-warning</InlineCode>, <InlineCode>text-success</InlineCode>, <InlineCode>text-information</InlineCode>)
        move to a darker scale step if they are under 4.5:1 on the page or their tint.
        The website uses <InlineCode>{'var(--color-semantic-text-on-action)'}</InlineCode> and the text tokens; it should not hardcode the ink.
      </P>

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
  version: 1
  colors: {
    scales: Record<string, Record<string, string>>   // e.g. primary.500
    semantic: Record<string, { type: "ref"; ref: string } | { type: "value"; value: string }>
    semanticResolved: Record<string, string>         // concrete hex/rgb values
  }
  sizing: {
    layout?: Record<string, string>
    spacing?: Record<string, string>
    borderRadius?: Record<string, string>
    stroke?: Record<string, string>
    elevation?: Record<string, string>
  }
  typography: {
    fontFamilies: Record<string, FontFamilyDef>
    scale: Record<string, TypeStyle>
    icons: Record<string, { fontSize: string }>
  }
  meta: {
    space: string
    sourceFormat: "web-v1" | "app-v1"
    updatedAt: number
    updatedBy: string
  }
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

      <SubHeading>Consumption — CMS change updates the site</SubHeading>
      <P>
        The website must not hardcode colors, spacing, or type. It loads <strong>published</strong> tokens at runtime and applies them as CSS custom properties on <InlineCode>{':root'}</InlineCode>. Editing in the CMS writes a draft; <strong>Publish</strong> copies draft → published; the next site fetch picks up the change. No site rebuild is required.
      </P>
      <Table
        headers={['Token', 'CSS variable', 'Use on the site']}
        rows={[
          ['Color scale', '--color-primary-500', 'var(--color-primary-500)'],
          ['Semantic color', '--color-semantic-surface-page', 'var(--color-semantic-surface-page)'],
          ['Action fill', '--color-semantic-surface-action-primary', 'var(--color-semantic-surface-action-primary)'],
          ['Ink on action', '--color-semantic-text-on-action', 'var(--color-semantic-text-on-action)'],
          ['Spacing', '--space-16', 'padding: var(--space-16)'],
          ['Radius', '--radius-lg', 'border-radius: var(--radius-lg)'],
          ['Stroke', '--stroke-button', 'border-width: var(--stroke-button)'],
          ['Layout', '--layout-grid-columns', 'var(--layout-grid-columns)'],
          ['Font family', '--font-family-heading', 'font-family: var(--font-family-heading)'],
          ['Type style', '--type-headline1', 'font: var(--type-headline1)'],
          ['Type size', '--type-headline1-size', 'font-size: var(--type-headline1-size)'],
          ['Icon size', '--icon-24', 'width: var(--icon-24)'],
        ]}
      />
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
        Pages are the primary content unit for Web and any published extra spaces. Each page is a Firestore document identified by its slug.
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
    keywords?: string[]
    canonical?: string
    noIndex?: boolean
    image?: string              // Falls back to first hero image
  }
  openGraph?: {
    ogTitle?: string
    ogDescription?: string
    ogImage?: string            // Copied from seo.image, else first hero image
    ogType?: string
  }
  aeo?: {
    speakable?: string
    faqs?: { id: string; question: string; answer: string }[]
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

      <SubHeading>Search and discovery</SubHeading>
      <P>
        Every page carries <InlineCode>seo</InlineCode>, <InlineCode>openGraph</InlineCode> (copied from SEO on save), and <InlineCode>aeo</InlineCode>. The website should emit meta tags, Open Graph tags, and JSON-LD (FAQPage from <InlineCode>aeo.faqs</InlineCode>). If <InlineCode>seo.image</InlineCode> is empty, use the first hero component image. Organization facts, locality, and crawler rules (<InlineCode>robots.txt</InlineCode>, <InlineCode>llms.txt</InlineCode>) are site-wide — not per page.
      </P>
      <P>
        <strong>Save</strong> writes the editor draft at <InlineCode>{'spaces/{space}/pages/{slug}'}</InlineCode>. Header <strong>Publish</strong> copies that draft to <InlineCode>{'spaces/{space}/published-pages'}</InlineCode> and appends <InlineCode>{'spaces/{space}/publish-log/{id}'}</InlineCode>. <InlineCode>GET /api/pages</InlineCode>, <InlineCode>/sitemap.xml</InlineCode>, and <InlineCode>/llms.txt</InlineCode> read the published snapshot (editor pages only until the first publish).
      </P>

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
  color?: string                  // text / longform: var(--color-semantic-text-title) or hex
}`}</Code>

      <SubHeading>Field types</SubHeading>
      <Table
        headers={['Type', 'Editor', 'Value format']}
        rows={[
          ['text', 'Single-line input + text color (title, body, on-action, …)', 'Plain string; optional color var'],
          ['longform', 'Multi-line textarea + text color', 'Plain string (may contain line breaks); optional color var'],
          ['hexcode', 'Design system roles (primary, secondary, tertiary, …) + custom', 'var(--color-primary-500) or hex'],
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
          ['tagline, eyebrow, kicker', 'Small all-caps line above the headline'],
          ['subheader', 'Subheader text'],
          ['body, description, text, detail_copy', 'Body / detail copy'],
          ['button_text, cta_text', 'CTA button label'],
          ['button_url, button_link, cta_url', 'CTA link target'],
          ['image, photo (type: image)', 'Primary image { url, alt }'],
          ['background_color, bg_color', 'Section background; transparent for none'],
          ['layout', 'image-left, image-right, full-image, or image-above'],
          ['container_padding, container_radius', 'Outside inset and container corners'],
          ['image_radius, cta_radius', 'Image and CTA panel corners'],
          ['color on text / longform', 'headline_color, body_color, h2_color, button_text_color'],
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
        Cloud Functions expose a REST API for notifications, published design tokens, pages, brand (name, logos), sitemap, and llms.txt. Draft tokens stay in Firestore and are not served here.
      </P>

      <SubHeading>Notifications</SubHeading>
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

      <SubHeading>Brand</SubHeading>
      <P>
        Public brand record from Client Setup. Use <InlineCode>darkLogoUrl</InlineCode> on light backgrounds and <InlineCode>lightLogoUrl</InlineCode> on dark backgrounds. <InlineCode>logoUrl</InlineCode> is the default mark (same as dark when both exist). Missing URLs are <InlineCode>null</InlineCode>. Editor-only fields (domains, published spaces) are not included.
      </P>
      <Table
        headers={['Method', 'Path', 'Description']}
        rows={[
          ['GET', '/api/brand', 'Brand name, logos, favicon, and site URL'],
        ]}
      />

      <SubHeading>Example: Brand</SubHeading>
      <Code>{`GET https://curbside-cms.web.app/api/brand

{
  "success": true,
  "data": {
    "brandName": "Curbside",
    "logoUrl": "https://…",
    "darkLogoUrl": "https://…",
    "lightLogoUrl": "https://…",
    "faviconUrl": "https://…",
    "siteUrl": "https://www.curbside.org"
  }
}`}</Code>

      <SubHeading>Design tokens</SubHeading>
      <P>
        Returns the published <InlineCode>BrandTokens</InlineCode> document for a space. Drafts are never served. <InlineCode>space</InlineCode> is one of <InlineCode>web</InlineCode>, <InlineCode>alerts</InlineCode>, <InlineCode>mobile-apps</InlineCode>, or <InlineCode>kiosk</InlineCode>.
      </P>
      <Table
        headers={['Method', 'Path', 'Description']}
        rows={[
          ['GET', '/api/tokens/:space', 'Published brand tokens (JSON)'],
          ['GET', '/api/tokens/:space?format=css', 'Every token flattened to CSS custom properties'],
          ['GET', '/api/tokens/:space?format=stylesheet', 'Same map as text/css :root { … }'],
        ]}
      />

      <SubHeading>Example: Published web tokens</SubHeading>
      <Code>{`GET /api/tokens/web

Response:
{
  "success": true,
  "space": "web",
  "data": { ...BrandTokens }
}`}</Code>

      <SubHeading>Example: CSS variables</SubHeading>
      <Code>{`GET /api/tokens/web?format=css

Response:
{
  "success": true,
  "space": "web",
  "data": {
    "--color-primary-500": "#9747FF",
    "--color-semantic-surface-page": "#FFFFFF",
    "--space-16": "16px",
    "--radius-lg": "8px",
    "--font-family-heading": "'Inter', sans-serif",
    "--type-headline1": "700 40px/48px var(--font-family-heading)",
    "--type-headline1-size": "40px",
    "--icon-24": "24px"
  }
}`}</Code>

      <SubHeading>Pages</SubHeading>
      <P>
        Returns published page documents for a space (header Publish). Until the first publish, it falls back to editor pages. <InlineCode>_order</InlineCode> and <InlineCode>_sections</InlineCode> are included on the list endpoint and are not valid slugs.
      </P>
      <Table
        headers={['Method', 'Path', 'Description']}
        rows={[
          ['GET', '/api/pages/:space', 'List published pages, nav order, and sidebar sections'],
          ['GET', '/api/pages/:space/:slug', 'Get one published page (sections, SEO, Open Graph, AEO)'],
          ['GET', '/sitemap.xml', 'Published web URLs (skips noIndex, _order, _sections)'],
          ['GET', '/llms.txt', 'Published home speakable summary and FAQs'],
        ]}
      />

      <SubHeading>Example: List web pages</SubHeading>
      <Code>{`GET /api/pages/web

Response:
{
  "success": true,
  "space": "web",
  "count": 11,
  "data": {
    "pages": [ ...CmsPage[] ],
    "order": ["home", "about-us", "get-involved", "our-programs", "contact-us", "donate-now"],
    "sections": [ { "id": "…", "name": "Site", "pages": ["home", "about-us"] } ]
  }
}`}</Code>

      <SubHeading>Example: Home page</SubHeading>
      <Code>{`GET /api/pages/web/home

Response:
{
  "success": true,
  "space": "web",
  "slug": "home",
  "data": { "id": "home", "slug": "home", "sections": [], "seo": { … } }
}`}</Code>

      <SubHeading>Components</SubHeading>
      <P>
        Components do <em>not</em> use a REST API yet. Consumer apps can read them from Firestore via the Firebase SDK. See the <a href="#integration" className="text-brand-primary hover:underline">Integration</a> section for setup.
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
const notificationsSnap = await getDocs(q)

// Fetch published brand tokens for the website
const tokensRef = doc(cmsDb, 'spaces', 'web', 'design-tokens', 'published')
const tokensSnap = await getDoc(tokensRef)

// Or pull brand name + light/dark logos over REST
// GET /api/brand  →  data.darkLogoUrl | data.lightLogoUrl`}</Code>

      <SubHeading>Platform mapping</SubHeading>
      <Table
        headers={['Consumer app', 'Space ID', 'What to read']}
        rows={[
          ['Consumer website', 'web', 'pages, components, design-tokens, notifications, /api/brand'],
          ['iOS / Android app (optional)', 'mobile-apps', 'pages, components, design-tokens, notifications'],
          ['In-store kiosk (optional)', 'kiosk', 'pages, components, design-tokens, notifications'],
        ]}
      />
      <P>
        Notifications from the <InlineCode>alerts</InlineCode> space are shared across all platforms. Each consumer app should fetch published notifications and filter by <InlineCode>target_pages</InlineCode> and <InlineCode>geo_target</InlineCode> at render time.
      </P>

      <SubHeading>Apply tokens on the website</SubHeading>
      <P>
        Fetch published tokens when the site boots (and optionally on a timer or Firestore snapshot of <InlineCode>{'spaces/web/design-tokens/published'}</InlineCode>). Write every property onto <InlineCode>{':root'}</InlineCode>. Style only with <InlineCode>{'var(--…)'}</InlineCode>. After you Publish in the CMS, reload the site — or listen live — and the new values apply.
      </P>
      <Code>{`const CMS_API = 'https://<cms-host>' // hosting rewrite: /api/** → api function

async function applyPublishedTokens() {
  const res = await fetch(\`\${CMS_API}/api/tokens/web?format=css\`, { cache: 'no-store' })
  const json = await res.json()
  if (!json.success) throw new Error(json.error)
  const root = document.documentElement
  for (const [name, value] of Object.entries(json.data)) {
    root.style.setProperty(name, String(value))
  }
}

applyPublishedTokens()

// Then in site CSS / Tailwind:
//   background: var(--color-semantic-surface-action-primary);
//   color: var(--color-semantic-text-on-action);
//   padding: var(--space-16);
//   font: var(--type-headline1);
`}</Code>
      <P>
        Or load the stylesheet form (still published-only, no-store):
      </P>
      <Code>{`<link rel="stylesheet" href="https://<cms-host>/api/tokens/web?format=stylesheet" />`}</Code>

      <SubHeading>Logos on the website</SubHeading>
      <P>
        Fetch <InlineCode>/api/brand</InlineCode> once at boot. Use the dark mark on light chrome and the light mark on dark chrome.
      </P>
      <Code>{`const res = await fetch(\`\${CMS_API}/api/brand\`, { cache: 'no-store' })
const { data } = await res.json()

<img src={data.darkLogoUrl} alt={data.brandName} />   // light backgrounds
<img src={data.lightLogoUrl} alt={data.brandName} />  // dark backgrounds`}</Code>
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
