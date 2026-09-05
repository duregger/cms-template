import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import type { CmsBlogBodyMode } from '@/types/blog'
import { BlogGallery } from '@/components/blog-gallery-extension'
import { EmojiPicker } from '@/components/EmojiPicker'
import { normalizeBlogBodyHtml, pastedBlogHtml } from '@/lib/blog-paste'
import { extractHeroImageFromHtml, markdownToHtml } from '@/lib/markdown-to-html'
import { isImageFile, uploadCmsAsset } from '@/lib/storage'

const ImageBlock = Image.extend({
  parseHTML() {
    return [{ tag: 'img[src]:not(figure.blog-gallery img)' }]
  },
})

export type BlogBodyEditorHandle = {
  getHtml: () => string
}

type Props = {
  mode: CmsBlogBodyMode
  html: string
  markdown: string
  disabled?: boolean
  onHtmlChange: (html: string) => void
  onMarkdownChange: (markdown: string) => void
  onHeroFromHtml?: (url: string) => void
}

export const BlogBodyEditor = forwardRef<BlogBodyEditorHandle, Props>(function BlogBodyEditor(
  { mode, html, markdown, disabled, onHtmlChange, onMarkdownChange, onHeroFromHtml },
  ref,
) {
  const imageInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<Editor | null>(null)
  const lastHtml = useRef(html)
  const [galleryBusy, setGalleryBusy] = useState(false)
  const [galleryError, setGalleryError] = useState<string | null>(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      ImageBlock.configure({
        HTMLAttributes: { class: 'blog-body-editor__img' },
      }),
      BlogGallery,
      Placeholder.configure({
        placeholder: 'Write your post…',
      }),
    ],
    content: html.trim() ? normalizeBlogBodyHtml(html) : '<p></p>',
    editable: !disabled,
    editorProps: {
      attributes: {
        class: 'blog-body-editor__prose font-emoji min-h-[16rem] px-3 py-2 focus:outline-none',
        spellcheck: 'true',
      },
      transformPastedHTML: (pasted) => normalizeBlogBodyHtml(pasted),
      handlePaste: (_view, event) => {
        const plain = event.clipboardData?.getData('text/plain') ?? ''
        const clipHtml = event.clipboardData?.getData('text/html') ?? ''
        if (!plain.trim() && !clipHtml.trim()) return false
        if (!/\p{Extended_Pictographic}/u.test(plain)) return false
        editorRef.current?.commands.insertContent(pastedBlogHtml(plain, clipHtml))
        return true
      },
    },
    onUpdate: ({ editor: instance }) => {
      const next = instance.getHTML()
      lastHtml.current = next
      onHtmlChange(next)
    },
  })
  editorRef.current = editor

  useEffect(() => {
    if (!editor) return
    editor.setEditable(!disabled)
  }, [editor, disabled])

  useEffect(() => {
    if (!editor || mode !== 'editor') return
    if (html === lastHtml.current) return
    const next = html.trim() ? normalizeBlogBodyHtml(html) : '<p></p>'
    if (editor.getHTML() !== next) {
      lastHtml.current = next
      editor.commands.setContent(next)
    }
  }, [editor, html, mode])

  useImperativeHandle(ref, () => ({
    getHtml: () => {
      if (mode === 'markdown') return markdownToHtml(markdown)
      if (mode === 'html') return html.trim() ? html : '<p></p>'
      return editor?.getHTML() ?? html ?? '<p></p>'
    },
  }), [editor, html, markdown, mode])

  const setLink = useCallback(() => {
    if (!editor) return
    const previous = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Link URL', previous || 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  const insertImage = useCallback(async (file: File) => {
    const url = await uploadCmsAsset(file, 'image')
    editor?.chain().focus().setImage({ src: url }).run()
  }, [editor])

  const insertGallery = useCallback(async (files: File[]) => {
    if (!editor) return
    const list = files.filter(isImageFile)
    if (list.length === 0) {
      setGalleryError('Choose image files (jpg, png, webp).')
      return
    }
    setGalleryBusy(true)
    setGalleryError(null)
    try {
      const images = []
      for (const file of list) {
        images.push({ src: await uploadCmsAsset(file, 'image'), alt: '' })
      }
      editor.chain().focus().insertBlogGallery(images).run()
    } catch (err) {
      setGalleryError(err instanceof Error ? err.message : 'Gallery upload failed.')
    } finally {
      setGalleryBusy(false)
    }
  }, [editor])

  const handleHtmlImport = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result || '')
      const next = text.trim() ? text : '<p></p>'
      onHtmlChange(next)
      const hero = extractHeroImageFromHtml(next)
      if (hero) onHeroFromHtml?.(hero)
    }
    reader.readAsText(file)
  }

  const toolbarBtn = (active: boolean, extra = '') =>
    `rounded px-2 py-1 text-xs font-medium ${
      active ? 'bg-brand-rest text-brand-ink-on-tint' : 'text-text-muted hover:bg-hairline-soft hover:text-brand-ink'
    } ${extra}`

  return (
    <div className="rounded-control border border-hairline">
      {mode === 'editor' && (
        <>
          <div className="flex flex-wrap items-center gap-0.5 border-b border-hairline px-2 py-1.5">
            <button type="button" className={toolbarBtn(!!editor?.isActive('bold'))} disabled={disabled} onClick={() => editor?.chain().focus().toggleBold().run()}>Bold</button>
            <button type="button" className={toolbarBtn(!!editor?.isActive('italic'))} disabled={disabled} onClick={() => editor?.chain().focus().toggleItalic().run()}>Italic</button>
            <button type="button" className={toolbarBtn(!!editor?.isActive('heading', { level: 2 }))} disabled={disabled} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
            <button type="button" className={toolbarBtn(!!editor?.isActive('heading', { level: 3 }))} disabled={disabled} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>H3</button>
            <button type="button" className={toolbarBtn(!!editor?.isActive('bulletList'))} disabled={disabled} onClick={() => editor?.chain().focus().toggleBulletList().run()}>List</button>
            <button type="button" className={toolbarBtn(!!editor?.isActive('orderedList'))} disabled={disabled} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>Numbered</button>
            <button type="button" className={toolbarBtn(!!editor?.isActive('blockquote'))} disabled={disabled} onClick={() => editor?.chain().focus().toggleBlockquote().run()}>Quote</button>
            <button type="button" className={toolbarBtn(!!editor?.isActive('link'))} disabled={disabled} onClick={setLink}>Link</button>
            <button type="button" className={toolbarBtn(false)} disabled={disabled} onClick={() => imageInputRef.current?.click()}>Image</button>
            <button type="button" className={toolbarBtn(!!editor?.isActive('blogGallery'))} disabled={disabled || galleryBusy} onClick={() => galleryInputRef.current?.click()}>{galleryBusy ? 'Uploading…' : 'Gallery'}</button>
            <EmojiPicker
              disabled={disabled}
              buttonClassName={toolbarBtn(false)}
              onPick={(emoji) => editor?.chain().focus().insertContent(emoji).run()}
            />
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (file) await insertImage(file)
              }}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={async (e) => {
                const files = e.target.files ? [...e.target.files] : []
                e.target.value = ''
                if (files.length > 0) await insertGallery(files)
              }}
            />
          </div>
          {galleryError && (
            <p className="border-b border-hairline px-3 py-1.5 text-xs text-danger">{galleryError}</p>
          )}
          <EditorContent editor={editor} className="blog-body-editor" />
        </>
      )}

      {mode === 'markdown' && (
        <textarea
          value={markdown}
          disabled={disabled}
          onChange={(e) => onMarkdownChange(e.target.value)}
          rows={16}
          placeholder="Write Markdown…"
          className="font-emoji w-full resize-y rounded-control bg-surface px-3 py-2 font-mono text-sm text-brand-ink focus:outline-none"
        />
      )}

      {mode === 'html' && (
        <div>
          <div className="flex items-center justify-between border-b border-hairline px-3 py-1.5">
            <span className="text-xs text-text-muted">Paste HTML or import a .html file</span>
            <label className="cursor-pointer text-xs font-medium text-brand-primary hover:underline">
              Import .html
              <input
                type="file"
                accept=".html,text/html"
                className="hidden"
                disabled={disabled}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  e.target.value = ''
                  if (file) handleHtmlImport(file)
                }}
              />
            </label>
          </div>
          <textarea
            value={html}
            disabled={disabled}
            onChange={(e) => onHtmlChange(e.target.value)}
            rows={16}
            placeholder="<p>Post HTML</p>"
            className="font-emoji w-full resize-y bg-surface px-3 py-2 font-mono text-sm text-brand-ink focus:outline-none"
          />
        </div>
      )}
    </div>
  )
})
