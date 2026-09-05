export type CmsBlogPostStatus = 'draft' | 'scheduled' | 'published'

export type CmsBlogBodyMode = 'editor' | 'markdown' | 'html'

export type CmsBlogCategory = {
  id: string
  name: string
  slug: string
}

export type CmsBlogPost = {
  slug: string
  title: string
  subtitle?: string
  excerpt?: string
  heroImage?: string
  heroVideo?: string
  bodyHtml: string
  bodyMode?: CmsBlogBodyMode
  markdownSource?: string
  categories?: string[]
  status: CmsBlogPostStatus
  publishedAt?: number
  seoTitle?: string
  seoDescription?: string
  ogImage?: string
  updatedAt?: number
  updatedBy?: string
  createdAt?: number
  createdBy?: string
}

export function normalizeBlogStatus(
  desired: CmsBlogPostStatus,
  publishedAt?: number,
): CmsBlogPostStatus {
  if (desired === 'draft') return 'draft'
  if (!publishedAt) return desired === 'scheduled' ? 'scheduled' : 'published'
  if (desired === 'published' && publishedAt > Date.now()) return 'scheduled'
  if (desired === 'scheduled' && publishedAt <= Date.now()) return 'published'
  return desired
}

export function isLiveBlogPost(post: Pick<CmsBlogPost, 'status' | 'publishedAt'>, now = Date.now()) {
  if (post.status === 'draft') return false
  if (post.status === 'published' && !post.publishedAt) return true
  if (!post.publishedAt) return false
  return post.publishedAt <= now && (post.status === 'published' || post.status === 'scheduled')
}
