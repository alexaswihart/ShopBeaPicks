/**
 * Full-page navigation to /admin so Cloudflare Access can
 * intercept the request. Do not call the Access CDN login URL
 * directly — that often fails with "Unable to find your Access application"
 * if the app domain/path doesn't match exactly.
 *
 * Guard against redirect loops when Access has authenticated the HTML
 * page but /api/admin/* still returns 401 (e.g. cookie path scoped to /admin).
 */
export function useAccessLoginRedirect(defaultPath = '/admin') {
  const FLAG = 'sbp-access-login-attempt'

  function redirectToAccessLogin(redirectPath = defaultPath) {
    if (!import.meta.client) return
    const path = redirectPath.startsWith('/') ? redirectPath : `/${redirectPath}`

    try {
      if (sessionStorage.getItem(FLAG) === path) {
        sessionStorage.removeItem(FLAG)
        window.location.assign(`/?accessError=1`)
        return
      }
      sessionStorage.setItem(FLAG, path)
    } catch {
      // sessionStorage unavailable — fall through to single redirect
    }

    window.location.assign(path)
  }

  function clearAccessLoginAttempt() {
    if (!import.meta.client) return
    try {
      sessionStorage.removeItem(FLAG)
    } catch {
      // ignore
    }
  }

  return { redirectToAccessLogin, clearAccessLoginAttempt }
}
