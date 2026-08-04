export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody(event)
  const post = await createPost(event, body || {})
  setResponseStatus(event, 201)
  return { post }
})
