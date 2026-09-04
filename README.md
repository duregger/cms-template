# BEGIN the work CMS

Reusable content-management template for BEGIN the work client projects. React, TypeScript, Vite, and Firebase (Firestore, Auth, Storage, Hosting).

Stand up Firebase first (the app cannot load without it), then sign in and run Client Setup for brand and editor domain. Full order: [AGENT-HANDOFF.md](AGENT-HANDOFF.md).

**Always-admin domain:** `@beginthework.com`  
**Client editors:** add their Google Workspace domain in `.env` and security rules.

For the full stand-up checklist, start at [AGENT-HANDOFF.md](AGENT-HANDOFF.md).

## Prerequisites

- Node.js 20+
- npm
- A Firebase project with Auth (Google), Firestore, Storage, and Hosting

## Setup

```bash
npm install
cp .env.example .env
```

Fill `.env` from Firebase Console → Project Settings → General → Your apps. Set `VITE_ALLOWED_DOMAINS` to the client login domain (comma-separated, no `@`).

```bash
npm run dev
```

Runs on `http://localhost:5174`.

Sign in with a `@beginthework.com` account. If `settings/project` is not marked complete, you land on **Client Setup** (`/system/setup`) to record brand, logo, favicon, and the client login domain. Firebase project keys stay in `.env` — they are not collected in the wizard.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` / `npm start` | Vite dev server |
| `npm run build` | Type-check and production build into `dist/` |
| `npm run preview` | Preview the production build |
| `npm run migrate` | `scripts/migrate-firestore.ts` (set `SOURCE_PROJECT` / `TARGET_PROJECT`) |
| `npm run migrate:spaces` | `scripts/migrate-to-spaces.ts` |
| `npm run deploy` | Build, then `firebase deploy` |

## App structure

Routes are space-scoped (`/:space/*` — `web`, `mobile-apps`, `kiosk`, `alerts`):

- `pages/:slug` — page editor
- `components`, `components/:id` — reusable component library
- `design-system` — per-space brand tokens
- `announcement-bars`, `alerts/:alertType`, `notifications/:id` — alerts

System routes under `/system/*`:

- `setup` — client onboarding
- `release-notes`, `dev-docs`

## Auth

Google sign-in. [`src/lib/brand.ts`](src/lib/brand.ts) always allows `@beginthework.com`. Extra domains and emails come from `VITE_ALLOWED_DOMAINS` and `VITE_ALLOWED_EMAILS`. The same allowlist must be mirrored in [`firestore.rules`](firestore.rules) and [`storage.rules`](storage.rules) or client editors can sign in but cannot write.

## Further documentation

- [AGENT-HANDOFF.md](AGENT-HANDOFF.md) — collect-and-configure checklist
- [PROJECT-OVERVIEW.md](PROJECT-OVERVIEW.md)
- [Documentation/GETTING-STARTED.md](Documentation/GETTING-STARTED.md)
- [Documentation/ARCHITECTURE.md](Documentation/ARCHITECTURE.md)
- [Documentation/CMS-DATA-MODEL.md](Documentation/CMS-DATA-MODEL.md)
- [Documentation/DEPLOYMENT.md](Documentation/DEPLOYMENT.md)
