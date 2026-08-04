export function useAdminSession() {
  const identity = useState<{ email: string, name?: string } | null>('admin-identity', () => null)
  const status = useState<'idle' | 'pending' | 'success' | 'error'>('admin-identity-status', () => 'idle')

  async function refresh() {
    if (!import.meta.client) return

    status.value = 'pending'
    try {
      const res = await $fetch<{ identity: { email: string, name?: string } }>('/api/admin/me', {
        credentials: 'include'
      })
      const email = res?.identity?.email
      if (email && (email !== 'dev@localhost' || import.meta.dev)) {
        identity.value = res.identity
        status.value = 'success'
        return
      }
      identity.value = null
      status.value = 'error'
    } catch {
      identity.value = null
      status.value = 'error'
    }
  }

  const isLoggedIn = computed(() => Boolean(identity.value))

  if (import.meta.client) {
    onMounted(() => {
      refresh()
    })

    const route = useRoute()
    watch(
      () => route.path,
      () => {
        refresh()
      }
    )
  }

  return {
    identity,
    isLoggedIn,
    status,
    refresh
  }
}
