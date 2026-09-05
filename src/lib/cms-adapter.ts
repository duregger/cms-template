import type { CmsHeroSlide, CmsCategoryCard, CmsContentBlock, CmsComponent } from '@/types/cms'
import { fieldUsesTextColor } from '@/lib/variable-field'

/** Normalize variable key for lookup: trim, lowercase, spaces/underscores → hyphens */
function normalizeVariableKey(key: string): string {
  return key.trim().toLowerCase().replace(/[\s_]+/g, '-').replace(/-+/g, '-')
}

/** Map variable key (from API component.variables[].key) → { component, layout, textAlignment } */
const VARIANT_TO_HERO: Record<string, { component: string; layout?: string; textAlignment?: string }> = {
  'left-content-right-image': { component: 'Hero_Split', layout: 'copy-left-image-right', textAlignment: 'left' },
  'right-content-left-image': { component: 'Hero_Split', layout: 'copy-right-image-left', textAlignment: 'left' },
  'full-bleed-overlay': { component: 'Hero_FullBleed', layout: 'full-bleed', textAlignment: 'left' },
  'centered-stack': { component: 'Hero_Centered', layout: 'centered-stack', textAlignment: 'center' },
  'color-field': { component: 'Hero_ColorField', layout: 'color-field', textAlignment: 'center' },
  'hero-content': { component: 'Hero_Split', layout: 'copy-left-image-right' },
}

const KNOWN_HERO_VARIANTS = new Set([
  'Hero_Split',
  'hero_split',
  'Hero_FullBleed',
  'hero_fullbleed',
  'Hero_Centered',
  'hero_centered',
  'Hero_ColorField',
  'hero_colorfield',
])

const COMPONENT_ALIASES: Record<string, string> = {
  'hero split': 'Hero_Split',
  'hero full bleed': 'Hero_FullBleed',
  'hero centered': 'Hero_Centered',
  'hero color field': 'Hero_ColorField',
}

function resolveComponentFromName(name: string): string | null {
  if (!name) return null
  if (KNOWN_HERO_VARIANTS.has(name)) return name
  const normalized = name.toLowerCase().replace(/\s+/g, ' ').trim()
  return COMPONENT_ALIASES[normalized] ?? null
}

const FIELD_KEY_MAP: Record<string, string> = {
  headline: 'headline',
  headline_top: 'headline',
  headline_1: 'headline',
  header_1: 'headline',
  main_headline: 'headline',
  title: 'headline',
  subheader: 'subheader',
  headline_small: 'subheader',
  h2: 'h2',
  headline_bottom: 'h2',
  headline_2: 'h2',
  header_2: 'h2',
  subheadline: 'h2',
  button_text: 'button_text',
  button_url: 'button_url',
  button_link: 'button_url',
  cta_text: 'button_text',
  background_color: 'background_color',
  headline_color: 'headline_color',
  subheader_color: 'subheader_color',
  h2_color: 'h2_color',
  button_color: 'button_color',
  text_alignment: 'text_alignment',
  'text-alignment': 'text_alignment',
  text_align: 'text_alignment',
  'text-align': 'text_alignment',
  layout: 'layout',
}

function buildContentFromVariable(slide: CmsHeroSlide, component: CmsComponent | null): Partial<CmsHeroSlide> {
  if (!component || !slide.variable) return {}
  const slideVar = slide.variable ?? ''
  const variable = component.variables.find(
    (v) => v.key === slideVar || v.label === slideVar || normalizeVariableKey(v.key) === normalizeVariableKey(slideVar)
  )
  if (!variable?.fields?.length) return {}

  const built: Record<string, unknown> = {}
  const keyLower = (k: string) => k.toLowerCase().trim()
  const isImageField = (k: string) =>
    /image|photo|picture|banner|hero_image|background/.test(keyLower(k)) && !/tear|paper/.test(keyLower(k))
  const isPaperTearField = (k: string) =>
    /paper_tear|paper-tear|tear|tear_image|paper/.test(keyLower(k))
  const isCenteredImageField = (k: string) =>
    /centered_image|center_image|badge|badge_image|logo_image/.test(keyLower(k))
  const typeLower = (t: string) => (t ?? '').toLowerCase()
  for (const f of variable.fields) {
    const val = f.defaultValue
    if (val == null || val === '') continue
    const fKey = (f.slug ?? f.key ?? '').trim()
    const fType = typeLower(f.type ?? '')
    if (fType === 'image' && isCenteredImageField(fKey)) {
      built.centered_image = { url: val, alt: '' }
    } else if (fType === 'image' && isImageField(fKey)) {
      built.image = { url: val, alt: '' }
    } else if (fType === 'image' && isPaperTearField(fKey)) {
      built.paper_tear = { url: val }
    } else if (typeof val === 'string') {
      const targetKey = FIELD_KEY_MAP[fKey] ?? FIELD_KEY_MAP[keyLower(fKey)] ?? fKey
      built[targetKey] = val
      if (f.color && fieldUsesTextColor(f)) {
        built[`${targetKey}_color`] = f.color
      }
    }
  }
  return built as Partial<CmsHeroSlide>
}

