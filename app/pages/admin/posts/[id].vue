<script setup lang="ts">
import type { EditorToolbarItem } from '@nuxt/ui'
import type { Post, PostStatus } from '#shared/types/post'
import { slugify } from '~/utils/slugify'

definePageMeta({
  middleware: 'admin'
})

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { redirectToAccessLogin } = useAccessLoginRedirect()

const id = computed(() => String(route.params.id || ''))
const isNew = computed(() => id.value === 'new')

const title = ref('')
const slug = ref('')
const excerpt = ref('')
const content = ref('')
const coverImage = ref('')
const status = ref<PostStatus>('draft')
const slugTouched = ref(false)
const saving = ref(false)

const toolbarItems = [
  [{
    kind: 'undo',
    icon: 'i-lucide-undo',
    tooltip: { text: 'Undo' }
  }, {
    kind: 'redo',
    icon: 'i-lucide-redo',
    tooltip: { text: 'Redo' }
  }],
  [{
    kind: 'heading',
    level: 1,
    icon: 'i-lucide-heading-1',
    tooltip: { text: 'Heading 1' }
  }, {
    kind: 'heading',
    level: 2,
    icon: 'i-lucide-heading-2',
    tooltip: { text: 'Heading 2' }
  }, {
    kind: 'heading',
    level: 3,
    icon: 'i-lucide-heading-3',
    tooltip: { text: 'Heading 3' }
  }],
  [{
    kind: 'mark',
    mark: 'bold',
    icon: 'i-lucide-bold',
    tooltip: { text: 'Bold' }
  }, {
    kind: 'mark',
    mark: 'italic',
    icon: 'i-lucide-italic',
    tooltip: { text: 'Italic' }
  }, {
    kind: 'mark',
    mark: 'strike',
    icon: 'i-lucide-strikethrough',
    tooltip: { text: 'Strikethrough' }
  }, {
    kind: 'mark',
    mark: 'code',
    icon: 'i-lucide-code',
    tooltip: { text: 'Code' }
  }],
  [{
    kind: 'bulletList',
    icon: 'i-lucide-list',
    tooltip: { text: 'Bullet list' }
  }, {
    kind: 'orderedList',
    icon: 'i-lucide-list-ordered',
    tooltip: { text: 'Ordered list' }
  }, {
    kind: 'blockquote',
    icon: 'i-lucide-text-quote',
    tooltip: { text: 'Quote' }
  }],
  [{
    kind: 'link',
    icon: 'i-lucide-link',
    tooltip: { text: 'Link' }
  }, {
    kind: 'image',
    icon: 'i-lucide-image',
    tooltip: { text: 'Image URL' }
  }]
] satisfies EditorToolbarItem[][]

watch(title, (value) => {
  if (!slugTouched.value && isNew.value) {
    slug.value = slugify(value)
  }
})

if (!isNew.value) {
  const { data, error } = await useFetch<{ post: Post }>(`/api/admin/posts/${id.value}`, {
    key: `admin-post-${id.value}`,
    credentials: 'include'
  })
  if (error.value?.statusCode === 401 || error.value?.statusCode === 403) {
    redirectToAccessLogin(route.fullPath)
    throw createError({ statusCode: 401, statusMessage: 'Sign in required' })
  }
  if (error.value || !data.value?.post) {
    throw createError({ statusCode: 404, statusMessage: 'Post not found' })
  }
  const post = data.value.post
  title.value = post.title
  slug.value = post.slug
  excerpt.value = post.excerpt
  content.value = post.content
  coverImage.value = post.cover_image || ''
  status.value = post.status
  slugTouched.value = true
}

async function uploadImage(file: File) {
  const form = new FormData()
  form.append('file', file)
  const result = await $fetch<{ url: string }>('/api/admin/upload', {
    method: 'POST',
    body: form,
    credentials: 'include'
  })
  return result.url
}

async function onCoverUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    coverImage.value = await uploadImage(file)
    toast.add({ title: 'Cover image uploaded', color: 'success' })
  } catch {
    toast.add({ title: 'Cover upload failed', color: 'error' })
  } finally {
    input.value = ''
  }
}

async function onBodyImageUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const url = await uploadImage(file)
    const imageMarkdown = `\n\n![${file.name}](${url})\n\n`
    content.value = `${content.value || ''}${imageMarkdown}`
    toast.add({ title: 'Image added to post', color: 'success' })
  } catch {
    toast.add({ title: 'Image upload failed', color: 'error' })
  } finally {
    input.value = ''
  }
}

