/**
 * Seed generator for per-space brand tokens.
 *
 * Normalizes the two real brand JSONs through the Track A importers and, if
 * Firebase Admin credentials are available, writes them to
 *   spaces/{space}/design-tokens/{draft,published}
 * (publish = draft copied to published). When credentials are NOT available it
 * instead emits the fully-normalized, validated BrandTokens (and the raw source
 * files) to scratch/seed/ so they can be imported via the /{space}/design-system UI.
 *
 * Usage:
 *   npx tsx scripts/seed-space-tokens.ts          # emit files (default)
 *   npx tsx scripts/seed-space-tokens.ts --write  # also write to Firestore if creds exist
 *
 * Credentials (any one):
 *   - your-cms-project-service-account.json (or FIREBASE_PROJECT_ID-service-account.json) in project root, or
 *   - GOOGLE_APPLICATION_CREDENTIALS pointing at a service-account JSON.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { importBrandTokens } from '../src/lib/token-import.ts'
import type { BrandTokens } from '../src/types/tokens.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = resolve(__dirname, '..')
const OUT = resolve(ROOT, 'scratch/seed')

// --- WEB source (the user's inline-pasted JSON → `web` space) --------------
const WEB_SOURCE = {
  colors: {
    semantic: {
      primary: { type: 'ref', ref: 'primary.500' },
      secondary: { type: 'ref', ref: 'secondary.500' },
      tertiary: { type: 'ref', ref: 'tertiary.500' },
      neutral: { type: 'ref', ref: 'neutral.500' },
      error: { type: 'ref', ref: 'error.500' },
      success: { type: 'ref', ref: 'success.500' },
      gray: { type: 'value', value: '#c0c0c0' },
      white: { type: 'value', value: '#fff' },
      black: { type: 'value', value: '#000' },
      background: { type: 'value', value: '#fff' },
      fontColor: { type: 'ref', ref: 'neutral.1000' },
    },
    brand: { '1': '#fed141', '2': '#4a0b71', '3': '#78be20', '4': '#fc6520', '5': '#3fb2f4' },
    primary: { '100': '#f5f2fd', '200': '#d0c2f4', '300': '#afa0ea', '400': '#8971de', '500': '#4f1bbf', '600': '#40199c' },
    secondary: { '100': '#fbf5d0', '200': '#faedc0', '300': '#f6df92', '400': '#f2d05c', '500': '#edd440', '600': '#cfa825' },
    tertiary: { '100': '#ffe7eb', '200': '#ffc5cf', '300': '#ffa6b8', '400': '#fd7b99', '500': '#f25280', '600': '#c84369' },
    neutral: { '0': '#fcf7f1', '25': '#f9f9fa', '50': '#f9fafb', '100': '#f3f4f6', '200': '#e5e7eb', '300': '#d1d5db', '400': '#9ca3af', '500': '#6b7280', '600': '#4b5563', '700': '#374151', '800': '#1f2937', '850': '#2a3037', '875': '#262b31', '900': '#111827', '1000': '#000' },
    error: { '100': '#fee2e2', '500': '#dc2626', '600': '#b7261f', '700': '#8c1d17' },
    success: { '100': '#dcfce7', '500': '#16a34a', '600': '#0a8a1e', '700': '#075a13' },
  },
  sizing: {
    layout: { 'mobile-header-height': '55px', 'header-height': '89px', 'desktop-header-height': '89px', 'subheader-height': '42px', 'side-nav-top': '0px' },
    spacing: { '00': '0px', '01': '2px', '02': '4px', '03': '6px', '04': '8px', '05': '12px', '06': '16px', '07': '24px', '08': '32px', '09': '40px', '10': '48px', '11': '64px', '12': '80px', '13': '96px', '14': '120px', '15': '160px', '16': '240px' },
    'border-radius': { '0': '0px', '01': '4px', '02': '8px', '03': '12px', '04': '16px', '05': '24px', '06': '32px', '07': '64px' },
    stroke: { '01': '1px', '02': '2px', '03': '3px', '04': '6px', '05': '8px', '06': '10px' },
    elevation: { '01': 'drop-shadow(0 2px 2px rgb(0 0 0 / 5%)) drop-shadow(0 2px 4px rgb(0 0 0 / 3%))', '02': 'drop-shadow(0 2px 6px rgb(0 0 0 / 16%)) drop-shadow(0 8px 16px rgb(0 0 0 / 10%))', '03': 'drop-shadow(0 1px 60px rgb(0 0 0 / 20%)) drop-shadow(0 1px 3px rgb(0 0 0 / 5%))' },
  },
  typography: {
    fontFamilies: { regular: "'Montserrat', sans-serif", heading: "'Rigero', sans-serif", sans: "'Inter', sans-serif" },
    scale: {
      bodyXSmall: { fontFamily: 'regular', fontSize: '10px', fontWeight: 500, lineHeight: '140%', letterSpacing: '0', textDecoration: 'none' },
      bodySmall: { fontFamily: 'regular', fontSize: '12px', fontWeight: 500, lineHeight: '140%', letterSpacing: '0', textDecoration: 'none' },
      bodyMedium: { fontFamily: 'regular', fontSize: '14px', fontWeight: 500, lineHeight: '150%', letterSpacing: '0', textDecoration: 'none' },
      bodyLarge: { fontFamily: 'regular', fontSize: '16px', fontWeight: 500, lineHeight: '150%', letterSpacing: '0', textDecoration: 'none' },
      bodyXLarge: { fontFamily: 'regular', fontSize: '18px', fontWeight: 500, lineHeight: '150%', letterSpacing: '0', textDecoration: 'none' },
      labelXSmall: { fontFamily: 'regular', fontSize: '10px', fontWeight: 900, lineHeight: '110%', letterSpacing: '0', textDecoration: 'none', textTransform: 'uppercase' },
      labelSmall: { fontFamily: 'regular', fontSize: '12px', fontWeight: 900, lineHeight: '110%', letterSpacing: '0', textDecoration: 'none', textTransform: 'uppercase' },
      labelMedium: { fontFamily: 'regular', fontSize: '14px', fontWeight: 900, lineHeight: '110%', letterSpacing: '0', textDecoration: 'none', textTransform: 'uppercase' },
      labelLarge: { fontFamily: 'regular', fontSize: '16px', fontWeight: 900, lineHeight: '110%', letterSpacing: '0', textDecoration: 'none', textTransform: 'uppercase' },
      labelXLarge: { fontFamily: 'regular', fontSize: '18px', fontWeight: 900, lineHeight: '110%', letterSpacing: '0', textDecoration: 'none', textTransform: 'uppercase' },
      headlineSmall: { fontFamily: 'regular', fontSize: '16px', fontWeight: 700, lineHeight: '120%', letterSpacing: '0', textDecoration: 'none' },
      headlineMedium: { fontFamily: 'regular', fontSize: '18px', fontWeight: 700, lineHeight: '120%', letterSpacing: '0', textDecoration: 'none' },
      headlineLarge: { fontFamily: 'regular', fontSize: '22px', fontWeight: 700, lineHeight: '120%', letterSpacing: '0', textDecoration: 'none', responsive: [{ breakpoint: 'md', fontSize: '32px' }] },
      displaySmall: { fontFamily: 'heading', fontSize: '24px', fontWeight: 700, lineHeight: '120%', letterSpacing: '0', textDecoration: 'none', margin: '0', padding: '0', responsive: [{ breakpoint: 'md', fontSize: '45px' }] },
      displayMedium: { fontFamily: 'heading', fontSize: '32px', fontWeight: 700, lineHeight: '120%', letterSpacing: '0', textDecoration: 'none', margin: '0', padding: '0', responsive: [{ breakpoint: 'md', fontSize: '64px' }] },
      displayLarge: { fontFamily: 'heading', fontSize: '45px', fontWeight: 700, lineHeight: '120%', letterSpacing: '0', textDecoration: 'none', margin: '0', padding: '0', responsive: [{ breakpoint: 'md', fontSize: '90px' }] },
    },
    icons: { iconXSmall: { fontSize: '8px' }, iconSmall: { fontSize: '12px' }, iconMedium: { fontSize: '16px' }, iconLarge: { fontSize: '24px' }, iconXLarge: { fontSize: '40px' }, iconXXLarge: { fontSize: '80px' } },
  },
}

const APP_SOURCE_PATH = '/Users/samduregger/Downloads/design-tokens (1).json'

/** Standard Google Fonts we can reference by name (no upload needed). */
const GOOGLE_FONTS = new Set(['Montserrat', 'Inter', 'Roboto', 'Open Sans', 'Lato', 'Poppins', 'Nunito Sans'])

