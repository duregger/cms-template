import { RESERVED_SPACE_IDS, type BlogSpaceDef } from '@/types/cms'

export function slugifySpaceId(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function titleCaseSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function isReservedBlogSlug(id: string): boolean {
  return (RESERVED_SPACE_IDS as readonly string[]).includes(id)
}

export function validateBlogSpaceId(id: string, existing?: BlogSpaceDef[] | null): string | null {
  const slug = slugifySpaceId(id)
  if (!slug) return 'Enter a space id.'
  if (isReservedBlogSlug(slug)) return `"${slug}" is reserved. Choose another id.`
  if (existing?.some((b) => b.id === slug)) return `"${slug}" is already a blog space.`
  return null
}

export function blogSpaceFromInput(id: string, label?: string): BlogSpaceDef {
  const slug = slugifySpaceId(id)
  const trimmed = label?.trim()
  return {
    id: slug,
    label: trimmed || titleCaseSlug(slug) || 'Blog',
  }
}
