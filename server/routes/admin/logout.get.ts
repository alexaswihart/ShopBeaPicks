/**
 * Clear Access application cookies (site-domain logout 404s when Access
 * only protects /admin), then revoke the team SSO session if present.
 */
export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  const site = String(config.public.siteUrl || 'https://shopbeapicks.com').replace(/\/$/, '')
  const team = String(config.public.accessTeamDomain || '')
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')

  const clear = (name: string, path: string) => {
    setCookie(event, name, '', {
      path,
      maxAge: 0,
      httpOnly: true,
      secure: true,
      sameSite: 'none'
    })
  }

  for (const name of ['CF_Authorization', 'CF_AppSession', 'CF_Binding']) {
    clear(name, '/')
    clear(name, '/admin')
  }

  if (team) {
    const returnTo = encodeURIComponent(`${site}/`)
    return sendRedirect(event, `https://${team}/cdn-cgi/access/logout?returnTo=${returnTo}`, 302)
  }

  return sendRedirect(event, `${site}/`, 302)
})
