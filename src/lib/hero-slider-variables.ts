import type { CmsComponentVariable, CmsVariableField } from '../types/cms'

export type HeroSliderLayout =
  | 'copy-left-image-right'
  | 'copy-right-image-left'
  | 'full-bleed'
  | 'centered-stack'
  | 'color-field'

type FieldDraft = {
  key: string
  label: string
  type: CmsVariableField['type']
  defaultValue?: string
}

function field(draft: FieldDraft): CmsVariableField {
  return {
    id: crypto.randomUUID(),
    key: draft.key,
    label: draft.label,
    type: draft.type,
    ...(draft.defaultValue ? { defaultValue: draft.defaultValue } : {}),
  }
}

const COPY_DEFAULTS = {
  headline_top: 'Providing income opportunities',
  headline_small: 'Supportive employment and housing programs.',
  headline_bottom:
    'Curbside was created to provide employment, income, and job skills training — and to build community.',
  button_text: 'Get involved',
  button_url: '/get-involved',
}

function sharedCopy(layout: HeroSliderLayout, align: 'left' | 'right' | 'center'): FieldDraft[] {
  return [
    { key: 'layout', label: 'Layout', type: 'text', defaultValue: layout },
    { key: 'text_alignment', label: 'Text Alignment', type: 'text', defaultValue: align },
    { key: 'headline_top', label: 'Headline Top', type: 'text', defaultValue: COPY_DEFAULTS.headline_top },
    { key: 'headline_small', label: 'Headline Small', type: 'text', defaultValue: COPY_DEFAULTS.headline_small },
    {
      key: 'headline_bottom',
      label: 'Headline Bottom',
      type: 'longform',
      defaultValue: COPY_DEFAULTS.headline_bottom,
    },
    { key: 'button_text', label: 'Button Text', type: 'text', defaultValue: COPY_DEFAULTS.button_text },
    { key: 'button_url', label: 'Button Link', type: 'url', defaultValue: COPY_DEFAULTS.button_url },
    { key: 'button_color', label: 'Button Color', type: 'hexcode', defaultValue: '#ffffff' },
  ]
}

export const HERO_SLIDER_VARIABLE_DEFS: {
  key: string
  label: string
  layout: HeroSliderLayout
  align: 'left' | 'right' | 'center'
  includeImage: boolean
  background: string
}[] = [
  {
    key: 'left_content_right_image',
    label: 'Split — Copy Left, Image Right',
    layout: 'copy-left-image-right',
    align: 'left',
    includeImage: true,
    background: '#16764F',
  },
  {
    key: 'right_content_left_image',
    label: 'Split — Copy Right, Image Left',
    layout: 'copy-right-image-left',
    align: 'left',
    includeImage: true,
    background: '#16764F',
  },
  {
    key: 'full_bleed_overlay',
    label: 'Full Bleed — Copy Over Image',
    layout: 'full-bleed',
    align: 'left',
    includeImage: true,
    background: '#111313',
  },
  {
    key: 'centered_stack',
    label: 'Centered — Stacked Copy',
    layout: 'centered-stack',
    align: 'center',
    includeImage: true,
    background: '#16764F',
  },
  {
    key: 'color_field',
    label: 'Color Field — Copy Only',
    layout: 'color-field',
    align: 'center',
    includeImage: false,
    background: '#16764F',
  },
]

export function buildHeroSliderVariable(
  def: (typeof HERO_SLIDER_VARIABLE_DEFS)[number],
  imageUrl?: string,
): CmsComponentVariable {
  const fields: FieldDraft[] = [
    { key: 'background_color', label: 'Background Color', type: 'hexcode', defaultValue: def.background },
  ]
  if (def.includeImage) {
    fields.push({
      key: 'hero_background_image',
      label: 'Hero Image',
      type: 'image',
      ...(imageUrl ? { defaultValue: imageUrl } : {}),
    })
  }
  fields.push(...sharedCopy(def.layout, def.align))
  return {
    id: crypto.randomUUID(),
    key: def.key,
    label: def.label,
    hidden: false,
    fields: fields.map(field),
  }
}

export function defaultHeroSliderVariables(imageUrl?: string): CmsComponentVariable[] {
  return HERO_SLIDER_VARIABLE_DEFS.map((def) => buildHeroSliderVariable(def, imageUrl))
}

export function mergeHeroSliderFields(
  existing: CmsVariableField[],
  next: CmsVariableField[],
): CmsVariableField[] {
  const byKey = new Map(existing.map((f) => [f.key, f]))
  const out = [...existing]
  for (const field of next) {
    if (byKey.has(field.key)) continue
    out.push(field)
  }
  return out
}
