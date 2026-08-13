<script setup lang="ts">
import type { PostListItem } from '#shared/types/post'
import type { HomeSettings } from '#shared/types/siteSettings'
import { DEFAULT_HOME_SETTINGS } from '#shared/types/siteSettings'
import { parseCoverImage } from '#shared/utils/coverImage'

const toast = useToast()
const route = useRoute()
const { isLoggedIn, isAdminView, status: sessionStatus } = useAdminSession()
const { redirectToAccessLogin } = useAccessLoginRedirect('/')

const {
  data: settingsData,
  refresh: refreshSettings
} = await useFetch<{ settings: HomeSettings }>('/api/site-settings', {
  key: 'home-settings'
})

const homeTitle = computed(() => settingsData.value?.settings.homeTitle || DEFAULT_HOME_SETTINGS.homeTitle)
const homeSubtitle = computed(() => settingsData.value?.settings.homeSubtitle || DEFAULT_HOME_SETTINGS.homeSubtitle)

const editingHeader = ref(false)
const savingHeader = ref(false)
const draftTitle = ref('')
const draftSubtitle = ref('')

function startHeaderEdit() {
  draftTitle.value = homeTitle.value
  draftSubtitle.value = homeSubtitle.value
  editingHeader.value = true
}

function cancelHeaderEdit() {
  editingHeader.value = false
}

async function saveHeaderEdit() {
  if (!draftTitle.value.trim()) {
    toast.add({ title: 'Title is required', color: 'error' })
    return
  }

  savingHeader.value = true
  try {
    await $fetch('/api/admin/site-settings', {
      method: 'PUT',
      credentials: 'include',
      body: {
        homeTitle: draftTitle.value.trim(),
        homeSubtitle: draftSubtitle.value.trim()
      }
    })
    toast.add({ title: 'Home header saved', color: 'success' })
    editingHeader.value = false
    await refreshSettings()
  } catch (e: unknown) {
    const statusCode = e && typeof e === 'object' && 'statusCode' in e
      ? Number((e as { statusCode?: number }).statusCode)
      : 0
    if (statusCode === 401 || statusCode === 403) {
      redirectToAccessLogin()
      return
    }
    const message = e && typeof e === 'object' && 'data' in e
      ? String((e as { data?: { statusMessage?: string } }).data?.statusMessage || 'Save failed')
      : 'Save failed'
    toast.add({ title: message, color: 'error' })
  } finally {
    savingHeader.value = false
  }
}

const {
  data: publishedData,
  status: publishedStatus,
  error: publishedError
} = await useFetch<{ posts: PostListItem[] }>('/api/posts', {
  key: 'published-posts'
})

const {
  data: adminData,
  status: adminStatus,
  error: adminError,
  refresh: refreshAdmin
} = await useFetch<{ posts: PostListItem[] }>('/api/admin/posts', {
  key: 'admin-posts-home',
  credentials: 'include',
  immediate: false,
  watch: false
})

async function loadAdminPosts() {
  if (!isLoggedIn.value) return
  await refreshAdmin()
}

watch(
  [isLoggedIn, sessionStatus],
  ([loggedIn, sess]) => {
    if (loggedIn && sess === 'success') {
      loadAdminPosts()
    }
  },
  { immediate: true }
)

watch(isAdminView, (adminView) => {
  if (!adminView) {
    editingHeader.value = false
  }
  if (adminView && isLoggedIn.value) {
    loadAdminPosts()
  }
})

watch(adminError, (err) => {
  if (!err || !isAdminView.value) return
  if (err.statusCode === 401 || err.statusCode === 403) {
    redirectToAccessLogin()
  }
})

const posts = computed<PostListItem[]>(() => {
  if (isAdminView.value) {
    return adminData.value?.posts || []
  }
  return publishedData.value?.posts || []
})

const listStatus = computed(() => {
  if (isAdminView.value) {
    // Wait for session before treating admin list as ready
    if (sessionStatus.value === 'idle' || sessionStatus.value === 'pending') {
      return 'pending'
    }
    if (!isLoggedIn.value) {
      return publishedStatus.value
    }
    // First admin load
    if (adminStatus.value === 'pending' && !adminData.value) {
      return 'pending'
    }
    return adminStatus.value === 'idle' && !adminData.value ? 'pending' : adminStatus.value
  }
  return publishedStatus.value
})

const listError = computed(() => {
  if (isAdminView.value) {
    return adminError.value
  }
  return publishedError.value
})

function coverFor(post: PostListItem) {
  return parseCoverImage(post.cover_image)
}

useSeoMeta({
  title: 'ShopBeaPicks',
  description: () => homeSubtitle.value
})

onMounted(() => {
  if (route.query.accessError === '1') {
    toast.add({
      title: 'Admin sign-in failed',
      description: 'Access authenticated, but the admin API could not read your session cookie. In Zero Trust → your Access app → Advanced → Cookie settings, turn OFF “Cookie Path Attribute”, then try again.',
      color: 'error',
      duration: 12000
    })
    navigateTo('/', { replace: true })
  }
})

