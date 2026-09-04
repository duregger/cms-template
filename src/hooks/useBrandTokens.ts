import { useCallback, useEffect, useState } from 'react'
import { getDoc, setDoc } from 'firebase/firestore'
import type { CmsSpace } from '@/types/cms'
import type { BrandTokens } from '@/types/tokens'
import { tokensDraftDoc, tokensPublishedDoc, tokenVersionDoc } from '@/lib/token-paths'

/** Firestore rejects explicit `undefined`; strip them before writing. */
function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => stripUndefinedDeep(v)) as unknown as T
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === undefined) continue
      out[k] = stripUndefinedDeep(v)
    }
    return out as T
  }
  return value
}

function withMeta(tokens: BrandTokens, space: CmsSpace, email?: string): BrandTokens {
  return {
    ...tokens,
    meta: { ...tokens.meta, space, updatedAt: Date.now(), updatedBy: email ?? '' },
  }
}

/**
 * Producer hook for the per-space brand-token system.
 *
 * Loads `spaces/{space}/design-tokens/{draft,published}` and exposes actions to
 * save a draft and publish (draft → published, with a version snapshot).
 *
 * NOTE: The legacy global `design-tokens/current` reader (`useDesignTokens`) is
 * intentionally left untouched so the running CMS chrome keeps working until the
 * migration lands.
 */
export function useBrandTokens(space: CmsSpace) {
  const [published, setPublished] = useState<BrandTokens | null>(null)
  const [draft, setDraft] = useState<BrandTokens | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([getDoc(tokensDraftDoc(space)), getDoc(tokensPublishedDoc(space))])
      .then(([draftSnap, pubSnap]) => {
        if (cancelled) return
        setDraft(draftSnap.exists() ? (draftSnap.data() as BrandTokens) : null)
        setPublished(pubSnap.exists() ? (pubSnap.data() as BrandTokens) : null)
      })
      .catch(() => {
        if (cancelled) return
        setDraft(null)
        setPublished(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [space])

  const saveDraft = useCallback(
    async (tokens: BrandTokens, email?: string) => {
      const payload = stripUndefinedDeep(withMeta(tokens, space, email))
      await setDoc(tokensDraftDoc(space), payload)
      setDraft(payload)
      return payload
    },
    [space],
  )

  const publish = useCallback(
    async (tokens: BrandTokens, email?: string) => {
      const payload = stripUndefinedDeep(withMeta(tokens, space, email))
      await setDoc(tokensPublishedDoc(space), payload)
      // Best-effort version snapshot for rollback; non-fatal on failure.
      try {
        await setDoc(tokenVersionDoc(space, String(payload.meta.updatedAt)), payload)
      } catch {
        /* ignore snapshot failure */
      }
      await setDoc(tokensDraftDoc(space), payload)
      setPublished(payload)
      setDraft(payload)
      return payload
    },
    [space],
  )

  return { published, draft, loading, saveDraft, publish }
}
