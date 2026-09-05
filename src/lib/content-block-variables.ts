import type { CmsComponentVariable, CmsVariableField } from '@/types/cms'

export type ContentBlockLayout = 'image-left' | 'image-right' | 'full-image' | 'image-above'

type FieldDraft = {
  key: string
  label: string
  type: CmsVariableField['type']
  defaultValue?: string
  color?: string
}

function field(draft: FieldDraft): CmsVariableField {
  return {
    id: crypto.randomUUID(),
    key: draft.key,
    label: draft.label,
    type: draft.type,
    ...(draft.defaultValue ? { defaultValue: draft.defaultValue } : {}),
    ...(draft.color ? { color: draft.color } : {}),
  }
}

const COPY = {
  tagline: 'Section',
  headline: 'Tell your story',
  detail: 'Replace this copy. Add a photo and pick a layout that fits the section.',
  button_text: 'Learn more',
  button_url: '/',
}

function sharedFields(layout: ContentBlockLayout, includeImage: boolean): FieldDraft[] {
  const fields: FieldDraft[] = [
    { key: 'layout', label: 'Layout', type: 'text', defaultValue: layout },
    {
      key: 'background_color',
      label: 'Background color',
      type: 'hexcode',
      defaultValue: 'transparent',
    },
    { key: 'container_padding', label: 'Outside padding', type: 'text', defaultValue: '24px' },
    { key: 'container_radius', label: 'Container corner radius', type: 'text', defaultValue: '24px' },
    { key: 'cta_radius', label: 'CTA section corner radius', type: 'text', defaultValue: '16px' },
  ]
  if (includeImage) {
    fields.push(
      { key: 'image', label: 'Image', type: 'image' },
      { key: 'image_alt', label: 'Image alt text', type: 'text' },
      { key: 'image_radius', label: 'Image corner radius', type: 'text', defaultValue: '16px' },
    )
  }
  fields.push(
    {
      key: 'tagline',
      label: 'Tagline',
      type: 'text',
      defaultValue: COPY.tagline,
      color: 'var(--color-semantic-text-action)',
    },
    {
      key: 'headline',
      label: 'Headline',
      type: 'text',
      defaultValue: COPY.headline,
      color: 'var(--color-semantic-text-title)',
    },
    {
      key: 'detail_copy',
      label: 'Detail copy',
      type: 'longform',
      defaultValue: COPY.detail,
      color: 'var(--color-semantic-text-body)',
    },
    {
      key: 'button_text',
      label: 'Button text',
      type: 'text',
      defaultValue: COPY.button_text,
      color: 'var(--color-semantic-text-on-action)',
    },
    { key: 'button_url', label: 'Button link', type: 'url', defaultValue: COPY.button_url },
    {
      key: 'button_color',
      label: 'Button color',
      type: 'hexcode',
      defaultValue: 'var(--color-semantic-surface-action-primary)',
    },
  )
  return fields
}

export const CONTENT_BLOCK_VARIABLE_DEFS: {
  key: string
  label: string
  layout: ContentBlockLayout
  includeImage: boolean
}[] = [
  {
    key: 'image_left_cta_right',
    label: 'Image left, CTA right',
    layout: 'image-left',
    includeImage: true,
  },
  {
    key: 'cta_left_image_right',
    label: 'CTA left, Image right',
    layout: 'image-right',
    includeImage: true,
  },
  {
    key: 'full_image',
    label: 'Full image',
    layout: 'full-image',
    includeImage: true,
  },
  {
    key: 'image_above_cta_below',
    label: 'Image above, CTA below',
    layout: 'image-above',
    includeImage: true,
  },
]

export function buildContentBlockVariable(
  def: (typeof CONTENT_BLOCK_VARIABLE_DEFS)[number],
): CmsComponentVariable {
  return {
    id: crypto.randomUUID(),
    key: def.key,
    label: def.label,
    hidden: false,
    fields: sharedFields(def.layout, def.includeImage).map(field),
  }
}

export function defaultContentBlockVariables(): CmsComponentVariable[] {
  return CONTENT_BLOCK_VARIABLE_DEFS.map(buildContentBlockVariable)
}

export function mergeContentBlockFields(
  existing: CmsVariableField[],
  next: CmsVariableField[],
): CmsVariableField[] {
  const byKey = new Map(existing.map((f) => [f.key, f]))
  const out = [...existing]
  for (const item of next) {
    if (byKey.has(item.key)) continue
    out.push(item)
  }
  return out
}
