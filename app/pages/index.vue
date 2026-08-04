<script setup lang="ts">
import type { PostListItem } from '#shared/types/post'

const { data, status, error } = await useFetch<{ posts: PostListItem[] }>('/api/posts', {
  key: 'published-posts'
})

const posts = computed(() => data.value?.posts || [])

useSeoMeta({
  title: 'ShopBeaPicks',
  description: 'Latest posts and picks from ShopBeaPicks.'
})

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
      <div class="mb-10">
        <h1 class="text-3xl sm:text-4xl font-bold text-highlighted tracking-tight">
          Latest posts
        </h1>
        <p class="mt-2 text-muted">
          Snippets from the ShopBeaPicks feed. Open a post to read the full story.
        </p>
      </div>

      <div v-if="status === 'pending'" class="space-y-4">
        <USkeleton class="h-28 w-full" />
        <USkeleton class="h-28 w-full" />
      </div>

      <UAlert
        v-else-if="error"
        color="error"
        title="Could not load posts"
        :description="error.message"
      />

      <div v-else-if="!posts.length" class="rounded-lg border border-default p-8 text-center">
        <p class="text-muted">
          No published posts yet. Check back soon.
        </p>
      </div>

      <ul v-else class="divide-y divide-default">
        <li
          v-for="post in posts"
          :key="post.id"
          class="py-6 first:pt-0"
        >
          <NuxtLink
            :to="`/posts/${post.slug}`"
            class="group block"
          >
            <div class="flex gap-4">
              <img
                v-if="post.cover_image"
                :src="post.cover_image"
                :alt="post.title"
                class="w-20 h-20 sm:w-28 sm:h-28 object-cover rounded-md shrink-0"
              >
              <div class="min-w-0 flex-1">
                <p v-if="post.published_at" class="text-xs text-muted mb-1">
                  {{ formatDate(post.published_at) }}
                </p>
                <h2 class="text-xl font-semibold text-highlighted group-hover:text-primary transition-colors">
                  {{ post.title }}
                </h2>
                <p class="mt-2 text-muted line-clamp-3">
                  {{ post.excerpt || 'Read the full post →' }}
                </p>
                <span class="mt-3 inline-flex items-center gap-1 text-sm text-primary font-medium">
                  Read more
                  <UIcon name="i-lucide-arrow-right" class="size-4" />
                </span>
              </div>
            </div>
          </NuxtLink>
        </li>
      </ul>
    </div>
  </UContainer>
</template>
