export default defineEventHandler(async (event) => {
  const posts = await listPublishedPosts(event)
  return { posts }
})