function primaryFamilyName(stack: string): string {
  const m = stack.match(/^\s*['"]?([^'",]+)['"]?/)
  return (m?.[1] ?? stack).trim()
}

type FontRow = { space: string; role: string; family: string; classification: string; storedSource: string }

/**
 * Honest per-family classification: keep name-ref so seeding completes, but mark
 * non-Google custom faces as `system` (name-ref, upload pending) and collect them.
 */
function reclassifyFonts(tokens: BrandTokens, space: string, rows: FontRow[]): void {
  for (const [role, def] of Object.entries(tokens.typography.fontFamilies)) {
    const family = primaryFamilyName(def.stack)
    const isGoogle = GOOGLE_FONTS.has(family)
    if (isGoogle) {
      def.source = 'google'
      rows.push({ space, role, family, classification: 'google', storedSource: 'google' })
    } else {
      // Non-standard custom face → name-ref for now, flagged upload-pending.
      def.source = 'system'
      rows.push({ space, role, family, classification: 'uploaded-pending', storedSource: 'system' })
    }
  }
}

function seedSpace(space: string, source: unknown, format: 'web-v1' | 'app-v1', fontRows: FontRow[]): BrandTokens | null {
  const result = importBrandTokens(source, space as BrandTokens['meta']['space'], format)
  console.log(`\n[${space}] format=${format} ok=${result.ok}`)
  if (!result.ok) {
    console.log('  ERRORS:')
    result.errors.forEach((e) => console.log('   - ' + e))
    return null
  }
  reclassifyFonts(result.tokens, space, fontRows)
  result.warnings.forEach((w) => console.log('  warning: ' + w))
  console.log(`  scales: ${Object.keys(result.tokens.colors.scales).join(', ')}`)
  console.log(`  semanticResolved: ${Object.keys(result.tokens.colors.semanticResolved).length} tokens`)
  console.log(`  sizing groups: ${Object.keys(result.tokens.sizing).join(', ') || '(none)'}`)
  console.log(`  type scale entries: ${Object.keys(result.tokens.typography.scale).length}`)
  return result.tokens
}

