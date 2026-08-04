export function useAdminSession() {
  const { data, status, refresh, error } = useFetch<{
    identity: { email: string, name?: string }
  }>('/api/admin/me', {
    key: 'admin-me',
    credentials: 'include'
  })

  const identity = computed(() => {
    const email = data.value?.identity?.email
    if (!email) return null
    // Local bypass identity is only trusted in dev
    if (email === 'dev@localhost' && !import.meta.dev) return null
    return data.value!.identity
  })

  const isLoggedIn = computed(() => Boolean(identity.value))

  return {
    identity,
    isLoggedIn,
    status,
    error,
    refresh
  }
}
