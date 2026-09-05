import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase'

const CMS_PREFIX = 'cms'

/**
 * Upload a file to Firebase Storage and return its public URL.
 * Path: cms/{type}/{filename}
 */
export type CmsAssetType =
  | 'hero-image'
  | 'paper-tear'
  | 'category'
  | 'video'
  | 'image'
  | 'og'
  | 'icon'
  | 'token-json'
  | 'font'
  | 'avatar'
  | 'logo'
  | 'logo-light'
  | 'logo-dark'
  | 'favicon'

export function isImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true
  return /\.(jpe?g|png|gif|webp|heic|heif|avif)$/i.test(file.name)
}

export async function uploadCmsAsset(
  file: File,
  type: CmsAssetType
): Promise<string> {
  const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
  const path = `${CMS_PREFIX}/${type}/${filename}`

  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}

/**
 * Persist the raw uploaded brand-token JSON for a space (re-download / audit).
 * Returns both the storage path and the public URL.
 * Path: cms/tokens/{space}/{ts}-{filename}.json
 */
export async function uploadRawTokenJson(
  space: string,
  rawJson: string,
  originalName = 'tokens.json'
): Promise<{ path: string; url: string }> {
  const safeName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_')
  const path = `${CMS_PREFIX}/tokens/${space}/${Date.now()}-${safeName}`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, new Blob([rawJson], { type: 'application/json' }))
  const url = await getDownloadURL(storageRef)
  return { path, url }
}

/**
 * Upload a self-hosted font file for a space.
 * Path: cms/fonts/{space}/{ts}-{filename}
 */
export async function uploadFontFile(space: string, file: File): Promise<string> {
  const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
  const path = `${CMS_PREFIX}/fonts/${space}/${filename}`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}
