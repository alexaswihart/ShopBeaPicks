export interface CoverImageMeta {
  url: string
  alt: string
  title: string
}

/** Parse stored cover_image (legacy URL or JSON metadata). */
export function parseCoverImage(value: string | null | undefined): CoverImageMeta | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null

  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as Partial<CoverImageMeta>
      if (parsed && typeof parsed.url === 'string' && parsed.url) {
        return {
          url: parsed.url,
          alt: typeof parsed.alt === 'string' ? parsed.alt : '',
          title: typeof parsed.title === 'string' ? parsed.title : ''
        }
      }
    } catch {
      // fall through to legacy URL
    }
  }

  return { url: trimmed, alt: '', title: '' }
}

export function serializeCoverImage(cover: CoverImageMeta | null | undefined): string | null {
  if (!cover?.url?.trim()) return null
  return JSON.stringify({
    url: cover.url.trim(),
    alt: (cover.alt || '').trim(),
    title: (cover.title || '').trim()
  })
}

export function coverImageUrl(value: string | null | undefined): string | null {
  return parseCoverImage(value)?.url || null
}
