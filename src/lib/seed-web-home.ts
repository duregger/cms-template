import { getDoc, getDocs, setDoc } from 'firebase/firestore'
import { spaceCollection, spaceDoc } from '@/lib/firestore-paths'
import {
  CONTENT_BLOCK_VARIABLE_DEFS,
  buildContentBlockVariable,
  defaultContentBlockVariables,
  mergeContentBlockFields,
} from '@/lib/content-block-variables'
import {
  HERO_SLIDER_VARIABLE_DEFS,
  buildHeroSliderVariable,
  defaultHeroSliderVariables,
  mergeHeroSliderFields,
} from '@/lib/hero-slider-variables'
import type { CmsComponent, CmsPage, CmsPageSection, CmsSpace } from '@/types/cms'

export const WEB_HOME_SLUG = 'home'

export const STARTER_SLIDER = {
  name: 'Home_Slider',
  displayName: 'Home Slider',
  kind: 'hero',
} as const

export const STARTER_CONTENT_BLOCK = {
  name: 'Home_Content_Block',
  displayName: 'Home Content Block',
  kind: 'content-block',
} as const

export type SidebarSection = { id: string; name: string; pages: string[] }

export type WebHomeSeedIO = {
  listComponents: () => Promise<CmsComponent[]>
  writeComponent: (component: CmsComponent) => Promise<void>
  readComponentOrder: () => Promise<string[]>
  writeComponentOrder: (ids: string[]) => Promise<void>
  readPage: (slug: string) => Promise<CmsPage | null>
  writePage: (page: CmsPage) => Promise<void>
  readPageOrder: () => Promise<string[]>
  writePageOrder: (slugs: string[]) => Promise<void>
  readSidebar: () => Promise<SidebarSection[]>
  writeSidebar: (sections: SidebarSection[]) => Promise<void>
}

function stripUndefined<T>(obj: T): T {
  if (obj === undefined || obj === null) return obj
  if (Array.isArray(obj)) return obj.map(stripUndefined) as T
  if (typeof obj === 'object') {
    const result = {} as Record<string, unknown>
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (v !== undefined) result[k] = stripUndefined(v)
    }
    return result as T
  }
  return obj
}

function slugKey(value: string): string {
  return value.toLowerCase().replace(/[\s-]+/g, '_')
}

export function isHeroComponent(component: Pick<CmsComponent, 'name' | 'displayName'>): boolean {
  const key = slugKey(`${component.name} ${component.displayName}`)
  if (key.includes('content_block') || key.includes('contentblock')) return false
  return key.includes('hero') || key.includes('slider')
}

export function isContentBlockComponent(
  component: Pick<CmsComponent, 'name' | 'displayName'>,
): boolean {
  const key = slugKey(`${component.name} ${component.displayName}`)
  return key.includes('content_block') || key.includes('contentblock')
}

export function pickHeroComponent(list: CmsComponent[]): CmsComponent | undefined {
  return (
    list.find((c) => slugKey(c.name) === slugKey(STARTER_SLIDER.name)) ??
    list.find(isHeroComponent)
  )
}

export function pickContentBlockComponent(list: CmsComponent[]): CmsComponent | undefined {
  return (
    list.find((c) => slugKey(c.name) === slugKey(STARTER_CONTENT_BLOCK.name)) ??
    list.find(isContentBlockComponent)
  )
}

export function starterSliderComponent(id: string, email: string): CmsComponent {
  return {
    id,
    name: STARTER_SLIDER.name,
    displayName: STARTER_SLIDER.displayName,
    kind: STARTER_SLIDER.kind,
    variables: defaultHeroSliderVariables(),
    updatedAt: Date.now(),
    updatedBy: email,
  }
}

function ensureHeroVariables(
  component: CmsComponent,
  email: string,
): { component: CmsComponent; added: string[] } {
  const existing = component.variables ?? []
  const byKey = new Map(existing.map((v) => [v.key, v]))
  const next = [...existing]
  const added: string[] = []
  for (const def of HERO_SLIDER_VARIABLE_DEFS) {
    const template = buildHeroSliderVariable(def)
    const current = byKey.get(def.key)
    if (!current) {
      next.push(template)
      added.push(def.label)
      continue
    }
    const fields = mergeHeroSliderFields(current.fields ?? [], template.fields)
    if (fields.length !== (current.fields ?? []).length) {
      const idx = next.findIndex((v) => v.id === current.id)
      next[idx] = { ...current, fields }
      added.push(`${def.label} fields`)
    }
  }
  if (added.length === 0) return { component, added }
  return {
    component: { ...component, variables: next, updatedAt: Date.now(), updatedBy: email },
    added,
  }
}

