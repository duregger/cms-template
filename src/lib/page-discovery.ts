import type { CmsComponent, CmsComponentVariable, CmsPageSection } from '@/types/cms'

function isHeroComponent(component: CmsComponent): boolean {
  const haystack = `${component.name} ${component.displayName} ${component.kind}`.toLowerCase()
  return haystack.includes('hero')
}

function imageFromVariable(variable: CmsComponentVariable | undefined): string | undefined {
  if (!variable?.fields?.length) return undefined
  for (const field of variable.fields) {
    if (field.type !== 'image') continue
    const key = (field.key ?? '').toLowerCase()
    if (/tear|paper/.test(key)) continue
    const value = field.defaultValue?.trim()
    if (value) return value
  }
  return undefined
}

/** First hero slide image on the page, used when SEO/OG image is empty. */
export function firstHeroImageUrl(
  sections: CmsPageSection[],
  components: CmsComponent[],
): string | undefined {
  for (const section of sections) {
    const sectionIsHero = section.name.toLowerCase().includes('hero')
    for (const item of section.items) {
      const component = components.find((c) => c.id === item.componentId)
      if (!component) continue
      if (!sectionIsHero && !isHeroComponent(component)) continue
      const visible = component.variables.filter((v) => !v.hidden)
      const selected = item.variable
        ? visible.find((v) => v.key === item.variable) ?? visible[0]
        : visible[0]
      const url = imageFromVariable(selected)
      if (url) return url
    }
  }
  return undefined
}

export function splitList(value: string): string[] {
  return value
    .split(/[,;\n]+/)
    .map((part) => part.trim())
    .filter(Boolean)
}

export function joinList(values: string[] | undefined): string {
  return (values ?? []).join(', ')
}

export function splitLines(value: string): string[] {
  return value
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean)
}

export function joinLines(values: string[] | undefined): string {
  return (values ?? []).join('\n')
}