async function save(nextStatus?: PostStatus) {
  if (!title.value.trim()) {
    toast.add({ title: 'Title is required', color: 'error' })
    return
  }

  saving.value = true
  const payload = {
    title: title.value.trim(),
    slug: slug.value.trim() || undefined,
    excerpt: excerpt.value.trim(),
    content: content.value,
    cover_image: coverImage.value.trim() || null,
    status: nextStatus || status.value
  }

  try {
    if (isNew.value) {
      const { post } = await $fetch<{ post: Post }>('/api/admin/posts', {
        method: 'POST',
        body: payload,
        credentials: 'include'
      })
      toast.add({
        title: payload.status === 'published' ? 'Post published' : 'Draft saved',
        color: 'success'
      })
      await router.replace(`/admin/posts/${post.id}`)
    } else {
      const { post } = await $fetch<{ post: Post }>(`/api/admin/posts/${id.value}`, {
        method: 'PUT',
        body: payload,
        credentials: 'include'
      })
      status.value = post.status
      slug.value = post.slug
      toast.add({
        title: payload.status === 'published' ? 'Post published' : 'Draft saved',
        color: 'success'
      })
    }
  } catch (e: unknown) {
    const statusCode = e && typeof e === 'object' && 'statusCode' in e
      ? Number((e as { statusCode?: number }).statusCode)
      : 0
    if (statusCode === 401 || statusCode === 403) {
      redirectToAccessLogin(route.fullPath)
      return
    }
    const message = e && typeof e === 'object' && 'data' in e
      ? String((e as { data?: { statusMessage?: string } }).data?.statusMessage || 'Save failed')
      : 'Save failed'
    toast.add({ title: message, color: 'error' })
  } finally {
    saving.value = false
  }
}

useSeoMeta({
  title: () => (isNew.value ? 'New post' : `Edit: ${title.value}`) + ' · Admin'
})
</script>

<template>
  <UContainer class="py-8">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div class="flex items-center gap-2">
        <UButton
          to="/admin"
          color="neutral"
          variant="ghost"
          icon="i-lucide-arrow-left"
          label="All posts"
        />
        <UBadge
          :color="status === 'published' ? 'success' : 'neutral'"
          variant="subtle"
        >
          {{ status }}
        </UBadge>
      </div>
      <div class="flex flex-wrap gap-2">
        <UButton
          color="neutral"
          variant="soft"
          label="Save draft"
          :loading="saving"
          @click="save('draft')"
        />
        <UButton
          color="primary"
          label="Publish"
          :loading="saving"
          @click="save('published')"
        />
      </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div class="space-y-4 min-w-0">
        <UFormField label="Title">
          <UInput
            v-model="title"
            size="xl"
            placeholder="Post title"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Excerpt" hint="Shown on the feed as the snippet">
          <UTextarea
            v-model="excerpt"
            :rows="3"
            placeholder="Short summary for the feed…"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Body">
          <div class="rounded-lg border border-default overflow-hidden bg-default">
            <div class="flex items-center gap-2 border-b border-muted px-2 py-1.5 bg-elevated">
              <label class="inline-flex">
                <input
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="onBodyImageUpload"
                >
                <UButton
                  as="span"
                  size="sm"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-image-up"
                  label="Upload image"
                />
              </label>
              <span class="text-xs text-muted">
                or use the image toolbar button for an external URL
              </span>
            </div>
            <UEditor
              v-slot="{ editor }"
              v-model="content"
              content-type="markdown"
              placeholder="Write your post…"
              class="min-h-80 w-full px-4 py-3"
            >
              <UEditorToolbar
                :editor="editor"
                :items="toolbarItems"
                class="border-b border-muted px-2 py-1.5 bg-elevated sticky top-0 z-10 overflow-x-auto"
              />
            </UEditor>
          </div>
        </UFormField>
      </div>

      <aside class="space-y-4">
        <UFormField label="Slug">
          <UInput
            v-model="slug"
            placeholder="url-slug"
            class="w-full"
            @update:model-value="slugTouched = true"
          />
        </UFormField>

        <UFormField label="Cover image URL">
          <UInput
            v-model="coverImage"
            placeholder="https://… or /api/images/…"
            class="w-full"
          />
          <div class="mt-2 flex gap-2">
            <label class="inline-flex">
              <input
                type="file"
                accept="image/*"
                class="hidden"
                @change="onCoverUpload"
              >
              <UButton
                as="span"
                size="sm"
                color="neutral"
                variant="soft"
                icon="i-lucide-upload"
                label="Upload"
              />
            </label>
            <UButton
              v-if="coverImage"
              size="sm"
              color="neutral"
              variant="ghost"
              label="Clear"
              @click="coverImage = ''"
            />
          </div>
          <img
            v-if="coverImage"
            :src="coverImage"
            alt="Cover preview"
            class="mt-3 w-full rounded-md object-cover max-h-40"
          >
        </UFormField>
      </aside>
    </div>
  </UContainer>
</template>
