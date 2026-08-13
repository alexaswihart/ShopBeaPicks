export default defineEventHandler(async (event) => {
  const settings = await getSiteSettings(event)
  return { settings }
})
