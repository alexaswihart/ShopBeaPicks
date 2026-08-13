import type { EditorCustomHandlers, EditorToolbarItem } from '@nuxt/ui'
import type { Editor } from '@tiptap/vue-3'

const DEFAULT_FONT_FAMILY = 'Poppins'
const DEFAULT_FONT_SIZE = '14px'

/** CSS value written into the textStyle mark */
const FONT_FAMILIES = [
  { label: 'Poppins', fontFamily: 'Poppins' },
  { label: 'Nunito Sans', fontFamily: "'Nunito Sans'" }
] as const

const FONT_SIZES = [
  { label: '11', fontSize: '11px' },
  { label: '12', fontSize: '12px' },
  { label: '14', fontSize: '14px' },
  { label: '16', fontSize: '16px' },
  { label: '18', fontSize: '18px' },
  { label: '20', fontSize: '20px' },
  { label: '24', fontSize: '24px' },
  { label: '32', fontSize: '32px' },
  { label: '40', fontSize: '40px' }
] as const

/** Collapse CSS font stacks / quotes to a comparable family name. */
function normalizeFontFamily(value: unknown): string {
  if (value == null || value === '') {
    return DEFAULT_FONT_FAMILY
  }
  const primary = String(value)
    .split(',')[0]
    ?.trim()
    .replace(/^['"]+|['"]+$/g, '')
  return primary || DEFAULT_FONT_FAMILY
}

function currentFontFamily(editor: Editor): string {
  return normalizeFontFamily(editor.getAttributes('textStyle').fontFamily)
}

function currentFontSize(editor: Editor): string {
  return editor.getAttributes('textStyle').fontSize || DEFAULT_FONT_SIZE
}

export function useEditorFontToolbar(options: { withImageUpload?: boolean } = {}) {
  const { withImageUpload = false } = options

  const fontHandlers = {
    fontFamily: {
      canExecute: (editor: Editor) => editor.isEditable,
      execute: (editor: Editor, item?: { fontFamily?: string }) => {
        const next = item?.fontFamily || DEFAULT_FONT_FAMILY
        return editor.chain().focus().setFontFamily(next)
      },
      isActive: (editor: Editor, item?: { fontFamily?: string }) => {
        return currentFontFamily(editor) === normalizeFontFamily(item?.fontFamily)
      },
      isDisabled: undefined
    },
    fontSize: {
      canExecute: (editor: Editor) => editor.isEditable,
      execute: (editor: Editor, item?: { fontSize?: string }) => {
        const next = item?.fontSize || DEFAULT_FONT_SIZE
        if (next === DEFAULT_FONT_SIZE) {
          return editor.chain().focus().unsetFontSize()
        }
        return editor.chain().focus().setFontSize(next)
      },
      isActive: (editor: Editor, item?: { fontSize?: string }) => {
        return currentFontSize(editor) === (item?.fontSize || DEFAULT_FONT_SIZE)
      },
      isDisabled: undefined
    },
    ...(withImageUpload
      ? {
          imageUpload: {
            canExecute: (editor: Editor) => editor.can().insertContent({ type: 'imageUpload' }),
            execute: (editor: Editor) => editor.chain().focus().insertContent({ type: 'imageUpload' }),
            isActive: (editor: Editor) => editor.isActive('imageUpload'),
            isDisabled: undefined
          }
        }
      : {})
  } satisfies EditorCustomHandlers

  const fontGroup = [
    {
      icon: 'i-lucide-type',
      // Default label matches default font (same idea as Size → 14 when active)
      label: 'Poppins',
      trailingIcon: 'i-lucide-chevron-down',
      content: { align: 'start' as const },
      items: FONT_FAMILIES.map(font => ({
        kind: 'fontFamily' as const,
        fontFamily: font.fontFamily,
        label: font.label,
        style: { fontFamily: normalizeFontFamily(font.fontFamily) }
      }))
    },
    {
      icon: 'i-lucide-a-large-small',
      label: '14',
      trailingIcon: 'i-lucide-chevron-down',
      content: { align: 'start' as const },
      items: FONT_SIZES.map(size => ({
        kind: 'fontSize' as const,
        fontSize: size.fontSize,
        label: size.label
      }))
    }
  ]

  const toolbarItems = [
    [{
      kind: 'undo',
      icon: 'i-lucide-undo',
      tooltip: { text: 'Undo' }
    }, {
      kind: 'redo',
      icon: 'i-lucide-redo',
      tooltip: { text: 'Redo' }
    }],
    fontGroup,
    [{
      kind: 'mark',
      mark: 'bold',
      icon: 'i-lucide-bold',
      tooltip: { text: 'Bold' }
    }, {
      kind: 'mark',
      mark: 'italic',
      icon: 'i-lucide-italic',
      tooltip: { text: 'Italic' }
    }, ...(withImageUpload
      ? [{
          kind: 'mark' as const,
          mark: 'strike' as const,
          icon: 'i-lucide-strikethrough',
          tooltip: { text: 'Strikethrough' }
        }, {
          kind: 'mark' as const,
          mark: 'code' as const,
          icon: 'i-lucide-code',
          tooltip: { text: 'Code' }
        }]
      : [])],
    [{
      kind: 'bulletList',
      icon: 'i-lucide-list',
      tooltip: { text: 'Bullet list' }
    }, {
      kind: 'orderedList',
      icon: 'i-lucide-list-ordered',
      tooltip: { text: 'Ordered list' }
    }, ...(withImageUpload
      ? [{
          kind: 'blockquote' as const,
          icon: 'i-lucide-text-quote',
          tooltip: { text: 'Quote' }
        }]
      : []), {
      kind: 'link',
      icon: 'i-lucide-link',
      tooltip: { text: 'Link' }
    }, ...(withImageUpload
      ? [{
          kind: 'imageUpload' as const,
          icon: 'i-lucide-image',
          tooltip: { text: 'Upload image' }
        }]
      : [])]
  ] satisfies EditorToolbarItem<typeof fontHandlers>[][]

  return { customHandlers: fontHandlers, toolbarItems }
}
