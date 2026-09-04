import { useEffect, useState, useCallback } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { accentScale } from '@/lib/accent'

export interface DesignTokens {
  colors: {
    'brand-primary': string
    'brand-cloud': string
    'brand-mist': string
    'brand-ink': string
    'brand-accent': string
    'brand-success': string
    'brand-gray': string
  }
  typography: {
    headlineSize: string
    subheaderSize: string
    bodySize: string
    buttonSize: string
  }
  buttons: {
    borderRadius: string
    primaryBg: string
    primaryText: string
    secondaryBg: string
    secondaryText: string
  }
  updatedAt?: number
  updatedBy?: string
}

export const DEFAULT_TOKENS: DesignTokens = {
  colors: {
    'brand-primary': '#3b3bff',
    'brand-cloud': '#eef1ff',
    'brand-mist': '#dfe4ff',
    'brand-ink': '#14142b',
    'brand-accent': '#ffb020',
    'brand-success': '#4d7c0f',
    'brand-gray': '#d4d4d4',
  },
  typography: {
    headlineSize: 'clamp(48px, 10vw, 91px)',
    subheaderSize: 'clamp(24px, 4vw, 46.991px)',
    bodySize: '16px',
    buttonSize: '22px',
  },
  buttons: {
    borderRadius: '100px',
    primaryBg: '#3b3bff',
    primaryText: '#eef1ff',
    secondaryBg: '#14142b',
    secondaryText: '#eef1ff',
  },
}

const DOC_REF = doc(db, 'design-tokens', 'current')

// Cache the last-applied CSS custom properties so index.html can paint them
// synchronously on the next load, before this hook's Firestore fetch resolves —
// otherwise every refresh flashes the static :root fallback color first.
const CACHE_KEY = 'cms-tokens-vars'

function cacheVars(vars: Record<string, string>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(vars))
  } catch {
    // localStorage unavailable (private mode, etc.) — flash-prevention is best-effort
  }
}

function applyTokens(tokens: DesignTokens) {
  const root = document.documentElement
  const vars: Record<string, string> = {}

  const set = (name: string, value: string) => {
    root.style.setProperty(name, value)
    vars[name] = value
  }

  for (const [key, value] of Object.entries(tokens.colors)) {
    set(`--${key}`, value)
  }
  set('--headline-size', tokens.typography.headlineSize)
  set('--subheader-size', tokens.typography.subheaderSize)
  set('--body-size', tokens.typography.bodySize)
  set('--button-size', tokens.typography.buttonSize)
  set('--btn-radius', tokens.buttons.borderRadius)
  set('--btn-primary-bg', tokens.buttons.primaryBg)
  set('--btn-primary-text', tokens.buttons.primaryText)
  set('--btn-secondary-bg', tokens.buttons.secondaryBg)
  set('--btn-secondary-text', tokens.buttons.secondaryText)

  const scale = accentScale(tokens.colors['brand-primary'])
  set('--brand-rest', scale.rest)
  set('--brand-hover', scale.hover)
  set('--brand-ink-on-tint', scale.ink)
  set('--brand-on', scale.on)
  set('--brand-rail', scale.rail)
  set('--brand-wash', scale.wash)

  cacheVars(vars)
}

export function useDesignTokens() {
  const [tokens, setTokens] = useState<DesignTokens>(DEFAULT_TOKENS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getDoc(DOC_REF)
      .then((snap) => {
        if (cancelled) return
        if (snap.exists()) {
          const data = snap.data() as DesignTokens
          const merged: DesignTokens = {
            colors: { ...DEFAULT_TOKENS.colors, ...data.colors },
            typography: { ...DEFAULT_TOKENS.typography, ...data.typography },
            buttons: { ...DEFAULT_TOKENS.buttons, ...data.buttons },
            updatedAt: data.updatedAt,
            updatedBy: data.updatedBy,
          }
          setTokens(merged)
          applyTokens(merged)
        } else {
          applyTokens(DEFAULT_TOKENS)
        }
      })
      .catch(() => {
        applyTokens(DEFAULT_TOKENS)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const saveTokens = useCallback(async (next: DesignTokens, email?: string) => {
    const payload = {
      ...next,
      updatedAt: Date.now(),
      updatedBy: email ?? '',
    }
    await setDoc(DOC_REF, payload)
    setTokens(payload)
    applyTokens(payload)
  }, [])

  const previewTokens = useCallback((next: DesignTokens) => {
    setTokens(next)
    applyTokens(next)
  }, [])

  return { tokens, loading, saveTokens, previewTokens }
}
