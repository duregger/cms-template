# CMS Firestore Data Model

This document describes the Firestore collections and data structures used by BEGIN the work CMS.

---

## Collection: `pages`

**Path:** `pages/{slug}`  
**Document ID:** slug (e.g. `"home"`, `"catering"`)

```typescript
interface CmsPage {
  slug: string
  sections: CmsPageSection[]
  /** @deprecated legacy — auto-migrated to sections on load */
  hero?: CmsHeroSlide[]
  /** @deprecated legacy — auto-migrated to sections on load */
  categories?: CmsCategoryCard[]
  updatedAt?: number
  updatedBy?: string
}

interface CmsPageSection {
  id: string
  name: string
  items: CmsPageSectionItem[]
}

interface CmsPageSectionItem {
  id: string
  componentId: string
  /** specific variant key, or all if omitted */
  variable?: string
}
```

---

## Collection: `components`

**Path:** `components/{id}`  
**Document ID:** UUID

```typescript
interface CmsComponent {
  id: string
  /** slug ID (e.g. "rio-red-tear") */
  name: string
  /** human-readable */
  displayName: string
  /** currently unused */
  kind: string
  variables: CmsComponentVariable[]
  updatedAt?: number
  updatedBy?: string
}

interface CmsComponentVariable {
  id: string
  key: string
  label: string
  fields: CmsVariableField[]
  hidden?: boolean
}

interface CmsVariableField {
  id: string
  key: string
  label: string
  type: 'text' | 'longform' | 'hexcode' | 'image' | 'video' | 'url' | ''
  options?: string[]
  defaultValue?: string
}
```

---

## Collection: `design-tokens`

**Path:** `design-tokens/current`  
**Document ID:** `"current"` (single document)

```typescript
interface DesignTokens {
  colors: {
    'rio-red': string
    'rio-red-muted': string
    'rio-red-badge': string
    'rio-lite-crema': string
    'rio-crema': string
    'rio-black-bean': string
    'rio-queso': string
    'rio-guac': string
    'rio-gray': string
  }
  typography: {
    headlineSize: string
    subheaderSize: string
    bodySize: string
    buttonSize: string
  }
  buttons: {
    borderRadius: string
    primaryBg: string
    primaryText: string
    secondaryBg: string
    secondaryText: string
  }
  updatedAt: number
  updatedBy: string
}
```

---

## How Data Flows

### Page Rendering

1. `useCmsPage(slug)` fetches the page document from Firestore.
2. If legacy `hero` or `categories` arrays exist, they are auto-migrated to the `sections` format.
3. `Page.tsx` iterates sections → looks up each `componentId` → fetches the component from `CmsComponentsContext`.
4. For hero-type components (`name` starts with `"hero"`): resolves variables via `cms-adapter.ts` → renders `HeroCarousel`.
5. For other components: resolves to category cards → renders `MenuCategories`.

### Component → Content Block Resolution

The `cms-adapter.ts` `resolveContentBlock()` function:

1. Takes a component's variables (each variable = one content block).
2. Maps field keys to content block properties:
   - `headline` / `title` → headline text
   - `body` / `description` / `text` → body copy
   - `button_text` / `cta_text` → CTA button label
   - `button_url` / `button_link` / `cta_url` → CTA link target
   - `image` (type `image`) → block image
   - `background_color` / `bg_color` → section background (token name or hex)
   - `headline_color`, `body_color` → text colors
   - `button_bg_color` / `button_color`, `button_text_color` → button colors
   - `layout` → `image-left` or `image-right`
   - `image_style` → `full-bleed` or `framed`
   - `accent_color` → accent for framed images
   - `decoration` → decorative SVG overlay (`citrus-pig`, `food-icons`, `none`)
3. Returns `CmsContentBlock[]` rendered by `ContentBlock` component.

**Detection:** Components whose `name` or `displayName` starts with `content-block` or `content_block` are rendered as content blocks by `Page.tsx`.

### Component → Hero Resolution

The `cms-adapter.ts` `resolveHeroSlide()` function:

1. Takes a component variable's fields.
2. Maps field keys to hero slide properties via `FIELD_KEY_MAP`.
3. Determines hero variant from `VARIANT_TO_HERO` (e.g. `"rio-red-tear-right"` → `Hero_Rio-Red` with `image-left` layout).
4. Returns a `CmsHeroSlide` object with `component`, `layout`, `text_alignment`, `images`, etc.

### Design Tokens

1. `useDesignTokens()` fetches `design-tokens/current` on app load.
2. Applies values as CSS custom properties on `document.documentElement`.
3. Tailwind config references these via `var(--rio-red, #F93A26)` with hardcoded fallbacks.
4. CMS Design System editor at `/{space}/design-system` writes changes back to Firestore.

## Collection: `settings/project`

**Path:** `settings/project`  
**Access:** Editors only (not public)

Client setup record written by `/system/setup`: brand name, logo/favicon URLs, client login domain, `setupComplete`. Firebase project keys are env-only, not stored here.
