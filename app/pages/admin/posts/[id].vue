<script setup lang="ts">
import { CalendarDate } from '@internationalized/date'
import type { Post, PostStatus } from '#shared/types/post'
import type { CoverImageMeta } from '#shared/utils/coverImage'
import { parseCoverImage, serializeCoverImage } from '#shared/utils/coverImage'
import { slugify } from '~/utils/slugify'
import { toEditorHtml } from '~/utils/contentHtml'
import { ImageUpload } from '~/components/editor/EditorImageUploadExtension'
import { fontExtensions } from '~/components/editor/fontExtensions'

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
const cover = ref<CoverImageMeta | null>(null)
const status = ref<PostStatus>('draft')
const slugTouched = ref(false)
const saving = ref(false)
const createdAt = ref(new Date().toISOString())
const postDate = shallowRef(toCalendarDate(createdAt.value))
const dateInput = useTemplateRef('dateInput')

function toCalendarDate(iso: string): CalendarDate {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) {
    const now = new Date()
    return new CalendarDate(now.getFullYear(), now.getMonth() + 1, now.getDate())
  }
  return new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate())
}

function calendarDateToIso(date: CalendarDate | null | undefined, timeSourceIso: string): string {
  const source = new Date(timeSourceIso)
  const hours = Number.isNaN(source.getTime()) ? 12 : source.getHours()
  const minutes = Number.isNaN(source.getTime()) ? 0 : source.getMinutes()
  const seconds = Number.isNaN(source.getTime()) ? 0 : source.getSeconds()
  const local = new Date(
    date!.year,
    date!.month - 1,
    date!.day,
    hours,
    minutes,
    seconds
  )
  return local.toISOString()
}

const { customHandlers, toolbarItems } = useEditorFontToolbar({ withImageUpload: true })

const imageOptions = {
  resize: {
    enabled: true,
    directions: ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const,
    minWidth: 48,
    minHeight: 48,
    alwaysPreserveAspectRatio: true
  }
}

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
  content.value = toEditorHtml(post.content)
  cover.value = parseCoverImage(post.cover_image)
  status.value = post.status
  slugTouched.value = true
  createdAt.value = post.created_at
  // Default to creation date; if a blog date was already set manually, show that
  postDate.value = toCalendarDate(post.published_at || post.created_at)
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
    const url = await uploadImage(file)
    cover.value = {
      url,
      alt: cover.value?.alt || '',
      title: cover.value?.title || ''
    }
    toast.add({ title: 'Cover image uploaded', color: 'success' })
  } catch {
    toast.add({ title: 'Cover upload failed', color: 'error' })
  } finally {
    input.value = ''
  }
}

function removeCover() {
  cover.value = null
}

async function save(nextStatus?: PostStatus) {
  if (!title.value.trim()) {
    toast.add({ title: 'Title is required', color: 'error' })
    return
  }
  if (!postDate.value) {
    toast.add({ title: 'Post date is required', color: 'error' })
    return
  }

  saving.value = true
  const payload = {
    title: title.value.trim(),
    slug: slug.value.trim() || undefined,
    excerpt: excerpt.value.trim(),
    content: content.value,
    cover_image: serializeCoverImage(cover.value),
    status: nextStatus || status.value,
    published_at: calendarDateToIso(postDate.value, createdAt.value)
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
      createdAt.value = post.created_at
      postDate.value = toCalendarDate(post.published_at || post.created_at)
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
          to="/"
          color="neutral"
          variant="ghost"
          icon="i-lucide-arrow-left"
          label="All posts"
        />
        <UBadge
          :color="status === 'published' ? 'success' : 'secondary'"
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
            <UEditor
              v-slot="{ editor }"
              v-model="content"
              content-type="html"
              :mention="false"
              :placeholder="{ placeholder: 'Write your post…', mode: 'firstLine' }"
              :starter-kit="{ heading: false }"
              :image="imageOptions"
              :extensions="[ImageUpload, ...fontExtensions]"
              :handlers="customHandlers"
              class="min-h-80 w-full px-4 py-3"
            >
              <UEditorToolbar
                :editor="editor"
                :items="toolbarItems"
                class="border-b border-muted px-2 py-1.5 bg-elevated sticky top-0 z-10 overflow-x-auto"
              />
              <EditorImageBubble :editor="editor" />
            </UEditor>
          </div>
        </UFormField>
      </div>

      <aside class="space-y-4">
        <UFormField label="Post date">
          <UInputDate
            ref="dateInput"
            v-model="postDate"
            class="w-full"
          >
            <template #trailing>
              <UPopover :reference="dateInput?.inputsRef?.[3]?.$el">
                <UButton
                  color="neutral"
                  variant="link"
                  size="sm"
                  icon="i-lucide-calendar"
                  aria-label="Select post date"
                  class="px-0"
                />
                <template #content>
                  <UCalendar
                    v-model="postDate"
                    class="p-2"
                  />
                </template>
              </UPopover>
            </template>
          </UInputDate>
        </UFormField>

        <UFormField label="Slug">
          <UInput
            v-model="slug"
            placeholder="url-slug"
            class="w-full"
            @update:model-value="slugTouched = true"
          />
        </UFormField>

        <UFormField label="Cover image">
          <div class="space-y-3">
            <template v-if="cover">
              <img
                :src="cover.url"
                :alt="cover.alt || 'Cover preview'"
                class="w-full rounded-md object-cover max-h-40"
              >
              <UInput
                v-model="cover.alt"
                size="sm"
                placeholder="Alt text"
                aria-label="Cover image alt text"
                class="w-full"
              />
              <UInput
                v-model="cover.title"
                size="sm"
                placeholder="Title (tooltip)"
                aria-label="Cover image title"
                class="w-full"
              />
            </template>

            <div class="flex flex-wrap gap-2">
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
                  :label="cover ? 'Replace' : 'Upload'"
                />
              </label>
              <UButton
                v-if="cover"
                size="sm"
                color="neutral"
                variant="ghost"
                icon="i-lucide-trash"
                label="Remove"
                @click="removeCover"
              />
            </div>
          </div>
        </UFormField>
      </aside>
    </div>
  </UContainer>
</template>
