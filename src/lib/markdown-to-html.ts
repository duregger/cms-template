/** Minimal Markdown → HTML for the blog Markdown body mode. */
export function markdownToHtml(source: string): string {
  const text = source.replace(/\r\n/g, '\n').trim()
  if (!text) return '<p></p>'

  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  const blocks = escaped.split(/\n{2,}/)
  return blocks.map((block) => {
    const heading = block.match(/^(#{1,4})\s+(.+)$/)
    if (heading?.[1] && heading[2]) {
      const level = heading[1].length
      return `<h${level}>${inline(heading[2])}</h${level}>`
    }
    if (/^[-*]\s/m.test(block) && block.split('\n').every((l) => /^[-*]\s/.test(l) || l.trim() === '')) {
      const items = block.split('\n').filter(Boolean).map((l) => `<li>${inline(l.replace(/^[-*]\s+/, ''))}</li>`)
      return `<ul>${items.join('')}</ul>`
    }
    if (/^\d+\.\s/m.test(block) && block.split('\n').every((l) => /^\d+\.\s/.test(l) || l.trim() === '')) {
      const items = block.split('\n').filter(Boolean).map((l) => `<li>${inline(l.replace(/^\d+\.\s+/, ''))}</li>`)
      return `<ol>${items.join('')}</ol>`
    }
    if (block.startsWith('&gt; ')) {
      return `<blockquote><p>${inline(block.replace(/^&gt; /gm, ''))}</p></blockquote>`
    }
    return `<p>${inline(block.replace(/\n/g, '<br />'))}</p>`
  }).join('')
}

function inline(value: string): string {
  return value
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" rel="noopener noreferrer">$1</a>')
}

export function extractHeroImageFromHtml(html: string): string | null {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i)
  const src = match?.[1]?.trim()
  return src || null
}
