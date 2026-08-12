<script setup lang="ts">
import type { NodeViewProps } from '@tiptap/vue-3'
import { NodeViewWrapper } from '@tiptap/vue-3'

const props = defineProps<NodeViewProps>()
const toast = useToast()

const file = ref<File | null>(null)
const loading = ref(false)

watch(file, async (newFile) => {
  if (!newFile) return

  loading.value = true
  try {
    const form = new FormData()
    form.append('file', newFile)
    const result = await $fetch<{ url: string }>('/api/admin/upload', {
      method: 'POST',
      body: form,
      credentials: 'include'
    })

    const pos = props.getPos()
    if (typeof pos !== 'number') return

    props.editor
      .chain()
      .focus()
      .deleteRange({ from: pos, to: pos + 1 })
      .setImage({ src: result.url, alt: newFile.name })
      .run()
  } catch {
    toast.add({ title: 'Image upload failed', color: 'error' })
    file.value = null
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <NodeViewWrapper>
    <UFileUpload
      v-model="file"
      accept="image/*"
      label="Upload an image"
      description="JPEG, PNG, GIF, WebP or SVG (max. 5MB)"
      :preview="false"
      class="min-h-48"
    >
      <template #leading>
        <UAvatar
          :icon="loading ? 'i-lucide-loader-circle' : 'i-lucide-image'"
          size="xl"
          :ui="{ icon: loading ? 'animate-spin' : undefined }"
        />
      </template>
    </UFileUpload>
  </NodeViewWrapper>
</template>
