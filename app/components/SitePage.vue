<script setup lang="ts">
import type { PageSlug, SitePage as SitePageModel } from '#shared/types/page'
import type { SiteSettings } from '#shared/types/siteSettings'
import { DEFAULT_SITE_SETTINGS } from '#shared/types/siteSettings'
import { contentToHtml, toEditorHtml } from '~/utils/contentHtml'
import { ImageUpload } from '~/components/editor/EditorImageUploadExtension'
import { fontExtensions } from '~/components/editor/fontExtensions'

const props = defineProps<{
  slug: PageSlug
  showAffiliateDisclosure?: boolean
}>()

const toast = useToast()

const { data, status, error, refresh } = await useFetch<{ page: SitePageModel }>(
  () => `/api/pages/${props.slug}`,
  { key: () => `site-page-${props.slug}` }
)

const {
  data: settingsData,
  refresh: refreshSettings
} = await useFetch<{ settings: SiteSettings }>('/api/site-settings', {
  key: 'site-settings',
  immediate: props.showAffiliateDisclosure === true
})

const page = computed(() => data.value?.page)
const { isAdminView } = useAdminSession()
const editing = ref(false)
const saving = ref(false)
const draftTitle = ref('')
/** Latest HTML from the editor (updated on every change). */
const draftContent = ref('')
/**
 * Seeded into UEditor once per edit session, then set to `null` so Nuxt UI's
 * modelValue watcher cannot call setContent and wipe new empty paragraphs.
 */
const editorModel = ref<string | null>(null)
const draftAffiliateEnabled = ref(true)
const draftAffiliateTitle = ref('')
const draftAffiliateDescription = ref('')

const affiliateEnabled = computed(() =>
  settingsData.value?.settings.affiliateDisclosureEnabled
  ?? DEFAULT_SITE_SETTINGS.affiliateDisclosureEnabled
)
const affiliateTitle = computed(() =>
  settingsData.value?.settings.affiliateDisclosureTitle
  || DEFAULT_SITE_SETTINGS.affiliateDisclosureTitle
)
const affiliateDescription = computed(() =>
  settingsData.value?.settings.affiliateDisclosureDescription
  || DEFAULT_SITE_SETTINGS.affiliateDisclosureDescription
)

/** Visitors only see it when enabled; admins also see it when hidden (with a badge). */
const showAffiliateAlert = computed(() => {
  if (!props.showAffiliateDisclosure) return false
  if (affiliateEnabled.value) return true
  return isAdminView.value
})

const html = computed(() => contentToHtml(page.value?.content || ''))

watchEffect(() => {
  if (!page.value) return
  useSeoMeta({
    title: `${page.value.title} · ShopBeaPicks`,
    description: page.value.title
  })
})

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

function startEdit() {
  if (!page.value) return
  draftTitle.value = page.value.title
  const seedHtml = toEditorHtml(page.value.content)
  draftContent.value = seedHtml
  editorModel.value = seedHtml
  if (props.showAffiliateDisclosure) {
    draftAffiliateEnabled.value = affiliateEnabled.value
    draftAffiliateTitle.value = affiliateTitle.value
    draftAffiliateDescription.value = affiliateDescription.value
  }
  editSession.value += 1
  editing.value = true
}

function cancelEdit() {
  editing.value = false
  editorModel.value = null
}

function onEditorUpdate(value: unknown) {
  if (typeof value === 'string') {
    draftContent.value = value
  }
}

const editSession = ref(0)
const pageEditor = useTemplateRef<{
  editor?: {
    chain: () => { focus: (pos?: string) => { run: () => void } }
    getHTML: () => string
  }
} | null>('pageEditor')

// Once TipTap mounts with seed HTML, detach modelValue so Nuxt UI's watcher
// cannot setContent and collapse empty paragraphs created by Enter.
watch(
  () => pageEditor.value?.editor,
  (editor) => {
    if (!editor || !editing.value || editorModel.value == null) return
    editorModel.value = null
    nextTick(() => {
      editor.chain().focus('end').run()
    })
  }
)

