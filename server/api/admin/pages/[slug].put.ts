export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const slug = parsePageSlug(getRouterParam(event, 'slug'))
  const body = await readBody(event)
  const page = await updatePage(event, slug, body || {})
  return { page }
})
