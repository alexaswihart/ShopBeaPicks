export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Slug is required' })
  }

  const published = await getPublishedPostBySlug(event, slug)
  if (published) {
    return { post: published }
  }

  // Admins can preview drafts at the public URL (read-only until Edit)
  try {
    await requireAdmin(event)
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'Post not found' })
  }

  const post = await getPostBySlug(event, slug)
  if (!post) {
    throw createError({ statusCode: 404, statusMessage: 'Post not found' })
  }

  return { post }
})
