# CMS API Output

The CMS uses **Firebase Firestore**. Data is fetched via `getDoc` / `getDocs`; there is no REST API layer. This document describes the document shapes as returned to the app.

---

## Collections

| Collection   | Document ID      | Purpose                          |
|-------------|------------------|----------------------------------|
| `pages`     | `{slug}`         | Page content (e.g. `home`)       |
| `pages`     | `_order`         | Page ordering (`slugs` array)     |
| `components`| `{uuid}`         | Reusable component definitions   |

---

## Page Document

**Path:** `pages/{slug}` (e.g. `pages/home`)

### Current format (sections)

Pages use a `sections` array. Each section contains items that reference components and optionally a specific variable (variant).

```json
{
  "slug": "home",
  "sections": [
    {
      "id": "string",
      "name": "string",
      "items": [
        {
          "id": "string",
          "componentId": "string",
          "variable": "string?"
        }
      ]
    }
  ],
  "updatedAt": "number?",
  "updatedBy": "string?"
}
```

### Legacy format

Older pages may still have flat `hero` and `categories` arrays. The client auto-migrates these to sections on load, but does not write back in the old format.

```json
{
  "hero": [
    {
      "id": "string",
      "component": "string",
      "componentId": "string?",
      "variable": "string?",
      "headline": "string?",
      "subheader": "string?",
      "h2": "string?",
      "image": { "url": "string", "alt": "string" },
      "centered_image": { "url": "string", "alt": "string" },
      "background_color": "string?",
      "paper_tear": { "url": "string" },
      "button_text": "string?",
      "button_url": "string?",
      "layout": "string?",
      "text_alignment": "string?",
      "button_color": "string?",
      "headline_color": "string?",
      "subheader_color": "string?",
      "h2_color": "string?"
    }
  ],
  "categories": [
    {
      "id": "string",
      "title": "string",
      "image": { "url": "string", "alt": "string" },
      "url": "string"
    }
  ]
}
```

---

## Section → Component resolution

Each section item references a `componentId`. The app fetches the component from the `components` collection and resolves its variables (variants) into hero slides or category cards.

- If `item.variable` is set, only that variable is rendered
- If `item.variable` is empty, all non-hidden variables are rendered

---

## Hero slider → metadata mapping

The hero slider resolves styling from `variable` (and fallback `component`). Variable keys are normalized (lowercase, spaces/underscores → hyphens) before lookup.

| Variable key (API)        | Component                | Layout       | Default alignment |
|---------------------------|--------------------------|--------------|-------------------|
| `rio-red-tear-right`      | Hero_Rio-Red             | image-left   | —                 |
| `rio-red-tear-left`       | Hero_Rio-Red             | image-right  | —                 |
| `black-bean-tear-right`   | Hero_Black-Bean          | image-left   | —                 |
| `black-bean-tear-left`    | Hero_Black-Bean          | image-right  | —                 |
| `crema-tear-right`        | Hero_Crema               | image-left   | —                 |
| `crema-tear-left`         | Hero_Crema               | image-right  | —                 |
| `hero-content`            | Hero_Rio-Red             | image-right  | —                 |
| `white-full`              | Hero_White_Full          | —            | center            |
| `rio-red-full`            | Hero_Rio-Red_Full        | —            | left              |
| `black-bean-full`         | Hero_White_Full          | —            | center            |
| `image-centered`          | Hero_Image_Centered      | —            | center            |
| `image-full`              | Hero_Image_Full          | —            | —                 |
| `image-centered-full`     | Hero_Image_Centered_Full | —            | center            |

If `variable` has no match, `component` is used (with alias normalization, e.g. `"Hero Rio Red"` → `Hero_Rio-Red`). Default: `Hero_Rio-Red`, `image-right`.

---

### Hero slide fields

These fields can come from the component variable's field `defaultValue` entries, or from legacy page-level hero data.

