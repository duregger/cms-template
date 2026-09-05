export type BlogPostStatus = 'draft' | 'scheduled' | 'published'

export type PublicBlogPost = {
  slug?: string
  title?: string
  subtitle?: string
  excerpt?: string
  heroImage?: string
  heroVideo?: string
  bodyHtml?: string
  categories?: string[]
  status?: BlogPostStatus
  publishedAt?: number
  seoTitle?: string
  seoDescription?: string
  ogImage?: string
  updatedAt?: number
}

export function isLiveBlogPost(
  post: Pick<PublicBlogPost, 'status' | 'publishedAt'>,
  now = Date.now(),
): boolean {
  if (post.status === 'draft') return false
  if (post.status === 'published' && !post.publishedAt) return true
  if (!post.publishedAt) return false
  return post.publishedAt <= now && (post.status === 'published' || post.status === 'scheduled')
}

export function publicPostPayload(id: string, post: PublicBlogPost) {
  const slug = post.slug?.trim() || id
  return {
    slug,
    title: post.title ?? '',
    subtitle: post.subtitle ?? null,
    excerpt: post.excerpt ?? null,
    heroImage: post.heroImage ?? null,
    heroVideo: post.heroVideo ?? null,
    bodyHtml: post.bodyHtml ?? '',
    categories: post.categories ?? [],
    status: post.status ?? 'published',
    publishedAt: post.publishedAt ?? null,
    seoTitle: post.seoTitle ?? null,
    seoDescription: post.seoDescription ?? null,
    ogImage: post.ogImage || post.heroImage || null,
    updatedAt: post.updatedAt ?? null,
  }
}
