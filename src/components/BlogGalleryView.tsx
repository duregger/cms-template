import { useId, useRef, useState } from 'react'
import { NodeViewWrapper, type ReactNodeViewProps } from '@tiptap/react'
import { isImageFile, uploadCmsAsset } from '@/lib/storage'
import type { BlogGalleryImage } from '@/components/blog-gallery-extension'

export function BlogGalleryView({ node, updateAttributes, selected, deleteNode, editor }: ReactNodeViewProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const fieldId = useId()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const images = (node.attrs.images ?? []) as BlogGalleryImage[]
  const editable = editor.isEditable

  const setImages = (next: BlogGalleryImage[]) => updateAttributes({ images: next })

  const addFiles = async (files: FileList | File[]) => {
    const list = [...files].filter(isImageFile)
    if (list.length === 0) {
      setError('Choose image files (jpg, png, webp).')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const uploaded: BlogGalleryImage[] = []
      for (const file of list) {
        uploaded.push({ src: await uploadCmsAsset(file, 'image'), alt: '' })
      }
      setImages([...images, ...uploaded])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <NodeViewWrapper
      as="figure"
      className={`blog-gallery ${selected ? 'blog-gallery--selected' : ''}`}
      data-type="blog-gallery"
    >
      <div className="blog-gallery__toolbar" contentEditable={false}>
        <span className="blog-gallery__label">Gallery</span>
        {editable && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="text-xs font-medium text-brand-primary hover:underline disabled:opacity-50"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              {busy ? 'Uploading…' : images.length === 0 ? 'Add photos' : 'Add more'}
            </button>
            <button
              type="button"
              className="text-xs font-medium text-danger hover:underline"
              onClick={deleteNode}
            >
              Remove gallery
            </button>
          </div>
        )}
      </div>

      {error && <p className="blog-gallery__empty text-danger">{error}</p>}
      {images.length === 0 ? (
        <p className="blog-gallery__empty">{busy ? 'Uploading…' : 'No photos yet.'}</p>
      ) : (
        <ul className="blog-gallery__grid">
          {images.map((img, index) => (
            <li key={`${img.src}-${index}`} className="blog-gallery__item">
              <img src={img.src} alt={img.alt || ''} />
              {editable && (
                <div className="blog-gallery__meta">
                  <label className="sr-only" htmlFor={`${fieldId}-alt-${index}`}>
                    Alt text for photo {index + 1}
                  </label>
                  <input
                    id={`${fieldId}-alt-${index}`}
                    type="text"
                    value={img.alt}
                    placeholder="Alt text"
                    onChange={(e) => {
                      const next = images.map((item, i) => (
                        i === index ? { ...item, alt: e.target.value } : item
                      ))
                      setImages(next)
                    }}
                  />
                  <div className="blog-gallery__actions">
                    <button
                      type="button"
                      aria-label={`Move photo ${index + 1} earlier`}
                      disabled={index === 0}
                      onClick={() => {
                        if (index === 0) return
                        const next = [...images]
                        const current = next[index]
                        const prev = next[index - 1]
                        if (!current || !prev) return
                        next[index - 1] = current
                        next[index] = prev
                        setImages(next)
                      }}
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      aria-label={`Move photo ${index + 1} later`}
                      disabled={index === images.length - 1}
                      onClick={() => {
                        if (index >= images.length - 1) return
                        const next = [...images]
                        const current = next[index]
                        const after = next[index + 1]
                        if (!current || !after) return
                        next[index + 1] = current
                        next[index] = after
                        setImages(next)
                      }}
                    >
                      →
                    </button>
                    <button
                      type="button"
                      aria-label={`Remove photo ${index + 1}`}
                      onClick={() => setImages(images.filter((_, i) => i !== index))}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        disabled={!editable || busy}
        onChange={async (e) => {
          const files = e.target.files ? [...e.target.files] : []
          e.target.value = ''
          if (files.length > 0) await addFiles(files)
        }}
      />
    </NodeViewWrapper>
  )
}