function ensureContentBlockVariables(
  component: CmsComponent,
  email: string,
): { component: CmsComponent; added: string[] } {
  const existing = component.variables ?? []
  const byKey = new Map(existing.map((v) => [v.key, v]))
  const next = [...existing]
  const added: string[] = []
  for (const def of CONTENT_BLOCK_VARIABLE_DEFS) {
    const template = buildContentBlockVariable(def)
    const current = byKey.get(def.key)
    if (!current) {
      next.push(template)
      added.push(def.label)
      continue
    }
    const fields = mergeContentBlockFields(current.fields ?? [], template.fields)
    if (fields.length !== (current.fields ?? []).length) {
      const idx = next.findIndex((v) => v.id === current.id)
      next[idx] = { ...current, fields }
      added.push(`${def.label} fields`)
    }
  }
  if (added.length === 0) return { component, added }
  return {
    component: { ...component, variables: next, updatedAt: Date.now(), updatedBy: email },
    added,
  }
}

export function starterContentBlockComponent(id: string, email: string): CmsComponent {
  return {
    id,
    name: STARTER_CONTENT_BLOCK.name,
    displayName: STARTER_CONTENT_BLOCK.displayName,
    kind: STARTER_CONTENT_BLOCK.kind,
    variables: defaultContentBlockVariables(),
    updatedAt: Date.now(),
    updatedBy: email,
  }
}

function homeSections(heroId: string, blockId: string): CmsPageSection[] {
  return [
    {
      id: crypto.randomUUID(),
      name: 'Hero',
      items: [{ id: crypto.randomUUID(), componentId: heroId }],
    },
    {
      id: crypto.randomUUID(),
      name: 'Content',
      items: [{ id: crypto.randomUUID(), componentId: blockId }],
    },
  ]
}

export function starterHomePage(heroId: string, blockId: string, email: string): CmsPage {
  return {
    slug: WEB_HOME_SLUG,
    title: 'Home',
    sections: homeSections(heroId, blockId),
    seo: {
      title: 'Home',
      description: 'Replace this description with a short summary of the home page.',
    },
    openGraph: {
      ogTitle: 'Home',
      ogDescription: 'Replace this description with a short summary of the home page.',
      ogType: 'website',
    },
    updatedAt: Date.now(),
    updatedBy: email,
  }
}

function sectionNamed(page: CmsPage, name: string): CmsPageSection | undefined {
  return page.sections.find((s) => s.name.trim().toLowerCase() === name)
}

/** Add Hero / Content items when those sections are empty. Does not overwrite existing items. */
export function wireHomePage(
  page: CmsPage,
  heroId: string,
  blockId: string,
): { page: CmsPage; changed: boolean } {
  let changed = false
  const sections = [...page.sections]

  const hero = sectionNamed({ ...page, sections }, 'hero')
  if (!hero) {
    sections.unshift({
      id: crypto.randomUUID(),
      name: 'Hero',
      items: [{ id: crypto.randomUUID(), componentId: heroId }],
    })
    changed = true
  } else if (hero.items.length === 0) {
    const idx = sections.findIndex((s) => s.id === hero.id)
    sections[idx] = {
      ...hero,
      items: [{ id: crypto.randomUUID(), componentId: heroId }],
    }
    changed = true
  }

  const content = sectionNamed({ ...page, sections }, 'content')
  if (!content) {
    sections.push({
      id: crypto.randomUUID(),
      name: 'Content',
      items: [{ id: crypto.randomUUID(), componentId: blockId }],
    })
    changed = true
  } else if (content.items.length === 0) {
    const idx = sections.findIndex((s) => s.id === content.id)
    sections[idx] = {
      ...content,
      items: [{ id: crypto.randomUUID(), componentId: blockId }],
    }
    changed = true
  }

  if (!changed) return { page, changed: false }
  return {
    page: { ...page, sections, updatedAt: Date.now() },
    changed: true,
  }
}

