# Deployment Guide

Build and deploy BEGIN the work CMS to Firebase Hosting, plus Firestore/Storage rules and Cloud Functions.

## Build

```bash
npm run build
# tsc -b && vite build → dist/
```

Vite bakes `VITE_*` env vars into the bundle at build time.

## Firebase Hosting

[`firebase.json`](../firebase.json) publishes `dist/` with an SPA rewrite to `index.html`.

## Deploy

```bash
npm run build
firebase deploy --only hosting
firebase deploy
```

Preview a channel:

```bash
firebase hosting:channel:deploy preview-name
```

## Environment variables

Required in `.env` (see `.env.example`):

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_ALLOWED_DOMAINS
VITE_ALLOWED_EMAILS
```

Point [`.firebaserc`](../.firebaserc) at the client Firebase project before deploy.

## Security rules

[`firestore.rules`](../firestore.rules) and [`storage.rules`](../storage.rules):

- Public read on content paths
- Writes for `@beginthework.com` plus any client domain you add to the email match
- `settings/*` is editor-only

## CI

GitHub Actions with `firebase-tools` is a good default. Store the service account as a secret. Do not commit `.env` or `*service-account*.json`.
