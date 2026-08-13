import { TextStyleKit } from '@tiptap/extension-text-style'

/** TextStyle + FontFamily + FontSize for the rich text editors. */
export const fontExtensions = [
  TextStyleKit.configure({
    backgroundColor: false,
    color: false,
    lineHeight: false
  })
]
