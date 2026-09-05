# Hero Component Variants

## Color Reference

| Name | Hex |
|------|-----|
| Rio Red | `#F93A26` |
| Crema | `#F9E4CA` |
| Lite Crema | `#F2E7DC` |
| Black Bean | `#382827` |

---

## Split-Layout Variants

These show a text panel on one side and an image on the other, with a paper tear divider between them. On mobile they stack vertically (image + tear + text).

### Hero_Rio-Red

**Background:** Rio Red
**Layout:** `image-right` (text left, image right) or `image-left` (image left, text right)

| Element | Color |
|---------|-------|
| Headline | Crema |
| Subheader | Crema |
| H2 | Crema |
| Button BG | Crema |
| Button Text | Rio Red |

---

### Hero_Black-Bean

**Background:** Black Bean
**Layout:** `image-right` or `image-left`

| Element | Color |
|---------|-------|
| Headline | Crema |
| Subheader | Crema |
| H2 | Crema |
| Button BG | Rio Red |
| Button Text | Lite Crema |

---

### Hero_Crema

**Background:** Crema
**Layout:** `image-right` or `image-left`

| Element | Color |
|---------|-------|
| Headline | Black Bean |
| Subheader | Rio Red |
| H2 | Black Bean |
| Button BG | Rio Red |
| Button Text | Crema |

---

## Full-Width Variants

These show a full-bleed background image on desktop with text overlaid, and a stacked image-then-text layout on mobile. They support `text_alignment` (left, center, right).

### Hero_White_Full

**Background:** White (`#FFFFFF`)

| Element | Color |
|---------|-------|
| Headline | Black Bean |
| Subheader | Black Bean |
| H2 | Black Bean |
| Button BG | Black Bean |
| Button Text | Lite Crema |

---

### Hero_Rio-Red_Full

**Background:** Rio Red
**Default text alignment:** Left

| Element | Color |
|---------|-------|
| Headline | Crema |
| Subheader | Crema |
| H2 | Crema |
| Button BG | Crema |
| Button Text | Rio Red |

---

## Image-Centric Variants

### Hero_Image_Centered

A solid-color background with the main image centered at ~40% height, text and button below.

**Background:** Rio Red (default, overridable via `background_color`)

| Element | Color |
|---------|-------|
| Headline | Crema |
| Subheader | Crema |
| H2 | Crema |
| Button BG | Rio Red |
| Button Text | Lite Crema |

---

### Hero_Image_Full

Full-bleed image edge-to-edge. Optional button overlaid at the bottom with a gradient scrim on mobile.

**Background:** Black (default, overridable via `background_color`)

| Element | Color |
|---------|-------|
| Button BG | Rio Red |
| Button Text | Lite Crema |

---

### Hero_Image_Centered_Full

Full-bleed background image with a centered badge/logo (`centered_image`) and optional button below. Used for promotional landing pages (e.g., deal pages).

**Background:** Black (default, overridable via `background_color`)

| Element | Color |
|---------|-------|
| Button BG | Crema |
| Button Text | Rio Red |

**Fields used:** `image` (background), `centered_image` (badge overlay), `button_text`, `button_url`

---

## Text Alignment

Full-width variants support `text_alignment` on the slide. The value is normalized — all of these work:

- `"left"`, `"Left"`, `"Left Align"` → left-aligned text and button
- `"right"`, `"Right"`, `"Right Align"` → right-aligned
- `"center"`, `"Center"`, or empty → centered (default)

Split-layout and image-centric variants always center their text.

---

## Text Behavior

- All text elements are uppercase
- Headline and H2 use the CMS headline face (Archivo Expanded)
- Subheader uses the CMS subheader face (Archivo Expanded Medium)
- Text wraps naturally within the available space
- Colors can be overridden per-slide via `headline_color`, `subheader_color`, `h2_color`
- Button color can be overridden via `button_color`
