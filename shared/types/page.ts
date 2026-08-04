export type PageSlug = 'about' | 'privacy' | 'contact'

export interface SitePage {
  slug: PageSlug
  title: string
  content: string
  updated_at: string
}

export interface SitePageInput {
  title?: string
  content?: string
}

export const PAGE_SLUGS: PageSlug[] = ['about', 'privacy', 'contact']

export function isPageSlug(value: string): value is PageSlug {
  return PAGE_SLUGS.includes(value as PageSlug)
}
