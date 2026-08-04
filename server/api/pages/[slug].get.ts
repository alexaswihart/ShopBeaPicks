export default defineEventHandler(async (event) => {
  const slug = parsePageSlug(getRouterParam(event, 'slug'))
  const page = await getPageBySlug(event, slug)
  if (!page) {
    throw createError({ statusCode: 404, statusMessage: 'Page not found' })
  }
  return { page }
})
