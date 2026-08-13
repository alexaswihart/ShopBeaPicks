import type { H3Event } from 'h3'
import type { Post, PostInput, PostListItem, PostStatus } from '#shared/types/post'

type PostRow = Post

function mapPost(row: PostRow): Post {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    cover_image: row.cover_image,
    status: row.status,
    published_at: row.published_at,
    created_at: row.created_at,
    updated_at: row.updated_at
  }
}

function mapListItem(row: PostRow): PostListItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    cover_image: row.cover_image,
    status: row.status,
    published_at: row.published_at,
    created_at: row.created_at,
    updated_at: row.updated_at
  }
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'post'
}

/** Accept ISO or YYYY-MM-DD; return ISO string or null if empty/invalid. */
function normalizePostDate(value: string | null | undefined): string | null {
  if (value == null) return null
  const trimmed = String(value).trim()
  if (!trimmed) return null
  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid post date' })
  }
  return parsed.toISOString()
}

async function uniqueSlug(event: H3Event, base: string, excludeId?: string): Promise<string> {
  const { DB } = useCloudflareEnv(event)
  let slug = base
  let attempt = 1

  while (true) {
    const existing = excludeId
      ? await DB.prepare('SELECT id FROM posts WHERE slug = ? AND id != ?').bind(slug, excludeId).first()
      : await DB.prepare('SELECT id FROM posts WHERE slug = ?').bind(slug).first()

    if (!existing) return slug
    attempt += 1
    slug = `${base}-${attempt}`
  }
}

export async function listPublishedPosts(event: H3Event): Promise<PostListItem[]> {
  const { DB } = useCloudflareEnv(event)
  const { results } = await DB.prepare(`
    SELECT id, slug, title, excerpt, cover_image, status, published_at, created_at, updated_at
    FROM posts
    WHERE status = 'published'
    ORDER BY datetime(COALESCE(published_at, created_at)) DESC, datetime(created_at) DESC
  `).all<PostRow>()

  return (results || []).map(mapListItem)
}

export async function listAllPosts(event: H3Event): Promise<PostListItem[]> {
  const { DB } = useCloudflareEnv(event)
  const { results } = await DB.prepare(`
    SELECT id, slug, title, excerpt, cover_image, status, published_at, created_at, updated_at
    FROM posts
    ORDER BY datetime(COALESCE(published_at, created_at)) DESC, datetime(created_at) DESC
  `).all<PostRow>()

  return (results || []).map(mapListItem)
}

export async function getPublishedPostBySlug(event: H3Event, slug: string): Promise<Post | null> {
  const { DB } = useCloudflareEnv(event)
  const row = await DB.prepare(`
    SELECT * FROM posts WHERE slug = ? AND status = 'published'
  `).bind(slug).first<PostRow>()

  return row ? mapPost(row) : null
}

export async function getPostBySlug(event: H3Event, slug: string): Promise<Post | null> {
  const { DB } = useCloudflareEnv(event)
  const row = await DB.prepare(`
    SELECT * FROM posts WHERE slug = ?
  `).bind(slug).first<PostRow>()

  return row ? mapPost(row) : null
}

export async function getPostById(event: H3Event, id: string): Promise<Post | null> {
  const { DB } = useCloudflareEnv(event)
  const row = await DB.prepare('SELECT * FROM posts WHERE id = ?').bind(id).first<PostRow>()
  return row ? mapPost(row) : null
}

export async function createPost(event: H3Event, input: PostInput): Promise<Post> {
  const { DB } = useCloudflareEnv(event)
  const now = new Date().toISOString()
  const id = crypto.randomUUID()
  const title = input.title?.trim()
  if (!title) {
    throw createError({ statusCode: 400, statusMessage: 'Title is required' })
  }

  const status: PostStatus = input.status === 'published' ? 'published' : 'draft'
  const baseSlug = slugify(input.slug?.trim() || title)
  const slug = await uniqueSlug(event, baseSlug)
  const excerpt = input.excerpt?.trim() || ''
  const content = input.content || ''
  const coverImage = input.cover_image ?? null
  // Prefer explicit date from admin; otherwise use creation time (do not special-case publish).
  const publishedAt = normalizePostDate(input.published_at) || now

  await DB.prepare(`
    INSERT INTO posts (id, slug, title, excerpt, content, cover_image, status, published_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, slug, title, excerpt, content, coverImage, status, publishedAt, now, now).run()

  const post = await getPostById(event, id)
  if (!post) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to create post' })
  }
  return post
}

export async function updatePost(event: H3Event, id: string, input: PostInput): Promise<Post> {
  const existing = await getPostById(event, id)
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Post not found' })
  }

  const { DB } = useCloudflareEnv(event)
  const now = new Date().toISOString()
  const title = input.title?.trim() || existing.title
  const status: PostStatus = input.status === 'published' || input.status === 'draft'
    ? input.status
    : existing.status
  const baseSlug = slugify(input.slug?.trim() || existing.slug || title)
  const slug = await uniqueSlug(event, baseSlug, id)
  const excerpt = input.excerpt !== undefined ? input.excerpt.trim() : existing.excerpt
  const content = input.content !== undefined ? input.content : existing.content
  const coverImage = input.cover_image !== undefined ? input.cover_image : existing.cover_image

  // Never auto-bump the blog date on save. Only change when the admin sends published_at.
  let publishedAt = existing.published_at || existing.created_at
  if (input.published_at !== undefined) {
    publishedAt = normalizePostDate(input.published_at) || existing.created_at
  }

  await DB.prepare(`
    UPDATE posts
    SET slug = ?, title = ?, excerpt = ?, content = ?, cover_image = ?, status = ?, published_at = ?, updated_at = ?
    WHERE id = ?
  `).bind(slug, title, excerpt, content, coverImage, status, publishedAt, now, id).run()

  const post = await getPostById(event, id)
  if (!post) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to update post' })
  }
  return post
}

export async function deletePost(event: H3Event, id: string): Promise<void> {
  const { DB } = useCloudflareEnv(event)
  const result = await DB.prepare('DELETE FROM posts WHERE id = ?').bind(id).run()
  if (!result.meta.changes) {
    throw createError({ statusCode: 404, statusMessage: 'Post not found' })
  }
}
