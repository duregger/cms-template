/**
 * Migrate Firestore data from a source project to this CMS project.
 *
 * Copies: pages, components, design-tokens collections
 *
 * Usage:
 *   SOURCE_PROJECT=old-project TARGET_PROJECT=your-cms-project npx tsx scripts/migrate-firestore.ts
 *
 * Prerequisites:
 *   - Both Firebase projects must have Firestore enabled
 *   - Service account keys named {project}-service-account.json in the project root
 *   - npm install firebase-admin (added as devDependency)
 */

import { initializeApp as initAdmin, cert, type ServiceAccount } from 'firebase-admin/app'
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const SOURCE_PROJECT = process.env.SOURCE_PROJECT || 'source-project'
const TARGET_PROJECT = process.env.TARGET_PROJECT || process.env.FIREBASE_PROJECT_ID || 'your-cms-project'

const COLLECTIONS = ['pages', 'components', 'design-tokens']

function loadServiceAccount(name: string): ServiceAccount {
  const paths = [
    resolve(__dirname, `../${name}-service-account.json`),
    resolve(__dirname, `${name}-service-account.json`),
  ]
  for (const p of paths) {
    if (existsSync(p)) {
      return JSON.parse(readFileSync(p, 'utf-8')) as ServiceAccount
    }
  }
  throw new Error(
    `Service account key not found for "${name}". Download from Firebase Console → Project Settings → Service Accounts → Generate New Private Key. Save as ${name}-service-account.json in the project root.`
  )
}

async function migrate() {
  console.log('Loading service account keys...')

  const sourceApp = initAdmin({
    credential: cert(loadServiceAccount(SOURCE_PROJECT)),
    projectId: SOURCE_PROJECT,
  }, 'source')

  const targetApp = initAdmin({
    credential: cert(loadServiceAccount(TARGET_PROJECT)),
    projectId: TARGET_PROJECT,
  }, 'target')

  const sourceDb = getAdminFirestore(sourceApp)
  const targetDb = getAdminFirestore(targetApp)

  for (const collectionName of COLLECTIONS) {
    console.log(`\nMigrating collection: ${collectionName}`)
    const snapshot = await sourceDb.collection(collectionName).get()
    console.log(`  Found ${snapshot.size} documents`)

    let count = 0
    const batch = targetDb.batch()

    for (const doc of snapshot.docs) {
      batch.set(targetDb.collection(collectionName).doc(doc.id), doc.data())
      count++

      // Firestore batches max at 500
      if (count % 500 === 0) {
        await batch.commit()
        console.log(`  Committed ${count} documents...`)
      }
    }

    if (count % 500 !== 0) {
      await batch.commit()
    }

    console.log(`  ✓ Migrated ${count} documents to ${collectionName}`)
  }

  console.log('\nMigration complete!')
  console.log('\nNote: Storage files (cms/*) must be migrated separately.')
  console.log('Use: gsutil -m cp -r gs://SOURCE_BUCKET/cms gs://TARGET_BUCKET/cms')
  process.exit(0)
}

migrate().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
