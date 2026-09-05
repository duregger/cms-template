import { useState } from 'react'
import { updateProfile, signOut as firebaseSignOut } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { uploadCmsAsset } from '@/lib/storage'
import { useDesignTokens } from '@/hooks/useDesignTokens'
import { ACCENT_PRESETS } from '@/lib/accent'

export interface ProfilePatch {
  displayName?: string
  photoURL?: string
}

interface AccountSheetProps {
  user: User
  open: boolean
  onClose: () => void
  onProfileChange: (patch: ProfilePatch) => void
}

export function initials(user: Pick<User, 'displayName' | 'email'>): string {
  const source = user.displayName?.trim() || user.email || ''
  if (!source) return '?'
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0]!.charAt(0) + parts[1]!.charAt(0)).toUpperCase()
  return source.slice(0, 2).toUpperCase()
}

export function AccountSheet({ user, open, onClose, onProfileChange }: AccountSheetProps) {
  const { tokens, saveTokens } = useDesignTokens()
  const [name, setName] = useState(user.displayName ?? '')
  const [savingName, setSavingName] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const nameDirty = name.trim() !== (user.displayName ?? '').trim()

  const handleSaveName = async () => {
    if (!auth.currentUser) return
    setSavingName(true)
    try {
      const displayName = name.trim()
      await updateProfile(auth.currentUser, { displayName })
      onProfileChange({ displayName })
    } catch (err) {
      console.error('[AccountSheet] Failed to update name', err)
    } finally {
      setSavingName(false)
    }
  }

  const handlePhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !auth.currentUser) return
    setUploadingPhoto(true)
    try {
      const photoURL = await uploadCmsAsset(file, 'avatar')
      await updateProfile(auth.currentUser, { photoURL })
      onProfileChange({ photoURL })
    } catch (err) {
      console.error('[AccountSheet] Failed to update photo', err)
    } finally {
      setUploadingPhoto(false)
      e.target.value = ''
    }
  }

  const handlePickAccent = (hex: string) => {
    saveTokens(
      { ...tokens, colors: { ...tokens.colors, 'brand-primary': hex } },
      user.email ?? undefined,
    )
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-panel ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden
      />
      <div
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-surface shadow-overlay transition-transform duration-panel ease-out"
        style={{ transform: open ? 'translateX(0)' : 'translateX(100%)' }}
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        aria-label="Account"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-hairline px-6 py-4">
          <span className="font-label text-sm text-brand-ink">Account</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-2 text-text-muted transition-colors duration-state hover:bg-hairline-soft hover:text-brand-ink"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="flex items-center gap-4">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt=""
                className="h-16 w-16 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-primary font-label text-lg text-brand-on">
                {initials(user)}
              </div>
            )}
            <label className="flex cursor-pointer items-center rounded-control border border-hairline bg-hairline-soft px-4 py-2 text-xs font-medium text-text-muted transition-colors duration-state hover:bg-hairline-soft">
              {uploadingPhoto ? 'Uploading…' : 'Change photo'}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handlePhotoFile}
                disabled={uploadingPhoto}
              />
            </label>
          </div>

          <label className="mt-6 flex flex-col gap-1">
            <span className="text-xs font-medium text-text-muted">Name</span>
            <div className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="min-w-0 flex-1 rounded-control border-hairline px-3 py-2 text-sm text-brand-ink border-2 focus:border-brand-primary focus:outline-none focus-visible:ring-0"
              />
              <button
                type="button"
                onClick={handleSaveName}
                disabled={!nameDirty || savingName}
                className="shrink-0 rounded-control bg-brand-primary px-4 py-2 text-xs font-medium text-brand-on shadow-button transition-colors duration-state hover:bg-brand-wash hover:text-brand-ink-on-tint disabled:opacity-50"
              >
                {savingName ? 'Saving…' : 'Save'}
              </button>
            </div>
          </label>

          <div className="mt-4 flex flex-col gap-1">
            <span className="text-xs font-medium text-text-muted">Email</span>
            <span className="text-sm text-text-muted">{user.email}</span>
          </div>

          <div className="my-6 border-t border-hairline" />

          <div>
            <span className="text-xs font-medium text-text-muted">CMS accent color</span>
            <div className="mt-2 flex flex-wrap gap-3">
              {ACCENT_PRESETS.map((preset) => {
                const active =
                  tokens.colors['brand-primary'].toLowerCase() === preset.hex.toLowerCase()
                return (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => handlePickAccent(preset.hex)}
                    title={preset.name}
                    aria-label={preset.name}
                    aria-pressed={active}
                    className={`h-8 w-8 rounded-full transition-shadow duration-state ${
                      active ? 'ring-2 ring-brand-ink ring-offset-2' : ''
                    }`}
                    style={{ backgroundColor: preset.hex }}
                  />
                )
              })}
            </div>
          </div>

          <div className="my-6 border-t border-hairline" />

          <button
            type="button"
            onClick={() => firebaseSignOut(auth)}
            className="w-full rounded-control border border-hairline px-4 py-2 text-sm font-medium text-text-muted transition-colors duration-state hover:bg-hairline-soft hover:text-brand-ink"
          >
            Sign out
          </button>
        </div>
      </div>
    </>
  )
}
