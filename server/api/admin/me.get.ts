export default defineEventHandler(async (event) => {
  const identity = await requireAdmin(event)
  return { identity }
})
