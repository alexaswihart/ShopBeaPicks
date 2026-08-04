export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const posts = await listAllPosts(event)
  return { posts }
})
