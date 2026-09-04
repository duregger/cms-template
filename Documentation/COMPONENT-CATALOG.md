# CMS Component Catalog

Reusable components across the application. Use design tokens (see `.cursor/rules/design-system.mdc`) — no inline hex colors or ad-hoc styling.

---

## Core UI

### Button (`src/components/Button.tsx`)

```tsx
import { Button, OrderNowButton, ButtonArrow } from '@/components/Button'

<Button size="sm|md|lg" variant="primary|secondary|outline" icon={<Icon />} iconPosition="left|right">
  Label
</Button>
<OrderNowButton size="sm|md|lg" />
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | sm (h-8), md (h-10), lg (h-12) |
| `variant` | `'primary' \| 'secondary' \| 'outline'` | `'primary'` | primary (red bg), secondary (dark bg), outline (red border) |
| `icon` | `ReactNode` | — | Optional icon node |
| `iconPosition` | `'left' \| 'right'` | `'right'` | Icon placement |
| `...rest` | `ButtonHTMLAttributes` | — | Passed to `<button>` |

**Notes:** Uses CSS variables (`--btn-primary-bg`, etc.). Always `rounded-pill`, `font-button` (Optic Medium Expanded, uppercase). `OrderNowButton` is a preconfigured primary button with arrow icon. `ButtonArrow` is a standalone SVG for custom use.

---

### Badge (`src/components/Badge.tsx`)

```tsx
import { Badge, PositionedBadge } from '@/components/Badge'

<Badge variant="new|fave|limited-time|coming-soon|today-only|sold-out" />
<PositionedBadge variant="sold-out" />
```

| Prop | Type | Description |
|------|------|-------------|
| `variant` | `BadgeVariant` | `new`, `fave`, `limited-time`, `coming-soon`, `today-only` (yellow), `sold-out` (red) |
| `className` | `string` | Optional extra classes |
| `children` | `ReactNode` | Override label (e.g. `"Monday Only"`) |

**Notes:** Custom SVG edge shapes, rotated -5.9°. Yellow variants use `rio-queso`, red uses `rio-red-badge`. `PositionedBadge` is absolutely positioned (`-left-3 -top-5 z-20`) for overlaying cards; use `className` to adjust (e.g. `relative left-0 top-0` for inline placement).

---

## CMS Components

### Hero (`src/components/cms/Hero.tsx`)

```tsx
import { Hero } from '@/components/cms/Hero'

<Hero slide={slideData} isActive />
```

| Prop | Type | Description |
|------|------|-------------|
| `slide` | `HeroSlideInput` | CMS slide: `headline`, `subheader`, `h2`, `image`, `button_text`, `button_url`, `component`, `layout`, `text_alignment`, `background_color`, etc. |
| `isActive` | `boolean` | When true, uses `eager` loading and `fetchpriority="high"` for current slide |

**Variants (via `slide.component`):**

- **Split:** `Hero_Rio-Red`, `Hero_Black-Bean`, `Hero_Crema` + `_Tear_Right` / `_Tear_Left` — side-by-side image/text with paper tear
- **Full-width:** `Hero_Rio-Red_Full`, `Hero_Black-Bean_Full`, `Hero_White_Full` — full-bleed image with overlay text
- **Image-centric:** `Hero_Image_Centered`, `Hero_Image_Full`, `Hero_Image_Centered_Full` — image-first layouts

**Notes:** Supports `text_alignment` (left/center/right), custom headline/subheader/h2 colors, paper tear overlays, external links. Uses `TextWithBreaks` for line breaks in copy.

---

### HeroCarousel (`src/components/cms/HeroCarousel.tsx`)

```tsx
import { HeroCarousel } from '@/components/cms/HeroCarousel'

<HeroCarousel blok={{ slides: [...], autoplay_interval: 10000 }} />
```

| Prop | Type | Description |
|------|------|-------------|
| `blok` | `HeroCarouselBlok` | `slides` (or `heroes`/`body`), optional `autoplay_interval` (ms, default 10000) |

**Notes:** Wraps `Hero` slides with autoplay (pauses on hover), prev/next arrows, dot indicators. Updates `theme-color` meta tag per slide for mobile safe area. Single slide renders without carousel chrome.

---

### Page (`src/components/cms/Page.tsx`)

```tsx
import { Page } from '@/components/cms/Page'

<Page sections={cmsSections} />
```

| Prop | Type | Description |
|------|------|-------------|
| `sections` | `CmsPageSection[]` | CMS page sections; each section resolves to HeroCarousel or MenuCategories |

**Notes:** Requires `CmsComponentsContext`. Resolves hero slides and category sliders from CMS component variables.

---

### ContentBlock (`src/components/cms/ContentBlock.tsx`)

```tsx
import { ContentBlock } from '@/components/cms/ContentBlock'

