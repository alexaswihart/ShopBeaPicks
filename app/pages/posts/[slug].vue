<script setup lang="ts">
import { marked } from 'marked'
import type { Post } from '#shared/types/post'

const route = useRoute()
const slug = computed(() => String(route.params.slug || ''))

const { data, error, status } = await useFetch<{ post: Post }>(() => `/api/posts/${slug.value}`, {
  key: () => `post-${slug.value}`
})

const post = computed(() => data.value?.post)

const html = computed(() => {
  if (!post.value?.content) return ''
  return marked.parse(post.value.content, { async: false }) as string
})

watchEffect(() => {
  if (!post.value) return
  useSeoMeta({
    title: `${post.value.title} · ShopBeaPicks`,
    description: post.value.excerpt || post.value.title,
    ogImage: post.value.cover_image || undefined
  })
})

function formatDate(value: string | null) {
  if (!value) return ''
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<template>
  <UContainer class="py-10 sm:py-14">
    <div class="max-w-2xl mx-auto">
      <UButton
        to="/"
        color="neutral"
        variant="ghost"
        icon="i-lucide-arrow-left"
        label="All posts"
        class="mb-6 -ml-2"
      />

      <div v-if="status === 'pending'" class="space-y-4">
        <USkeleton class="h-10 w-3/4" />
        <USkeleton class="h-4 w-1/3" />
        <USkeleton class="h-64 w-full" />
      </div>

      <UAlert
        v-else-if="error"
        color="error"
        title="Post not found"
        description="This post may be unpublished or the link is incorrect."
      />

      <article v-else-if="post">
        <header class="mb-8">
          <p v-if="post.published_at" class="text-sm text-muted mb-2">
            {{ formatDate(post.published_at) }}
          </p>
          <h1 class="text-3xl sm:text-4xl font-bold text-highlighted tracking-tight">
            {{ post.title }}
          </h1>
          <p v-if="post.excerpt" class="mt-3 text-lg text-muted">
            {{ post.excerpt }}
          </p>
        </header>

        <img
          v-if="post.cover_image"
          :src="post.cover_image"
          :alt="post.title"
          class="w-full rounded-lg mb-8 object-cover max-h-96"
        >

        <div
          class="prose max-w-none text-default prose-headings:text-highlighted prose-a:text-primary prose-strong:text-highlighted prose-blockquote:border-secondary prose-blockquote:bg-muted/40 prose-blockquote:text-toned"
          v-html="html"
        />
      </article>
    </div>
  </UContainer>
</template>
