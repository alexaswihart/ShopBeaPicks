export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody(event)
  const settings = await updateSiteSettings(event, body || {})
  return { settings }
})