export async function applyWebHomeSeed(
  io: WebHomeSeedIO,
  email: string,
): Promise<{ changed: boolean; created: string[] }> {
  const created: string[] = []
  let changed = false

  const components = await io.listComponents()
  let hero = pickHeroComponent(components)
  let block = pickContentBlockComponent(components)

  if (!hero) {
    hero = starterSliderComponent(crypto.randomUUID(), email)
    await io.writeComponent(hero)
    components.push(hero)
    created.push(
      `${hero.displayName} (${hero.variables.length} layouts)`,
    )
    changed = true
  } else {
    const ensured = ensureHeroVariables(hero, email)
    if (ensured.added.length > 0) {
      hero = ensured.component
      await io.writeComponent(hero)
      created.push(`${hero.displayName} variables: ${ensured.added.join(', ')}`)
      changed = true
    }
  }

  if (!block) {
    block = starterContentBlockComponent(crypto.randomUUID(), email)
    await io.writeComponent(block)
    components.push(block)
    created.push(
      `${block.displayName} (${block.variables.length} layouts)`,
    )
    changed = true
  } else {
    const ensured = ensureContentBlockVariables(block, email)
    if (ensured.added.length > 0) {
      block = ensured.component
      await io.writeComponent(block)
      created.push(`${block.displayName} variables: ${ensured.added.join(', ')}`)
      changed = true
    }
  }

  const order = await io.readComponentOrder()
  const nextOrder = [
    hero.id,
    block.id,
    ...order.filter((id) => id !== hero.id && id !== block.id),
  ]
  const extras = components.map((c) => c.id).filter((id) => !nextOrder.includes(id))
  const fullOrder = [...nextOrder, ...extras]
  if (fullOrder.join() !== order.join()) {
    await io.writeComponentOrder(fullOrder)
    changed = true
  }

  let page = await io.readPage(WEB_HOME_SLUG)
  if (!page) {
    page = starterHomePage(hero.id, block.id, email)
    await io.writePage(page)
    created.push('Home page')
    changed = true
  } else {
    const wired = wireHomePage({ ...page, updatedBy: email }, hero.id, block.id)
    if (wired.changed) {
      await io.writePage(wired.page)
      created.push('Home page sections')
      changed = true
    }
  }

  const slugs = await io.readPageOrder()
  if (!slugs.includes(WEB_HOME_SLUG)) {
    await io.writePageOrder([WEB_HOME_SLUG, ...slugs])
    changed = true
  }

  const sidebar = await io.readSidebar()
  const hasHome = sidebar.some((s) => s.pages.includes(WEB_HOME_SLUG))
  if (!hasHome) {
    if (sidebar.length === 0) {
      await io.writeSidebar([
        { id: crypto.randomUUID(), name: 'Site', pages: [WEB_HOME_SLUG] },
      ])
    } else {
      const next = sidebar.map((s, i) =>
        i === 0 ? { ...s, pages: [...s.pages, WEB_HOME_SLUG] } : s,
      )
      await io.writeSidebar(next)
    }
    changed = true
  }

  return { changed, created }
}

function clientIO(space: CmsSpace): WebHomeSeedIO {
  return {
    async listComponents() {
      const snap = await getDocs(spaceCollection(space, 'components'))
      return snap.docs
        .filter((d) => d.id !== '_order')
        .map((d) => ({ id: d.id, ...(d.data() as Omit<CmsComponent, 'id'>) }))
    },
    async writeComponent(component) {
      await setDoc(spaceDoc(space, 'components', component.id), stripUndefined(component))
    },
    async readComponentOrder() {
      const snap = await getDoc(spaceDoc(space, 'components', '_order'))
      return (snap.data()?.ids as string[] | undefined) ?? []
    },
    async writeComponentOrder(ids) {
      await setDoc(spaceDoc(space, 'components', '_order'), { ids })
    },
    async readPage(slug) {
      const snap = await getDoc(spaceDoc(space, 'pages', slug))
      if (!snap.exists()) return null
      return { slug: snap.id, ...(snap.data() as Omit<CmsPage, 'slug'>) }
    },
    async writePage(page) {
      await setDoc(spaceDoc(space, 'pages', page.slug), stripUndefined(page))
    },
    async readPageOrder() {
      const snap = await getDoc(spaceDoc(space, 'pages', '_order'))
      return (snap.data()?.slugs as string[] | undefined) ?? []
    },
    async writePageOrder(slugs) {
      await setDoc(spaceDoc(space, 'pages', '_order'), { slugs })
    },
    async readSidebar() {
      const snap = await getDoc(spaceDoc(space, 'pages', '_sections'))
      return (snap.data()?.sections as SidebarSection[] | undefined) ?? []
    },
    async writeSidebar(sections) {
      await setDoc(spaceDoc(space, 'pages', '_sections'), { sections })
    },
  }
}

const finished = new Set<CmsSpace>()
let inflight: Promise<boolean> | null = null

export function resetWebHomeSeed(space: CmsSpace = 'web') {
  finished.delete(space)
}

/** Creates Home + slider + content-block layouts when missing. */
export async function seedWebHome(
  space: CmsSpace,
  email?: string,
  opts?: { force?: boolean },
): Promise<boolean> {
  if (space !== 'web') return false
  if (opts?.force) finished.delete(space)
  if (finished.has(space)) return false
  if (inflight) return inflight

  inflight = (async () => {
    try {
      const { changed } = await applyWebHomeSeed(clientIO(space), email || 'cms')
      finished.add(space)
      return changed
    } finally {
      inflight = null
    }
  })()

  return inflight
}
