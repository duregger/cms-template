/**
 * Seed Web Home + Home Slider + Home Content Block on the active Firebase project.
 * Point .firebaserc (or --project=) at the new brand first.
 *
 *   npm run seed:web-home
 *   npm run seed:web-home -- --project=client-cms
 */
import { readFileSync } from 'node:fs'
import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import {
  applyWebHomeSeed,
  type SidebarSection,
  type WebHomeSeedIO,
} from '../src/lib/seed-web-home.ts'
import type { CmsComponent, CmsPage } from '../src/types/cms.ts'

function projectId(): string {
  const fromArg = process.argv.find((a) => a.startsWith('--project='))?.slice('--project='.length)
  if (fromArg) return fromArg
  const fromEnv = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT
  if (fromEnv) return fromEnv
  const rc = JSON.parse(readFileSync('.firebaserc', 'utf8')) as {
    projects?: { default?: string }
  }
  const id = rc.projects?.default
  if (!id) throw new Error('Set --project=, GCLOUD_PROJECT, or .firebaserc projects.default')
  return id
}

function adminIO(db: Firestore): WebHomeSeedIO {
  const components = db.collection('spaces/web/components')
  const pages = db.collection('spaces/web/pages')
  return {
    async listComponents() {
      const snap = await components.get()
      return snap.docs
        .filter((d) => d.id !== '_order')
        .map((d) => ({ id: d.id, ...(d.data() as Omit<CmsComponent, 'id'>) }))
    },
    async writeComponent(component) {
      await components.doc(component.id).set(component)
    },
    async readComponentOrder() {
      const snap = await components.doc('_order').get()
      return (snap.data()?.ids as string[] | undefined) ?? []
    },
    async writeComponentOrder(ids) {
      await components.doc('_order').set({ ids })
    },
    async readPage(slug) {
      const snap = await pages.doc(slug).get()
      if (!snap.exists) return null
      return { slug: snap.id, ...(snap.data() as Omit<CmsPage, 'slug'>) }
    },
    async writePage(page) {
      await pages.doc(page.slug).set(page)
    },
    async readPageOrder() {
      const snap = await pages.doc('_order').get()
      return (snap.data()?.slugs as string[] | undefined) ?? []
    },
    async writePageOrder(slugs) {
      await pages.doc('_order').set({ slugs })
    },
    async readSidebar() {
      const snap = await pages.doc('_sections').get()
      return (snap.data()?.sections as SidebarSection[] | undefined) ?? []
    },
    async writeSidebar(sections) {
      await pages.doc('_sections').set({ sections })
    },
  }
}

async function main() {
  const id = projectId()
  initializeApp({ credential: applicationDefault(), projectId: id })
  const db = getFirestore()
  const result = await applyWebHomeSeed(adminIO(db), 'seed-web-home')
  if (!result.changed) {
    console.log(`web home already seeded on ${id}`)
    return
  }
  console.log(`seeded web home on ${id}`)
  for (const item of result.created) console.log(` + ${item}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
