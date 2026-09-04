# BEGIN the work CMS — Project Overview

Standalone content management system used as a template for BEGIN the work client projects. Built as its own Vite app, separate from any consumer site.

**Stack:** Vite + React 18 + TypeScript + Tailwind CSS + Firebase (Firestore, Auth, Storage)
**Repo:** `duregger/cms-template`

---

## Architecture

Each client gets its own Firebase project. Consumer sites read CMS data via a secondary Firebase app — no API layer for pages or components. The Alerts space also exposes a REST API via Cloud Functions.

```
┌─────────────────────┐       ┌─────────────────────┐
│  BEGIN the work CMS │       │  Client site / apps │
│  (this project)     │       │                     │
│  Editors write      │──────▶│  Reads CMS data     │
│  to Firestore       │ public│  via secondary      │
│                     │ reads │  Firebase app       │
└─────────────────────┘       └─────────────────────┘
```

### Security model

- **Reads:** Public (consumer apps need to display content)
- **Writes:** Authenticated editors — `@beginthework.com` always, plus an optional client domain
- **Auth:** Google Sign-In; app allowlist in [`src/App.tsx`](src/App.tsx), enforced again in Firestore/Storage rules
- **Client record:** `settings/project` (editor-only) — brand, assets, client login domain from Client Setup. Firebase project config lives in `.env`, not in this document.

---

## Data model (Firestore)

| Collection | Purpose |
|---|---|
| `spaces/{space}/pages` | Page content — sections, SEO, OpenGraph, parent/child |
| `spaces/{space}/components` | Reusable components with typed variable fields |
| `spaces/{space}/design-tokens` | Brand tokens applied as CSS custom properties |
| `spaces/alerts/notifications` | Announcement bars and alert modals |
| `settings/project` | Client setup: brand, logo/favicon, login domain |

---

## Features

- Spaces: Web, Apps, Kiosk, Alerts
- Page builder with reusable components and SEO / Open Graph fields
- Per-space design tokens
- Client Setup wizard for brand, Firebase, and auth domain
- Google sign-in with BEGIN the work as the permanent admin domain

---

## File structure

```
src/
├── App.tsx                    # Auth gate, first-run setup redirect, routes
├── lib/brand.ts               # Product name + always-admin domain
├── pages/CmsSetup.tsx         # Client onboarding wizard
├── hooks/useProjectSettings.ts
└── ...
```

See [AGENT-HANDOFF.md](AGENT-HANDOFF.md) to stand up a new client.
