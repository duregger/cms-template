# BEGIN the work CMS — Architecture

Standalone CMS admin app. Consumer sites and apps read Firestore directly; this app is the write surface.

## Tech stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3 | UI |
| TypeScript | 5.6 | Type safety |
| Vite | 5.4 | Build |
| Firebase | 12.9 | Firestore, Auth, Storage |
| Tailwind CSS | 3.4 | Styling |
| React Router | 6.28 | Routing |
| Firebase Hosting | — | Production hosting |

## Directory structure

```
cms-template/
├── AGENT-HANDOFF.md
├── Documentation/
├── functions/             # Alerts REST API
├── public/                # BEGIN favicons + fonts
├── scripts/
└── src/
    ├── App.tsx            # Auth gate + setup redirect
    ├── assets/logos/      # BEGIN wordmarks
    ├── components/
    ├── contexts/
    ├── hooks/
    ├── lib/               # firebase, brand, storage, cms-adapter
    ├── pages/
    └── types/
```

## Data flows

### CMS content

```
Editor writes in this app
    → Firestore spaces/{space}/pages|components
    → Consumer app secondary Firebase app
    → cms-adapter / page renderer
```

### Design tokens

```
spaces/{space}/design-tokens
    → useDesignTokens
    → CSS variables on :root
```

### Auth

```
Google popup
    → App allowlist (@beginthework.com + VITE_ALLOWED_DOMAINS)
    → Firestore / Storage rules (same domain match)
```

### Client setup

Firebase and `.env` are configured before the app runs (see AGENT-HANDOFF.md).

```
/system/setup
    → settings/project (brand, logo, favicon, client domain)
```

## Bootstrap

```
React.StrictMode
    → BrowserRouter
    → App (design tokens, auth)
    → SetupGate
    → space or system routes
```

## Related

- [CMS-DATA-MODEL.md](CMS-DATA-MODEL.md)
- [DEPLOYMENT.md](DEPLOYMENT.md)
- [../AGENT-HANDOFF.md](../AGENT-HANDOFF.md)
