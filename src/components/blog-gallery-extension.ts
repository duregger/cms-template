import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { BlogGalleryView } from '@/components/BlogGalleryView'

export type BlogGalleryImage = {
  src: string
  alt: string
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    blogGallery: {
      insertBlogGallery: (images?: BlogGalleryImage[]) => ReturnType
    }
  }
}

function readImages(element: HTMLElement): BlogGalleryImage[] {
  const raw = element.getAttribute('data-images')
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as BlogGalleryImage[]
      if (Array.isArray(parsed)) {
        return parsed.filter((img) => img?.src)
      }
    } catch {
      // use <img> children
    }
  }
  return [...element.querySelectorAll('img')].map((img) => ({
    src: img.getAttribute('src') || '',
    alt: img.getAttribute('alt') || '',
  })).filter((img) => img.src)
}

export const BlogGallery = Node.create({
  name: 'blogGallery',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      images: {
        default: [] as BlogGalleryImage[],
        parseHTML: (element) => readImages(element),
        renderHTML: (attributes) => ({
          'data-images': JSON.stringify(attributes.images ?? []),
        }),
      },
    }
  },

  parseHTML() {
    return [
      { tag: 'figure.blog-gallery', priority: 100 },
      { tag: 'figure[data-type="blog-gallery"]', priority: 100 },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    const images = (node.attrs.images ?? []) as BlogGalleryImage[]
    return [
      'figure',
      mergeAttributes(HTMLAttributes, {
        class: 'blog-gallery',
        'data-type': 'blog-gallery',
      }),
      ...images.map((img) => ['img', { src: img.src, alt: img.alt || '' }]),
    ]
  },

  addCommands() {
    return {
      insertBlogGallery: (images = []) => ({ commands }) =>
        commands.insertContent({
          type: this.name,
          attrs: { images },
        }),
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(BlogGalleryView, {
      stopEvent({ event }) {
        const el = event.target
        if (!(el instanceof HTMLElement)) return false
        return !el.closest('button, input, textarea, label, select, a')
      },
    })
  },
})
