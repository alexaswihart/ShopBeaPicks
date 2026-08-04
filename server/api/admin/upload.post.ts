const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
])

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const { IMAGES } = useCloudflareEnv(event)
  if (!IMAGES) {
    throw createError({
      statusCode: 500,
      statusMessage: 'R2 binding IMAGES is not available'
    })
  }

  const form = await readMultipartFormData(event)
  const file = form?.find(part => part.name === 'file' && part.data && part.filename)
  if (!file?.data || !file.filename) {
    throw createError({ statusCode: 400, statusMessage: 'file is required' })
  }

  const type = file.type || 'application/octet-stream'
  if (!ALLOWED_TYPES.has(type)) {
    throw createError({ statusCode: 400, statusMessage: 'Unsupported image type' })
  }

  if (file.data.byteLength > 5 * 1024 * 1024) {
    throw createError({ statusCode: 400, statusMessage: 'Image must be 5MB or smaller' })
  }

  const ext = file.filename.includes('.')
    ? file.filename.split('.').pop()?.toLowerCase()
    : type.split('/')[1]
  const key = `uploads/${crypto.randomUUID()}.${ext || 'bin'}`

  await IMAGES.put(key, file.data, {
    httpMetadata: { contentType: type }
  })

  return {
    url: `/api/images/${key}`,
    key
  }
})