<ContentBlock block={contentBlockData} />
```

| Prop | Type | Description |
|------|------|-------------|
| `block` | `CmsContentBlock` | CMS content block: `headline`, `body`, `button_text`, `button_url`, `image`, `background_color`, `headline_color`, `body_color`, `button_bg_color`, `button_text_color`, `layout`, `image_style`, `accent_color`, `decoration` |

**Layout options (`block.layout`):**

- `image-left` (default): Image left, content right (desktop); image top, content bottom (mobile)
- `image-right`: Content left, image right (desktop); image top, content bottom (mobile)

**Image style (`block.image_style`):**

- `full-bleed` (default): Image fills its grid column edge-to-edge
- `framed`: Image inset with accent-color rectangle behind it (layered effect)

**Decorations (`block.decoration`):**

- `citrus-pig`: Citrus wheel (top-left) + pig outline (bottom-center) — used on careers/yellow blocks
- `food-icons`: Bowl with steam + pepper (bottom-right) — used on catering/orange blocks
- `none` or omitted: No decoration

**CMS detection:** Components with `name` starting with `content-block` or `content_block` are auto-detected by `Page.tsx` and rendered as content blocks.

**Notes:** Colors accept design token names (`rio-red`, `rio-queso`, etc.) or raw hex values. Uses `ButtonArrow` for CTA icon. Supports internal links (React Router `Link`) and external links (`<a>` with `target="_blank"`).

---

### MenuCategories (CMS) (`src/components/cms/MenuCategories.tsx`)

```tsx
import { MenuCategories } from '@/components/cms/MenuCategories'

<MenuCategories subheader="OUR MENU" headline="MADE FOR FLAVOR" categories={categories} />
```

| Prop | Type | Description |
|------|------|-------------|
| `subheader` | `string` | Small uppercase label |
| `headline` | `string` | Main section title |
| `categories` | `Category[]` | Category cards with image, name, link |

**Notes:** CMS-style category slider/grid for homepage or landing pages. Different from order `MenuCategories` (tabs).

---

## Discovery

### DiscoverSection (`src/components/DiscoverSection.tsx`)

```tsx
import { DiscoverSection } from '@/components/DiscoverSection'

<DiscoverSection items={items} title="Discover Something New" />
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `DiscoverItem[]` | Built-in defaults | `{ id, title, price, image, layout, badge?, video?, description? }` |
| `title` | `string` | `"Discover Something New"` | Section heading |

**Notes:** Horizontal bento-style card layout. Mobile: 2-column grid. Desktop: 4-column bento (hero + rows). Cards support `portrait`/`landscape` layout, optional badge, optional video. Click opens detail modal with Order Now button.

---

## Order / Menu

### MenuItemCard (`src/components/order/MenuItemCard.tsx`)

```tsx
import { MenuItemCard } from '@/components/order/MenuItemCard'

<MenuItemCard item={menuItem} onClick={() => openCustomizer(item)} />
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `item` | `MenuItem` | — | Menu item with name, price, image, badge, variants, optionGroups |
| `onClick` | `() => void` | — | Fired when card (or plus icon) is clicked |
| `aspectRatio` | `string` | `'291/310'` | CSS aspect-ratio for image (e.g. `'4/3'`) |
| `showPrice` | `boolean` | `true` | Show price; for variants shows min–max range |

**Notes:** Hover reveals plus icon with notch clip-path animation. Supports `availableDay` or day name in description for "Monday Only"–style badges. Uses `PositionedBadge` for overlays.

---

### MenuItemGrid (`src/components/order/MenuItemGrid.tsx`)

```tsx
import { MenuItemGrid } from '@/components/order/MenuItemGrid'

<MenuItemGrid items={menuItems} onItemSelect={(item) => openCustomizer(item)} />
```

| Prop | Type | Description |
|------|------|-------------|
| `items` | `MenuItem[]` | Menu items to display |
| `onItemSelect` | `(item: MenuItem) => void` | Called when an item is clicked |

**Notes:** Responsive grid (1–4 cols). Renders `MenuItemCard` for each item. Empty state shows "No items available" message.

---

### MenuCategories (Order) (`src/components/order/MenuCategories.tsx`)

```tsx
import { MenuCategories } from '@/components/order/MenuCategories'

<MenuCategories categories={categories} selectedId={selectedId} onSelect={setSelectedId} />
```

| Prop | Type | Description |
|------|------|-------------|
| `categories` | `Category[]` | Menu categories |
| `selectedId` | `string \| null` | Active category id |
| `onSelect` | `(id: string) => void` | Category selection handler |

**Notes:** Horizontal scrollable tabs. Auto-scrolls active tab into view. Underline indicator on active/hover.

---

### ItemCustomizer (`src/components/order/ItemCustomizer.tsx`)

```tsx
import { ItemCustomizer } from '@/components/order/ItemCustomizer'

<ItemCustomizer
  item={menuItem}
  onClose={() => setCustomizing(null)}
  onAddToOrder={(item, selections, totalPrice, variant) => addToCart(...)}
