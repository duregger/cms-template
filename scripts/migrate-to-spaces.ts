/**
 * Migrate Firestore data from flat collections to space-scoped subcollections.
 *
 * Copies:
 *   pages/* → spaces/web/pages/*
 *   components/* → spaces/web/components/*
 *
 * Also creates placeholder docs for mobile, apps, and alerts spaces.
 *
 * Usage:
 *   npx tsx scripts/migrate-to-spaces.ts
 *
 * Prerequisites:
 *   - Target Firebase project must have Firestore enabled
 *   - Service account key as FIREBASE_PROJECT_ID-service-account.json, or GOOGLE_APPLICATION_CREDENTIALS
 *   - npm install firebase-admin (already a devDependency)
 *
 * This script is idempotent — re-running it will overwrite existing space docs.
 */

import { initializeApp as initAdmin, cert, type ServiceAccount } from 'firebase-admin/app'
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const PROJECT = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'your-cms-project'

function loadServiceAccount(): ServiceAccount {
  const paths = [
    resolve(__dirname, `../${PROJECT}-service-account.json`),
    resolve(__dirname, `${PROJECT}-service-account.json`),
  ]
  for (const p of paths) {
    if (existsSync(p)) {
      return JSON.parse(readFileSync(p, 'utf-8')) as ServiceAccount
    }
  }
  throw new Error(
    `Service account key not found. Download from Firebase Console → Project Settings → Service Accounts → Generate New Private Key. Save as ${PROJECT}-service-account.json in the project root.`
  )
}

async function copyCollection(
  db: FirebaseFirestore.Firestore,
  source: string,
  target: string,
) {
  console.log(`  Copying ${source} → ${target}`)
  const snapshot = await db.collection(source).get()
  console.log(`    Found ${snapshot.size} documents`)

  let count = 0
  let batch = db.batch()

  for (const doc of snapshot.docs) {
    batch.set(db.collection(target).doc(doc.id), doc.data())
    count++

    if (count % 500 === 0) {
      await batch.commit()
      batch = db.batch()
      console.log(`    Committed ${count} documents...`)
    }
  }

  if (count % 500 !== 0) {
    await batch.commit()
  }

  console.log(`    Done: ${count} documents`)
  return count
}

async function migrate() {
  console.log('=== Migrate to Spaces Architecture ===\n')
  console.log('Loading service account key...')

  const app = initAdmin({
    credential: cert(loadServiceAccount()),
    projectId: PROJECT,
  })

  const db = getAdminFirestore(app)

  // Step 1: Copy existing pages and components to spaces/web/
  console.log('\nStep 1: Copy pages → spaces/web/pages')
  const pagesCount = await copyCollection(db, 'pages', 'spaces/web/pages')

  console.log('\nStep 2: Copy components → spaces/web/components')
  const componentsCount = await copyCollection(db, 'components', 'spaces/web/components')

  // Step 3: Create placeholder space docs so subcollections are discoverable
  console.log('\nStep 3: Initialize space metadata docs')
  const spaces = ['web', 'mobile-apps', 'kiosk', 'alerts']
  for (const space of spaces) {
    await db.doc(`spaces/${space}`).set(
      {
        name: space.charAt(0).toUpperCase() + space.slice(1),
        createdAt: Date.now(),
      },
      { merge: true },
    )
    console.log(`  Created spaces/${space}`)
  }

  console.log('\n=== Migration Complete ===')
  console.log(`  Pages migrated:      ${pagesCount}`)
  console.log(`  Components migrated: ${componentsCount}`)
  console.log(`  Spaces initialized:  ${spaces.join(', ')}`)
  console.log('\nNote: Original pages/ and components/ collections are preserved.')
  console.log('You can delete them manually after verifying the migration.')

  process.exit(0)
}

migrate().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