function emit(space: string, source: unknown, tokens: BrandTokens): void {
  mkdirSync(OUT, { recursive: true })
  writeFileSync(resolve(OUT, `${space}.source.json`), JSON.stringify(source, null, 2))
  // draft and published receive identical content (publish = draft copied).
  writeFileSync(resolve(OUT, `${space}.brandtokens.published.json`), JSON.stringify(tokens, null, 2))
  writeFileSync(resolve(OUT, `${space}.brandtokens.draft.json`), JSON.stringify(tokens, null, 2))
  console.log(`  emitted → scratch/seed/${space}.source.json, ${space}.brandtokens.{draft,published}.json`)
}

function findServiceAccount(): string | null {
  const candidates = [
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    resolve(ROOT, `${process.env.FIREBASE_PROJECT_ID || 'your-cms-project'}-service-account.json`),
    resolve(ROOT, 'your-cms-project-service-account.json'),
  ].filter(Boolean) as string[]
  return candidates.find((p) => existsSync(p)) ?? null
}

// ---------------------------------------------------------------------------
// Verify mode (read-only): diff live Firestore docs vs emitted canonical files
// ---------------------------------------------------------------------------

/** Meta fields that are expected to differ (set at publish time). */
const VOLATILE_META = new Set(['updatedAt', 'updatedBy', 'rawStoragePath'])

function deepDiff(expected: unknown, actual: unknown, path: string, out: string[]): void {
  if (typeof expected !== typeof actual) {
    out.push(`${path}: type ${typeof expected} → ${typeof actual}`)
    return
  }
  if (expected && typeof expected === 'object') {
    const e = expected as Record<string, unknown>
    const a = (actual ?? {}) as Record<string, unknown>
    const keys = new Set([...Object.keys(e), ...Object.keys(a)])
    for (const k of keys) {
      if (path === 'meta' && VOLATILE_META.has(k)) continue
      if (!(k in e)) { out.push(`${path}.${k}: missing in expected (extra in live)`); continue }
      if (!(k in a)) { out.push(`${path}.${k}: missing in live`); continue }
      deepDiff(e[k], a[k], path ? `${path}.${k}` : k, out)
    }
    return
  }
  if (expected !== actual) out.push(`${path}: ${JSON.stringify(expected)} → ${JSON.stringify(actual)}`)
}

function counts(t: BrandTokens) {
  return {
    scales: Object.keys(t.colors?.scales ?? {}).length,
    semantics: Object.keys(t.colors?.semanticResolved ?? {}).length,
    sizingGroups: Object.keys(t.sizing ?? {}).length,
    typeScale: Object.keys(t.typography?.scale ?? {}).length,
  }
}

