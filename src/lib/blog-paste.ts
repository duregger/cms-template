const EMOJI_ONLY = /^(?:[\s\uFE0F\u200D]|\p{Extended_Pictographic}|\p{Emoji_Component})+$/u

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function hasEmoji(value: string): boolean {
  return /\p{Extended_Pictographic}/u.test(value)
}

function textOfHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
}

function replaceEmojiImages(html: string): string {
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    const alt = tag.match(/\balt=["']([^"']*)["']/i)?.[1] ?? ''
    return alt && EMOJI_ONLY.test(alt) ? alt : tag
  })
}

type Para = { attrs: string; inner: string }

function isEmojiOnly(html: string): boolean {
  const text = textOfHtml(html)
  return Boolean(text) && EMOJI_ONLY.test(text)
}

function mergeEmojiOnlyParas(paras: Para[]): Para[] {
  const out: Para[] = []
  for (let i = 0; i < paras.length; i += 1) {
    const block = paras[i]
    if (!block) continue
    if (!isEmojiOnly(block.inner)) {
      out.push({ ...block })
      continue
    }

    const prev = out[out.length - 1]
    if (prev && !isEmojiOnly(prev.inner)) {
      prev.inner = `${prev.inner.trim()} ${block.inner.trim()}`
      continue
    }

    const next = paras[i + 1]
    if (next && !isEmojiOnly(next.inner) && textOfHtml(next.inner)) {
      next.inner = `${block.inner.trim()} ${next.inner.trim()}`
      continue
    }

    out.push({ ...block })
  }
  return out
}

function flattenEmojiBreaks(inner: string): string {
  const parts = inner.split(/<br\s*\/?>/i)
  if (parts.length < 2) return inner
  const out: string[] = []
  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i] ?? ''
    if (!isEmojiOnly(part)) {
      out.push(part)
      continue
    }
    const prev = out[out.length - 1]
    if (prev && !isEmojiOnly(prev)) {
      out[out.length - 1] = `${prev.trim()} ${part.trim()}`
      continue
    }
    const next = parts[i + 1]
    if (next && textOfHtml(next) && !isEmojiOnly(next)) {
      parts[i + 1] = `${part.trim()} ${next.trim()}`
      continue
    }
    out.push(part)
  }
  return out.map((part) => part.trim()).filter(Boolean).join('<br>')
}

/** Keep 🧡💙 on the same line as the words they wrap. */
export function normalizeBlogBodyHtml(html: string): string {
  const withEmoji = replaceEmojiImages(html)
  const matches = [...withEmoji.matchAll(/<p(\s[^>]*)?>([\s\S]*?)<\/p>/gi)]
  if (matches.length === 0) return withEmoji

  const leftover = withEmoji.replace(/<p(\s[^>]*)?>([\s\S]*?)<\/p>/gi, '').trim()
  const paras = matches.map((m) => ({
    attrs: m[1] ?? '',
    inner: flattenEmojiBreaks(m[2] ?? ''),
  }))
  const merged = leftover ? paras : mergeEmojiOnlyParas(paras)
  let index = 0
  return withEmoji.replace(/<p(\s[^>]*)?>([\s\S]*?)<\/p>/gi, () => {
    const p = merged[index]
    index += 1
    if (!p) return ''
    return `<p${p.attrs}>${p.inner}</p>`
  })
}

export function plainTextToBlogHtml(text: string): string {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  while (lines.length > 0 && !lines[lines.length - 1]?.trim()) lines.pop()
  while (lines.length > 0 && !lines[0]?.trim()) lines.shift()
  if (lines.length === 0) return '<p></p>'
  return lines
    .map((line) => `<p>${line.trim() ? escapeHtml(line.trim()) : '<br>'}</p>`)
    .join('')
}

export function pastedBlogHtml(plain: string, html?: string): string {
  if (plain.trim() && hasEmoji(plain)) return plainTextToBlogHtml(plain)
  if (html?.trim()) return normalizeBlogBodyHtml(html)
  return plainTextToBlogHtml(plain)
}
