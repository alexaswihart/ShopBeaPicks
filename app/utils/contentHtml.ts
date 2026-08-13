import { marked } from 'marked'

/** True when content is already HTML (vs legacy markdown). */
export function looksLikeHtml(content: string): boolean {
  const trimmed = content.trim()
  if (!trimmed.startsWith('<')) return false
  return /<\/[a-z][\s\S]*>/i.test(trimmed) || /^<(p|div|h[1-6]|ul|ol|blockquote|img|span)\b/i.test(trimmed)
}

/** Render stored content for display (HTML as-is; markdown via marked). */
export function contentToHtml(content: string): string {
  if (!content?.trim()) return ''
  if (looksLikeHtml(content)) return content
  return marked.parse(content, { async: false }) as string
}

/** Normalize content for the HTML TipTap editor (convert legacy plain/markdown once). */
export function toEditorHtml(content: string): string {
  if (!content?.trim()) return '<p></p>'
  if (looksLikeHtml(content)) return content.trim()
  // marked adds a trailing newline that can fight TipTap's v-model round-trip
  const html = marked.parse(content, { async: false }) as string
  return html.trim() || '<p></p>'
}
