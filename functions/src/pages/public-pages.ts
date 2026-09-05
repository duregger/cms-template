import * as admin from 'firebase-admin'

/** Live consumer pages: Publish snapshot, or editor pages until the first release. */
export async function publicPagesCollection(space: string) {
  const db = admin.firestore()
  const release = await db.doc(`spaces/${space}/releases/current`).get()
  const name = release.exists ? 'published-pages' : 'pages'
  return db.collection(`spaces/${space}/${name}`)
}