| Field             | Type     | Description                                              |
|-------------------|----------|----------------------------------------------------------|
| `id`              | string   | Unique slide ID                                          |
| `component`       | string   | Component name (e.g. `Hero_Rio-Red`)                     |
| `componentId`     | string?  | Reference to `components` collection                     |
| `variable`        | string?  | Variant key (e.g. `rio-red-tear-right`)                 |
| `variableOrder`   | string[]?| Order of variable options                                |
| `hiddenVariables` | string[]?| Hidden variable keys                                     |
| `headline`        | string?  | Main headline                                            |
| `subheader`       | string?  | Subheader text                                           |
| `h2`              | string?  | Secondary heading                                        |
| `image`           | object?  | `{ url, alt }` — background/main image                   |
| `centered_image`  | object?  | `{ url, alt }` — badge/logo centered on image variants   |
| `background_color`| string?  | Hex color (e.g. `#F93A26`)                               |
| `paper_tear`      | object?  | `{ url }` — tear overlay image                          |
| `button_text`     | string?  | CTA button label                                         |
| `button_url`      | string?  | CTA URL                                                  |
| `layout`          | string?  | `image-right` \| `image-left`                            |
| `text_alignment`  | string?  | Accepts `left`, `center`, `right`, or labels like `Left Align` |
| `button_color`    | string?  | Hex for button background                                |
| `headline_color`  | string?  | Hex for headline text                                    |
| `subheader_color` | string?  | Hex for subheader text                                   |
| `h2_color`        | string?  | Hex for h2 text                                          |

#### `text_alignment` normalization

The value is normalized before use: lowercased and matched by prefix. All of these resolve correctly:

- `"left"`, `"Left"`, `"Left Align"`, `"left-align"` → **left**
- `"right"`, `"Right"`, `"Right Align"` → **right**
- `"center"`, `"Center"`, `"Center Align"`, or empty → **center**

---

### Category card fields

| Field   | Type   | Description        |
|---------|--------|--------------------|
| `id`    | string | Unique card ID     |
| `title` | string | Display title      |
| `image` | object?| `{ url, alt }`     |
| `url`   | string | Link target        |

---

## Page order document

**Path:** `pages/_order`

```json
{
  "slugs": ["home", "about", "catering"]
}
```

---

## Component document

**Path:** `components/{id}`

```json
{
  "name": "string",
  "displayName": "string",
  "kind": "string",
  "variables": [
    {
      "id": "string",
      "key": "string",
      "label": "string",
      "fields": [
        {
          "id": "string",
          "key": "string",
          "label": "string",
          "type": "text | longform | hexcode | image | video | url | ''",
          "options": ["string"]?,
          "defaultValue": "string?"
        }
      ],
      "hidden": "boolean?"
    }
  ],
  "updatedAt": "number?",
  "updatedBy": "string?"
}
```

---

## Resolved Page Output

When a page is rendered, the client resolves each section's component references into fully hydrated content blocks. This is the **resolved payload** — the actual data used by the front-end.

### Resolution flow

```
pages/{slug}.sections[]
  → for each item, fetch components/{item.componentId}
  → if item.variable set, use that variable only; otherwise use all non-hidden variables
  → map variable fields (via defaultValue) to resolved content
  → determine section type from component name
```

### Section type detection

| Component name starts with | Resolved as | Renderer |
|---|---|---|
| `hero` (case-insensitive) | Hero slides | `HeroCarousel` |
| anything else | Category cards | `MenuCategories` |

### Resolved Hero Slide

Each hero section item resolves to one or more `CmsHeroSlide` objects. Variable fields' `defaultValue` entries are mapped to slide properties via `FIELD_KEY_MAP`, then the variant key determines `component` and `layout`.

```json
{
  "id": "item-uuid",
  "component": "Hero_Rio-Red",
  "componentId": "component-uuid",
  "variable": "rio-red-tear-right",
  "layout": "image-left",
  "text_alignment": "center",
  "headline": "Sweet Pork Barbacoa",
  "subheader": "Made Fresh Daily",
  "h2": "",
  "image": { "url": "https://storage.../hero-sweet-pork.jpg", "alt": "" },
  "paper_tear": { "url": "https://storage.../tear-rio-red.png" },
  "centered_image": null,
  "background_color": "#F93A26",
  "button_text": "Order Now",
  "button_url": "/order",
  "button_color": "",
  "headline_color": "",
  "subheader_color": "",
  "h2_color": ""
}
```

**Field mapping:** Component variable fields are matched by key (with aliases):

| Field key(s) in component | Maps to |
|---|---|
| `headline`, `headline_1`, `header_1`, `main_headline`, `title` | `headline` |
| `subheader` | `subheader` |
| `h2`, `headline_2`, `header_2`, `subheadline` | `h2` |
| `button_text`, `cta_text` | `button_text` |
| `button_url`, `button_link` | `button_url` |
| `background_color` | `background_color` |
| `headline_color`, `subheader_color`, `h2_color`, `button_color` | (same) |
| `text_alignment`, `text-alignment`, `text_align`, `text-align` | `text_alignment` |
| `layout` | `layout` |
| image-type field matching `/image\|photo\|picture\|banner/` | `image` |
| image-type field matching `/centered_image\|badge\|logo_image/` | `centered_image` |
| image-type field matching `/paper_tear\|tear\|paper/` | `paper_tear` |

