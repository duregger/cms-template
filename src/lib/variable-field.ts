import type { CmsVariableField } from '@/types/cms'

const STRUCTURAL_KEYS = new Set([
  'layout',
  'text_alignment',
  'text-alignment',
  'text_align',
  'text-align',
  'alignment',
  'align',
  'container_radius',
  'container_padding',
  'image_radius',
  'cta_radius',
  'image_alt',
  'alt',
])

function fieldKey(field: Pick<CmsVariableField, 'key' | 'slug'>): string {
  return (field.slug ?? field.key ?? '').trim().toLowerCase()
}

/** Copy fields can take a text-role color. Layout and alignment cannot. */
export function fieldUsesTextColor(field: Pick<CmsVariableField, 'key' | 'slug' | 'type'>): boolean {
  const type = (field.type ?? '').toLowerCase()
  if (type !== 'text' && type !== 'longform') return false
  return !STRUCTURAL_KEYS.has(fieldKey(field))
}
