import { Paragraph } from '@tiptap/extension-paragraph'

/**
 * Always emit &nbsp; for empty paragraphs so blank lines survive
 * markdown round-trips (TipTap's default only emits it for the 2nd+ empty para).
 */
export const ParagraphWithEmptyLines = Paragraph.extend({
  name: 'paragraph',
  renderMarkdown: (node, h) => {
    if (!node) return ''
    const content = Array.isArray(node.content) ? node.content : []
    if (content.length === 0) {
      return '&nbsp;'
    }
    return h.renderChildren(content)
  }
})

export default ParagraphWithEmptyLines
