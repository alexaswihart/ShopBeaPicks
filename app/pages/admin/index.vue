<script setup lang="ts">
import type { PostListItem } from '#shared/types/post'

definePageMeta({
  middleware: 'admin'
})

const { data, status, error, refresh } = await useFetch<{ posts: PostListItem[] }>('/api/admin/posts', {
  key: 'admin-posts',
  credentials: 'include'
})

const posts = computed(() => data.value?.posts || [])
const toast = useToast()
const { redirectToAccessLogin } = useAccessLoginRedirect('/admin')

watchEffect(() => {
  if (error.value?.statusCode === 401 || error.value?.statusCode === 403) {
    redirectToAccessLogin()
  }
})

async function removePost(post: PostListItem) {
  const confirmed = confirm(`Delete “${post.title}”? This cannot be undone.`)
  if (!confirmed) return

  try {
    await $fetch(`/api/admin/posts/${post.id}`, { method: 'DELETE', credentials: 'include' })
    toast.add({ title: 'Post deleted', color: 'success' })
    await refresh()
  } catch (e: unknown) {
    const statusCode = e && typeof e === 'object' && 'statusCode' in e
      ? Number((e as { statusCode?: number }).statusCode)
      : 0
    if (statusCode === 401 || statusCode === 403) {
      redirectToAccessLogin()
      return
    }
    const message = e && typeof e === 'object' && 'data' in e
      ? String((e as { data?: { statusMessage?: string } }).data?.statusMessage || 'Delete failed')
      : 'Delete failed'
    toast.add({ title: message, color: 'error' })
  }
}

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<template>
  <UContainer class="py-10">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 class="text-2xl font-bold text-highlighted">
          Admin
        </h1>
        <p class="text-muted text-sm mt-1">
          Create drafts, publish posts, and edit existing content.
        </p>
      </div>
      <UButton
        to="/admin/posts/new"
        icon="i-lucide-plus"
        label="New post"
        color="primary"
      />
    </div>

    <div v-if="status === 'pending'" class="space-y-3">
      <USkeleton class="h-16 w-full" />
      <USkeleton class="h-16 w-full" />
    </div>

    <UAlert
      v-else-if="error"
      color="error"
      title="Could not load posts"
      :description="error.message || 'Make sure NUXT_ADMIN_DEV_BYPASS=true for local development, or sign in via Cloudflare Access.'"
    />

    <div v-else-if="!posts.length" class="rounded-lg border border-dashed border-default p-10 text-center">
      <p class="text-muted mb-4">
        No posts yet.
      </p>
      <UButton to="/admin/posts/new" label="Create your first post" />
    </div>

    <ul v-else class="divide-y divide-default rounded-lg border border-default overflow-hidden">
      <li
        v-for="post in posts"
        :key="post.id"
        class="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-default"
      >
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 flex-wrap">
            <NuxtLink
              :to="`/admin/posts/${post.id}`"
              class="font-semibold text-highlighted hover:text-primary truncate"
            >
              {{ post.title }}
            </NuxtLink>
            <UBadge
              :color="post.status === 'published' ? 'success' : 'neutral'"
              variant="subtle"
              size="sm"
            >
              {{ post.status }}
            </UBadge>
          </div>
          <p class="text-sm text-muted mt-1 truncate">
            /posts/{{ post.slug }} · updated {{ formatDate(post.updated_at) }}
          </p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <UButton
            v-if="post.status === 'published'"
            :to="`/posts/${post.slug}`"
            color="neutral"
            variant="ghost"
            icon="i-lucide-external-link"
            size="sm"
          />
          <UButton
            :to="`/admin/posts/${post.id}`"
            color="neutral"
            variant="soft"
            label="Edit"
            size="sm"
          />
          <UButton
            color="error"
            variant="ghost"
            icon="i-lucide-trash-2"
            size="sm"
            @click="removePost(post)"
          />
        </div>
      </li>
    </ul>
  </UContainer>
</template>
