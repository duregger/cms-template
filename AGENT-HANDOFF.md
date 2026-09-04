# Agent handoff — stand up a client CMS

Use this file when cloning the template for a new client. The product chrome is **BEGIN the work CMS**. `@beginthework.com` is always an admin.

**Order matters.** Firebase and `.env` must exist before anyone can sign in. Client Setup (`/system/setup`) only records brand and the client login domain — it cannot create a Firebase project.

```
1. Collect client facts
2. Create Firebase + fill .env / rules / .firebaserc
3. npm install && npm run dev (or deploy)
4. Sign in as @beginthework.com
5. Run Client Setup (brand, logo, favicon, client domain)
6. If a client domain was added, update .env + rules and redeploy
```

## 1. Collect

- [ ] Brand name
- [ ] Consumer site URL
- [ ] Logo (SVG or PNG)
- [ ] Favicon set (ico / 16 / 32 / apple-touch / 192 / 512), or a folder to generate them from
- [ ] Client Google Workspace domain for editor login (e.g. `client.com`)
- [ ] Extra individual emails that should be allowed (rare)

## 2. Firebase (before the app can run)

Create a **new** Firebase project. Do not reuse another client’s project.

- [ ] Project created; note the **project ID**
- [ ] **Authentication** → Google provider on
- [ ] Authorized domains include the CMS host and `localhost`
- [ ] **Firestore** created (production mode; deploy these repo rules)
- [ ] **Storage** enabled
- [ ] **Hosting** site created (optional custom domain, e.g. `cms.client.com`)
- [ ] Web app registered: Project Settings → General → Your apps

```bash
cp .env.example .env
```

Fill from the Firebase web-app config. You can leave `VITE_ALLOWED_DOMAINS` empty until after Client Setup if only BEGIN will sign in first.

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_ALLOWED_DOMAINS=
VITE_ALLOWED_EMAILS=
```

Point [`.firebaserc`](.firebaserc) at the new project ID.

[`firestore.rules`](firestore.rules) and [`storage.rules`](storage.rules) already allow `@beginthework.com`. After Client Setup, add the client domain:

```
request.auth.token.email.matches('.*@(beginthework\\.com|client\\.com)$');
```

```bash
npm install
npm run dev          # local: http://localhost:5174
# or
npm run build && firebase deploy
```

## 3. Client Setup (in the app)

Sign in with a `@beginthework.com` account. If `settings/project.setupComplete` is false, the app opens **System → Client Setup**.

Record:

- Brand name and consumer site URL
- Logo and favicon (uploaded to Storage)
- Client login domain

Then add that domain to `VITE_ALLOWED_DOMAINS` and the rules match, and redeploy rules (and rebuild if env changed).

## 4. Verify

- [ ] `@beginthework.com` can sign in
- [ ] Client Setup can save
- [ ] A user at the client domain can sign in and write a draft page
- [ ] Any other domain is denied