/>
```

| Prop | Type | Description |
|------|------|-------------|
| `item` | `MenuItem` | Item to customize |
| `onClose` | `() => void` | Close modal |
| `onAddToOrder` | `(item, selections, totalPrice, variant?) => void` | Add to cart callback |

**Notes:** Full-screen modal. Variant selection (if multiple), option groups with min/max, real-time price and nutrition. Validates required groups before enabling Add. Uses `OptionGroupSelector` and `NutritionPanel`.

---

### OptionGroupSelector (`src/components/order/OptionGroupSelector.tsx`)

```tsx
import { OptionGroupSelector } from '@/components/order/OptionGroupSelector'

<OptionGroupSelector group={optionGroup} selections={selections} onChange={setSelections} />
```

| Prop | Type | Description |
|------|------|-------------|
| `group` | `OptionGroup` | Options, minSelections, maxSelections |
| `selections` | `Selection[]` | Current selections |
| `onChange` | `(selections: Selection[]) => void` | Selection update handler |

**Notes:** Collapsible accordion. Single/multi-select, required/optional hints. Shows surcharge for paid options. Used inside `ItemCustomizer`.

---

### NutritionPanel (`src/components/order/NutritionPanel.tsx`)

```tsx
import { NutritionPanel } from '@/components/order/NutritionPanel'

<NutritionPanel nutrition={totals} loading={isLoading} className="mb-3" />
```

| Prop | Type | Description |
|------|------|-------------|
| `nutrition` | `NutritionTotals \| null` | `{ calories, protein, totalCarbs, totalFat, dietaryFiber, sodium }` |
| `loading` | `boolean` | Shows "(loading...)" when true |
| `className` | `string` | Optional extra classes |

**Notes:** 3-column grid. Rounds values. Used in `ItemCustomizer` with `useNutrition` hook for real-time totals.

---

## Layout

### Layout (`src/components/Layout/Layout.tsx`)

```tsx
import { Layout } from '@/components/Layout/Layout'

<Layout />  // Used as route parent; renders <Outlet /> for child routes
```

**Notes:** Wraps app with Header, main content (`pt-16`), Footer, and `SignInModal`. Uses `Outlet` for nested routes.

---

### Header (`src/components/Layout/Header.tsx`)

```tsx
import { Header } from '@/components/Layout/Header'

<Header />
```

**Notes:** Fixed nav. Scroll-morphing: rectangle → pill via `--nav-t` CSS variable (0–400px scroll). Desktop: nav links, Order Now, Sign In / user greeting, cart. Mobile: hamburger, cart; dropdown nav. Uses `AuthContext` for sign-in state.

---

### Footer (`src/components/Layout/Footer.tsx`)

```tsx
import { Footer } from '@/components/Layout/Footer'

<Footer />
```

**Notes:** Dark background (`rio-black-bean`). Logo, app store badges, nav columns, Order Now, social links. Bottom bar: Terms, Privacy, Release Notes, CMS Admin, Prototype Logout, Accessibility toggle.

---

## Auth

### PrototypeGate (`src/components/PrototypeGate.tsx`)

```tsx
import { PrototypeGate } from '@/components/PrototypeGate'

<PrototypeGate>
  <App />
</PrototypeGate>
```

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Content shown only when authenticated |

**Notes:** Google sign-in gate. Domain-restricted: `beginthework.com` plus optional client domains. Shows loading pulse, then gate overlay if unauthenticated. Denied users see "Access is restricted" message.

---

### SignInModal (`src/components/SignInModal.tsx`)

```tsx
import { SignInModal } from '@/components/SignInModal'

<SignInModal />  // Rendered by Layout; controlled via AuthContext
```

**Notes:** Modal for email/password sign-in (demo/mock). Opened via `openSignInModal` from `AuthContext`. Escape to close. No props; state from context.

---

## CMS Admin

### CmsLayout (`src/components/CmsLayout.tsx`)

```tsx
import { CmsLayout } from '@/components/CmsLayout'

<CmsLayout />  // Route parent for /cms-admin/*
```

**Notes:** Admin shell with collapsible sidebar (pages, components, Design System, Release Notes, Dev Docs). Page reorder, Create Page/Component. Main area renders `Outlet`. Header sign-out. Requires `CmsPagesContext` and `CmsComponentsContext`.

---

## Icons

### ArrowRight (`src/components/icons/ArrowRight.tsx`)

```tsx
import { ArrowRight } from '@/components/icons/ArrowRight'

<ArrowRight className="h-5 w-5" />
```

### ChevronDown (`src/components/icons/ChevronDown.tsx`)

```tsx
import { ChevronDown } from '@/components/icons/ChevronDown'

<ChevronDown className="h-4 w-4" />
```

**Notes:** SVG icons; accept `className` for size/color. Use `currentColor` for inheritance.
