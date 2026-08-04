export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith('/admin')) return

  const config = useRuntimeConfig()
  // Local bypass — skip probe
  if (import.meta.dev && !config.public.accessTeamDomain) return

  try {
    await $fetch('/api/admin/me')
  } catch {
    if (import.meta.server) {
      // Let the page render; client will bounce to Access if needed
      return
    }
    const { redirectToAccessLogin } = useAccessLoginRedirect(to.fullPath)
    redirectToAccessLogin()
    return abortNavigation()
  }
})