**Merge rule:** Variable content is the base; slide-level values override only when non-empty.

### Resolved Category Card

Each non-hero section item resolves to one or more `CmsCategoryCard` objects:

```json
{
  "id": "variable-uuid",
  "title": "Burritos",
  "image": { "url": "https://storage.../burritos.jpg", "alt": "Burritos" },
  "url": "/order/burritos"
}
```

**Field mapping:** Variable fields are matched by key:

| Field key(s) | Maps to |
|---|---|
| `title`, `name`, `label` | `title` |
| `image`, `photo` (or type `image`) | `image` |
| `url`, `link`, `href` (or type `url`) | `url` |
| `alt`, `image_alt` | `image.alt` |

### Example: Resolved home page output

```json
{
  "slug": "home",
  "sections": [
    {
      "id": "section-1-uuid",
      "name": "Hero Slides",
      "type": "hero",
      "resolved": [
        {
          "id": "item-1",
          "component": "Hero_Rio-Red",
          "layout": "image-left",
          "variable": "rio-red-tear-right",
          "headline": "Sweet Pork Barbacoa",
          "subheader": "Made Fresh Daily",
          "image": { "url": "https://storage.../hero.jpg", "alt": "" },
          "paper_tear": { "url": "https://storage.../tear.png" },
          "button_text": "Order Now",
          "button_url": "/order",
          "text_alignment": "center"
        },
        {
          "id": "item-2",
          "component": "Hero_Image_Centered_Full",
          "layout": null,
          "variable": "image-centered-full",
          "headline": "",
          "image": { "url": "https://storage.../promo-bg.jpg", "alt": "" },
          "centered_image": { "url": "https://storage.../badge.png", "alt": "" },
          "button_text": "Learn More",
          "button_url": "/promotions",
          "text_alignment": "center"
        }
      ]
    },
    {
      "id": "section-2-uuid",
      "name": "Menu Categories",
      "type": "categories",
      "resolved": [
        {
          "id": "var-uuid-1",
          "title": "Burritos",
          "image": { "url": "https://storage.../burritos.jpg", "alt": "Burritos" },
          "url": "/order/burritos"
        },
        {
          "id": "var-uuid-2",
          "title": "Salads",
          "image": { "url": "https://storage.../salads.jpg", "alt": "Salads" },
          "url": "/order/salads"
        }
      ]
    }
  ]
}
```

**Note:** The `type` and `resolved` keys above represent the conceptual output. In the actual front-end, sections are resolved inline by `Page.tsx` and rendered directly — there is no intermediate JSON endpoint. If you need a REST API that returns this resolved format, a Cloud Function would need to replicate the `cms-adapter.ts` resolution logic.

---

## Client-side normalization

When fetching a page, the client:

1. Checks for the new `sections` format first (array with `items` sub-arrays)
2. Falls back to legacy `hero`/`categories` arrays and auto-migrates them to a sections structure
3. Adds `slug` from the document ID

```ts
// useCmsPage.ts
const hasNewFormat = rawSections.length > 0 && rawSections[0]?.items
let sections = hasNewFormat ? rawSections : []

// Auto-migrate legacy hero array
if (!hasNewFormat && Array.isArray(data?.hero) && data.hero.length > 0) {
  sections = [{
    id: 'migrated-hero',
    name: 'Hero Slides',
    items: data.hero.map((h) => ({
      id: h.id || crypto.randomUUID(),
      componentId: h.componentId || '',
      variable: h.variable || undefined,
    })),
  }]
}
```

---

## Adding new content blocks

When you add new components to a page in the CMS editor, the resolved output updates automatically as long as:

1. **Component exists** in the `components` collection with at least one variable containing fields with `defaultValue` set
2. **Page section item** references the correct `componentId` (and optionally `variable`)
3. **For hero components:** the component's `name` or `displayName` starts with `"hero"` (case-insensitive), and the variable key is listed in `VARIANT_TO_HERO` in `cms-adapter.ts`. Unknown variable keys fall back to `Hero_Rio-Red` with `image-right` layout.
4. **For category components:** any component whose name does NOT start with `"hero"` is resolved as category cards. Fields are matched by key (`title`, `image`, `url`).

### Checklist after adding a new component

- [ ] Component saved in Firestore `components/{id}` with variables and fields
- [ ] Each field has `defaultValue` set with the actual content (text, image URL, etc.)
- [ ] Page section in `pages/{slug}` references the component via `componentId`
- [ ] If hero variant: variable key exists in `VARIANT_TO_HERO` map (or add it to `cms-adapter.ts`)
- [ ] Field keys match the expected mapping (see tables above)
