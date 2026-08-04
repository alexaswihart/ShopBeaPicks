/**
 * Full-page navigation to /admin so Cloudflare Access can
 * intercept the request. Do not call the Access CDN login URL
 * directly — that often fails with "Unable to find your Access application"
 * if the app domain/path doesn't match exactly.
 */
export function useAccessLoginRedirect(defaultPath = '/admin') {
  function redirectToAccessLogin(redirectPath = defaultPath) {
    if (!import.meta.client) return
    const path = redirectPath.startsWith('/') ? redirectPath : `/${redirectPath}`
    window.location.assign(path)
  }

  return { redirectToAccessLogin }
}
