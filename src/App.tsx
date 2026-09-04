import { useEffect, useState, type ReactNode } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { auth, googleProvider } from '@/lib/firebase'
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { useDesignTokens } from '@/hooks/useDesignTokens'
import { useProjectSettings } from '@/hooks/useProjectSettings'
import { CmsLayout } from '@/components/CmsLayout'
import { SpaceProvider, SpaceContext } from '@/contexts/SpaceContext'
import { CmsPagesProvider } from '@/contexts/CmsPagesContext'
import { CmsComponentsProvider } from '@/contexts/CmsComponentsContext'
import { CmsAlertsProvider } from '@/contexts/CmsAlertsContext'
import { CmsPagesList } from '@/pages/CmsPagesList'
import { CmsPageEditor } from '@/pages/CmsPageEditor'
import { CmsComponentsList } from '@/pages/CmsComponentsList'
import { CmsComponentEditor } from '@/pages/CmsComponentEditor'
import { CmsAlertsList } from '@/pages/CmsAlertsList'
import { CmsAlertEditor } from '@/pages/CmsAlertEditor'
import { CmsReleaseNotes } from '@/pages/CmsReleaseNotes'
import { CmsDevDocs } from '@/pages/CmsDevDocs'
import { CmsDesignSystem } from '@/pages/CmsDesignSystem'
import { CmsSetup } from '@/pages/CmsSetup'
import { CMS_NAME, CMS_SHORT_NAME, allowedEditorDomains, parseAllowList } from '@/lib/brand'
import logo from '@/assets/logos/begin-logo.svg'
import logoWhite from '@/assets/logos/begin-logo-white.svg'

const ALLOWED_EMAILS = parseAllowList(import.meta.env.VITE_ALLOWED_EMAILS)
const ALLOWED_DOMAINS = allowedEditorDomains(import.meta.env.VITE_ALLOWED_DOMAINS)

function isAllowedEditor(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase() ?? ''
  return ALLOWED_EMAILS.includes(email.toLowerCase()) || ALLOWED_DOMAINS.includes(domain)
}

function SpaceRoutes({ user }: { user: User }) {
  return (
    <SpaceProvider>
      <CmsPagesProvider>
        <CmsComponentsProvider>
          <CmsAlertsProvider>
            <Routes>
              <Route element={<CmsLayout user={user} />}>
                <Route index element={<CmsPagesList user={user} />} />
                <Route path="pages/:slug" element={<CmsPageEditor user={user} />} />
                <Route path="components" element={<CmsComponentsList user={user} />} />
                <Route path="components/:id" element={<CmsComponentEditor user={user} />} />
                <Route path="design-system" element={<CmsDesignSystem />} />
                <Route path="announcement-bars" element={<CmsAlertsList user={user} />} />
                <Route path="alerts/:alertType" element={<CmsAlertsList user={user} />} />
                <Route path="notifications/new" element={<CmsAlertEditor user={user} />} />
                <Route path="notifications/:id" element={<CmsAlertEditor user={user} />} />
              </Route>
            </Routes>
          </CmsAlertsProvider>
        </CmsComponentsProvider>
      </CmsPagesProvider>
    </SpaceProvider>
  )
}

function SystemRoutes({ user }: { user: User }) {
  const defaultSpace = { space: 'web' as const }
  const { settings } = useProjectSettings()
  return (
    <SpaceContext.Provider value={defaultSpace}>
      <CmsPagesProvider>
        <CmsComponentsProvider>
          <Routes>
            <Route element={<CmsLayout user={user} />}>
              <Route path="setup" element={<CmsSetup user={user} initial={settings} />} />
              <Route path="release-notes" element={<CmsReleaseNotes />} />
              <Route path="dev-docs" element={<CmsDevDocs />} />
            </Route>
          </Routes>
        </CmsComponentsProvider>
      </CmsPagesProvider>
    </SpaceContext.Provider>
  )
}

function BrandPulse() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-ink">
      <img src={logoWhite} alt={CMS_SHORT_NAME} className="h-10 w-auto animate-pulse motion-reduce:animate-none" />
    </div>
  )
}

function SetupGate({ children }: { children: ReactNode }) {
  const { settings, loading } = useProjectSettings()
  const location = useLocation()

  if (loading) return <BrandPulse />

  const needsSetup = !settings?.setupComplete
  if (needsSetup && !location.pathname.startsWith('/system/setup')) {
    return <Navigate to="/system/setup" replace />
  }

  return <>{children}</>
}

function App() {
  useDesignTokens()

  const [user, setUser] = useState<User | null>(null)
  const [denied, setDenied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [signingIn, setSigningIn] = useState(false)

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      if (u) {
        const email = u.email ?? ''
        if (!isAllowedEditor(email)) {
          setDenied(true)
          firebaseSignOut(auth)
        } else {
          setUser(u)
          setDenied(false)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })
  }, [])

  const signIn = async () => {
    setSigningIn(true)
    setDenied(false)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch {
      // popup closed or error
    } finally {
      setSigningIn(false)
    }
  }

  if (loading) return <BrandPulse />

  if (!user) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-brand-ink px-6">
        <div className="w-full max-w-sm rounded-panel border border-hairline-soft bg-surface p-8 text-center shadow-panel">
          <img src={logo} alt={CMS_SHORT_NAME} className="mx-auto mb-8 h-10 w-auto" />

          <h1 className="font-headline text-xl text-brand-ink">{CMS_NAME}</h1>
          <p className="mt-2 font-body text-sm text-text-muted">
            Sign in with your {CMS_SHORT_NAME} Google account to access the CMS.
          </p>

          <button
            onClick={signIn}
            disabled={signingIn}
            className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-control border border-hairline bg-surface px-6 py-3 font-body text-sm font-medium text-brand-ink shadow-button transition-colors duration-state hover:bg-hairline-soft disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 2.58 9 2.58z" fill="#EA4335"/>
            </svg>
            {signingIn ? 'Signing in\u2026' : 'Sign in with Google'}
          </button>

          {denied && (
            <p role="alert" className="mt-4 font-body text-sm text-danger">
              Access is restricted to authorized accounts.
            </p>
          )}

          <p className="mt-8 font-body text-xs text-text-muted">
            {CMS_NAME}
          </p>
        </div>
      </div>
    )
  }

  return (
    <SetupGate>
      <Routes>
        <Route path="system/*" element={<SystemRoutes user={user} />} />
        <Route path=":space/*" element={<SpaceRoutes user={user} />} />
        <Route index element={<Navigate to="/web" replace />} />
        <Route path="*" element={<Navigate to="/web" replace />} />
      </Routes>
    </SetupGate>
  )
}

export default App
