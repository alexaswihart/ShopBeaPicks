import type { H3Event } from 'h3'

export function useCloudflareEnv(event: H3Event) {
  const env = event.context.cloudflare?.env
  if (!env?.DB) {
    throw createError({
      statusCode: 500,
      statusMessage: 'D1 binding DB is not available. Check wrangler.jsonc and nitro-cloudflare-dev.'
    })
  }
  return env
}
