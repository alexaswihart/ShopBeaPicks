import type { H3Event } from 'h3'
import { createRemoteJWKSet, jwtVerify } from 'jose'

export interface AccessIdentity {
  email: string
  name?: string
}

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null
let jwksTeam = ''

function getJwks(teamDomain: string) {
  const host = teamDomain.replace(/^https?:\/\//, '').replace(/\/$/, '')
  if (!jwks || jwksTeam !== host) {
    jwksTeam = host
    jwks = createRemoteJWKSet(new URL(`https://${host}/cdn-cgi/access/certs`))
  }
  return jwks
}

/**
 * Access should protect /admin* (browser navigations only).
 * Do NOT put /api/admin* behind Access — XHR redirects cause CORS errors.
 * APIs trust the CF_Authorization cookie set after the /admin login.
 */
export async function requireAdmin(event: H3Event): Promise<AccessIdentity> {
  const config = useRuntimeConfig(event)

  // Bypass is local-dev only. Never honor it in production builds,
  // even if NUXT_ADMIN_DEV_BYPASS was accidentally set to true.
  if (import.meta.dev && String(config.adminDevBypass) === 'true') {
    return { email: 'dev@localhost', name: 'Local Dev' }
  }

  const token = getHeader(event, 'cf-access-jwt-assertion')
    || getCookie(event, 'CF_Authorization')

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized. Sign in via Cloudflare Access.'
    })
  }

  const teamDomain = String(config.public.accessTeamDomain || '')
  if (!teamDomain) {
    throw createError({
      statusCode: 500,
      statusMessage: 'NUXT_PUBLIC_ACCESS_TEAM_DOMAIN is not configured'
    })
  }

  let payload: Record<string, unknown>
  try {
    const verifyOpts: { issuer: string, audience?: string | string[] } = {
      issuer: `https://${teamDomain.replace(/^https?:\/\//, '')}`
    }
    const audience = String(config.accessAud || '')
    if (audience) {
      verifyOpts.audience = audience
    }

    const result = await jwtVerify(token, getJwks(teamDomain), verifyOpts)
    payload = result.payload as Record<string, unknown>
  } catch {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid or expired Access token. Sign in again.'
    })
  }

  const email = typeof payload.email === 'string' ? payload.email : null
  if (!email) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Access token is missing an email claim'
    })
  }

  const allowed = String(config.accessAllowedEmails || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)

  if (allowed.length && !allowed.includes(email.toLowerCase())) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Email is not allowed to administer this site'
    })
  }

  const name = typeof payload.name === 'string' ? payload.name : undefined
  return { email, name }
}
