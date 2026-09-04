import { collection, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { CmsSpace } from '@/types/cms'

/**
 * Resolves a Firestore collection path scoped to a space.
 * e.g. spaceCollection('web', 'pages') → collection(db, 'spaces', 'web', 'pages')
 */
export function spaceCollection(space: CmsSpace, subcollection: string) {
  return collection(db, 'spaces', space, subcollection)
}

/**
 * Resolves a Firestore document path scoped to a space.
 * e.g. spaceDoc('web', 'pages', 'home') → doc(db, 'spaces', 'web', 'pages', 'home')
 */
export function spaceDoc(space: CmsSpace, subcollection: string, docId: string) {
  return doc(db, 'spaces', space, subcollection, docId)
}