async function saveEdit() {
  if (!draftTitle.value.trim()) {
    toast.add({ title: 'Title is required', color: 'error' })
    return
  }

  if (props.showAffiliateDisclosure) {
    if (!draftAffiliateTitle.value.trim()) {
      toast.add({ title: 'Disclosure title is required', color: 'error' })
      return
    }
    if (!draftAffiliateDescription.value.trim()) {
      toast.add({ title: 'Disclosure text is required', color: 'error' })
      return
    }
  }

  // Prefer live editor HTML in case the last keystroke hasn't flushed yet.
  const content = pageEditor.value?.editor?.getHTML() ?? draftContent.value

  saving.value = true
  try {
    await $fetch(`/api/admin/pages/${props.slug}`, {
      method: 'PUT',
      credentials: 'include',
      body: {
        title: draftTitle.value.trim(),
        content
      }
    })

    if (props.showAffiliateDisclosure) {
      await $fetch('/api/admin/site-settings', {
        method: 'PUT',
        credentials: 'include',
        body: {
          affiliateDisclosureEnabled: draftAffiliateEnabled.value,
          affiliateDisclosureTitle: draftAffiliateTitle.value.trim(),
          affiliateDisclosureDescription: draftAffiliateDescription.value.trim()
        }
      })
      await refreshSettings()
    }

    toast.add({ title: 'Page saved', color: 'success' })
    editing.value = false
    editorModel.value = null
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

watch(isAdminView, (adminView) => {
  if (!adminView) {
    editing.value = false
  }
})
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
            class="text-3xl sm:text-4xl font-bold text-navy-600 dark:text-highlighted tracking-tight"
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
              @keydown.enter.prevent
            />
          </UFormField>

          <div
            v-if="isAdminView"
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
                type="button"
                color="neutral"
                variant="soft"
                label="Cancel"
                :disabled="saving"
                @click="cancelEdit"
              />
              <UButton
                type="button"
                color="primary"
                label="Save"
                :loading="saving"
                @click="saveEdit"
              />
            </template>
          </div>
        </div>

        <div
          v-if="showAffiliateAlert"
          class="mb-8"
        >
          <UAlert
            color="secondary"
            variant="subtle"
            icon="i-lucide-badge-info"
            :description="editing ? undefined : affiliateDescription"
            :ui="{
              root: 'text-secondary!'
            }"
          >
            <template
              v-if="!editing"
              #title
            >
              <span class="inline-flex items-center gap-2 flex-wrap">
                <span>{{ affiliateTitle }}</span>
                <UBadge
                  v-if="isAdminView && !affiliateEnabled"
                  color="tertiary"
                  variant="subtle"
                  size="sm"
                >
                  hidden
                </UBadge>
              </span>
            </template>

            <template
              v-if="editing"
              #description
            >
              <div class="space-y-3 w-full mt-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <UFormField
                    label="Show disclosure"
                    class="flex-1"
                  >
                    <USwitch v-model="draftAffiliateEnabled" />
                  </UFormField>
                  <UBadge
                    v-if="!draftAffiliateEnabled"
                    color="tertiary"
                    variant="subtle"
                    size="sm"
                  >
                    hidden
                  </UBadge>
                </div>
                <UFormField label="Title">
                  <UInput
                    v-model="draftAffiliateTitle"
                    class="w-full"
                  />
                </UFormField>
                <UFormField label="Text">
                  <UTextarea
                    v-model="draftAffiliateDescription"
                    :rows="3"
                    class="w-full"
                  />
                </UFormField>
              </div>
            </template>
          </UAlert>
        </div>

        <div
          v-if="!editing"
          class="prose max-w-none text-default prose-headings:text-highlighted prose-strong:text-highlighted"
          v-html="html"
        />

        <div
          v-else
          class="rounded-lg border border-default overflow-hidden bg-default"
        >
          <UEditor
            :key="editSession"
            ref="pageEditor"
            v-slot="{ editor }"
            :model-value="editorModel ?? undefined"
            content-type="html"
            :mention="false"
            :placeholder="{ placeholder: 'Write page content…', mode: 'firstLine' }"
            :starter-kit="{ heading: false }"
            :image="imageOptions"
            :extensions="[ImageUpload, ...fontExtensions]"
            :handlers="customHandlers"
            class="min-h-80 w-full px-4 py-3"
            @update:model-value="onEditorUpdate"
          >
            <UEditorToolbar
              :editor="editor"
              :items="toolbarItems"
              class="border-b border-muted px-2 py-1.5 bg-elevated sticky top-0 z-10 overflow-x-auto"
            />
            <EditorImageBubble :editor="editor" />
          </UEditor>
        </div>
      </template>
    </div>
  </UContainer>
</template>
