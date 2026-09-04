import { collection, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { CmsSpace } from '@/types/cms'

/**
 * Per-space brand-token document paths.
 *
 *   spaces/{space}/design-tokens/draft       — work-in-progress (edited, not live)
 *   spaces/{space}/design-tokens/published    — live tokens consumed by the site
 *   spaces/{space}/token-versions/{id}        — optional published snapshots (rollback)
 *
 * Legacy `design-tokens/current` (single global doc) is intentionally left in
 * place; readers fall back to it until the migration (Track D) runs.
 */

export function tokensDraftDoc(space: CmsSpace) {
  return doc(db, 'spaces', space, 'design-tokens', 'draft')
}

export function tokensPublishedDoc(space: CmsSpace) {
  return doc(db, 'spaces', space, 'design-tokens', 'published')
}

export function tokenVersionsCollection(space: CmsSpace) {
  return collection(db, 'spaces', space, 'token-versions')
}

export function tokenVersionDoc(space: CmsSpace, versionId: string) {
  return doc(db, 'spaces', space, 'token-versions', versionId)
}

/** Legacy single global doc (backward-compatible fallback). */
export const LEGACY_TOKENS_PATH = 'design-tokens/current'