async function verify() {
  const { initializeApp, applicationDefault } = await import('firebase-admin/app')
  const { getFirestore } = await import('firebase-admin/firestore')
  const app = initializeApp({
    credential: applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'your-cms-project',
  })
  const db = getFirestore(app)

  const spaces = ['web', 'mobile-apps'] as const
  let allPass = true

  for (const space of spaces) {
    console.log(`\n========== ${space} ==========`)
    const expectedPath = resolve(OUT, `${space}.brandtokens.published.json`)
    if (!existsSync(expectedPath)) {
      console.log(`  FAIL: expected file missing (${expectedPath}). Re-run the seed generator first.`)
      allPass = false
      continue
    }
    const expected = JSON.parse(readFileSync(expectedPath, 'utf-8')) as BrandTokens

    const draftSnap = await db.doc(`spaces/${space}/design-tokens/draft`).get()
    const pubSnap = await db.doc(`spaces/${space}/design-tokens/published`).get()

    const draftExists = draftSnap.exists
    const pubExists = pubSnap.exists
    console.log(`  draft exists:     ${draftExists}`)
    console.log(`  published exists: ${pubExists}`)
    if (!pubExists) {
      console.log('  FAIL: published doc missing.')
      allPass = false
      continue
    }
    const pub = pubSnap.data() as BrandTokens
    const draft = draftExists ? (draftSnap.data() as BrandTokens) : null

    const c = counts(pub)
    console.log(`  counts → scales:${c.scales} semantics:${c.semantics} sizingGroups:${c.sizingGroups} typeScale:${c.typeScale}`)
    const ec = counts(expected)
    console.log(`  expected → scales:${ec.scales} semantics:${ec.semantics} sizingGroups:${ec.sizingGroups} typeScale:${ec.typeScale}`)

    // published == draft (ignoring volatile meta)?
    let pubVsDraft = 'n/a (no draft)'
    if (draft) {
      const d: string[] = []
      deepDiff(draft, pub, '', d)
      pubVsDraft = d.length === 0 ? 'identical' : `${d.length} diffs`
      if (d.length) console.log('  published vs draft diffs:', d.slice(0, 10))
    }
    console.log(`  published == draft: ${pubVsDraft}`)

    // published vs expected canonical (ignoring volatile meta)
    const diffs: string[] = []
    deepDiff(expected, pub, '', diffs)
    const meaningful = diffs.filter((d) => !d.startsWith('meta.warnings'))
    if (meaningful.length === 0) {
      console.log(`  RESULT: PASS ✅ (published matches expected canonical payload)`)
    } else {
      allPass = false
      console.log(`  RESULT: FAIL ❌ — ${meaningful.length} differing key(s):`)
      meaningful.slice(0, 40).forEach((d) => console.log('    - ' + d))
      if (meaningful.length > 40) console.log(`    …and ${meaningful.length - 40} more`)
    }
  }

  console.log(`\n=== OVERALL: ${allPass ? 'PASS ✅' : 'FAIL ❌'} ===`)
  process.exit(allPass ? 0 : 2)
}

async function main() {
  if (process.argv.includes('--verify')) {
    await verify()
    return
  }
  const wantWrite = process.argv.includes('--write')
  const fontRows: FontRow[] = []

  const appRaw = existsSync(APP_SOURCE_PATH) ? JSON.parse(readFileSync(APP_SOURCE_PATH, 'utf-8')) : null
  if (!appRaw) {
    console.error(`APP source not found at ${APP_SOURCE_PATH}`)
    process.exit(1)
  }

  const web = seedSpace('web', WEB_SOURCE, 'web-v1', fontRows)
  const app = seedSpace('mobile-apps', appRaw, 'app-v1', fontRows)

  if (!web || !app) {
    console.error('\nOne or more spaces failed validation; aborting.')
    process.exit(1)
  }

  console.log('\n=== Font classification ===')
  console.table(fontRows)

  const sa = findServiceAccount()
  if (wantWrite && sa) {
    console.log(`\nService account found (${sa}); writing to Firestore…`)
    const { initializeApp, cert } = await import('firebase-admin/app')
    const { getFirestore } = await import('firebase-admin/firestore')
    const admin = initializeApp({
      credential: cert(JSON.parse(readFileSync(sa, 'utf-8'))),
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'your-cms-project',
    })
    const db = getFirestore(admin)
    for (const [space, tokens] of [['web', web], ['mobile-apps', app]] as const) {
      await db.doc(`spaces/${space}/design-tokens/draft`).set(tokens)
      await db.doc(`spaces/${space}/design-tokens/published`).set(tokens)
      console.log(`  wrote spaces/${space}/design-tokens/{draft,published}`)
    }
    console.log('\n=== Firestore seed complete ===')
  } else {
    if (wantWrite && !sa) console.log('\n--write requested but NO service account found; emitting files instead.')
    console.log('\n=== Emitting seed files (no Firestore credentials) ===')
    emit('web', WEB_SOURCE, web)
    emit('mobile-apps', appRaw, app)
  }

  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
