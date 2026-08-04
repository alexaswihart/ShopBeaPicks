export default defineEventHandler(async (event) => {
  const keyParam = getRouterParam(event, 'key')
  if (!keyParam) {
    throw createError({ statusCode: 400, statusMessage: 'Image key is required' })
  }

  const key = Array.isArray(keyParam)
    ? keyParam.map(decodeURIComponent).join('/')
    : decodeURIComponent(String(keyParam))

  const { IMAGES } = useCloudflareEnv(event)
  if (!IMAGES) {
    throw createError({ statusCode: 500, statusMessage: 'R2 binding IMAGES is not available' })
  }

  const object = await IMAGES.get(key)
  if (!object) {
    throw createError({ statusCode: 404, statusMessage: 'Image not found' })
  }

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)
  headers.set('cache-control', 'public, max-age=31536000, immutable')

  return new Response(object.body, { headers })
})
