# Getting Started

A quick guide for developers joining a BEGIN the work CMS project.

## Prerequisites

- Node.js 20+
- npm
- A Firebase project with Firestore, Auth (Google provider), and Storage enabled

## Setup

1. Clone the repo
2. `npm install`
3. `cp .env.example .env` and fill Firebase web-app keys plus `VITE_ALLOWED_DOMAINS`
4. Point `.firebaserc` at the project ID
5. `npm run dev` — http://localhost:5174

Firebase + `.env` must already be in place (see [AGENT-HANDOFF.md](../AGENT-HANDOFF.md)). Sign in with a `@beginthework.com` account. New projects open **Client Setup** (brand and client login domain) until `settings/project.setupComplete` is true.

## Key URLs (local)

- `/web` — Web space pages
- `/web/design-system` — Brand tokens for the web space
- `/system/setup` — Client onboarding
- `/system/dev-docs` — In-app developer docs
- `/system/release-notes` — CMS release notes

## Auth

- Always allowed: `@beginthework.com`
- Extra domains: `VITE_ALLOWED_DOMAINS` (must also be added to `firestore.rules` and `storage.rules`)

## Project scripts

- `npm run dev` / `npm start` — Vite dev server
- `npm run build` — TypeScript check + production build
- `npm run preview` — Preview production build
- `npm run deploy` — Build + Firebase deploy

## Next

Follow [AGENT-HANDOFF.md](../AGENT-HANDOFF.md) when this clone is for a new client.
