export function pageDisplayName(slug: string, title?: string): string {
  if (title?.trim()) return title.trim()
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
