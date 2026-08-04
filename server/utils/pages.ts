import type { H3Event } from 'h3'
import type { PageSlug, SitePage, SitePageInput } from '#shared/types/page'
import { isPageSlug } from '#shared/types/page'

type PageRow = SitePage

function mapPage(row: PageRow): SitePage {
  return {
    slug: row.slug,
    title: row.title,
    content: row.content,
    updated_at: row.updated_at
  }
}

export function parsePageSlug(value: string | undefined): PageSlug {
  if (!value || !isPageSlug(value)) {
    throw createError({ statusCode: 404, statusMessage: 'Page not found' })
  }
  return value
}

export async function getPageBySlug(event: H3Event, slug: PageSlug): Promise<SitePage | null> {
  const { DB } = useCloudflareEnv(event)
  const row = await DB.prepare('SELECT slug, title, content, updated_at FROM pages WHERE slug = ?')
    .bind(slug)
    .first<PageRow>()
  return row ? mapPage(row) : null
}

export async function updatePage(
  event: H3Event,
  slug: PageSlug,
  input: SitePageInput
): Promise<SitePage> {
  const existing = await getPageBySlug(event, slug)
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Page not found' })
  }

  const { DB } = useCloudflareEnv(event)
  const now = new Date().toISOString()
  const title = input.title?.trim() || existing.title
  const content = input.content !== undefined ? input.content : existing.content

  await DB.prepare(`
    UPDATE pages
    SET title = ?, content = ?, updated_at = ?
    WHERE slug = ?
  `).bind(title, content, now, slug).run()

  const page = await getPageBySlug(event, slug)
  if (!page) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to update page' })
  }
  return page
}