async function removePost(post: PostListItem) {
  const confirmed = confirm(`Delete “${post.title}”? This cannot be undone.`)
  if (!confirmed) return

  try {
    await $fetch(`/api/admin/posts/${post.id}`, {
      method: 'DELETE',
      credentials: 'include'
    })
    toast.add({ title: 'Post deleted', color: 'success' })
    await Promise.all([
      refreshAdmin(),
      refreshNuxtData('published-posts')
    ])
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
  if (!value) return ''
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<template>
  <UContainer class="py-10 sm:py-14">
    <div class="max-w-2xl mx-auto">
      <div class="mb-10 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div class="min-w-0 flex-1">
          <template v-if="!editingHeader">
            <h1 class="text-3xl sm:text-4xl font-bold text-navy-600 dark:text-highlighted tracking-tight">
              {{ homeTitle }}
            </h1>
            <p class="mt-2 text-muted">
              {{ homeSubtitle }}
            </p>
          </template>
          <div
            v-else
            class="space-y-3"
          >
            <UInput
              v-model="draftTitle"
              size="xl"
              class="w-full font-bold"
              aria-label="Home heading"
            />
            <UTextarea
              v-model="draftSubtitle"
              :rows="2"
              class="w-full"
              aria-label="Home subtitle"
            />
          </div>
        </div>
        <div
          v-if="isAdminView"
          class="flex flex-wrap gap-2 shrink-0"
        >
          <template v-if="!editingHeader">
            <UButton
              color="neutral"
              variant="soft"
              icon="i-lucide-pencil"
              label="Edit header"
              @click="startHeaderEdit"
            />
            <UButton
              to="/admin/posts/new"
              color="primary"
              icon="i-lucide-plus"
              label="New post"
            />
          </template>
          <template v-else>
            <UButton
              color="neutral"
              variant="soft"
              label="Cancel"
              :disabled="savingHeader"
              @click="cancelHeaderEdit"
            />
            <UButton
              color="primary"
              label="Save"
              :loading="savingHeader"
              @click="saveHeaderEdit"
            />
          </template>
        </div>
      </div>

      <div v-if="listStatus === 'pending'" class="space-y-4">
        <USkeleton class="h-28 w-full" />
        <USkeleton class="h-28 w-full" />
      </div>

      <UAlert
        v-else-if="listError"
        color="error"
        title="Could not load posts"
        :description="listError.message"
      />

      <div v-else-if="!posts.length" class="rounded-lg border border-default p-8 text-center">
        <p class="text-muted">
          {{ isAdminView ? 'No posts yet.' : 'No published posts yet. Check back soon.' }}
        </p>
        <UButton
          v-if="isAdminView"
          to="/admin/posts/new"
          class="mt-4"
          label="Create your first post"
        />
      </div>

      <ul v-else class="divide-y divide-default">
        <li
          v-for="post in posts"
          :key="post.id"
          class="py-6 first:pt-0"
        >
          <div class="flex gap-3 sm:gap-4 items-start">
            <NuxtLink
              :to="`/posts/${post.slug}`"
              class="group min-w-0 flex-1 block"
            >
              <div class="flex gap-4">
                <img
                  v-if="coverFor(post)"
                  :src="coverFor(post)!.url"
                  :alt="coverFor(post)!.alt || post.title"
                  :title="coverFor(post)!.title || undefined"
                  class="w-20 h-20 sm:w-28 sm:h-28 object-cover rounded-md shrink-0"
                >
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2 flex-wrap mb-1">
                    <p v-if="post.published_at" class="text-xs text-muted">
                      {{ formatDate(post.published_at) }}
                    </p>
                    <UBadge
                      v-if="isAdminView && post.status !== 'published'"
                      color="secondary"
                      variant="subtle"
                      size="sm"
                    >
                      {{ post.status }}
                    </UBadge>
                  </div>
                  <h2 class="text-xl font-semibold text-navy-600 dark:text-highlighted group-hover:text-secondary transition-colors">
                    {{ post.title }}
                  </h2>
                  <p class="mt-2 text-muted line-clamp-3">
                    {{ post.excerpt || 'Read the full story →' }}
                  </p>
                  <span class="mt-3 inline-flex items-center gap-1 text-sm text-sky-500 font-medium">
                    Read more
                    <UIcon name="i-lucide-arrow-right" class="size-4" />
                  </span>
                </div>
              </div>
            </NuxtLink>

            <div
              v-if="isAdminView"
              class="flex flex-col sm:flex-row gap-1 shrink-0"
            >
              <UButton
                :to="`/admin/posts/${post.id}`"
                color="neutral"
                variant="soft"
                icon="i-lucide-pencil"
                size="sm"
                aria-label="Edit post"
              />
              <UButton
                color="error"
                variant="ghost"
                icon="i-lucide-trash-2"
                size="sm"
                aria-label="Delete post"
                @click="removePost(post)"
              />
            </div>
          </div>
        </li>
      </ul>
    </div>
  </UContainer>
</template>