/** Resolves component, layout, and content from slide + component variable data */
export function resolveHeroSlide(
  slide: CmsHeroSlide,
  cmsComponent?: CmsComponent | null
): CmsHeroSlide & { component: string; layout?: string } {
  const rawKey = slide.variable
  const normKey = rawKey ? normalizeVariableKey(rawKey) : ''
  const heroConfig = normKey ? VARIANT_TO_HERO[normKey] ?? VARIANT_TO_HERO[rawKey!] : null

  const heroVariant =
    heroConfig?.component ??
    resolveComponentFromName(slide.component ?? '') ??
    'Hero_Split'

  const layout = heroConfig?.layout ?? slide.layout

  const fromVariable = buildContentFromVariable(slide, cmsComponent ?? null)
  const merged = { ...fromVariable } as Record<string, unknown>
  for (const [k, v] of Object.entries(slide)) {
    if (v == null) continue
    if (typeof v === 'string' && v.trim() === '') continue
    if ((k === 'image' || k === 'paper_tear') && v && typeof v === 'object') {
      const url = (v as { url?: string }).url ?? ''
      if (!url || !url.trim()) continue
    }
    merged[k] = v
  }

  const textAlignment = (merged.text_alignment as string) || heroConfig?.textAlignment
  return { ...merged, component: heroVariant, layout, ...(textAlignment ? { text_alignment: textAlignment } : {}) } as CmsHeroSlide & { component: string; layout?: string }
}

/**
 * Resolve a CMS component's variables into CmsContentBlock[].
 */
export function resolveContentBlock(component: CmsComponent | null): CmsContentBlock[] {
  if (!component) return []

  return component.variables
    .filter((v) => !v.hidden)
    .map((v) => {
      const block: CmsContentBlock = {
        id: v.id,
        headline: '',
        body: '',
        button_text: '',
        button_url: '',
      }
      let imageAlt = ''

      for (const f of v.fields ?? []) {
        const val = f.defaultValue ?? ''
        if (!val) continue
        const k = (f.slug ?? f.key ?? '').toLowerCase()
        const t = (f.type ?? '').toLowerCase()

        if (t === 'image' || k === 'image' || k === 'photo') {
          block.image = { url: val, alt: imageAlt || v.label || v.key }
        } else if (k === 'image_alt' || k === 'alt') {
          imageAlt = val
          if (block.image) block.image.alt = val
        } else if (k === 'tagline' || k === 'eyebrow' || k === 'kicker') {
          block.tagline = val
          if (f.color) block.tagline_color = f.color
        } else if (k === 'headline' || k === 'title') {
          block.headline = val
          if (f.color) block.headline_color = f.color
        } else if (k === 'body' || k === 'description' || k === 'text' || k === 'detail_copy' || k === 'detail') {
          block.body = val
          if (f.color) block.body_color = f.color
        } else if (k === 'button_text' || k === 'cta_text') {
          block.button_text = val
          if (f.color) block.button_text_color = f.color
        } else if (k === 'button_url' || k === 'button_link' || k === 'cta_url' || (t === 'url' && /button|cta|link/.test(k))) {
          block.button_url = val
        } else if (k === 'background_color' || k === 'bg_color') {
          block.background_color = val
        } else if (k === 'headline_color') {
          block.headline_color = val
        } else if (k === 'body_color') {
          block.body_color = val
        } else if (k === 'button_bg_color' || k === 'button_color') {
          block.button_bg_color = val
        } else if (k === 'button_text_color') {
          block.button_text_color = val
        } else if (k === 'layout') {
          block.layout = val as CmsContentBlock['layout']
        } else if (k === 'container_radius') {
          block.container_radius = val
        } else if (k === 'container_padding' || k === 'outside_padding') {
          block.container_padding = val
        } else if (k === 'image_radius') {
          block.image_radius = val
        } else if (k === 'cta_radius') {
          block.cta_radius = val
        } else if (k === 'image_style') {
          block.image_style = val as CmsContentBlock['image_style']
        } else if (k === 'accent_color') {
          block.accent_color = val
        } else if (k === 'decoration') {
          block.decoration = val
        }
      }

      return block
    })
}

/**
 * Resolve a CMS component's variables into CmsCategoryCard[].
 */
export function resolveCategorySlider(component: CmsComponent | null): CmsCategoryCard[] {
  if (!component) return []

  return component.variables
    .filter((v) => !v.hidden)
    .map((v) => {
      let title = v.label || v.key || ''
      let imageUrl = ''
      let imageAlt = ''
      let url = ''

      for (const f of v.fields ?? []) {
        const val = f.defaultValue ?? ''
        if (!val) continue
        const k = (f.slug ?? f.key ?? '').toLowerCase()
        const t = (f.type ?? '').toLowerCase()

        if (t === 'image' || k === 'image' || k === 'photo') {
          imageUrl = val
          imageAlt = title
        } else if (k === 'url' || k === 'link' || k === 'href' || t === 'url') {
          url = val
        } else if (k === 'title' || k === 'name' || k === 'label') {
          title = val
        } else if (k === 'alt' || k === 'image_alt') {
          imageAlt = val
        }
      }

      return {
        id: v.id,
        title,
        image: imageUrl ? { url: imageUrl, alt: imageAlt } : undefined,
        url,
      }
    })
}
