<script setup lang="ts">
import { marked } from 'marked'
import type { EditorToolbarItem } from '@nuxt/ui'
import type { PageSlug, SitePage as SitePageModel } from '#shared/types/page'

const props = defineProps<{
  slug: PageSlug
  showAffiliateDisclosure?: boolean
}>()

const toast = useToast()

const { data, status, error, refresh } = await useFetch<{ page: SitePageModel }>(
  () => `/api/pages/${props.slug}`,
  { key: () => `site-page-${props.slug}` }
)

const page = computed(() => data.value?.page)
const { isLoggedIn: isAdmin } = useAdminSession()
const editing = ref(false)
const saving = ref(false)
const draftTitle = ref('')
const draftContent = ref('')

const html = computed(() => {
  if (!page.value?.content) return ''
  return marked.parse(page.value.content, { async: false }) as string
})

watchEffect(() => {
  if (!page.value) return
  useSeoMeta({
    title: `${page.value.title} · ShopBeaPicks`,
    description: page.value.title
  })
})


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
    kind: 'link',
    icon: 'i-lucide-link',
    tooltip: { text: 'Link' }
  }]
] satisfies EditorToolbarItem[][]

function startEdit() {
  if (!page.value) return
  draftTitle.value = page.value.title
  draftContent.value = page.value.content
  editing.value = true
}

function cancelEdit() {
  editing.value = false
}

async function saveEdit() {
  if (!draftTitle.value.trim()) {
    toast.add({ title: 'Title is required', color: 'error' })
    return
  }

  saving.value = true
  try {
    await $fetch(`/api/admin/pages/${props.slug}`, {
      method: 'PUT',
      credentials: 'include',
      body: {
        title: draftTitle.value.trim(),
        content: draftContent.value
      }
    })
    toast.add({ title: 'Page saved', color: 'success' })
    editing.value = false
    await refresh()
  } catch (e: unknown) {
    const message = e && typeof e === 'object' && 'data' in e
      ? String((e as { data?: { statusMessage?: string } }).data?.statusMessage || 'Save failed')
      : 'Save failed'
    toast.add({ title: message, color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UContainer class="py-10 sm:py-14">
    <div class="max-w-2xl mx-auto">
      <div v-if="status === 'pending'" class="space-y-4">
        <USkeleton class="h-10 w-1/2" />
        <USkeleton class="h-40 w-full" />
      </div>

      <UAlert
        v-else-if="error || !page"
        color="error"
        title="Page not found"
        description="This page could not be loaded."
      />

      <template v-else>
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <h1
            v-if="!editing"
            class="text-3xl sm:text-4xl font-bold text-highlighted tracking-tight"
          >
            {{ page.title }}
          </h1>
          <UFormField
            v-else
            label="Title"
            class="flex-1 w-full"
          >
            <UInput
              v-model="draftTitle"
              size="xl"
              class="w-full"
            />
          </UFormField>

          <div
            v-if="isAdmin"
            class="flex flex-wrap gap-2 shrink-0"
          >
            <template v-if="!editing">
              <UButton
                color="primary"
                icon="i-lucide-pencil"
                label="Edit"
                @click="startEdit"
              />
            </template>
            <template v-else>
              <UButton
                color="neutral"
                variant="soft"
                label="Cancel"
                :disabled="saving"
                @click="cancelEdit"
              />
              <UButton
                color="primary"
                label="Save"
                :loading="saving"
                @click="saveEdit"
              />
            </template>
          </div>
        </div>

        <UAlert
          v-if="showAffiliateDisclosure"
          color="secondary"
          variant="subtle"
          icon="i-lucide-badge-info"
          title="Affiliate disclosure"
          description="As an Amazon Associate I earn from qualifying purchases."
          class="mb-8"
          :ui="{
            root: 'text-secondary!'
          }"
        />

        <div
          v-if="!editing"
          class="prose max-w-none text-default prose-headings:text-highlighted prose-a:text-primary prose-strong:text-highlighted"
          v-html="html"
        />

        <div
          v-else
          class="rounded-lg border border-default overflow-hidden bg-default"
        >
          <UEditor
            v-slot="{ editor }"
            v-model="draftContent"
            content-type="markdown"
            placeholder="Write page content…"
            class="min-h-64 w-full px-4 py-3"
          >
            <UEditorToolbar
              :editor="editor"
              :items="toolbarItems"
              class="border-b border-muted px-2 py-1.5 bg-elevated sticky top-0 z-10 overflow-x-auto"
            />
          </UEditor>
        </div>
      </template>
    </div>
  </UContainer>
</template>
